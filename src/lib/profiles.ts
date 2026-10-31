// Capability profiles for the match engine.
//
// Every listing is described on the same axes so the ranking maths is
// comparable across categories. `price` is a modelled monthly run cost for a
// small team (local tools are genuinely free — they execute in the Worker).
// `roles` is 0–100 capability fit for a job, not a quality score.

export type RoleKey =
  | "research"
  | "writing"
  | "code"
  | "data"
  | "support"
  | "product"
  | "creative"
  | "growth"
  | "ops"
  | "education"
  | "risk"
  | "trading";

export interface RoleMeta {
  label: string;
  /** What a winning listing must actually do in this role. */
  job: string;
  keywords: string[];
}

export const ROLES: Record<RoleKey, RoleMeta> = {
  research: {
    label: "Research",
    job: "Find, verify and cite what is already known",
    keywords: ["research", "investigate", "investigation", "sources", "citation", "citations", "competitive", "market", "brief", "landscape", "analysis", "analyst", "intel", "benchmark", "competitor", "competitors"],
  },
  product: {
    label: "Product",
    job: "Turn a vague idea into scope, metrics and a decision",
    keywords: ["spec", "product", "roadmap", "requirements", "prd", "scope", "planning", "mvp", "feature", "features", "prioritise", "prioritize", "metrics"],
  },
  writing: {
    label: "Writing",
    job: "Produce the words that ship — copy, docs, scripts",
    keywords: ["write", "writing", "copy", "content", "blog", "article", "newsletter", "script", "scripts", "caption", "captions", "edit", "editing", "editor", "docs", "documentation", "post", "posts", "email", "emails", "story"],
  },
  creative: {
    label: "Creative",
    job: "Generate distinct directions, not variations on a template",
    keywords: ["creative", "name", "naming", "brand", "branding", "tagline", "campaign", "hook", "hooks", "concept", "ideas", "brainstorm", "viral", "storyboard", "thumbnail"],
  },
  growth: {
    label: "Growth",
    job: "Get attention and turn it into a conversation",
    keywords: ["growth", "launch", "marketing", "seo", "outreach", "leads", "sales", "funnel", "acquisition", "audience", "followers", "tiktok", "twitter", "linkedin", "instagram", "youtube", "newsletter", "promote", "promotion"],
  },
  code: {
    label: "Engineering",
    job: "Change the code without breaking production",
    keywords: ["code", "coding", "engineering", "engineer", "review", "pull request", "pr", "prs", "bug", "bugs", "refactor", "api", "migration", "deploy", "typescript", "python", "react", "frontend", "backend", "tests", "testing"],
  },
  data: {
    label: "Data",
    job: "Turn raw records into an answer someone can act on",
    keywords: ["data", "sql", "query", "queries", "analytics", "dashboard", "metrics", "json", "schema", "csv", "spreadsheet", "table", "report", "reporting", "chart", "charts", "database"],
  },
  support: {
    label: "Support",
    job: "Resolve the customer without losing them",
    keywords: ["support", "ticket", "tickets", "customer", "customers", "helpdesk", "churn", "refund", "complaint", "escalation", "escalate", "inbox", "response", "replies"],
  },
  ops: {
    label: "Operations",
    job: "Make the repeatable part repeatable",
    keywords: ["workflow", "automation", "automate", "process", "operations", "ops", "git", "repo", "template", "templates", "pipeline", "routine", "checklist", "meeting", "meetings", "notes", "handoff", "onboarding"],
  },
  education: {
    label: "Enablement",
    job: "Make someone capable of doing it themselves",
    keywords: ["teach", "learn", "learning", "tutor", "explain", "explainer", "curriculum", "course", "training", "onboard", "education", "students", "study"],
  },
  trading: {
    label: "Markets",
    job: "Check the trade before the money moves",
    keywords: ["trade", "trading", "token", "tokens", "crypto", "solana", "defi", "nft", "wallet", "onchain", "on-chain", "degen", "portfolio", "invest", "investment", "rug", "scam", "coin", "mint"],
  },
  risk: {
    label: "Risk",
    job: "Break the plan before reality does",
    keywords: ["risk", "risks", "security", "audit", "adversarial", "red team", "red-team", "due diligence", "diligence", "compliance", "scam", "rug", "fraud", "trading", "invest", "investment", "token", "solana", "crypto"],
  },
};

export interface ListingProfile {
  /** 0–100 fit per role. Absent means the listing cannot play that role. */
  roles: Partial<Record<RoleKey, number>>;
  /** Modelled monthly run cost in USD for a small team. */
  price: number;
  /** 0–100 — how quickly it produces a usable result. */
  speed: number;
  /** 0–100 — how little setup it needs. */
  ease: number;
  /** 0–100 — independence from a single vendor / data leaving your control. */
  independence: number;
  /** One line the engine can use when explaining a win. */
  edge: string;
  /** The honest caveat shown next to the win. */
  watchOut: string;
}

