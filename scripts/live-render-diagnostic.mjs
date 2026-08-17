import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const url = process.env.LIVE_QA_URL || "https://orbion-lexicon-preorder-seven.vercel.app/book";
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium" });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const consoleErrors = [];
const failedRequests = [];
page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
page.on("requestfailed", request => failedRequests.push({ url: request.url(), failure: request.failure()?.errorText || "unknown" }));
await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 }).catch(error => consoleErrors.push(`navigation: ${error.message}`));
await page.waitForTimeout(1_000);
const rendered = await page.evaluate(() => ({
  title: document.title,
  rootText: document.getElementById("root")?.innerText || "",
  rootChildCount: document.getElementById("root")?.childElementCount || 0,
  bodyText: document.body.innerText.slice(0, 500),
}));
await browser.close();
const result = { url, checkedAt: new Date().toISOString(), consoleErrors, failedRequests, rendered };
await mkdir(path.join(root, "docs"), { recursive: true });
await writeFile(path.join(root, "docs", "live-render-diagnostic.json"), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
if (!rendered.rootText.trim() || consoleErrors.length || failedRequests.length) process.exit(1);
