import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const baseUrl = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const routes = [
  "/", "/book", "/lexicon", "/lexicon/spaceflight", "/domains", "/domains/spaceflight-foundations-physics",
  "/maps", "/methodology", "/sources", "/search", "/about", "/intelligence", "/terms-of-sale",
  "/preorder-refund-policy", "/shipping-delay-policy", "/privacy-policy", "/contact", "/corrections",
];
const viewports = [
  { label: "desktop", width: 1280, height: 720 },
  { label: "mobile", width: 375, height: 812, isMobile: true },
];

const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium" });
const results = [];
const failures = [];

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport, isMobile: Boolean(viewport.isMobile) });
  for (const route of routes) {
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(`pageerror: ${error.message}`));
    page.on("console", message => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 20_000 });

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    const focusSamples = [];
    for (let index = 0; index < 6; index += 1) {
      await page.keyboard.press("Tab");
      const active = await page.evaluate(() => {
        const element = document.activeElement;
        if (!(element instanceof HTMLElement)) return null;
        const bounds = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          tag: element.tagName.toLowerCase(),
          text: (element.textContent || element.getAttribute("aria-label") || "").trim().slice(0, 70),
          visible: bounds.width > 0 && bounds.height > 0 && style.visibility !== "hidden" && style.display !== "none",
          focusStyle: style.outlineStyle,
        };
      });
      focusSamples.push(active);
    }

    const focusFailure = focusSamples.some(sample => !sample || !sample.visible || sample.focusStyle === "none");
    if (overflow) failures.push(`${viewport.label} ${route}: horizontal overflow`);
    if (focusFailure) failures.push(`${viewport.label} ${route}: focus target is missing, hidden, or has no visible outline`);
    if (errors.length) failures.push(`${viewport.label} ${route}: ${errors.join(" | ")}`);
    results.push({ viewport: viewport.label, route, overflow, focusSamples, errors });
    await page.close();
  }
  await context.close();
}

await browser.close();
await mkdir(path.join(root, "docs"), { recursive: true });
await writeFile(path.join(root, "docs", "keyboard-qa-results.json"), `${JSON.stringify({ baseUrl, checkedAt: new Date().toISOString(), routeCount: routes.length, viewportCount: viewports.length, failures, results }, null, 2)}\n`);

if (failures.length) {
  console.error(`Keyboard QA found ${failures.length} issue(s):\n${failures.join("\n")}`);
  process.exit(1);
}
console.log(`Keyboard QA passed: ${routes.length} routes across ${viewports.length} viewport classes, with no overflow or focus failures.`);
