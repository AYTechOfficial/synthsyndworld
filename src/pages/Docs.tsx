import { useEffect, useState } from "react";
import { Icon } from "../components/ui";
import { fetchModelsStatic } from "../api";

interface AgentModel {
  slug: string;
  name: string;
  model: string;
  capability: string;
}

export default function Docs() {
  const [models, setModels] = useState<AgentModel[]>([]);

  useEffect(() => {
    fetchModelsStatic()
      .then((d) => setModels(d.agents || []))
      .catch(() => setModels([]));
  }, []);

  return (
    <div className="container">
      <div className="page-head">
        <span className="kicker">Documentation</span>
        <h1>How Synthsynd World works</h1>
        <p>Everything on this page is implemented in the running build — no aspirational bullets. Read it before you publish, fork or integrate.</p>
      </div>

      <div className="docs-grid">
        <nav className="docs-nav" aria-label="Documentation">
          <a href="#overview">Overview</a>
          <a href="#catalog">Catalog model</a>
          <a href="#runtimes">Runtimes</a>
          <a href="#models">Models</a>
          <a href="#match">Match engine</a>
          <a href="#api">API reference</a>
          <a href="#publishing">Publishing guide</a>
          <a href="#architecture">Architecture</a>
          <a href="#local">Run it locally</a>
          <a href="#roadmap">Roadmap</a>
        </nav>

        <div className="docs-body">
          <h2 id="overview">Overview</h2>
          <p>
            Synthsynd World is a working marketplace for AI building blocks: <b>agents</b> that do autonomous work, <b>tools</b> that remove friction,
            <b> prompts</b> that have been tested, and <b>skills</b> that teams can adopt as playbooks. The goal is simple: discovery you can trust,
            and a demo behind every listing.
          </p>
          <p>Three principles shaped the build:</p>
          <ul>
            <li><b>Show the work.</b> Every listing includes its real prompt or logic, a version and an author.</li>
            <li><b>Runnable beats readable.</b> Agents and tools open in a live runner. Deterministic tools work with no API key at all.</li>
            <li><b>No empty promises.</b> No financial-advice listings, no undisclosed sponsorship, no “revolutionary” without a mechanism.</li>
          </ul>
          <p>
            The marketplace ships with a curated catalog across four categories and accepts community submissions through the
            <a href="/submit"> publish flow</a>.
          </p>

          <h2 id="catalog">Catalog model</h2>
          <p>Every listing is a row in D1 with a portable JSON manifest. The public shape:</p>
          <div className="codeblock">
            <div className="code-head"><span className="dots"><i /><i /><i /></span><span>listing.json</span></div>
            <pre className="code-body">{`{
  "slug": "promptforge",
  "name": "Prompt Forge",
  "category": "agent",            // agent | tool | prompt | skill
  "runtime": "det:promptforge",  // ai | det:<fn> | null
  "model": "GLM-5.3",          // public model label for AI listings
  "version": "1.4.2",
  "author": { "name": "synth_core", "role": "Founding curator" },
  "tags": ["prompting", "writing", "structure"],
  "inputSchema": [
    { "key": "raw", "label": "Raw idea", "type": "textarea" }
  ],
  "rating": { "avg": 4.8, "count": 4 },
  "installs": 4821,
  "runs": 9210
}`}</pre>
          </div>
          <p>
            Installs are counted server-side when someone copies the manifest. Runs are counted on every successful execution.
            Reviews feed a live average rating. Nothing is mocked — the counters are real D1 writes.
          </p>

          <h2 id="runtimes">Runtimes</h2>
          <p>There are three runtime states:</p>
          <ul>
            <li><b>Local deterministic</b> (<code>det:*</code>) — implemented in the Worker. Instant, private, free. Prompt Forge, JSON → Schema, Markdown Grid and five more run this way.</li>
            <li><b>AI</b> (<code>ai</code>) — a live model call routed through the Worker. Each agent has a task-matched primary model and selected fallbacks; keys and provider routing stay server-side. Runs have a 40-second timeout and a per-IP daily cap.</li>
            <li><b>Reference</b> — prompts and skills that are meant to be copied into your own model session. They expose no hosted runtime by design.</li>
          </ul>
          <p>
            AI runs are real model calls. The response header credits the model that actually answered — never a provider, endpoint or key.
          </p>

          <h2 id="models">Live models</h2>
          <p>
            Every AI agent is bound to the model best suited to its job. A primary model handles the run; if it is unavailable, the request
            falls through to a selected fallback. The marketplace shows only the model that answered.
          </p>
          {models.length > 0 ? (
            <div className="model-table" role="table" aria-label="Agent model routing">
              <div className="model-row model-row-head" role="row">
                <span role="columnheader">Agent</span>
                <span role="columnheader">Model</span>
                <span role="columnheader">Chosen for</span>
              </div>
              {models.map((m) => (
                <div className="model-row" role="row" key={m.slug}>
                  <a role="cell" href={"/item/" + m.slug}>{m.name}</a>
                  <span role="cell" className="model-name"><Icon name="spark" size={11} /> {m.model}</span>
                  <span role="cell" className="model-cap">{m.capability}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="hint">Loading the live model registry…</p>
          )}

          <h2 id="match">Match engine</h2>
          <p>
            The match room turns one brief into a ranked stack. It is deterministic, explainable and runs inside the Worker in a few
            milliseconds — no model key, no hidden model, no popularity vote. The same brief, budget and priority always produce the
            same verdict, which is why a shared link replays exactly what you saw.
          </p>
          <p>Every listing carries a capability profile: which roles it can play (0–100 fit), a modelled monthly run cost, time to a usable result, setup effort and vendor independence. On a brief the engine:</p>
          <ol>
            <li><b>Splits</b> the text into jobs. A job needs at least two keyword signals; one passing mention is not a role.</li>
            <li><b>Ranks</b> every listing that plays each role on six factors: capability fit, track record, cost, speed, setup effort and independence.</li>
            <li><b>Weights</b> those factors by the priority preset, then picks one winner per job and records the runner-up margin.</li>
            <li><b>Audits</b> the stack: modelled cost against budget, cheaper swaps, coverage, close calls and production nouns the catalog cannot serve.</li>
          </ol>
          <p><b>Track record</b> is a Bayesian-shrunk rating (a prior of 4.3 over six reviews) blended with a log-scaled usage signal — so four 5-star reviews do not beat two hundred 4.6-star reviews. <b>Cost</b> is the modelled monthly run price; local runtimes are genuinely $0 because they execute in the Worker.</p>
          <p>Weights by priority:</p>
          <div className="endpoint"><span className="method method-get">1</span><code>Balanced</code><span className="edesc">fit 42 · track record 20 · cost 8 · speed 10 · setup 8 · independence 12</span></div>
          <div className="endpoint"><span className="method method-get">2</span><code>Best result</code><span className="edesc">fit 40 · track record 32 · cost 4 · speed 6 · setup 6 · independence 12</span></div>
          <div className="endpoint"><span className="method method-get">3</span><code>Lean budget</code><span className="edesc">fit 38 · track record 14 · cost 28 · speed 8 · setup 8 · independence 4</span></div>
          <div className="endpoint"><span className="method method-get">4</span><code>Fastest path</code><span className="edesc">fit 40 · track record 14 · cost 6 · speed 26 · setup 8 · independence 6</span></div>
          <div className="endpoint"><span className="method method-get">5</span><code>Data control</code><span className="edesc">fit 40 · track record 16 · cost 6 · speed 6 · setup 8 · independence 24</span></div>
          <p>
            Honesty rules: a brief that names video, audio or another capability the catalog cannot serve gets a visible gap and a lower
            coverage score instead of a substituted agent. A role with a single candidate is labelled a default, not a contest. A stack
            over budget gets modelled swaps with the score cost printed.
          </p>
          <p>
            The compare arena reuses the same scoring inputs plus a documentation-depth factor, with user-set weights. Changing a weight
            changes the verdict instantly, and the URL carries the finalists and weights so a shortlist is shareable.
          </p>

          <h2 id="api">API reference</h2>
          <p>All endpoints are same-origin JSON. Writes are rejected from foreign origins.</p>
          <div className="endpoint"><span className="method method-get">GET</span><code>/api/items</code><span className="edesc">list · q, category, tag, sort, limit</span></div>
          <div className="endpoint"><span className="method method-get">GET</span><code>/api/items/:slug</code><span className="edesc">detail + reviews + related</span></div>
          <div className="endpoint"><span className="method method-post">POST</span><code>/api/items</code><span className="edesc">publish a listing</span></div>
          <div className="endpoint"><span className="method method-post">POST</span><code>/api/items/:slug/reviews</code><span className="edesc">add a review (1–5)</span></div>
          <div className="endpoint"><span className="method method-post">POST</span><code>/api/items/:slug/install</code><span className="edesc">increment the install counter</span></div>
          <div className="endpoint"><span className="method method-post">POST</span><code>/api/run/:slug</code><span className="edesc">execute a runnable listing</span></div>
          <div className="endpoint"><span className="method method-post">POST</span><code>/api/match</code><span className="edesc">score a brief · q, budget, priority — records the mission</span></div>
          <div className="endpoint"><span className="method method-get">GET</span><code>/api/match</code><span className="edesc">replay a verdict without recording it</span></div>
          <div className="endpoint"><span className="method method-get">GET</span><code>/api/match/recent</code><span className="edesc">latest six missions and their top winner</span></div>
          <div className="endpoint"><span className="method method-get">GET</span><code>/api/compare</code><span className="edesc">up to four slugs + w_* weights</span></div>
          <div className="endpoint"><span className="method method-get">GET</span><code>/api/models</code><span className="edesc">agent → live model routing</span></div>
          <div className="endpoint"><span className="method method-get">GET</span><code>/api/stats</code><span className="edesc">live totals and category counts</span></div>
          <div className="endpoint"><span className="method method-get">GET</span><code>/api/events</code><span className="edesc">latest marketplace activity</span></div>
          <div className="endpoint"><span className="method method-get">GET</span><code>/api/health</code><span className="edesc">liveness probe</span></div>

          <h3>Example: run an agent</h3>
          <div className="codeblock">
            <div className="code-head"><span className="dots"><i /><i /><i /></span><span>curl</span></div>
            <pre className="code-body">{`curl -X POST /api/run/promptforge \\
  -H 'content-type: application/json' \\
  -d '{"values":{"raw":"an agent that reviews pull requests for security issues"}}'

# => {
#   "mode": "deterministic",
#   "out": "You are a senior software engineer…",
#   "ms": 3,
#   "runs": 9211
# }`}</pre>
          </div>

          <h2 id="publishing">Publishing guide</h2>
          <p>Publishing takes about two minutes. The form validates name, tagline and body length, then writes a versioned row to D1.</p>
          <ul>
            <li><b>Name</b> — 3–60 characters, memorable, no version numbers.</li>
            <li><b>Tagline</b> — 10–160 characters. Say what it does and who it is for.</li>
            <li><b>Body</b> — 30–4000 characters. Describe the real work and its limits. Bullets are supported.</li>
            <li><b>The work</b> — paste the complete prompt or the real logic. Listings with the real prompt get installed far more.</li>
            <li><b>Tags</b> — up to five, lowercase, under 24 characters each.</li>
          </ul>
          <p>
            Not allowed: financial return promises, undisclosed paid promotion, scraped prompts without credit, or listings that cannot
            be demonstrated. Moderators can remove listings that break these rules.
          </p>

          <h2 id="architecture">Architecture</h2>
          <p>
            A single Cloudflare Worker serves both the API and the compiled React SPA. Catalog data lives in D1, seeded idempotently on first
            request. The frontend is React + React Router with no runtime UI framework — the design system is hand-written CSS.
          </p>
          <ul>
            <li><b>Worker</b> — Hono routes under <code>/api/*</code>, then a static-asset fallback so SPA routes deep-link correctly.</li>
            <li><b>Database</b> — D1 tables: <code>items</code>, <code>reviews</code>, <code>events</code>, <code>usage</code>, <code>matches</code>, <code>settings</code>. All queries are parameterized.</li>
            <li><b>Match engine</b> — <code>server/match.ts</code> plus per-listing profiles in <code>server/profiles.ts</code>. Pure functions: same input, same verdict.</li>
            <li><b>Runners</b> — deterministic functions run inside the Worker; AI runs are routed to task-matched live models with selected fallbacks, timeout and daily quota.</li>
            <li><b>Security</b> — same-origin write checks, input length caps, no key material in the browser, no secrets in listings.</li>
          </ul>

          <h2 id="local">Run it locally</h2>
          <div className="codeblock">
            <div className="code-head"><span className="dots"><i /><i /><i /></span><span>terminal</span></div>
            <pre className="code-body">{`npm install
npm run build
npx wrangler dev --port 8787

# open http://localhost:8787
# D1 is created and seeded automatically on first request`}</pre>
          </div>
          <p>
            Live AI runs dispatch to OpenAI-compatible endpoints that you configure in the Worker environment using numbered slots —
            <code>MODEL_ENDPOINT_1_URL</code>, <code>MODEL_ENDPOINT_1_KEY</code> and <code>MODEL_ENDPOINT_1_MODELS</code>, up to six endpoints.
            Slot 1 is treated as the strongest general endpoint and later slots serve as fallbacks. Add the same names in
            <b>Sites → Secrets</b> for a deployed build. Endpoint URLs and keys are read server-side only and never shipped to the browser.
            Everything else works without configuration.
          </p>

          <h2 id="roadmap">Roadmap</h2>
          <p>What is deliberately not in this version, and why:</p>
          <ul>
            <li><b>Accounts and ownership</b> — listings are anonymous by handle today. Sign-in and claimable ownership is the next milestone.</li>
            <li><b>Semantic search</b> — the catalog is small enough that keyword search is honest and fast. A vector index would be premature.</li>
            <li><b>Version history</b> — listings carry a version string, not yet a full diff history.</li>
            <li><b>Moderation queue</b> — publishing is instant; review-before-publish needs a real moderation workflow.</li>
          </ul>
          <p style={{ marginTop: 26 }}>
            <a href="/discover" className="btn btn-primary">Browse the catalog <Icon name="arrow" size={14} /></a>
          </p>
        </div>
      </div>
    </div>
  );
}
