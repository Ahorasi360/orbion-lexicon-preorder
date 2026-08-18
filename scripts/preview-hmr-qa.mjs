import { chromium } from "playwright";

const baseUrl = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium" });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();
const errors = [];

page.on("console", message => {
  const text = message.text();
  if (message.type() === "error" && /vite.*(websocket|failed to connect)|websocket.*(closed|failed)/i.test(text)) errors.push(text);
});
page.on("pageerror", error => errors.push(error.message));

await page.goto(`${baseUrl}/book?from_webdev=1`, { waitUntil: "networkidle", timeout: 20_000 });
const rendered = await page.getByRole("heading", { name: /The Orbion Space Lexicon/i }).isVisible();
await context.close();
await browser.close();

if (!rendered || errors.length) {
  console.error(JSON.stringify({ rendered, errors }, null, 2));
  process.exit(1);
}
console.log("Managed preview QA passed: Book page rendered without Vite WebSocket errors.");
