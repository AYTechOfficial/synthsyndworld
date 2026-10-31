# Synthsynd World

**The agent bazaar** — a working marketplace for AI agents, tools, prompts and skills, plus the decision layer that picks the right one. Describe a mission and the match room names a winner for every job, scores it on six factors, prices it against your budget and shows the runner-up margin. Then edit the stack, compare finalists and export the handoff.

Built as a complete, demonstrable product for the Synthsynd World bounty: real catalog, real backend, real runners, real reviews, real publishing. No mock screens.

![Synthsynd World](screenshots/home.png)

| Match room — winners, margins, budget | Compare arena — weighted verdict |
| --- | --- |
| ![Match room](screenshots/match.png) | ![Compare arena](screenshots/compare.png) |

![Stack studio](screenshots/studio.png)

---

## What's inside

| Area | What works |
| --- | --- |
| **Catalog** | A curated catalog across `agent`, `tool`, `prompt`, `skill`; keyword search; category and tag filters; four sort modes (trending, installs, rating, newest) |
| **Listings** | Full description, version, author, tags, live rating, reviews, installs/views/runs, related listings |
| **Runner** | 9 deterministic runtimes execute locally in the Worker (no key, instant); six AI agents run on live, task-matched models with fallbacks, timeout and a per-IP daily quota. The response is credited to the model that answered — never a provider. |
| **Publishing** | Validated form with live preview card; writes a versioned listing to D1; appears instantly in the catalog and activity feed; success state with shareable URL |
| **Reviews** | Star rating + text, aggregates updated server-side, rating distribution in the UI |
| **Discovery UX** | ⌘/Ctrl+K command palette, live activity ticker, trending rank, skeletons, empty states, toasts |
| **Documentation** | In-app docs (`/docs`) covering the model, runtimes, API, publishing rules, architecture and roadmap; this README |
| **Design** | Hand-written obsidian-and-champagne design system: Instrument Serif + Manrope + JetBrains Mono, glass panels, fine gold hairlines, ambient light, scroll-driven reveals, responsive to 390px, reduced-motion support |
| **$SSDY** | The creator’s token is live on pump.fun, with a direct call-to-action in the navigation, hero, token band and footer. No tokenomics claims, no mirrors — one official link. |
| **Match room** | One brief → roles → one winner per role. Six weighted factors, runner-up margin, confidence, budget audit with modelled swaps, risk register, honest coverage gaps. Deterministic, replayable and explainable. |
| **Compare arena** | Up to four finalists, six user-set weights, live verdict, radar chart and a line-by-line table. Shareable URL carries the finalists and weights. |
| **Studio** | The winning draft becomes an editable pipeline: reorder (drag or arrows), replace from the catalog, re-price against budget, save to a browser library, export a JSON blueprint or a Markdown brief, share a link. |
| **Models** | Bring-your-own-endpoint live model routing, model-only attribution in the UI, automatic fallbacks, server-side configuration. No local or fake AI responses. |

## $SSDY

The creator’s token for Synthsynd World is live on pump.fun. Every token call-to-action in the UI — navigation, hero, token band and footer — opens the same official page in a new tab:

**https://pump.fun/coin/5kkYSNkWgn6DCkTkPRbKKEZtmzVzVWXSR9R9PK5Ppump**

Contract: `5kkYSNkWgn6DCkTkPRbKKEZtmzVzVWXSR9R9PK5Ppump` — copyable from the token band and footer. The site makes no price, return or tokenomics claims.

## Live models

Every AI agent calls a real, hosted model selected for its job. The browser sees only the model that answered; endpoint URLs and keys stay inside the Worker.

| Agent | Primary model | Chosen for |
| --- | --- | --- |
| Deep Research Copilot | Long-context | Long-context research |
| Code Review Copilot | Code | Code & correctness |
| Product Spec Whisperer | General | Product reasoning |
| Support Triage Unit | Triage | Fast triage |
| SQL Sensei | Data | Data & SQL |
| Synth Muse | Creative | Creative direction |

Routing is capability-based: each agent asks for a profile (long-context, code, data, triage, general, creative), matched against the models you register in your endpoint slots — the most specialized model wins. Selected fallbacks are tried automatically if a primary model is unavailable. The registry lives in [`server/models.ts`](server/models.ts); `GET /api/models` exposes only the public labels and capabilities. The table above shows the profile each agent requests; the model labels you see in the app come from your own endpoint configuration.

## Screens

- `/` — cinematic hero with a mission bar, live proof, activity ticker, a real match-room example, trending, categories, editorial standard, $SSDY band, fresh drops, publish call
- `/match` — mission brief → scored winner cards, budget audit, risk register, scoring audit trail
- `/compare` — weighted finalist arena with radar and table
- `/studio` — editable stack, library, export and share
- `/discover` — the full catalog with URL-synced filters
- `/item/:slug` — listing detail, prompt, manifest, reviews
- `/run/:slug` — the agent/tool runner (or reference view for prompts/skills)
- `/submit` — publish flow with a live preview
- `/docs` — product and API documentation

