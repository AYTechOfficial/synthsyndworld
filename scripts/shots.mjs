import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://127.0.0.1:8787";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 980 }, deviceScaleFactor: 1 });
const page = await context.newPage();

async function shot(path, file, opts = {}) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  if (opts.wait) await page.waitForSelector(opts.wait, { timeout: 15000 });
  if (opts.scroll) await page.evaluate((y) => window.scrollTo(0, y), opts.scroll);
  await page.waitForTimeout(opts.pause || 900);
  await page.screenshot({ path: "screenshots/" + file, fullPage: !!opts.full });
  console.log("captured", file);
}

await shot("/", "home.png");
await shot("/match?q=Cut%20our%20support%20backlog%20and%20draft%20replies%20to%20angry%20customers&budget=80&priority=balanced", "match.png", { wait: ".step-card", scroll: 320, pause: 1200 });
await shot("/compare?slugs=code-review-copilot,deep-research,support-triage", "compare.png", { wait: ".arena-verdict", scroll: 220, pause: 1000 });
await shot("/studio?s=escalation-writer,ruthless-editor&name=Support%20response%20stack&budget=80", "studio.png", { wait: ".studio-step", scroll: 260, pause: 900 });

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const m = await mobile.newPage();
await m.goto(BASE + "/match?q=Review%20our%20pull%20requests%20for%20security%20before%20launch&budget=120&priority=balanced", { waitUntil: "networkidle" });
await m.waitForSelector(".step-card", { timeout: 15000 });
await m.waitForTimeout(900);
await m.screenshot({ path: "screenshots/match-mobile.png", fullPage: false });
console.log("captured match-mobile.png");

await browser.close();
