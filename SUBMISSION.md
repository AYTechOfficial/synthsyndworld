# Synthsynd World — bounty submission

**Bounty:** “Prove the Product. Build the Ecosystem.” — Synthsynd World, an AI agent marketplace for discovering and sharing agents, tools, prompts and skills.

**Deliverable:** a complete, working implementation of the marketplace with a live runner, real data, documentation, a decision layer and recorded walkthroughs.

**Live build:** https://site-88e41829834e494ebb2ee8827761e6dc.freebuff.page

**Decision-layer walkthrough:** [walkthrough-v2.mp4](walkthrough-v2.mp4) (72s, silent, shot on the running build). **Marketplace walkthrough:** [walkthrough.mp4](walkthrough.mp4) (narrated, recorded before the match room landed).

## One sentence

Synthsynd World is a working agent bazaar **with a decision layer**: describe a mission and the match room names a winner for every job — scored on six weighted factors, priced against your budget, with the runner-up margin, a risk register and an audit trail printed alongside. Edit the winners in the studio, compare finalists in the arena, export the handoff.

## Why this is a real submission, not a mock

- **Real database, real counters.** Publishing, reviews and installs write to D1 and immediately change the catalog, ratings and activity ticker. Reload the page — the data persists.
- **Real runners.** Nine tools execute deterministic logic inside the Worker: prompt restructuring, JSON Schema inference, CSV→Markdown, regex analysis, readability stats, template filling, cost modelling and Hook Lab hook generation. They return in milliseconds with no API key.
- **Real AI path.** Six agents route to live hosted models selected for their task, with automatic fallbacks, a 40-second attempt timeout and a per-IP daily quota. The UI credits only the model that answered; provider credentials and endpoints never reach the browser. There is no local or fake AI fallback.
- **Real publishing.** The publish form validates, writes a versioned listing to D1, and links to the live detail page. Anyone can install or review it.
- **Real decision layer.** The match room is a deterministic scoring engine over the catalog, not a prompt wrapper. It splits a brief into jobs, ranks listings on six factors with a printed weighting table, models budget swaps, and reports production capabilities the catalog cannot serve instead of substituting an agent. `/compare` recomputes a weighted verdict live; `/studio` turns the draft into an editable, exportable plan.
- **Real documentation.** In-app docs (`/docs`) plus this repository README cover the model, API, runtimes, match engine, publishing rules, architecture and roadmap.

## Demo script (what the walkthrough shows)

1. **Home** — hero with a mission bar, live counts, recent activity ticker, a real match-room example, trending and fresh drops.
2. **Match room** — type “Cut our support backlog and draft replies to angry customers”; watch the four-pass analysis, then read the winner cards: score, confidence, runner-up margin, six factor bars, budget audit, risk register and the printed weights. Re-score as “Best result” and watch the verdict move.
3. **Studio** — open the draft, reorder a step, replace one from the catalog, read the live cost total, then copy the Markdown brief and a share link.
4. **Compare arena** — drag the weights and watch the winner change; the radar and table update with it.
5. **Discovery** — search “schema”, filter by category and tag, sort by rating/newest; URL stays shareable.
3. **Command palette** — ⌘/Ctrl+K, type “review”, open Code Review Copilot.
6. **Listing** — full description, system prompt, install manifest, rating distribution, add-to-stack and reviews.
7. **Runner** — Prompt Forge: type a raw idea, run it, get a structured prompt instantly.
8. **Tool runner** — Hook Lab or JSON → Schema: real output from a local runtime.
9. **Live model run** — Deep Research answers in real time; the response header names the model that answered.
10. **Publish** — fill the form, watch the live preview card, publish; the listing appears in the catalog and ticker.
11. **Docs** — match engine, model routing, API, runtimes and the implementation reference behind every claim.

## How to run

```bash
npm install
npm run build
npx wrangler dev --port 8787
```

Open `http://localhost:8787`. Catalog, publishing, reviews and all deterministic runners work with no configuration. Add your OpenAI-compatible endpoints to `.env` (`MODEL_ENDPOINT_1_URL/_KEY/_MODELS`, up to six slots) for live AI runs. Endpoint URLs and keys are server-side only.

## Verification performed

- Client and Worker builds pass.
- All API routes exercised against local D1 with curl.
- UI flows exercised in the browser: install, review posting, publishing, runner execution, command palette, filtering, mobile layout.
- SPA deep links and asset serving verified through `wrangler dev`.

## What is deliberately out of scope (v1)

Accounts/ownership, semantic search, version diffs and a moderation queue. These are listed in the in-app roadmap with reasons — shipping an honest v1 is more useful than four half-built features.

## Files of interest

- `server/index.ts` — Worker API, schema bootstrap, AI run endpoint
- `server/models.ts` — live model registry and per-agent routing
- `server/runners.ts` — deterministic agent/tool logic
- `server/data.ts` — the curated catalog
- `src/` — React app, hand-written design system
- `sites-manifest.json` — deployment manifest
- `walkthrough.mp4` / `walkthrough-v2.mp4` — recorded product walkthroughs
- `screenshots/` — home, match room, compare arena, studio and mobile captures
