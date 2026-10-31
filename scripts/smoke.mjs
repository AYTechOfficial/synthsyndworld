import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://127.0.0.1:8787";
const PUMP = "https://pump.fun/coin/5kkYSNkWgn6DCkTkPRbKKEZtmzVzVWXSR9R9PK5Ppump";
const failures = [];
const note = (ok, message) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${message}`);
  if (!ok) failures.push(message);
};

const browser = await chromium.launch({ headless: true });

async function newPage(width, height) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(e.message));
  return { context, page, errors };
}

/* desktop routes */
{
  const { context, page, errors } = await newPage(1440, 1000);
  const routes = [
    ["/", "The work of machines"],
    ["/match", "Every job gets a winner"],
    ["/compare", "Four finalists. One winner."],
    ["/studio", "Reorders the work"],
    ["/discover", "The whole bazaar"],
    ["/item/promptforge", "Prompt Forge"],
    ["/run/promptforge", "Prompt Forge"],
    ["/submit", "Publish a listing"],
    ["/docs", "How Synthsynd World works"],
    ["/missing-page", "This page wandered off"],
  ];
  for (const [path, heading] of routes) {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    const text = await page.locator("h1").first().innerText();
    note(text.includes(heading), `route ${path} renders “${heading}”`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    note(overflow <= 1, `route ${path} has no horizontal overflow (${overflow}px)`);
  }
  note(errors.length === 0, `no console/page errors across routes${errors.length ? ": " + errors.join(" | ") : ""}`);
  await context.close();
}

/* pump.fun integration */
{
  const { context, page } = await newPage(1440, 1000);
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const links = await page.$$eval('a[href*="pump.fun"]', (as) => as.map((a) => ({ href: a.href, target: a.target, rel: a.rel, text: a.textContent.trim() })));
  const exact = links.filter((l) => l.href === PUMP);
  note(exact.length >= 4, `home exposes the canonical $SSDY URL in ${exact.length} places`);
  note(exact.every((l) => l.target === "_blank" && l.rel.includes("noopener") && l.rel.includes("noreferrer")), "all pump.fun links open safely in a new tab");
  note(exact.some((l) => /Creator’s \$SSDY on pump\.fun/i.test(l.text)), "footer uses the “Creator’s $SSDY on pump.fun” label");
  note(exact.some((l) => /Buy \$SSDY on pump\.fun/i.test(l.text)), "hero/token use the “Buy $SSDY on pump.fun” label");

  await page.keyboard.press("Control+k");
  await page.waitForSelector(".palette-input input");
  await page.fill(".palette-input input", "schema");
  await page.waitForTimeout(300);
  const results = await page.$$eval(".palette-item", (els) => els.map((e) => e.textContent));
  note(results.some((t) => t.includes("JSON → Schema")), "command palette finds “JSON → Schema”");
  await page.keyboard.press("Escape");

  await page.goto(BASE + "/discover", { waitUntil: "networkidle" });
  await page.locator(".seg-btn", { hasText: "Tools" }).click();
  await page.waitForTimeout(650);
  const filtered = await page.$$eval(".seg-btn.active", (els) => els[0]?.textContent || "");
  const count = await page.locator(".grid .card").count();
  const toolCount = await page.evaluate(async () => (await (await fetch("/api/stats")).json()).categories.tool);
  note(filtered.includes("Tools") && count === toolCount, `discover filters to tools (${count} cards)`);

  await page.goto(BASE + "/run/promptforge", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Run agent" }).click();
  await page.waitForTimeout(1800);
  const output = await page.locator(".output-body").innerText().catch(() => "");
  note(output.length > 40, "Prompt Forge runner returns real output");
  await context.close();
}

/* match room → studio flow */
{
  const { context, page, errors } = await newPage(1440, 1000);
  await page.goto(BASE + "/match?q=Cut%20our%20support%20backlog%20and%20draft%20replies&budget=80&priority=balanced", { waitUntil: "networkidle" });
  await page.waitForSelector(".step-card", { timeout: 8000 });
  const cards = await page.locator(".step-card").count();
  note(cards >= 2, `match room drafts ${cards} winner cards`);
  note(await page.locator(".winner-seal").count() === cards, "every match card carries a winner seal");
  const shareLink = new URL(page.url());
  note(/Cut our support/.test(shareLink.searchParams.get("q") || "") && shareLink.searchParams.get("budget") === "80", "match verdict is encoded in the URL");
  const maths = await page.locator(".audit-table tr").count();
  note(maths === 7, `audit panel prints every weight row (${maths - 1} factors)`);

  const detail = await page.locator(".step-card").first().innerText();
  note(/confidence/i.test(detail) && /Why this wins/i.test(detail), "winner card shows confidence and reasoning");

  await page.getByRole("button", { name: /Open in studio/i }).click();
  await page.waitForSelector(".studio-step", { timeout: 8000 });
  const studioSteps = await page.locator(".studio-step").count();
  note(studioSteps === cards, `studio received the same ${studioSteps} steps`);

  await page.goto(BASE + "/compare?slugs=code-review-copilot,deep-research,support-triage", { waitUntil: "networkidle" });
  await page.waitForSelector(".arena-verdict", { timeout: 8000 });
  const winnerName = await page.locator(".arena-winner h2").innerText();
  note(winnerName.length > 2, `compare arena picks a winner (${winnerName})`);
  const radar = await page.locator(".radar-shape").count();
  note(radar === 3, `radar plots all three finalists (${radar})`);

  note(errors.length === 0, `no console/page errors in the decision layer${errors.length ? ": " + errors.join(" | ") : ""}`);
  await context.close();
}

/* responsive nav + mobile menu + layout */
for (const width of [1280, 920, 880, 768, 390]) {
  const { context, page } = await newPage(width, 900);
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const info = await page.evaluate(() => {
    const rect = (s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) };
    };
    return {
      viewport: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      brand: rect(".brand"),
      actions: rect(".nav-actions"),
      nav: rect(".nav-inner"),
      burger: getComputedStyle(document.querySelector(".burger")).display,
    };
  });
  note(info.scrollWidth <= info.viewport + 1, `viewport ${width} has no horizontal overflow`);
  note(info.brand && info.actions && info.brand.right < info.actions.left, `viewport ${width} nav brand and actions do not overlap`);
  note(info.actions && info.actions.right <= info.nav.right, `viewport ${width} nav actions fit inside the header`);
  if (width === 390) {
    await page.goto(BASE + "/match?q=Review%20pull%20requests%20for%20security", { waitUntil: "networkidle" });
    await page.waitForSelector(".step-card", { timeout: 8000 });
    const matchOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    note(matchOverflow <= 1, `match room has no horizontal overflow at 390px (${matchOverflow}px)`);
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    note(info.burger !== "none", "mobile menu trigger is visible at 390px");
    await page.getByRole("button", { name: "Menu" }).click();
    const menuPump = await page.locator(".mobile-menu a.btn-pump").getAttribute("href");
    note(menuPump === PUMP, "mobile menu includes the $SSDY pump.fun button");
    const menuOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    note(menuOverflow <= 1, "open mobile menu does not create overflow");
  }
  await context.close();
}

/* mobile detail layout */
{
  const { context, page } = await newPage(390, 844);
  await page.goto(BASE + "/item/promptforge", { waitUntil: "networkidle" });
  const widths = await page.evaluate(() => {
    const overflow = document.documentElement.scrollWidth - window.innerWidth;
    const code = document.querySelector(".codeblock")?.getBoundingClientRect().width || 0;
    const grid = document.querySelector(".detail-grid")?.getBoundingClientRect().width || 0;
    return { overflow, code, grid };
  });
  note(widths.overflow <= 1, "mobile listing detail has no horizontal overflow");
  note(widths.code <= widths.grid + 1, "mobile code blocks stay inside the detail column");
  await context.close();
}

await browser.close();
if (failures.length) {
  console.error(`\n${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nAll smoke checks passed.");
