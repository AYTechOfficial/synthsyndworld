# Synthsynd World — bounty submission

**Bounty:** “Prove the Product. Build the Ecosystem.” — Synthsynd World, an AI agent marketplace for discovering and sharing agents, tools, prompts and skills.

**Deliverable:** a complete, working marketplace plus a decision layer — catalog, publishing, reviews, counters, a deterministic match engine, a weighted compare arena, a stack studio, real accounts on Supabase, real Postgres with row-level security, documentation and recorded walkthroughs. Deployable on Vercel; [repository](https://github.com/AYTechOfficial/synthsyndworld) included.

**Decision-layer walkthrough:** [walkthrough-v3.mp4](walkthrough-v3.mp4) (77s, silent, shot on the running build — match room, studio, compare arena, password sign-in, docs). **Narrated marketplace walkthrough:** [walkthrough.mp4](walkthrough.mp4).

## One sentence

Synthsynd World is a working agent bazaar **with a decision layer**: describe a mission and the match room names a winner for every job — scored on six weighted factors, priced against your budget, with the runner-up margin, a risk register and an audit trail printed alongside — then sign in with a magic link and your stacks, reviews and published listings follow you everywhere.

## Why this is a real submission, not a mock

- **Real database, real counters.** Postgres in Supabase with row-level security enabled on every table. Publishing, reviews, installs and runs mutate live rows through RPC-authenticated paths; the catalog, averages and activity ticker change immediately.
- **Real decision layer.** The match room is a deterministic scoring engine over the catalog, not a prompt wrapper. It splits a brief into jobs, ranks listings on six factors with a printed weighting table, models budget swaps, and reports production capabilities the catalog cannot serve instead of substituting an agent. `/compare` recomputes a weighted verdict live; `/studio` turns the draft into an editable, sync-able and exportable plan.
- **Real accounts.** Magic-link sign-in through Supabase Auth (PKCE). Owner-scoped `stacks` with RLS, attributed reviews and attributed publications. Sign-out, sign-in on another device, and the library is the same.
- **Real runners.** Nine tools execute deterministic logic — prompt restructuring, JSON Schema inference, CSV→Markdown, regex analysis, readability stats, template filling, cost modelling, hook generation, due diligence — instantly and privately in the browser.
- **Real documentation.** In-app docs (`/docs`) plus the README cover the data model, schemas, RLS policies, the match engine's exact weights, publishing rules, architecture and roadmap.

## Demo script (what the walkthrough shows)

1. **Home** — boot shimmer, mission bar, live counts, activity ticker and a real verdict preview from the current catalog.
2. **Match room** — type “Cut our support backlog and draft replies to angry customers”; read the winner cards: score, confidence, runner-up margin, six factor bars, then re-score as “Best result” and watch the verdict move.
3. **Studio** — open the draft, reorder, replace a step from the catalog, read the live cost total, export the JSON blueprint, copy the Markdown brief.
4. **Compare arena** — drag a weight slider; watch the winner change and the radar redraw.
5. **Sign in** — magic link from the nav; on return, save a stack, reload in a private window on another device: it is still there.
6. **Publish** — fill the form, ship a versioned listing, watch it appear instantly in the catalog and activity ticker.
7. **Listing** — prompt, install manifest, rating distribution, add-to-stack and attributed reviews.
8. **Runner** — Prompt Forge or Hook Lab: real output in milliseconds, with the counter bumped in Postgres.
9. **Docs** — schemas, RLS, engine weights, publishing rules.

## How to run

```bash
npm install
cp .env.example .env      # fill VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm run dev               # http://127.0.0.1:8787
```

Database bootstrap (one time): paste [`supabase/setup.sql`](supabase/setup.sql) into the Supabase SQL editor, or run `SUPABASE_DB_PASSWORD="..." node scripts/apply-schema.mjs`. Vercel: import the repo, set the same two env vars, deploy. Without env values the whole catalog, match room, compare arena, studio and all nine runners still work — sign-in, publishing, reviews and sync fail honestly.

## Verification performed

- `npm run build` and `tsc --noEmit` clean.
- Playwright smoke suite across all routes, the match → studio flow, the compare arena, runner execution, pump.fun canonical links, the command palette and 390px mobile with no horizontal overflow.
- Supabase: schema + seed applied idempotently; RLS verified so anonymous clients can read but not mutate rows; `bump_metric` is the only counter path.

## What is deliberately out of scope (v1)

Semantic search, stack runbooks (running entire stacks), author profile pages and a moderation queue. Each is listed in the in-app roadmap with a reason — shipping an honest, verified v1 beats four half-built features.

## Files of interest

- `src/api.ts` — data layer: bundled catalog + Supabase reads/writes, engines
- `src/lib/match.ts`, `src/lib/profiles.ts` — the deterministic match engine and capability profiles
- `src/lib/runners.ts` — the nine deterministic runtimes
- `src/lib/account.ts`, `src/lib/supabase.ts` — Supabase Auth wiring and session state
- `src/lib/catalog.ts` — the curated marketplace
- `src/fx.tsx` — the motion layer (boot overlay, pointer aura, constellation, tilt, route fades)
- `supabase/schema.sql`, `supabase/setup.sql` — tables, RLS, RPC and seed
- `vercel.json` — one-command Vercel configuration
- `walkthrough.mp4` / `walkthrough-v2.mp4` and `screenshots/` — recorded proof
