// Synthsynd World — seed catalog.
// Each entry is a real, copy-pasteable agent / tool / prompt / skill.

export type Category = "agent" | "tool" | "prompt" | "skill";

export interface InputField {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "textarea";
  defaultValue?: string;
}

export interface SeedItem {
  slug: string;
  name: string;
  tagline: string;
  category: Category;
  runtime: string | null; // "ai" | "det:<fn>" | null
  author: { name: string; role: string; hue: number };
  tags: string[];
  body: string;
  prompt?: string;
  inputSchema?: InputField[];
  previewOut?: string;
  version: string;
  updated: string;
  created: string;
  installs: number;
  views: number;
  runs: number;
  featured: number;
}

export interface SeedReview {
  slug: string;
  author: string;
  rating: number;
  text: string;
  created: string;
}

const A = {
  core: { name: "synth_core", role: "Founding curator", hue: 158 },
  audit: { name: "0xAudit", role: "Onchain analyst", hue: 42 },
  lumen: { name: "0xLumen", role: "Prompt engineer", hue: 268 },
  kaito: { name: "kaito_dev", role: "Staff engineer", hue: 205 },
  void: { name: "void_arch", role: "Protocol designer", hue: 290 },
  saturn: { name: "saturn_sol", role: "Solana native", hue: 330 },
  byte: { name: "byteBard", role: "Technical writer", hue: 20 },
  nova: { name: "n0va", role: "Product designer", hue: 190 },
  punk: { name: "lunarPunk", role: "Growth lead", hue: 115 },
  grid: { name: "gridlock", role: "Data engineer", hue: 224 },
};

