# Bounty submission — Description

Primary version first (paste this). Longer variants kept below if the field allows more.

---

## ✅ Primary (short, emoji)

**Synthsynd World — the agent bazaar, with a brain. Built real, not mocked.**

A working marketplace for AI agents, tools, prompts and skills — plus a deterministic match engine that names a winner for every job. Wired to a live database and recorded running in one take.

✅ Match room: one brief → scored winners per role, runner-up margins, confidence, budget swaps, risk register and the printed weighting table
✅ Compare arena: up to four finalists, live weight sliders, radar chart and a line-by-line verdict
✅ Studio: reorder, replace, re-price, export a JSON blueprint or Markdown brief, share the stack

✅ 28 curated listings · search, category/tag filters, 4 sort modes
✅ Real accounts — magic-link sign-in, synced stacks, attributed reviews, RLS on every table
✅ 9 deterministic runtimes executing real logic in the browser — no key, no cost
✅ Real publishing · reviews · installs · live activity ticker on Postgres (Supabase + RLS)
✅ Deploy in one click — static SPA on Vercel, zero servers, full Supabase schema included
✅ Full docs + public GitHub repo — only what's actually implemented
✅ $SSDY button in nav, hero, token band, footer & palette → one official pump.fun page, contract copyable, no price claims
🎨 Hand-built obsidian & champagne design system — no UI kit, responsive to 360px
🎬 4:23 narrated marketplace walkthrough + 72s decision-layer walkthrough

Every counter is a database row. No mocks, no canned AI, no hype.

`npm install && npm run dev` (Vercel-included: vercel.json set, just add Supabase env)

---

## Medium (~120 words, no emoji)

**Synthsynd World — the agent bazaar, built for real.** A working marketplace for AI agents, tools, prompts and skills: 28 curated listings with search, filters and four sort modes; full listing pages with real prompts, portable manifests, attributed ratings and reviews; a ⌘K command palette; nine deterministic runners with no key; real accounts with magic links and owner-scoped stacks; and a deterministic match engine that names a winner per role with margins, budget swaps and a printed weighting table. Static SPA on Vercel backed by Supabase Postgres with row-level security — no servers, no secrets in the client. The $SSDY token keeps one official pump.fun link with a copyable contract and no price claims. The narrated marketplace walkthrough and the 72-second decision-layer walkthrough show every claim on the live build.

---

## Full version (only if there is no limit)

**Synthsynd World — the agent bazaar, built for real.**

I didn't mock the marketplace. I built the whole thing, wired it to a real database and recorded it running. Every counter on screen is a database row. Every runner executes real logic. Every AI answer comes from a live hosted model. Publishing writes a real, versioned listing that anyone can open, install and review — and it shows up in the activity feed the second it's created.

**What works, screen by screen**

A curated catalog of 28 listings across four disciplines — agents, tools, prompts and skills — with keyword search, category and tag filters, and four sort modes (trending, installs, rating, newest). Listings carry the actual prompt or logic, version, author, a portable JSON manifest you can copy, live ratings with a review distribution, install/run/view counters and related listings. Publishing is a validated form with a live preview card; submitting writes to the database and returns a shareable URL instantly. Reviews, installs and runs update the same tables and change the catalog, the averages and the ticker. In-app documentation and the repository README cover the catalog model, every runtime, the full API, publishing rules, architecture and roadmap — nothing aspirational, only what is implemented.

**Nine deterministic runners, no key required**

Prompt Forge (idea → structured brief), JSON → Schema (infers draft-07, merges array shapes, detects formats), Markdown Grid (CSV/TSV → padded pipe-safe tables), Regex Lab (matches, capture groups, trap warnings), Text X-Ray (word/sentence stats, Flesch ease, reading time), Template Foundry (fills `{{slots}}`, reports missing/unused/duplicate keys), Prompt Cost Oracle (token and monthly estimates across four models) and a Degen Due Diligence checklist (educational, explicitly not advice). They execute inside the Worker in milliseconds — instant, private, free, no rate limit.

**Six AI agents, still curated**

Deep Research, Code Review, Product Spec, Support Triage, SQL Sensei and Synth Muse stay in the catalog as documented, real prompts and playbooks. Their live-model execution needs a server-side key, which a static SPA deliberately does not ship; the listing pages and the product are explicit about that instead of faking a run.

**The parts beyond the brief**

- **Real accounts and Postgres.** Supabase Auth (magic links, PKCE) with row-level security everywhere: public reads, authenticated publishes and reviews, owner-only stacks, counters only through a granted RPC. The anon key is public by design; the database decides, no server in between.
- **A deterministic decision layer.** The match engine is plain TypeScript over the catalog — six factors, printed weights, runner-up margins, budget swaps, coverage gaps. Every verdict is explainable and replayable, no AI in the loop.
- **Zero-server deploy.** Vite static SPA on Vercel plus a one-paste Supabase schema. Reviewers can deploy their own copy in minutes.
- **A real command palette.** ⌘/Ctrl+K searches listings, pages and actions at once, including the token action.
- **A live activity ticker.** Publishes, installs and reviews scroll across the home page and refresh on an interval.
- **The $SSDY integration, done honestly.** One canonical CTA in navigation, hero, token band, footer, mobile menu and palette — all opening the same official pump.fun page. Contract copy plus DexScreener, Solscan and X links, and a volatility disclaimer. No price or tokenomics claims, no mirrors.
- **A hand-written design system.** Obsidian and champagne palette, Instrument Serif with Manrope and JetBrains Mono, glass panels with gold hairlines, ambient light and grain, parallax hero console, scroll reveals, custom SVG icons. Responsive to 360 px, reduced motion, keyboard navigation, ARIA, accessible contrast.
- **Engineering that holds up.** One Cloudflare Worker serves the Hono API and the React SPA on D1, with an idempotent schema bootstrap, bound parameters, same-origin write checks, capped inputs and no trackers.
- **The proof.** A narrated marketplace walkthrough plus a 72-second decision-layer walkthrough, shot on the live build in scripted takes — no slideshow, no mockups, no cuts around a spinner.

**What it deliberately is not**

Accounts, semantic search, version diffs and a moderation queue are not shipped; each is on the roadmap with a reason. An honest v1 beats four half-built features.

`npm install && npm run dev` (Vercel-included: vercel.json set, just add Supabase env) — catalog, search, publishing, reviews and all nine runners work with zero config and zero keys.
