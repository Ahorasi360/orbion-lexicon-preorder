import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium" });
const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true });
const page = await context.newPage();
const errors = [];
page.on("pageerror", error => errors.push(`pageerror: ${error.message}`));
page.on("console", message => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });

await page.goto(`${baseUrl}/lexicon`, { waitUntil: "networkidle", timeout: 20_000 });
const initialCards = await page.locator(".entry-card").count();
await page.getByRole("button", { name: "Open navigation menu", exact: true }).click();
const menuVisible = await page.getByText("Explore Orbion", { exact: true }).isVisible();
await page.getByRole("button", { name: "Close navigation menu", exact: true }).click();

const letterNav = page.getByRole("navigation", { name: "Filter Lexicon by initial letter" });
await letterNav.getByRole("button", { name: "A", exact: true }).click();
await page.waitForFunction(() => document.querySelector(".active-lexicon-filter")?.textContent?.includes("Starts with A"));
const letterCards = await page.locator(".entry-card").count();
const letterNames = await page.locator(".entry-card h3").allTextContents();
const lettersMatch = letterNames.length > 0 && letterNames.every(name => name.trim().startsWith("A"));

const search = page.getByRole("searchbox", { name: "Search terms" });
await search.fill("acceleration");
await page.waitForFunction(() => document.querySelector(".active-lexicon-filter")?.textContent?.toLocaleLowerCase().includes("acceleration"));
const searchCards = await page.locator(".entry-card").count();
const searchText = (await page.locator(".entry-grid").innerText()).toLocaleLowerCase();
await page.getByRole("button", { name: "Clear search" }).click();
const clearedValue = await search.inputValue();
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);

const result = {
  baseUrl,
  checkedAt: new Date().toISOString(),
  initialCards,
  menuVisible,
  letterCards,
  lettersMatch,
  searchCards,
  searchIncludesAcceleration: searchText.includes("acceleration"),
  clearedValue,
  overflow,
  errors,
};
await mkdir(path.join(root, "docs"), { recursive: true });
await writeFile(path.join(root, "docs", "mobile-lexicon-qa-results.json"), `${JSON.stringify(result, null, 2)}\n`);
await context.close();
await browser.close();

const failed = !menuVisible || !lettersMatch || searchCards < 1 || !searchText.includes("acceleration") || clearedValue !== "" || overflow || errors.length;
if (failed) {
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}
console.log(`Mobile Lexicon QA passed: menu, A–Z filter, search, clear control, and overflow checks all succeeded (${initialCards} initial terms, ${letterCards} A terms, ${searchCards} search results).`);
