// Records a short, scripted walkthrough of Synthsynd World.
// Usage: node scripts/record-walkthrough.mjs
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://127.0.0.1:8787";
const OUT_DIR = path.resolve("walkthrough-tmp");
const FINAL = path.resolve("walkthrough.webm");

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: OUT_DIR, size: { width: 1440, height: 900 } },
  deviceScaleFactor: 1,
});

await context.addInitScript(() => {
  const mount = () => {
    if (document.getElementById("__walk_cursor")) return;
    const dot = document.createElement("div");
    dot.id = "__walk_cursor";
    dot.style.cssText =
      "position:fixed;left:0;top:0;width:16px;height:16px;margin:-8px 0 0 -8px;border:2px solid #3cf2b4;border-radius:50%;background:rgba(60,242,180,.18);box-shadow:0 0 14px rgba(60,242,180,.85);pointer-events:none;z-index:2147483647;";
    document.body.appendChild(dot);
    document.addEventListener(
      "mousemove",
      (e) => {
        dot.style.left = e.clientX + "px";
        dot.style.top = e.clientY + "px";
      },
      true,
    );
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
});

const page = await context.newPage();
const wait = (ms) => page.waitForTimeout(ms);

async function smoothScroll(targetY, duration = 600) {
  await page.evaluate(
    ({ y, ms }) =>
      new Promise((resolve) => {
        const startY = window.scrollY;
        const t0 = performance.now();
        const step = (t) => {
          const p = Math.min(1, (t - t0) / ms);
          const e = 1 - Math.pow(1 - p, 3);
          window.scrollTo(0, startY + (y - startY) * e);
          if (p < 1) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      }),
    { y: targetY, ms: duration },
  );
}

async function goto(pathname) {
  await page.goto(BASE + pathname, { waitUntil: "networkidle" });
  await wait(900);
}

console.log("1. Home");
await goto("/");
await wait(2200);
await smoothScroll(650, 700);
await wait(2200);
await smoothScroll(1300, 700);
await wait(2200);
await smoothScroll(0, 600);
await wait(700);

console.log("2. Command palette → Prompt Forge");
await page.keyboard.press("Control+k");
await wait(700);
await page.locator(".palette-input input").fill("prompt forge");
await wait(1000);
await page.keyboard.press("Enter");
await wait(2000);

console.log("3. Listing detail");
await wait(700);
await smoothScroll(560, 600);
await wait(1900);
await smoothScroll(1400, 800);
await wait(2000);
await smoothScroll(0, 600);
await wait(500);
await page.locator(".detail-actions a.btn-primary").click();
await wait(1800);

console.log("4. Prompt Forge runner");
await page.locator(".run-grid form button[type=submit]").click();
await wait(2300);
await smoothScroll(470, 600);
await wait(2100);

console.log("5. JSON → Schema tool");
await goto("/run/json2schema");
await page.locator(".run-grid form button[type=submit]").click();
await wait(2100);
await smoothScroll(440, 500);
await wait(1700);

console.log("6. Publish flow");
await goto("/submit");
await page.fill("#name", "Release Radar");
await wait(400);
await page.fill("#tagline", "Turns a week of merged pull requests into release notes people read.");
await wait(400);
await page.fill(
  "#description",
  "Paste a week of merged PRs and get a clean release note grouped by theme, with breaking changes first and internal noise removed.",
);
await wait(400);
await page.fill("#author", "synth_core");
await wait(1200);
await smoothScroll(420, 500);
await wait(600);
await page.locator(".submit-grid form button[type=submit]").click();
await wait(2400);

console.log("7. Published listing");
await page.locator(".success-card a").first().click();
await wait(2200);
await smoothScroll(300, 500);
await wait(1800);

console.log("8. Documentation");
await goto("/docs");
await wait(1400);
await smoothScroll(520, 600);
await wait(1900);

console.log("Closing and finalizing video…");
await page.close();
await context.close();
await browser.close();

const files = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith(".webm"));
if (!files.length) throw new Error("Playwright did not produce a .webm file");
const src = path.join(OUT_DIR, files[0]);
fs.copyFileSync(src, FINAL);
console.log("Saved:", FINAL, fs.statSync(FINAL).size, "bytes");