## Architecture

```
┌────────────────────────────── Cloudflare Worker ──────────────────────────────┐
│                                                                              │
│  Hono API  /api/*  ──►  D1 (items, reviews, events, usage, matches)          │
│      │                                                                       │
│      └─ match engine (deterministic scoring, no key)                        │
│      │                                                                       │
│      ├─ deterministic runners (server/runners.ts)                            │
│      └─ AI router ──► live models (task-matched, fallbacks, server-side keys)│
│                                                                              │
│  Static assets fallback ──► env.ASSETS (React SPA, SPA deep-link fallback)   │
└──────────────────────────────────────────────────────────────────────────────┘
                ▲
                │ same-origin JSON
        React 18 + React Router + hand-written CSS
```

- **Runtime:** one Worker serves API and UI. `run_worker_first` keeps `/api/*` ahead of assets and the SPA fallback handles deep links.
- **Database:** D1. Schema is created idempotently and seeded with the curated catalog on first request. All queries use bound parameters.
- **Runners:** deterministic logic lives in [`server/runners.ts`](server/runners.ts); per-agent model routing lives in [`server/models.ts`](server/models.ts) and is called from [`server/index.ts`](server/index.ts).
- **No secret reaches the browser.** Endpoint URLs and keys are read from the Worker environment only; responses carry a model label, never an endpoint.

### Data model

| Table | Purpose |
| --- | --- |
| `items` | One row per listing: slug, category, runtime, tags, body, prompt, input schema, version, counters |
| `reviews` | Rating + text per listing; feeds the live average |
| `events` | Install / publish / review activity for the ticker |
| `usage` | Per-IP daily count for live AI runs |
| `matches` | Mission briefs scored by the match room: query, budget, priority, winner, score |
| `settings` | Catalog seed version, so new listings reach an existing database without a wipe |

## Run it locally

Requires Node 18+.

```bash
npm install
npm run build
npx wrangler dev --port 8787
# open http://localhost:8787
```

Wrangler creates the local D1 database and seeds it automatically. No endpoint is needed for the catalog, publishing, reviews, or the deterministic runners.

To enable live AI runs, add your own OpenAI-compatible endpoints to `.env` (Wrangler reads it automatically):

```
MODEL_ENDPOINT_1_URL=https://your-endpoint.example/v1
MODEL_ENDPOINT_1_KEY=your-secret-key
MODEL_ENDPOINT_1_MODELS=model-large,model-fast,model-reasoning*thinking
```

Up to six slots (`MODEL_ENDPOINT_2_*` … `MODEL_ENDPOINT_6_*`). Slot 1 is treated as the strongest general endpoint; later slots serve as fallbacks when a primary model is unavailable. Append `*thinking` to a model id that tends to run a long silent reasoning pass — the runtime then asks it to answer directly.

For a deployed build, add the same names in **Sites → Secrets**. Endpoint URLs and keys stay server-side; `.env` is gitignored. Without endpoints, AI runs fail honestly with a model-unavailable message — there is no local or fake AI fallback.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run build` | Builds the SPA (`client-dist/`) and bundles the Worker (`server-dist/index.js`) |
| `npm run dev` | Builds, then starts `wrangler dev` |
| `npm run preview` | Starts `wrangler dev` on an existing build |

## API

All endpoints are same-origin JSON. Writes with a foreign `Origin` are rejected with 403.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/items` | List with `q`, `category`, `tag`, `sort` (`trending\|installs\|rating\|new`), `limit` |
| GET | `/api/items/:slug` | Listing + reviews + related; increments views |
| POST | `/api/items` | Publish a listing |
| POST | `/api/items/:slug/reviews` | Add a review (`rating` 1–5, `text` 5–600) |
| POST | `/api/items/:slug/install` | Increment installs |
| POST | `/api/run/:slug` | Execute a runnable listing; AI runs return `model` (the model that answered) |
| GET | `/api/models` | Public agent → model routing labels and capabilities |
| GET | `/api/stats` | Live totals and category counts |
| GET | `/api/events` | Latest 10 activity items |
| POST | `/api/match` | Score a brief (`q`, `budget`, `priority`) and record the mission |
| GET | `/api/match` | Replay the same verdict without recording it |
| GET | `/api/match/recent` | Latest six missions and their top winner |
| GET | `/api/compare` | Compare up to four slugs with `w_*` weights |
| GET | `/api/health` | Liveness probe |

### Example

```bash
curl -X POST http://localhost:8787/api/run/promptforge \
  -H 'content-type: application/json' \
  -d '{"values":{"raw":"an agent that reviews pull requests for security issues"}}'
```