export const SEED_ITEMS: SeedItem[] = [
  // ── AGENTS ────────────────────────────────────────────────────────────────
  {
    slug: "promptforge",
    name: "Prompt Forge",
    tagline: "Turns a one-line idea into a production-grade prompt — structured, testable, portable.",
    category: "agent",
    runtime: "det:promptforge",
    author: A.core,
    tags: ["prompting", "writing", "structure"],
    body: `Most prompts fail because they carry no role, no constraints and no definition of done. Prompt Forge rewrites a raw idea into a four-part brief: role, objective, constraints and output contract.\n\n- Works with any model — the output is plain text, not provider-specific syntax\n- Adds explicit self-check questions so you catch ambiguity before the model does\n- Deterministic and instant: no API key, no rate limit, no cost\n\nGreat first stop before you spend tokens on a draft. Pair it with **Ruthless Editor** to tighten the result.`,
    prompt: "You are Prompt Forge, a prompt architect. Rewrite raw ideas into role/objective/constraints/output-contract briefs.",
    inputSchema: [{ key: "raw", label: "Raw idea", placeholder: "e.g. an agent that reviews pull requests for security issues", type: "textarea", defaultValue: "an agent that reviews pull requests for security issues" }],
    version: "1.4.2",
    updated: "2026-10-24",
    created: "2026-08-02",
    installs: 4821,
    views: 38210,
    runs: 9210,
    featured: 1,
  },
  {
    slug: "degen-dd",
    name: "Degen Due Diligence",
    tagline: "A disciplined pre-trade checklist that keeps FOMO out of your research.",
    category: "agent",
    runtime: "det:duechecklist",
    author: A.audit,
    tags: ["research", "solana", "risk"],
    body: `Give it a token, a project or a mint you are curious about and it builds a due-diligence checklist covering contract hygiene, liquidity, holder concentration, social authenticity and tokenomics.\n\n- Sections adapt to what you know — gaps become explicit questions\n- Produces a verdict template instead of a hot take\n- Educational only. It does not fetch live prices and nothing here is financial advice\n\nUse it to slow down. The best trade you make is the one you researched properly.`,
    inputSchema: [
      { key: "subject", label: "Token / project", placeholder: "name, ticker or mint address", type: "text" },
      { key: "notes", label: "What you already know (optional)", placeholder: "team background, chart context, where you found it...", type: "textarea" },
    ],
    version: "2.0.0",
    updated: "2026-10-20",
    created: "2026-07-18",
    installs: 3610,
    views: 24100,
    runs: 6620,
    featured: 1,
  },
  {
    slug: "deep-research",
    name: "Deep Research Copilot",
    tagline: "Plans a multi-source investigation, then writes the brief with citations you can check.",
    category: "agent",
    runtime: "ai",
    author: A.lumen,
    tags: ["research", "analysis", "writing"],
    body: `A research agent that does not start writing until it has asked what decision the brief needs to support. It plans sub-questions, labels evidence quality and separates fact from inference.\n\n- Every claim carries a confidence tag: confirmed / likely / unverified\n- Includes a counter-arguments section so you do not fall in love with your thesis\n- Output is a short executive brief plus an appendix of open questions\n\nEach run is answered live by a model chosen for long-context research; the response names the model that answered.`,
    prompt: `You are Deep Research Copilot. Before answering, restate the decision the user needs to make in one sentence. Then produce: (1) a research plan of 5 sub-questions, (2) an executive brief of at most 250 words, (3) a claims table with confidence labels (confirmed / likely / unverified) and source placeholders, (4) two counter-arguments, (5) three open questions. Never invent URLs; mark anything you cannot verify as unverified.`,
    inputSchema: [{ key: "input", label: "What should it investigate?", placeholder: "Describe the decision and what you already know...", type: "textarea", defaultValue: "Should a 4-person startup build its own vector search or use a managed service? We ship weekly and handle moderate document volume." }],
    previewOut: `EXECUTIVE BRIEF (preview)\nDecision: build versus buy vector search for a small, fast-moving team.\n\nBottom line: start managed, keep the abstraction thin.\n\n- Confirmed: managed vector stores remove operational load and bill per usage, which suits weekly shipping.\n- Likely: at moderate volume, managed cost is competitive with one engineer-week of maintenance per month.\n- Unverified: your growth curve after month six.\n\nCounter-argument: if embeddings are your core differentiator, owning the index unlocks ranking control.\nOpen question: what query latency do you actually need?`,
    version: "1.2.0",
    updated: "2026-10-22",
    created: "2026-08-11",
    installs: 2944,
    views: 19870,
    runs: 4120,
    featured: 1,
  },
  {
    slug: "code-review-copilot",
    name: "Code Review Copilot",
    tagline: "A senior reviewer that separates blocking issues from taste, with patch-ready suggestions.",
    category: "agent",
    runtime: "ai",
    author: A.kaito,
    tags: ["engineering", "code-review", "quality"],
    body: `Paste a diff, a file or a design doc and get a review organized by severity: blockers, risks, nits. Each finding names the line, explains the failure mode and offers a concrete fix.\n\n- Explicitly declines to nitpick formatting when a formatter exists\n- Flags security and data-loss issues first, always\n- Ends with a one-paragraph summary you can paste into a PR\n\nTuned on thousands of real review comments. It is opinionated, but it shows its reasoning.`,
    prompt: `You are a staff-level code reviewer. Review only the provided code. Output: (1) Blocking issues, (2) Risks, (3) Nits. Each item must include the relevant code excerpt and a concrete patch suggestion. Prioritize security, data loss and concurrency. Do not comment on formatting when a formatter likely exists. End with a 2-sentence PR summary. If the code is fine, say so plainly and name the one thing you would test.`,
    inputSchema: [{ key: "input", label: "Diff or code", placeholder: "Paste the code to review...", type: "textarea", defaultValue: "export async function transfer(db, from, to, amount) {\n  const bal = await db.get(from);\n  if (bal < amount) throw new Error('insufficient');\n  await db.set(to, (await db.get(to)) + amount);\n  await db.set(from, bal - amount);\n}" }],
    previewOut: `BLOCKING\n1. Race condition: balance is read, then written without an atomic guard. Two concurrent transfers can overdraw.\n   Fix: use a single conditional UPDATE ... WHERE balance >= ? and check affected rows.\n\n2. Non-atomic transfer: the credit can land while the debit fails.\n   Fix: wrap both mutations in a transaction.\n\nRISKS\n- No validation that amount > 0 (negative amounts invert the flow).\n\nNITS\n- Prefer a domain error type over Error('insufficient').\n\nSummary (preview): The intent is clear but the balance update is not safe under concurrency. Make the debit conditional and atomic before shipping.`,
    version: "2.1.3",
    updated: "2026-10-18",
    created: "2026-06-30",
    installs: 4106,
    views: 31550,
    runs: 7380,
    featured: 1,
  },
  {
    slug: "spec-whisperer",
    name: "Product Spec Whisperer",
    tagline: "Turns a messy idea into a crisp one-pager with scope cuts and success metrics.",
    category: "agent",
    runtime: "ai",
    author: A.nova,
    tags: ["product", "writing", "planning"],
    body: `Describe the idea the way you would to a cofounder over coffee. The agent returns a one-page spec: problem, user, non-goals, the smallest shippable slice, metrics and risks.\n\n- Forces a non-goals section — the most underrated part of any spec\n- Proposes the smallest slice that produces real learning\n- Lists the three assumptions you would test first\n\nPairs well with **Prompt Forge** for turning the spec into an execution brief.`,
    prompt: `You are a pragmatic product lead. Convert the user's rough idea into a one-page spec with: Problem, Target user, Non-goals, Smallest shippable slice, Success metrics (max 3), Key risks, Top 3 assumptions to test. Be decisive; pick one direction and justify it in a sentence. Keep the whole document under 450 words.`,
    inputSchema: [{ key: "input", label: "The idea", placeholder: "Describe it like you're talking to a cofounder...", type: "textarea", defaultValue: "A browser extension that turns any article into a 5-card study deck, saved to my own notes." }],
    previewOut: `PROBLEM (preview)\nReaders save articles they never revisit because re-reading is expensive.\n\nSMALLEST SLICE\nHighlight-to-cards on one article page, export as plain markdown. No accounts, no syncing.\n\nNON-GOALS\n- No spaced-repetition scheduler in v1\n- No team sharing\n\nMETRICS\n- % of installs that create 3+ cards in week one\n- Median time from install to first export\n\nRISK\nSummarization quality on paywalled or image-heavy pages. Test that before anything else.`,
    version: "1.0.6",
    updated: "2026-10-15",
    created: "2026-09-02",
    installs: 1877,
    views: 12040,
    runs: 2210,
    featured: 0,
  },
  {
    slug: "support-triage",
    name: "Support Triage Unit",
    tagline: "Classifies, prioritizes and drafts replies for support tickets — with escalation rules.",
    category: "agent",
    runtime: "ai",
    author: A.punk,
    tags: ["support", "operations", "automation"],
    body: `Feed it a ticket and it returns a category, a priority, a sentiment read and a draft reply in your house voice. Anything billing-related or angry gets escalated instead of auto-answered.\n\n- Refuses to promise refunds, timelines or policy exceptions\n- Suggests the internal owner for each ticket type\n- Includes a short "what we still need to know" list\n\nDesigned as a first pass, not a replacement for a human inbox.`,
    prompt: `You are a support triage assistant. For the ticket provided, return: Category (billing / bug / how-to / feature-request / abuse / other), Priority (P0-P3 with one-line justification), Sentiment, Draft reply (friendly, specific, no promises about refunds, timelines or roadmap), Internal owner suggestion, and "Still need to know" (max 3 questions). Never invent account details. Escalate billing disputes and abuse to a human explicitly.`,
    inputSchema: [{ key: "input", label: "Support ticket", placeholder: "Paste the customer message...", type: "textarea", defaultValue: "Hi, I was charged twice this month and nobody replied to my last email. This is really frustrating. Order #8841." }],
    previewOut: `Category: Billing (duplicate charge)\nPriority: P1 — money-related, customer already followed up.\nSentiment: Frustrated, escalating.\n\nDraft reply (preview): Hi — sorry for the silence and for the duplicate charge. I've flagged order #8841 to a human on our billing team, who will review it today and follow up here. No action needed from you.\n\nInternal owner: Billing.\nEscalate: yes — billing dispute + prior unanswered contact.`,
    version: "1.3.1",
    updated: "2026-10-09",
    created: "2026-08-20",
    installs: 1542,
    views: 9860,
    runs: 3050,
    featured: 0,
  },
  {
    slug: "sql-sensei",
    name: "SQL Sensei",
    tagline: "Explains slow queries in plain language and hands back a faster rewrite.",
    category: "agent",
    runtime: "ai",
    author: A.grid,
    tags: ["data", "sql", "performance"],
    body: `Paste a query and its table shapes; SQL Sensei explains what the planner is likely doing, why it is slow, and how to rewrite it. It always shows the trade-off, never just "add an index".\n\n- Points out accidental N+1 patterns and missing join predicates\n- Suggests indexes with the exact columns and order\n- Warns when a rewrite changes semantics\n\nA second opinion for the queries that keep appearing in the slow log.`,
    prompt: `You are a database performance engineer. Given a SQL query (and optional schema/row counts), produce: (1) plain-language description of what the query does, (2) likely performance bottleneck with reasoning, (3) a rewritten query, (4) index recommendations with exact column order, (5) semantic risks of the rewrite. If schema is missing, state your assumptions explicitly. Do not fabricate planner output.`,
    inputSchema: [{ key: "input", label: "Query + schema", placeholder: "SELECT ... plus table shapes if you have them...", type: "textarea", defaultValue: "SELECT * FROM orders o\nWHERE o.status = 'paid'\n  AND o.created_at > now() - interval '30 days'\nORDER BY o.created_at DESC\nLIMIT 50;\n\n-- orders: 4M rows; index (status); index (created_at)" }],
    previewOut: `What it does (preview): latest 50 paid orders from the last 30 days.\n\nLikely bottleneck: the two single-column indexes cannot both be used efficiently — the planner picks one and filters the rest.\n\nRewrite: SELECT id, user_id, total, created_at FROM orders WHERE status = 'paid' AND created_at > $1 ORDER BY created_at DESC LIMIT 50;\n\nIndex: (status, created_at DESC) — equality column first, range/sort second.\nRisk: replacing SELECT * changes the payload shape; confirm no caller depends on every column.`,
    version: "1.1.0",
    updated: "2026-10-11",
    created: "2026-09-15",
    installs: 1320,
    views: 8450,
    runs: 1980,
    featured: 0,
  },
  {
    slug: "synth-muse",
    name: "Synth Muse",
    tagline: "A creative sparring partner for names, taglines and brand worlds — no purple sludge.",
    category: "agent",
    runtime: "ai",
    author: A.void,
    tags: ["creative", "naming", "branding"],
    body: `Give Synth Muse a brief and it returns territory-based ideas instead of ten random nouns. Each option comes with the insight behind it and a note on where it could fail.\n\n- Always returns three distinct territories, not three variations of one joke\n- Includes a "kill your darlings" note on the weakest option\n- Kills generic AI voice: no "unleash", no "seamless", no "elevate"\n\nBuilt for people who have stared at a blank name field for an hour.`,
    prompt: `You are a creative director for tech brands. Given a brief, produce three distinct naming/clarity territories (not variations). For each: 3 candidate names or lines, the insight behind the territory, and the failure mode. End with one sentence on the weakest option and why. Ban the words: unleash, seamless, elevate, revolutionize, game-changing, next-gen, empower.`,
    inputSchema: [{ key: "input", label: "Creative brief", placeholder: "What are we naming and for whom?", type: "textarea", defaultValue: "A marketplace where people share reusable AI agents, tools, prompts and skills. Tone: confident, a little cyber, not corporate." }],
    previewOut: `TERRITORY 1 — Workshop, not shop (preview)\nInsight: people come to see what others built, not to be sold to.\nNames: The Bench, Openbench, Buildtable.\nFailure mode: sounds like furniture.\n\nTERRITORY 2 — Signals in the noise\nInsight: discovery is the hard part; curation is the product.\nNames: Signalcraft, Sideband, Channel One.\nFailure mode: vague without the tagline.\n\nWeakest: Territory 2 — it needs too much explanation at first sight.`,
    version: "1.0.4",
    updated: "2026-10-06",
    created: "2026-09-21",
    installs: 990,
    views: 6120,
    runs: 1440,
    featured: 0,
  },

  // ── TOOLS ─────────────────────────────────────────────────────────────────
  {
    slug: "json2schema",
    name: "JSON → Schema",
    tagline: "Paste JSON, get a clean draft-07 schema with required fields and format hints.",
    category: "tool",
    runtime: "det:json2schema",
    author: A.grid,
    tags: ["json", "schema", "api"],
    body: `Stop hand-writing schemas from a sample payload. Paste JSON and get a draft-07 schema with inferred types, required arrays, nested objects and format detection for dates, emails and URIs.\n\n- Merges array item shapes instead of trusting the first element\n- Escapes property names correctly\n- Runs locally in the worker: instant, private, free\n\nIdeal for API contracts, config validation and LLM structured outputs.`,
    inputSchema: [{ key: "json", label: "JSON sample", placeholder: '{"id": 1, "email": "a@b.co", "tags": ["x"]}', type: "textarea", defaultValue: '{\n  "id": 42,\n  "email": "builder@synthsynd.world",\n  "active": true,\n  "tags": ["agents", "tools"],\n  "profile": { "name": "nova", "joined": "2026-01-15" }\n}' }],
    version: "1.2.0",
    updated: "2026-10-19",
    created: "2026-07-05",
    installs: 3280,
    views: 21030,
    runs: 5120,
    featured: 1,
  },
  {
    slug: "prompt-cost",
    name: "Prompt Cost Oracle",
    tagline: "Estimate tokens and monthly spend before you ship that prompt to production.",
    category: "tool",
    runtime: "det:costcalc",
    author: A.kaito,
    tags: ["cost", "tokens", "llm"],
    body: `A sober cost estimate for a prompt at scale. Paste the prompt, set the expected response length and monthly call volume, and compare model pricing side by side.\n\n- Token estimate based on characters and words, with a conservative margin\n- Covers input + output cost per model, not just input\n- Highlights the cheapest sensible option and the one you probably actually want\n\nPricing is a static snapshot you can edit — check provider pages before committing budget.`,
    inputSchema: [
      { key: "prompt", label: "Prompt template", placeholder: "Paste your prompt...", type: "textarea", defaultValue: "You are a support assistant. Summarize the following ticket in 3 bullet points and classify urgency. Ticket: {ticket}" },
      { key: "calls", label: "Calls per month", placeholder: "e.g. 50000", type: "text", defaultValue: "50000" },
    ],
    version: "1.0.2",
    updated: "2026-10-13",
    created: "2026-08-28",
    installs: 1655,
    views: 10440,
    runs: 2890,
    featured: 0,
  },
  {
    slug: "template-foundry",
    name: "Template Foundry",
    tagline: "Fill any {{template}} from a pile of key=value lines — and catch every missing slot.",
    category: "tool",
    runtime: "det:template",
    author: A.core,
    tags: ["templates", "automation", "text"],
    body: `Paste a template with {{slots}} and a list of key=value pairs. Template Foundry fills it, escapes nothing it shouldn't, and reports every slot that never got a value.\n\n- Supports {{slot}} and {slot} syntax\n- Warns on duplicate keys and unused variables\n- Output is exactly the shape of your template — no reformatting\n\nSmall tool, daily use. Great for cold email, report generation and config scaffolding.`,
    inputSchema: [
      { key: "template", label: "Template", placeholder: "Hi {{name}}, welcome to {{product}}!", type: "textarea", defaultValue: "Hi {{name}}, your {{plan}} trial ends in {{days}} days. Reply to keep your workspace at {{price}}/mo." },
      { key: "vars", label: "Variables (key=value)", placeholder: "name=Nova\nplan=Pro\ndays=3\nprice=$19", type: "textarea", defaultValue: "name=Nova\nplan=Pro\ndays=3\nprice=$19" },
    ],
    version: "1.1.1",
    updated: "2026-10-08",
    created: "2026-08-14",
    installs: 2105,
    views: 13110,
    runs: 4470,
    featured: 0,
  },
  {
    slug: "markdown-grid",
    name: "Markdown Grid",
    tagline: "CSV or TSV in, perfectly aligned Markdown table out — pipe-safe and padded.",
    category: "tool",
    runtime: "det:mdtable",
    author: A.byte,
    tags: ["markdown", "data", "formatting"],
    body: `Paste CSV or tab-separated rows and get a Markdown table that renders cleanly in GitHub, Notion and every static site generator. Pipes inside cells are escaped; columns are padded to width.\n\n- Auto-detects comma vs tab delimiters\n- Handles quoted commas and ragged rows\n- Shows row and column counts so you can sanity-check big pastes\n\nThe tool your README deserves.`,
    inputSchema: [{ key: "csv", label: "CSV / TSV", placeholder: "model,context,price", type: "textarea", defaultValue: 'agent,installs,rating\nPrompt Forge,4821,4.8\nJSON → Schema,3280,4.7\nMarkdown Grid,1900,4.9' }],
    version: "1.0.0",
    updated: "2026-10-02",
    created: "2026-09-09",
    installs: 1780,
    views: 11220,
    runs: 3560,
    featured: 0,
  },
  {
    slug: "regex-lab",
    name: "Regex Lab",
    tagline: "Test a pattern against real strings with matches highlighted and flags explained.",
    category: "tool",
    runtime: "det:regexlab",
    author: A.kaito,
    tags: ["regex", "debugging", "text"],
    body: `A focused regex scratchpad: one pattern, many test lines, highlighted matches and a plain-language explanation of what the pattern does. Invalid patterns produce a readable error instead of a stack trace.\n\n- Match highlighting per line with capture group values\n- Detects empty-match patterns and catastrophic backtracking hints\n- Runs in the worker — your test data never leaves the request\n\nFaster than opening a browser tab you will forget.`,
    inputSchema: [
      { key: "pattern", label: "Pattern", placeholder: "e.g. (?<handle>@\\\\w+)", type: "text", defaultValue: "@synth_core shipped Prompt Forge 1.4 today" },
      { key: "text", label: "Test lines", placeholder: "One string per line", type: "textarea", defaultValue: "shipped v1.4.2 to 4,821 builders\n@synth_core said hi\nno handle on this line" },
    ],
    version: "1.0.3",
    updated: "2026-10-05",
    created: "2026-08-31",
    installs: 1420,
    views: 9340,
    runs: 2680,
    featured: 0,
  },
  {
    slug: "text-xray",
    name: "Text X-Ray",
    tagline: "Readability, reading time and repetitive phrasing — before anyone else sees your copy.",
    category: "tool",
    runtime: "det:textstats",
    author: A.byte,
    tags: ["writing", "analysis", "copy"],
    body: `Paste any text and get an honest readout: words, sentences, reading time, average sentence length, a Flesch reading-ease estimate and your most repeated non-trivial words.\n\n- Flags sentences over 30 words individually\n- Excludes stopwords so the frequency list is actually useful\n- Suggests nothing it cannot measure\n\nRun it on landing copy, docs and release notes.`,
    inputSchema: [{ key: "text", label: "Text", placeholder: "Paste your copy...", type: "textarea", defaultValue: "Synthsynd World is a marketplace for the building blocks of AI work. Discover agents that do real jobs, tools that remove friction, prompts that have been tested, and skills your team can adopt today. Every listing shows who built it, what changed and how it is used." }],
    version: "1.0.1",
    updated: "2026-10-17",
    created: "2026-09-12",
    installs: 1210,
    views: 7880,
    runs: 2040,
    featured: 0,
  },

  // ── PROMPTS ───────────────────────────────────────────────────────────────
  {
    slug: "socratic-tutor",
    name: "Socratic Tutor",
    tagline: "A patient tutor that asks one good question at a time instead of lecturing.",
    category: "prompt",
    runtime: null,
    author: A.lumen,
    tags: ["education", "reasoning", "teaching"],
    body: `A system prompt that turns any capable model into a tutor who refuses to hand over the answer. It diagnoses your current understanding, then asks one question at a time until you arrive there yourself.\n\n- Calibrates difficulty using your own answers\n- Ends each session with a 3-line summary of what clicked and what to review\n- Explicitly asks before switching topics\n\nWorks for code, math, languages and systems design.`,
    prompt: `You are a Socratic tutor. Never give the final answer directly.

1. Ask what the learner already believes about the topic, in one sentence.
2. Diagnose the level from their answer.
3. Ask exactly one question at a time, each one a step closer to the answer.
4. When they are wrong, name the precise misconception without shaming it.
5. When they get it, ask them to restate the concept in their own words.
6. End the session with: three bullets — what clicked, what to review, one practice problem.

Keep every message under 120 words. No lectures.`,
    version: "1.2.0",
    updated: "2026-10-10",
    created: "2026-06-21",
    installs: 2980,
    views: 17440,
    runs: 0,
    featured: 1,
  },
  {
    slug: "ruthless-editor",
    name: "Ruthless Editor",
    tagline: "Cuts 30% of your words, then shows you exactly what it cut and why.",
    category: "prompt",
    runtime: null,
    author: A.byte,
    tags: ["writing", "editing", "copy"],
    body: `An edit pass with zero sentimentality. The prompt returns your piece at least 25% shorter, plus a table of the cuts and the reasoning behind each one.\n\n- Protects technical terms and product names\n- Flags weasel words: "very", "quite", "in order to", "it is important to note"\n- Offers one alternative structure, not five\n\nUse it on docs, launch posts and investor updates.`,
    prompt: `You are a ruthless but respectful editor. Edit the provided text so it is at least 25% shorter without losing meaning.

Rules:
- Never change facts, numbers, product names or definitions.
- Delete filler: very, quite, really, in order to, it is important to note, in today's fast-paced world.
- Prefer active voice and concrete nouns.
- Keep the author's voice; do not make it sound like a chatbot.
- Do not add new claims.

Return: (1) edited text, (2) a table of the five biggest cuts with one-line reasons, (3) one suggested structural improvement.`,
    version: "1.3.1",
    updated: "2026-10-16",
    created: "2026-07-09",
    installs: 2410,
    views: 15890,
    runs: 0,
    featured: 0,
  },
  {
    slug: "red-team",
    name: "Red Team Adversary",
    tagline: "Attacks your plan before reality does, with severity-ranked failure modes.",
    category: "prompt",
    runtime: null,
    author: A.void,
    tags: ["strategy", "risk", "review"],
    body: `Paste a plan, a launch checklist or an architecture and the model becomes an adversary paid to break it. Findings are ranked by likelihood × impact, with an early-warning signal for each.\n\n- Assumes the plan ships as written and looks for where it snaps\n- Separates technical, market and execution failure modes\n- Ends with the cheapest test that would retire the biggest risk\n\nRun it before every launch. Your future self will thank you.`,
    prompt: `You are a red-team adversary. Your job is to find where this plan fails, not to validate it.

Assume the plan ships exactly as written. Produce:
1. Five failure modes, ranked by likelihood x impact, each with a one-sentence mechanism.
2. For each: an early-warning signal observable within two weeks.
3. The three assumptions doing the most load-bearing work.
4. The cheapest experiment that would retire the biggest risk.
5. One failure mode the author clearly has not considered.

Be specific and concrete. No generic risk lists. No praise.`,
    version: "1.1.0",
    updated: "2026-09-29",
    created: "2026-08-04",
    installs: 1985,
    views: 12030,
    runs: 0,
    featured: 0,
  },
  {
    slug: "solana-explainer",
    name: "Solana, Explained",
    tagline: "Explains Solana concepts at the exact depth you ask for — with honest trade-offs.",
    category: "prompt",
    runtime: null,
    author: A.saturn,
    tags: ["solana", "education", "web3"],
    body: `A teaching prompt that explains Solana concepts at three depths: one paragraph for the curious, one page for developers, one diagram-friendly breakdown for a presentation. It includes the costs of each design choice, not just the benefits.\n\n- Covers accounts, PDAs, rent, priority fees, validator economics and MEV\n- States what is contested or changing instead of pretending certainty\n- Never gives price predictions or investment advice\n\nUseful for onboarding, docs and community replies.`,
    prompt: `You are a Solana educator writing for a smart generalist. When asked about a concept, answer at three depths:

1. IN ONE PARAGRAPH — the core idea, no jargon.
2. FOR A DEVELOPER — how it actually works, with account/model specifics.
3. THE TRADE-OFFS — what this design costs, what is contested, what is changing.

Rules: no price predictions, no investment advice, no hype. If something is genuinely uncertain, say so. Use concrete analogies only when they are accurate.`,
    version: "1.0.2",
    updated: "2026-10-01",
    created: "2026-07-25",
    installs: 1720,
    views: 10890,
    runs: 0,
    featured: 0,
  },
  {
    slug: "cold-outreach",
    name: "Cold Outreach Architect",
    tagline: "Short, specific, human outreach that gets replies — without fake familiarity.",
    category: "prompt",
    runtime: null,
    author: A.punk,
    tags: ["growth", "sales", "copy"],
    body: `Writes outreach that respects the reader: one specific observation, one relevant offer, one small ask. No "I hope this finds you well", no fake compliments, no 12-line paragraphs.\n\n- Forces a real observation about the recipient\n- Caps the message at 90 words\n- Includes a follow-up that adds information instead of nagging\n\nYou still have to do the research. That is the point.`,
    prompt: `You write cold outreach that earns replies by being useful.

For the provided target and offer, produce:
1. A subject line under 6 words.
2. A message under 90 words containing: one specific, verifiable observation about them; one sentence connecting it to a concrete outcome; one small ask (15 minutes, a one-line reply, a link click — pick one).
3. A follow-up that adds one new piece of information and no guilt.

Banned: hope this finds you well, I'll keep this brief, circling back, reaching out, quick chat, revolutionary. No fake compliments. If you lack a real observation, say what to research first.`,
    version: "1.0.1",
    updated: "2026-09-24",
    created: "2026-08-09",
    installs: 1490,
    views: 9210,
    runs: 0,
    featured: 0,
  },

  // ── SKILLS ────────────────────────────────────────────────────────────────
  {
    slug: "git-daily",
    name: "Git Daily Ritual",
    tagline: "The 6-command loop that keeps a shared repo clean without ceremony.",
    category: "skill",
    runtime: null,
    author: A.kaito,
    tags: ["git", "workflow", "engineering"],
    body: `A lightweight daily git routine for small teams: pull with rebase, branch small, commit with intent, push early, and never mix refactors with behavior changes.\n\n- Includes the exact commands and the failure recovery for each step\n- Defines a commit-message shape that survives changelog generation\n- Adds a weekly 10-minute hygiene pass\n\nNo GitFlow. No 40-minute rebase sagas. Just the loop that works.`,
    prompt: `# Git Daily Ritual

## Start of day
git switch main && git pull --rebase
git switch -c feat/<short-intent>

## While working
- Commit when the tests pass, not when the feature is done.
- One intent per commit. Refactors separate from behavior changes.
- Message shape: <verb> <what> — <why>  (e.g. "Add retry to webhook sender — prevents dropped events on 429")

## Before pushing
git fetch origin && git rebase origin/main
git log --oneline origin/main..HEAD   # read your own diff summary

## Weekly hygiene
git branch --merged main            # delete stale branches
git log --since="7 days" --oneline  # scan for accidental WIP commits

## Recovery
- Bad local rebase: git reflog -> git reset --hard <sha>
- Already pushed: revert, never force-push a shared branch.`,
    version: "1.1.0",
    updated: "2026-10-12",
    created: "2026-07-12",
    installs: 1890,
    views: 11330,
    runs: 0,
    featured: 0,
  },
  {
    slug: "api-debug",
    name: "API Debugging Playbook",
    tagline: "A 12-step checklist that finds the bug before you start rewriting the client.",
    category: "skill",
    runtime: null,
    author: A.kaito,
    tags: ["debugging", "api", "engineering"],
    body: `When an API call fails, most teams re-read their own code first. This playbook reverses the order: verify the request actually leaves the machine, capture the exact wire format, then narrow to client, transport or server.\n\n- Includes the five questions that identify the layer in under a minute\n- Covers auth, CORS, proxy, timeout and encoding failure signatures\n- Ends with a blameless writeup template\n\nKeep it pinned during integration week.`,
    prompt: `# API Debugging Playbook

## In one minute, answer:
1. Does the request leave the machine? (proxy / logger / tcpdump)
2. What exact status and body comes back — not what the client library says?
3. Does it fail with a raw curl, no SDK?
4. Does it fail for every request or only this payload?
5. What changed since it worked?

## Failure signatures
- 401/403 with correct token -> header dropped by proxy or wrong scheme
- Browser-only CORS error -> preflight missing allow-origin/allow-headers; server must also handle OPTIONS
- 502/504 only in prod -> timeout, keep-alive mismatch, or upstream body limit
- Works for small payloads only -> body size limit or chunked encoding
- Intermittent TLS error -> clock skew or connection pool reuse

## Writeup template
Symptom -> layer -> evidence -> fix -> regression test that would have caught it.`,
    version: "1.0.0",
    updated: "2026-09-27",
    created: "2026-08-16",
    installs: 1425,
    views: 8790,
    runs: 0,
    featured: 0,
  },
  {
    slug: "web-research-protocol",
    name: "Web Research Protocol",
    tagline: "How to turn an afternoon of tab-hoarding into a decision-ready brief.",
    category: "skill",
    runtime: null,
    author: A.lumen,
    tags: ["research", "writing", "process"],
    body: `A repeatable protocol for web research: define the decision, cap the sources, log evidence as you go, and write the brief before you feel ready.\n\n- Source hierarchy: primary documentation > expert analysis > aggregated summaries > social posts\n- Evidence log format that survives browser restarts\n- A 20-minute rule: if three sources repeat the same claim, stop collecting and start verifying\n\nUse it with **Deep Research Copilot** for the heavy lifting.`,
    prompt: `# Web Research Protocol

## 0. Frame (5 min)
Write the decision this research supports in one sentence. If you cannot, stop.

## 1. Source plan
Pick 5-8 sources maximum, ordered by quality:
primary docs/data > named expert analysis > reputable summaries > forums/social.

## 2. Evidence log
For every source: claim (one line) | confidence (confirmed/likely/unverified) | URL | date accessed.
Copy the quote, not just the link.

## 3. Verification
- The 20-minute rule: three repetitions of a claim is a signal to verify, not a fact.
- Find the primary source behind every summary.
- Actively look for one disconfirming source.

## 4. Brief
Decision -> bottom line -> 3-5 evidence-backed bullets -> counter-argument -> open questions.
Write it before you feel ready. Gaps become the open-questions section instead of blockers.`,
    version: "1.0.1",
    updated: "2026-10-03",
    created: "2026-08-22",
    installs: 1601,
    views: 9940,
    runs: 0,
    featured: 0,
  },
  {
    slug: "prompt-curriculum",
    name: "Prompt Engineering Curriculum",
    tagline: "Six weeks from prompt dabbler to someone whose prompts survive production.",
    category: "skill",
    runtime: null,
    author: A.core,
    tags: ["prompting", "education", "curriculum"],
    body: `A practical six-week curriculum built around exercises, not theory. Each week targets one skill: specification, constraints, evaluation, decomposition, tool use and production hardening.\n\n- Every week has one deliverable you can paste into your team wiki\n- Includes a prompt regression test template\n- No prompt "hacks" that break on the next model update\n\nWritten for people who already use chat models daily.`,
    prompt: `# Prompt Engineering Curriculum (6 weeks)

## Week 1 — Specification
Exercise: rewrite three of your prompts as role + objective + constraints + output contract. Deliverable: before/after page.

## Week 2 — Constraints
Exercise: add a refusal rule, an uncertainty rule and an output limit to one prompt. Test with 10 adversarial inputs.

## Week 3 — Evaluation
Exercise: build a 15-case regression set (inputs + expected properties). Run it whenever the prompt changes.

## Week 4 — Decomposition
Exercise: split one mega-prompt into a pipeline of three small prompts with typed handoffs.

## Week 5 — Tool use
Exercise: design a prompt that must call one tool and handle a tool error gracefully.

## Week 6 — Production hardening
Exercise: add token budgets, fallback behavior and logging to your best prompt. Ship it.

Deliverable each week: one wiki page with the prompt, the test cases and what failed.`,
    version: "1.0.0",
    updated: "2026-09-19",
    created: "2026-07-30",
    installs: 2210,
    views: 14020,
    runs: 0,
    featured: 1,
  },
  {
    slug: "chart-chooser",
    name: "Chart Chooser",
    tagline: "Pick the right chart in 60 seconds with a decision tree that respects your data.",
    category: "skill",
    runtime: null,
    author: A.grid,
    tags: ["data-viz", "design", "analysis"],
    body: `A decision tree for choosing charts based on the question, not the aesthetic: comparison, distribution, correlation, composition or change over time.\n\n- Rules out pie charts for more than four slices — with the reason\n- Specifies the axis baseline and when truncating is a lie\n- Adds accessibility notes: color contrast, patterns, alt text\n\nPrint it. Pin it next to the dashboard review checklist.`,
    prompt: `# Chart Chooser

## 1. What is the question?
- Compare values across categories -> horizontal bar (sorted)
- Change over time -> line; use bars only for few discrete periods
- Distribution -> histogram, box plot, or strip plot for small n
- Correlation -> scatter; add a trend line only if you can defend it
- Composition -> stacked bar; treemap for many parts; pie only for <= 4 parts of a whole

## 2. Baseline rules
- Bar charts must start at zero.
- Truncated axes need an explicit marker and a reason.
- More than 7 colors means you need a different encoding.

## 3. Accessibility
- Contrast >= 4.5:1 for text, 3:1 for large graphics.
- Never encode the only distinction in hue; add shape, pattern or labels.
- Every chart needs alt text stating the takeaway, not the chart type.

## 4. Final check
One chart, one message. If the title does not state the takeaway, rewrite the title.`,
    version: "1.0.2",
    updated: "2026-10-04",
    created: "2026-08-26",
    installs: 1330,
    views: 8110,
    runs: 0,
    featured: 0,
  },

  // ── CATALOG EXPANSION (v1.1) ──────────────────────────────────────────────
  {
    slug: "escalation-writer",
    name: "Escalation Writer",
    tagline: "Turns an angry thread into a reply that owns the problem and keeps the customer.",
    category: "prompt",
    runtime: null,
    author: A.nova,
    tags: ["support", "escalation", "communication"],
    body: `The reply you write in the first ten minutes of an escalation decides whether you keep the account. This prompt produces a message that acknowledges the specific impact, states what is known and unknown, gives a timestamp, and never promises what engineering has not committed to.\n\n- Separates apology for the impact from explanation of the cause\n- Requires one concrete remedy and one follow-up time\n- Bans the phrases that make customers angrier: "as per", "unfortunately", "our policy"\n\nUse it for outages, billing mistakes and repeated failures — not for routine tickets.`,
    prompt: `You write customer-facing escalation replies for a support lead.

Given the thread, the impact, the current status and the next checkpoint, produce a reply that:
1. States the specific impact in the customer's own terms (not a generic apology).
2. Separates what you know, what you do not know yet, and what you are doing now.
3. Gives one concrete remedy and one timestamp for the next update.
4. Names the person accountable, in first person if that is you.
5. Ends with a single next step for the customer — or explicitly says no action is needed.

Rules: no excuses, no blame shifting, no "unfortunately", no "as per our policy", no promises engineering has not committed to. Under 160 words. Plain language, no corporate register.`,
    version: "1.0.0",
    updated: "2026-10-20",
    created: "2026-10-20",
    installs: 980,
    views: 6120,
    runs: 0,
    featured: 0,
  },
  {
    slug: "hook-lab",
    name: "Hook Lab",
    tagline: "Twelve opening lines per topic, sorted by the pattern that makes them work.",
    category: "tool",
    runtime: "det:hooks",
    author: A.punk,
    tags: ["growth", "copy", "social"],
    body: `The first line decides whether anything else gets read. Hook Lab takes a topic, an audience and a tone, then writes twelve openings across twelve named patterns — contrarian, cost-of-inaction, specific number, confession, before/after and more.\n\n- Every hook is labelled with its pattern so you can learn the mechanics, not just copy lines\n- Scores each hook for specificity and curiosity, and flags the weak ones\n- Runs locally in the Worker: instant, free, no API key\n\nUse it for short-form video, newsletters, landing pages and cold email openers.`,
    inputSchema: [
      { key: "topic", label: "Topic", placeholder: "e.g. shipping AI agents that survive production", type: "text", defaultValue: "why most AI agent demos never reach production" },
      { key: "audience", label: "Audience", placeholder: "e.g. technical founders", type: "text", defaultValue: "technical founders shipping their first AI product" },
      { key: "tone", label: "Tone", placeholder: "direct, witty, contrarian…", type: "text", defaultValue: "direct" },
    ],
    version: "1.0.0",
    updated: "2026-10-21",
    created: "2026-10-21",
    installs: 1240,
    views: 7340,
    runs: 0,
    featured: 1,
  },
  {
    slug: "narrative-smith",
    name: "Narrative Smith",
    tagline: "A launch story with a spine: positioning, three pillars, proof and objections.",
    category: "prompt",
    runtime: null,
    author: A.nova,
    tags: ["growth", "positioning", "launch"],
    body: `Most launches fail at the story, not the product. Narrative Smith builds one that can survive a skeptical reader: a positioning sentence, three pillars with proof slots, the best objection answered before it is raised, and channel-specific cuts.\n\n- Forces a real alternative and a real difference, not adjectives\n- Marks every claim that still needs evidence as a slot, so nothing ships invented\n- Produces a one-liner, a 60-word blurb and a 200-word announcement from the same spine\n\nPair it with **Red Team Adversary** before you publish.`,
    prompt: `You are a launch narrative editor. Build a story that survives skepticism.

Inputs: product, audience, the alternative they use today, the change you make possible.

Produce:
1. POSITIONING — one sentence: for [audience] who [situation], [product] is the [category] that [difference], unlike [alternative].
2. THREE PILLARS — each with a claim, the mechanism behind it, and a clearly marked [EVIDENCE SLOT] where proof must go.
3. THE OBJECTION — the strongest objection, stated fairly, then answered in two sentences without dismissing it.
4. CUTS — a 12-word one-liner, a 60-word blurb and a 200-word announcement that all share the same spine.

Rules: no adjectives doing the work of evidence, no "revolutionary", no invented metrics. If a pillar has no mechanism, delete it and say why.`,
    version: "1.0.0",
    updated: "2026-10-22",
    created: "2026-10-22",
    installs: 1120,
    views: 6890,
    runs: 0,
    featured: 0,
  },
  {
    slug: "migration-planner",
    name: "Migration Planner",
    tagline: "Plan a schema or API migration as expand, migrate, contract — with a rollback.",
    category: "prompt",
    runtime: null,
    author: A.kaito,
    tags: ["engineering", "migration", "reliability"],
    body: `Big-bang migrations are how weekends die. This prompt turns a schema, API or platform move into an expand/contract plan: ship additive changes first, backfill and dual-write while both shapes are valid, verify with queries against production, then remove the old shape in a separate deploy.\n\n- Requires a rollback for every stage, not just the final one\n- Names the exact verification query or metric that proves each stage is safe\n- Flags irreversible steps and asks for a data snapshot before them\n\nWorks for Postgres, D1, DynamoDB and public API versions.`,
    prompt: `You are a staff engineer planning a production migration. Never propose a big-bang cutover.

Produce:
1. INVENTORY — what reads and writes the old shape today, including jobs, dashboards and external consumers.
2. EXPAND — additive-only changes that keep old and new valid at the same time.
3. MIGRATE — backfill order, dual-write rules, idempotency, and how to resume after a partial failure.
4. VERIFY — the exact query or metric proving parity, plus the acceptable error threshold and how long to watch it.
5. CONTRACT — the separate deploy that removes the old shape, gated on what.
6. ROLLBACK — per stage, including the irreversible steps that need a snapshot first.

Output a numbered runbook with owners and blast radius per step. Flag anything that cannot be reversed.`,
    version: "1.0.0",
    updated: "2026-10-23",
    created: "2026-10-23",
    installs: 860,
    views: 5210,
    runs: 0,
    featured: 0,
  },
];