export const PROFILES: Record<string, ListingProfile> = {
  promptforge: {
    roles: { writing: 62, product: 54, ops: 44 },
    price: 0, speed: 97, ease: 96, independence: 100,
    edge: "Restructures a raw idea into role, objective, constraints and output contract in milliseconds — locally, with no key.",
    watchOut: "It cannot judge whether the idea is worth building; it only sharpens the instruction.",
  },
  "degen-dd": {
    roles: { trading: 96, risk: 88, research: 56, education: 40 },
    price: 0, speed: 94, ease: 92, independence: 100,
    edge: "Forces a documented checklist before a trade, which is exactly when judgement is worst.",
    watchOut: "It is a research scaffold, not advice, and it cannot verify claims by itself.",
  },
  "deep-research": {
    roles: { research: 96, writing: 62, risk: 40, product: 38 },
    price: 18, speed: 64, ease: 74, independence: 55,
    edge: "Plans a multi-source investigation and returns a cited brief rather than a pile of links.",
    watchOut: "Needs a configured model endpoint and its citations must still be spot-checked.",
  },
  "code-review-copilot": {
    roles: { code: 97, risk: 56, product: 34 },
    price: 22, speed: 66, ease: 72, independence: 55,
    edge: "Separates blocking defects from taste, so reviews stop arguing about formatting.",
    watchOut: "It reviews the diff it is given — it cannot see your runtime behaviour.",
  },
  "spec-whisperer": {
    roles: { product: 95, writing: 72, ops: 34 },
    price: 14, speed: 68, ease: 80, independence: 60,
    edge: "Converts a messy idea into a one-pager with explicit scope cuts and success metrics.",
    watchOut: "Scope calls still belong to a human who owns the roadmap.",
  },
  "support-triage": {
    roles: { support: 96, ops: 52, writing: 48 },
    price: 16, speed: 72, ease: 70, independence: 55,
    edge: "Classifies, prioritises and drafts a reply in one pass, with escalation rules attached.",
    watchOut: "Tone is easy to automate; the accountability for a bad reply is not.",
  },
  "sql-sensei": {
    roles: { data: 96, code: 44, product: 30 },
    price: 12, speed: 70, ease: 76, independence: 60,
    edge: "Explains the slow query in plain language and hands back a faster rewrite.",
    watchOut: "Validate the rewrite against real data volume before it reaches production.",
  },
  "synth-muse": {
    roles: { creative: 95, writing: 62, growth: 45 },
    price: 10, speed: 74, ease: 82, independence: 60,
    edge: "Produces distinct creative directions instead of twelve variations of the same safe idea.",
    watchOut: "Names still need trademark and domain checks before you get attached.",
  },
  json2schema: {
    roles: { data: 82, code: 45, ops: 30 },
    price: 0, speed: 98, ease: 96, independence: 100,
    edge: "Infers a draft-07 schema from a real payload, including nested objects and format hints.",
    watchOut: "It infers from your sample; optional fields you never sent will not appear.",
  },
  "prompt-cost": {
    roles: { ops: 64, data: 46, product: 30 },
    price: 0, speed: 96, ease: 92, independence: 100,
    edge: "Puts a monthly price on a prompt before anyone commits budget to it.",
    watchOut: "Static price snapshot — confirm against provider pages before you commit.",
  },
  "template-foundry": {
    roles: { ops: 82, writing: 38, data: 34 },
    price: 0, speed: 98, ease: 96, independence: 100,
    edge: "Fills every slot and reports the ones that never got a value, which is where templates usually break.",
    watchOut: "It does not validate that the filled values are true.",
  },
  "markdown-grid": {
    roles: { data: 72, ops: 48, writing: 30 },
    price: 0, speed: 99, ease: 98, independence: 100,
    edge: "Pipe-safe, padded Markdown tables from pasted CSV in one step.",
    watchOut: "Formatting only — it will not clean dirty data.",
  },
  "regex-lab": {
    roles: { code: 58, data: 44, ops: 30 },
    price: 0, speed: 95, ease: 90, independence: 100,
    edge: "Shows matches, groups and the traps in a pattern against real strings.",
    watchOut: "Catastrophic backtracking on huge inputs is still your problem.",
  },
  "text-xray": {
    roles: { writing: 82, ops: 32, data: 30 },
    price: 0, speed: 97, ease: 96, independence: 100,
    edge: "Readability, reading time and repetition before anyone else sees the copy.",
    watchOut: "Metrics are a prompt, not a verdict — the edit still needs taste.",
  },
  "socratic-tutor": {
    roles: { education: 95, writing: 48, research: 32 },
    price: 0, speed: 88, ease: 92, independence: 95,
    edge: "Refuses to hand over the answer and asks one calibrated question at a time.",
    watchOut: "Slow by design — it is a teaching loop, not a lookup.",
  },
  "ruthless-editor": {
    roles: { writing: 96, creative: 42, growth: 36 },
    price: 0, speed: 92, ease: 94, independence: 95,
    edge: "Cuts at least 25% of the words and shows every cut with a reason.",
    watchOut: "It will happily cut something you needed; review the cut list, not just the output.",
  },
  "red-team": {
    roles: { risk: 96, product: 68, code: 40 },
    price: 0, speed: 86, ease: 90, independence: 95,
    edge: "Attacks the plan as written and ranks failure modes by likelihood × impact.",
    watchOut: "Adversarial by design — it will over-index on catastrophic scenarios.",
  },
  "solana-explainer": {
    roles: { education: 74, trading: 66, risk: 48, research: 42 },
    price: 0, speed: 88, ease: 92, independence: 95,
    edge: "Explains the mechanism at three depths and names the trade-offs, not just the upside.",
    watchOut: "It explains; it does not audit a contract or predict a price.",
  },
  "cold-outreach": {
    roles: { growth: 96, writing: 66, creative: 40 },
    price: 0, speed: 90, ease: 92, independence: 95,
    edge: "Forces one real observation and one small ask, capped at 90 words.",
    watchOut: "The research is still yours; without a real observation the hook is theatre.",
  },
  "git-daily": {
    roles: { ops: 86, code: 52, education: 30 },
    price: 0, speed: 88, ease: 90, independence: 100,
    edge: "The exact six-command loop plus recovery for each step, without GitFlow ceremony.",
    watchOut: "It assumes a small team with a shared main branch.",
  },
  "api-debug": {
    roles: { code: 62, ops: 52, risk: 30 },
    price: 0, speed: 86, ease: 88, independence: 100,
    edge: "Moves the investigation to the wire format first, which is where the answer usually is.",
    watchOut: "Needs network access to actually capture traffic.",
  },
  "web-research-protocol": {
    roles: { research: 92, writing: 54, ops: 40 },
    price: 0, speed: 82, ease: 86, independence: 100,
    edge: "Caps sources, logs evidence and forces the brief before you feel ready.",
    watchOut: "A protocol, not an agent — it will not fetch pages for you.",
  },
  "prompt-curriculum": {
    roles: { education: 86, writing: 52, ops: 34 },
    price: 0, speed: 74, ease: 82, independence: 100,
    edge: "A six-week progression with exercises that survive production, not prompt trivia.",
    watchOut: "Six weeks is the product; skimming it defeats the point.",
  },
  "chart-chooser": {
    roles: { data: 76, creative: 46, writing: 30 },
    price: 0, speed: 94, ease: 94, independence: 100,
    edge: "Chooses the chart from the question and rules out the misleading defaults.",
    watchOut: "It picks the form; your data still has to be honest.",
  },
  "escalation-writer": {
    roles: { support: 94, writing: 72, ops: 40 },
    price: 0, speed: 91, ease: 94, independence: 95,
    edge: "Owns the impact, states what is unknown, and gives a checkpoint instead of a platitude.",
    watchOut: "Never let it promise a fix date engineering has not committed to.",
  },
  "hook-lab": {
    roles: { growth: 90, creative: 82, writing: 68 },
    price: 0, speed: 98, ease: 95, independence: 100,
    edge: "Twelve labelled hook patterns per topic, scored for specificity and curiosity.",
    watchOut: "Hooks are the door, not the room — the substance still has to exist.",
  },
  "narrative-smith": {
    roles: { growth: 88, creative: 84, writing: 78, product: 42 },
    price: 0, speed: 86, ease: 92, independence: 95,
    edge: "Builds one narrative spine with evidence slots, then cuts it for every channel.",
    watchOut: "Every evidence slot must be filled by you before it ships.",
  },
  "migration-planner": {
    roles: { code: 66, risk: 58, product: 42, ops: 36 },
    price: 0, speed: 80, ease: 86, independence: 95,
    edge: "Forces expand → migrate → verify → contract with a rollback per stage.",
    watchOut: "It plans the change; it cannot see the consumers you forgot to list.",
  },
};

/** Fallback profile for listings published by the community. */
export function fallbackProfile(item: {
  slug: string;
  category: string;
  tags: string[];
  runtime: string | null;
  prompt: string;
  body: string;
}): ListingProfile {
  const hay = (item.slug + " " + item.tags.join(" ") + " " + item.body).toLowerCase();
  const roles: Partial<Record<RoleKey, number>> = {};
  for (const key of Object.keys(ROLES) as RoleKey[]) {
    let hits = 0;
    for (const kw of ROLES[key].keywords) if (hay.includes(kw)) hits++;
    if (hits) roles[key] = Math.min(88, 48 + hits * 9);
  }
  if (!Object.keys(roles).length) roles.ops = 55;
  const local = item.runtime?.startsWith("det:") ? 100 : item.runtime === "ai" ? 55 : 90;
  return {
    roles,
    price: item.runtime === "ai" ? 18 : 0,
    speed: item.runtime === "ai" ? 68 : 90,
    ease: item.prompt ? 88 : 78,
    independence: local,
    edge: "Community listing — scored from its documented tags, runtime and usage.",
    watchOut: "Community work has less usage history, so the confidence is lower.",
  };
}
