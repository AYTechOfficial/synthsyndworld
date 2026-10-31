// Records a short silent walkthrough of the decision layer:
// match room → studio → compare arena → docs.
// Usage: node scripts/record-decision-layer.mjs
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://127.0.0.1:8787";
const OUT_DIR = path.resolve("walkthrough-tmp");
const FINAL = path.resolve("walkthrough-v3.webm");

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
      "position:fixed;left:50%;top:50%;width:16px;height:16px;margin:-8px 0 0 -8px;border:2px solid #f3dfb4;border-radius:50%;background:rgba(243,223,180,.16);box-shadow:0 0 16px rgba(243,223,180,.8);pointer-events:none;z-index:2147483647;";
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

async function smoothScroll(targetY, duration = 700) {
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

async function move(x, y) {
  await page.mouse.move(x, y, { steps: 18 });
  await wait(180);
}

console.log("1. Home + mission bar");
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await wait(2200);
await smoothScroll(760, 800);
await wait(2600);
await smoothScroll(1420, 800);
await wait(3200);
await smoothScroll(0, 700);
await wait(600);

console.log("2. Match room");
await page.goto(
  BASE + "/match?q=Cut%20our%20support%20backlog%20and%20draft%20replies%20to%20angry%20customers&budget=80&priority=balanced",
  { waitUntil: "networkidle" },
);
await page.waitForSelector(".step-card");
await wait(2200);
await smoothScroll(330, 700);
await wait(2400);
await page.locator(".link-btn", { hasText: "Compare" }).first().click();
await wait(2600);
await smoothScroll(760, 700);
await wait(2600);
await smoothScroll(1500, 700);
await wait(2400);

console.log("3. Re-score as Best result");
await smoothScroll(0, 600);
await wait(500);
await page.getByRole("button", { name: "Best result" }).first().click();
await wait(2600);
await smoothScroll(330, 700);
await wait(2200);

console.log("4. Studio");
await page.getByRole("button", { name: /Open in studio/i }).click();
await page.waitForSelector(".studio-step");
await wait(1400);
await smoothScroll(150, 500);
await wait(900);
await page.locator('.studio-row-actions button[aria-label="Move down"]').first().click();
await wait(1600);
await page.getByRole("button", { name: /Replace/i }).first().click();
await page.waitForSelector(".picker-modal");
await wait(1700);
await page.locator(".picker-modal-item").first().click();
await wait(1800);
await smoothScroll(320, 600);
await wait(2200);

console.log("5. Compare arena");
await page.goto(BASE + "/compare?slugs=code-review-copilot,deep-research,support-triage", { waitUntil: "networkidle" });
await page.waitForSelector(".arena-verdict");
await wait(2000);
await page.evaluate(() => {
  const slider = document.querySelectorAll(".weight input")[1];
  if (slider) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    setter?.call(slider, "55");
    slider.dispatchEvent(new Event("input", { bubbles: true }));
  }
});
await wait(2200);
await smoothScroll(300, 700);
await wait(3000);
await smoothScroll(760, 700);
await wait(2600);

console.log("6. Sign in (password)");
await page.goto(BASE + "/signin", { waitUntil: "networkidle" });
await wait(1600);
await page.getByRole("tab", { name: "Create account" }).click();
await wait(1400);
await page.getByRole("tab", { name: "Sign in" }).click();
await wait(900);
await page.fill("#email", "reviewer@synthsynd.demo");
await page.fill("#password", "the-good-parts");
await wait(1600);

console.log("7. Docs");
await page.goto(BASE + "/docs#match", { waitUntil: "networkidle" });
await wait(1600);
await smoothScroll(1400, 800);
await wait(2600);

console.log("8. Closing frame");
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await wait(2600);

await page.close();
await context.close();
await browser.close();

const files = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith(".webm"));
if (!files.length) throw new Error("Playwright did not produce a .webm file");
const src = path.join(OUT_DIR, files[0]);
fs.copyFileSync(src, FINAL);
console.log("Saved:", FINAL, fs.statSync(FINAL).size, "bytes");