```json
{
  "mode": "deterministic",
  "out": "You are a senior software engineer with a review-first mindset...",
  "ms": 3,
  "runs": 9211
}
```

## The runners

| Listing | Runtime | What it actually does |
| --- | --- | --- |
| Prompt Forge | `det:promptforge` | Rewrites an idea into role / objective / constraints / output contract |
| Degen Due Diligence | `det:duechecklist` | Builds a structured pre-trade research checklist (educational, no advice) |
| JSON → Schema | `det:json2schema` | Infers a draft-07 JSON Schema, merges array shapes, detects formats |
| Prompt Cost Oracle | `det:costcalc` | Token + monthly cost estimates across four models |
| Template Foundry | `det:template` | Fills `{{slots}}`, reports missing/unused/duplicate keys |
| Markdown Grid | `det:mdtable` | CSV/TSV → pipe-safe, padded Markdown table |
| Regex Lab | `det:regexlab` | Highlights matches, capture groups and common trap warnings |
| Text X-Ray | `det:textstats` | Word/sentence stats, Flesch ease, reading time, repetition |
| Hook Lab | `det:hooks` | Twelve labelled hook patterns per topic, scored for specificity and tension |

AI listings (Deep Research, Code Review, Product Spec, Support Triage, SQL Sensei, Synth Muse) are routed to live, task-matched models. The response credits only the model that answered.

## The match engine

The match room is the part that makes the marketplace a product rather than a list. Every listing has a profile — which roles it can play, a modelled monthly cost, time to a usable result, setup effort and vendor independence — and the engine is a pure function over the catalog:

1. **Split** the brief into jobs. A role needs at least two keyword signals; one passing mention is not a job. A brief that names a listing pins it.
2. **Rank** every listing that plays the role on six factors: capability fit, track record (Bayesian-shrunk rating + log-scaled usage), cost, speed, setup and independence.
3. **Weight** those factors by the priority preset (balanced, best result, lean budget, fastest path, data control), then pick one winner per job and record the runner-up margin.
4. **Audit** the stack: modelled cost versus budget with cheaper swaps and their score cost, coverage, close calls, model-key dependencies, and production nouns the catalog cannot serve.

Nothing is random and nothing is hidden: the weighting table is printed with every verdict, and `GET /api/match` replays the same result without recording it. That is why a shared link shows exactly what you saw.

Adding a runtime: implement a function in `server/runners.ts`, add it to `runDeterministic`, and reference it as `runtime: "det:<name>"` on a listing.

## Publishing rules

- Name 3–60 chars, tagline 10–160, body 30–4000, up to five tags.
- Show the real prompt or logic. Listings without the work get installed less.
- No financial-return promises, undisclosed promotion, or scraped prompts without credit.
- Every listing starts at `0.1.0` and is editable by the catalog maintainers.

## Deployment

The app is a standard Cloudflare Worker + static assets + D1 project. A Sites deployment manifest is included at [`sites-manifest.json`](sites-manifest.json):

```json
{
  "entrypoint": "index.js",
  "compatibilityDate": "2026-09-01",
  "modules": [{ "name": "index.js", "type": "esm", "path": "./server-dist/index.js" }],
  "assetsDirectory": "./client-dist",
  "spa": true
}
```

Provision a D1 database with binding name `DB` before deploying. The Worker creates and seeds its schema on first request.

## Security notes

- Endpoint URLs and keys are server-side only; the browser never sees them and API responses never name an endpoint.
- Same-origin enforcement on all writes; all SQL is parameterized; input lengths are capped.
- AI runs use fixed per-agent model routing, a 40-second attempt timeout and 40 live runs per IP per day.
- Reviews and listings are rate-limit-friendly by design (no auth in v1), but content is length-capped.
- No analytics, no third-party trackers, no cookies.

## Verification checklist

- [x] `npm run build` passes for client and worker
- [x] `/api/health`, `/api/stats`, `/api/items`, `/api/items/:slug` return live D1 data
- [x] Install, review, and publish mutate D1 and update the UI
- [x] All nine deterministic runners return real output
- [x] AI agents return live model output and a model-only attribution
- [x] SPA deep links (`/item/...`, `/run/...`, `/docs`) return the app
- [x] Command palette, filters, sorting, toasts, review posting
- [x] Match room drafts winners, shows margins, budget audit and risk register
- [x] Compare arena recomputes the verdict when a weight changes
- [x] Studio reorders, replaces, re-prices, exports a blueprint and shares a link
- [x] Responsive at 390px with no horizontal overflow

## Roadmap

Accounts and claimable listings · semantic search when the catalog warrants it · full version diffs · moderation queue · collections and author pages.

## License

MIT — use it, fork it, extend it.