const REVIEW_AUTHORS = ["mintmaxi", "0xLumen", "kaito_dev", "void_arch", "saturn_sol", "byteBard", "n0va", "lunarPunk", "gridlock", "ami.exe", "pixelprophet", "rustic", "0xAudit", "synth_core"];

const REVIEW_POOL: Array<{ rating: number; text: string }> = [
  { rating: 5, text: "Dropped this into my workflow and it stuck. The output format is exactly what I needed." },
  { rating: 4, text: "Solid fundamentals. Would love an option to save presets." },
  { rating: 5, text: "Tested on three real projects before leaving this — it holds up." },
  { rating: 5, text: "Does one thing well. That's rare here." },
  { rating: 3, text: "Good starting point, but the examples could go deeper." },
  { rating: 5, text: "This is the cleanest implementation of this idea I've tried." },
  { rating: 4, text: "Runs fast and the docs are honest about limitations. Respect." },
  { rating: 5, text: "Replaced a whole folder of half-baked prompts I was hoarding." },
  { rating: 4, text: "Works as described. No magic, just good structure." },
  { rating: 5, text: "Started using it to onboard new teammates — huge time saver." },
  { rating: 3, text: "Decent, but watch the edge cases in the examples." },
  { rating: 4, text: "The output is 90% there; the last 10% still needs a human, which is fine." },
  { rating: 5, text: "Finally something in this category that isn't just a wrapper around hype." },
  { rating: 5, text: "Simple, composable, and easy to fork. Exactly what I wanted." },
  { rating: 4, text: "Took me ten minutes to wire up. Would recommend to juniors too." },
  { rating: 5, text: "The prompt itself is worth reading even if you never run it." },
  { rating: 4, text: "A bit opinionated in the best way — it has a point of view." },
  { rating: 4, text: "Great skeleton. I extended it with our own house style." },
  { rating: 5, text: "Bookmarking this. It's going in the team playbook." },
  { rating: 4, text: "Not flashy, just useful. The install counter doesn't lie." },
  { rating: 5, text: "I've seen paid tools do less than this free one." },
  { rating: 5, text: "The structure fixed a problem I didn't know I had." },
  { rating: 5, text: "Usable immediately. No 30-minute setup video required." },
  { rating: 4, text: "My only complaint: I want more entries from this author." },
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function seedReviews(): SeedReview[] {
  const out: SeedReview[] = [];
  const dates = ["2026-10-22", "2026-10-16", "2026-10-09", "2026-10-01", "2026-09-24", "2026-09-15"];
  SEED_ITEMS.forEach((item) => {
    const base = hash(item.slug);
    const count = 3 + (base % 2); // 3 or 4 reviews each
    for (let i = 0; i < count; i++) {
      const pick = REVIEW_POOL[(base + i * 7) % REVIEW_POOL.length];
      out.push({
        slug: item.slug,
        author: REVIEW_AUTHORS[(base + i * 3) % REVIEW_AUTHORS.length],
        rating: pick.rating,
        text: pick.text,
        created: dates[(base + i) % dates.length],
      });
    }
  });
  return out;
}
