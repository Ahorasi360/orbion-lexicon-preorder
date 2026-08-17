import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const baseUrl = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const expectedPlatformPaths = ["/", "/lexicon", "/domains", "/maps", "/methodology", "/sources", "/about", "/intelligence"];
const expectedPolicyPaths = ["/terms-of-sale", "/preorder-refund-policy", "/shipping-delay-policy", "/privacy-policy", "/contact", "/corrections"];
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium" });
const failures = [];
const results = { baseUrl, checkedAt: new Date().toISOString(), desktop: [], mobile: [], checkoutUrls: [] };

async function createPage(viewport) {
  const context = await browser.newContext({ viewport, isMobile: viewport.width < 600 });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__orbionCheckoutUrls = [];
    window.open = (url) => { window.__orbionCheckoutUrls.push(String(url)); return null; };
  });
  return { context, page };
}

async function visitBook(page) {
  await page.goto(`${baseUrl}/book`, { waitUntil: "domcontentloaded", timeout: 20_000 });
  await page.waitForFunction(() => document.querySelectorAll(".edition-cards button").length === 3);
}

async function verifyDestination(page, selector, expectedPath, label, bucket) {
  await visitBook(page);
  const locator = page.locator(selector).first();
  if (!await locator.isVisible()) {
    failures.push(`${label}: link was not visible`);
    return;
  }
  await locator.click();
  await page.waitForLoadState("networkidle").catch(() => undefined);
  const actualPath = new URL(page.url()).pathname;
  if (actualPath !== expectedPath) failures.push(`${label}: expected ${expectedPath}, received ${actualPath}`);
  bucket.push({ label, expectedPath, actualPath });
}

const desktop = await createPage({ width: 1280, height: 720 });
for (const expectedPath of expectedPlatformPaths) {
  await verifyDestination(desktop.page, `header nav a[href="${expectedPath}"]`, expectedPath, `desktop header ${expectedPath}`, results.desktop);
  await verifyDestination(desktop.page, `footer .book-footer-links a[href="${expectedPath}"]`, expectedPath, `desktop footer ${expectedPath}`, results.desktop);
}
for (const expectedPath of expectedPolicyPaths) {
  await verifyDestination(desktop.page, `footer .policy-links a[href="${expectedPath}"]`, expectedPath, `desktop policy ${expectedPath}`, results.desktop);
}

await visitBook(desktop.page);
await desktop.page.getByRole("button", { name: "Read the illustrated preview" }).click();
await desktop.page.waitForFunction(() => Math.abs(document.querySelector("#preview")?.getBoundingClientRect().top || 9999) < 180, undefined, { timeout: 2_000 }).catch(() => undefined);
const previewPosition = await desktop.page.locator("#preview").evaluate(node => node.getBoundingClientRect().top);
if (previewPosition > 180) failures.push("desktop preview control did not scroll the preview section into view");
results.desktop.push({ label: "desktop preview control", previewPosition });

await visitBook(desktop.page);
await desktop.page.getByRole("button", { name: "Join the preorder list" }).first().click();
await desktop.page.waitForFunction(() => Math.abs(document.querySelector("#preorder")?.getBoundingClientRect().top || 9999) < 180, undefined, { timeout: 2_000 }).catch(() => undefined);
const preorderPosition = await desktop.page.locator("#preorder").evaluate(node => node.getBoundingClientRect().top);
if (preorderPosition > 180) failures.push("desktop preorder-list control did not scroll the preorder section into view");
results.desktop.push({ label: "desktop preorder control", preorderPosition });

await visitBook(desktop.page);
await desktop.page.waitForTimeout(700);
for (const button of await desktop.page.locator(".edition-cards button").all()) await button.click();
results.checkoutUrls = await desktop.page.evaluate(() => window.__orbionCheckoutUrls);
if (results.checkoutUrls.length !== 3 || new Set(results.checkoutUrls).size !== 3 || results.checkoutUrls.some(url => !url.startsWith("https://buy.stripe.com/"))) {
  failures.push(`checkout buttons did not produce three unique Stripe URLs: ${JSON.stringify(results.checkoutUrls)}`);
}
await desktop.context.close();

const mobile = await createPage({ width: 375, height: 812 });
for (const expectedPath of expectedPlatformPaths) {
  await visitBook(mobile.page);
  await mobile.page.getByRole("button", { name: "Toggle navigation" }).click();
  const selector = `header nav a[href="${expectedPath}"]`;
  const locator = mobile.page.locator(selector).first();
  if (!await locator.isVisible()) {
    failures.push(`mobile menu ${expectedPath}: link was not visible after opening navigation`);
    continue;
  }
  await locator.click();
  await mobile.page.waitForLoadState("networkidle").catch(() => undefined);
  const actualPath = new URL(mobile.page.url()).pathname;
  if (actualPath !== expectedPath) failures.push(`mobile menu ${expectedPath}: expected ${expectedPath}, received ${actualPath}`);
  results.mobile.push({ expectedPath, actualPath });
}
for (const expectedPath of expectedPlatformPaths) {
  await verifyDestination(mobile.page, `footer .book-footer-links a[href="${expectedPath}"]`, expectedPath, `mobile footer ${expectedPath}`, results.mobile);
}
for (const expectedPath of expectedPolicyPaths) {
  await verifyDestination(mobile.page, `footer .policy-links a[href="${expectedPath}"]`, expectedPath, `mobile policy ${expectedPath}`, results.mobile);
}
await visitBook(mobile.page);
await mobile.page.getByRole("button", { name: "Read the illustrated preview" }).click();
await mobile.page.waitForFunction(() => Math.abs(document.querySelector("#preview")?.getBoundingClientRect().top || 9999) < 180, undefined, { timeout: 2_000 }).catch(() => undefined);
const mobilePreviewPosition = await mobile.page.locator("#preview").evaluate(node => node.getBoundingClientRect().top);
if (mobilePreviewPosition > 180) failures.push("mobile preview control did not scroll the preview section into view");
results.mobile.push({ label: "mobile preview control", previewPosition: mobilePreviewPosition });

await visitBook(mobile.page);
await mobile.page.getByRole("button", { name: "Join the preorder list" }).first().click();
await mobile.page.waitForFunction(() => Math.abs(document.querySelector("#preorder")?.getBoundingClientRect().top || 9999) < 180, undefined, { timeout: 2_000 }).catch(() => undefined);
const mobilePreorderPosition = await mobile.page.locator("#preorder").evaluate(node => node.getBoundingClientRect().top);
if (mobilePreorderPosition > 180) failures.push("mobile preorder-list control did not scroll the preorder section into view");
results.mobile.push({ label: "mobile preorder control", preorderPosition: mobilePreorderPosition });
await mobile.context.close();
await browser.close();

await mkdir(path.join(root, "docs"), { recursive: true });
await writeFile(path.join(root, "docs", "book-link-qa-results.json"), `${JSON.stringify({ ...results, failures }, null, 2)}\n`);
if (failures.length) {
  console.error(`Book link QA found ${failures.length} issue(s):\n${failures.join("\n")}`);
  process.exit(1);
}
console.log(`Book link QA passed: ${results.desktop.length} desktop link/control checks, ${results.mobile.length} mobile navigation checks, and ${results.checkoutUrls.length} safe checkout URL captures.`);
