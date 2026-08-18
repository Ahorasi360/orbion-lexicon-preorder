import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const managedConsolePath = path.join(root, ".manus-logs", "browserConsole.log");
await mkdir(path.dirname(managedConsolePath), { recursive: true });
await writeFile(managedConsolePath, "");
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium" });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();
const errors = [];

page.on("console", message => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", error => errors.push(error.message));

async function open(route) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 20_000 });
}

await open("/");
const homeVisible = await page.getByRole("heading", { name: /The language of space, connected/i }).isVisible();

await open("/book");
const bookVisible = await page.getByRole("heading", { name: /The Orbion Space Lexicon/i }).isVisible();
const checkoutControls = await page.getByRole("button", { name: /Preorder (Collector’s|Hardcover|Paperback)/i }).count();

await open("/lexicon");
const catalogCardCount = await page.locator(".entry-card").count();
const lockedCardCopy = await page.getByText(/Member entry\. Annual access unlocks/i).first().isVisible();

await open("/lexicon/spaceflight");
const lockedEntryVisible = await page.getByRole("heading", { name: /Continue with member access/i }).isVisible();
const premiumMarkerVisible = await page.getByText(/INDUSTRY EXAMPLE/i).count();

await open("/account");
const accountDeniedVisible = await page.getByRole("heading", { name: /Sign in to view/i }).isVisible();

await open("/lexicon/access");
const accessOfferVisible = await page.getByRole("heading", { name: /One year of/i }).isVisible();
const purchaseButtonEnabled = await page.getByRole("button", { name: /Continue to secure checkout/i }).isEnabled().catch(() => false);

await page.setViewportSize({ width: 375, height: 812 });
await open("/lexicon");
await page.getByRole("button", { name: "Open navigation menu", exact: true }).click();
const mobileMenuVisible = await page.getByText("Explore Orbion", { exact: true }).isVisible();
await page.getByRole("button", { name: "Close navigation menu", exact: true }).click();
await page.getByRole("navigation", { name: "Filter Lexicon by initial letter" }).getByRole("button", { name: "A", exact: true }).click();
const activeFilterVisible = await page.locator(".active-lexicon-filter").isVisible();
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
await page.keyboard.press("Tab");
const focusVisible = await page.evaluate(() => document.activeElement instanceof HTMLElement && getComputedStyle(document.activeElement).outlineStyle !== "none");
await page.waitForTimeout(250);
const managedConsole = await readFile(managedConsolePath, "utf8");
const managedPreviewErrors = managedConsole.match(/vite.*(failed|websocket)|WebSocket.*(closed|failed)/ig) ?? [];

const result = {
  checkedAt: new Date().toISOString(),
  baseUrl,
  homeVisible,
  bookVisible,
  checkoutControls,
  catalogCardCount,
  lockedCardCopy,
  lockedEntryVisible,
  premiumMarkerVisible,
  accountDeniedVisible,
  accessOfferVisible,
  purchaseButtonEnabled,
  mobileMenuVisible,
  activeFilterVisible,
  overflow,
  focusVisible,
  errors,
  managedPreviewErrors,
};

await mkdir(path.join(root, "docs"), { recursive: true });
await writeFile(path.join(root, "docs", "release-qa-results.json"), `${JSON.stringify(result, null, 2)}\n`);
await context.close();
await browser.close();

const passed = homeVisible && bookVisible && checkoutControls >= 3 && catalogCardCount > 0 && lockedCardCopy && lockedEntryVisible && premiumMarkerVisible === 0 && accountDeniedVisible && accessOfferVisible && !purchaseButtonEnabled && mobileMenuVisible && activeFilterVisible && !overflow && focusVisible && errors.length === 0 && managedPreviewErrors.length === 0;
if (!passed) {
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}
console.log("Release QA passed: public routes, locked content, account denial, checkout-safe controls, mobile accessibility, and browser console are clean in one fresh session.");
