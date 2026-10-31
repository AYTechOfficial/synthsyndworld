// The match engine.
//
// Deterministic, explainable and dependency-free: given a brief, a monthly
// budget and a priority, it ranks catalog listings per job, picks one winner
// per role, shows the runner-up margin and the exact weighting used.
// The same inputs always produce the same verdict, so shared links replay.

import { PROFILES, ROLES, fallbackProfile, type ListingProfile, type RoleKey } from "./profiles";

export interface MatchItem {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  runtime: string | null;
  tags: string[];
  body: string;
  prompt: string;
  inputSchema: unknown[];
  previewOut: string;
  version: string;
  installs: number;
  runs: number;
  views: number;
  rating: { avg: number; count: number };
}

export type PriorityKey = "balanced" | "quality" | "budget" | "speed" | "control";
export type FactorKey = "fit" | "quality" | "value" | "speed" | "ease" | "independence";

export const FACTOR_LABELS: Record<FactorKey, string> = {
  fit: "Capability fit",
  quality: "Track record",
  value: "Cost",
  speed: "Time to result",
  ease: "Setup effort",
  independence: "Independence",
};

export const PRIORITIES: Record<PriorityKey, { label: string; note: string; weights: Record<FactorKey, number> }> = {
  balanced: {
    label: "Balanced",
    note: "Nothing dominates — fit and track record lead.",
    weights: { fit: 0.42, quality: 0.2, value: 0.08, speed: 0.1, ease: 0.08, independence: 0.12 },
  },
  quality: {
    label: "Best result",
    note: "Score quality first, then pay for it deliberately.",
    weights: { fit: 0.4, quality: 0.32, value: 0.04, speed: 0.06, ease: 0.06, independence: 0.12 },
  },
  budget: {
    label: "Lean budget",
    note: "Cost and fit carry the decision.",
    weights: { fit: 0.38, quality: 0.14, value: 0.28, speed: 0.08, ease: 0.08, independence: 0.04 },
  },
  speed: {
    label: "Fastest path",
    note: "Time to a usable result beats polish.",
    weights: { fit: 0.4, quality: 0.14, value: 0.06, speed: 0.26, ease: 0.08, independence: 0.06 },
  },
  control: {
    label: "Data control",
    note: "Prefer local, vendor-independent work.",
    weights: { fit: 0.4, quality: 0.16, value: 0.06, speed: 0.06, ease: 0.08, independence: 0.24 },
  },
};

const PRIORITY_KEYS: PriorityKey[] = ["balanced", "quality", "budget", "speed", "control"];

export function normalizePriority(raw: unknown): PriorityKey {
  const key = String(raw || "balanced") as PriorityKey;
  return PRIORITY_KEYS.includes(key) ? key : "balanced";
}

// Production nouns the catalog cannot serve as of this seed. If a brief names
// one, the engine says so instead of quietly substituting a generalist.
const ARTIFACT_WORDS = ["video", "videos", "voice", "voiceover", "audio", "music", "image", "images", "thumbnail", "captions", "subtitles", "animation", "podcast", "illustration", "photo", "3d", "translation", "translate"];

const PIPELINE_ORDER: RoleKey[] = ["research", "product", "writing", "creative", "growth", "code", "data", "support", "ops", "risk", "trading", "education"];

const COMPLEMENT: Record<RoleKey, RoleKey> = {
  research: "writing",
  product: "risk",
  writing: "ops",
  creative: "growth",
  growth: "creative",
  code: "risk",
  data: "product",
  support: "writing",
  ops: "code",
  risk: "research",
  education: "writing",
  trading: "risk",
};

export interface Ranking {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  runtime: string | null;
  price: number;
  score: number;
  confidence: number;
  factors: Record<FactorKey, number>;
  contributions: Record<FactorKey, number>;
  edge: string;
  watchOut: string;
  rating: { avg: number; count: number };
  installs: number;
  pinned?: boolean;
}

export interface MatchStep {
  role: RoleKey;
  label: string;
  job: string;
  need: number;
  winner: Ranking;
  runnerUp: Ranking | null;
  delta: number;
  alternatives: Ranking[];
  reason: string;
}

export interface MatchResult {
  mission: {
    query: string;
    budget: number;
    priority: PriorityKey;
    priorityLabel: string;
    note: string;
    weights: Record<FactorKey, number>;
    roles: Array<{ key: RoleKey; label: string; need: number; job: string }>;
    coverageNote: string;
  };
  steps: MatchStep[];
  totals: {
    cost: number;
    budget: number;
    withinBudget: boolean;
    overBy: number;
    avgScore: number;
    coverage: number;
    confidence: number;
  };
  swaps: Array<{ role: RoleKey; roleLabel: string; fromSlug: string; fromName: string; toSlug: string; toName: string; saves: number; scoreCost: number; applied: boolean }>;
  risks: Array<{ severity: "high" | "medium" | "low"; text: string }>;
  /** Needs the brief named that no listing can serve. Shown, never hidden. */
  gaps: string[];
  firstMove: string;
  evaluated: number;
  engine: { version: string; formula: string; ms: number };
}

// ── scoring primitives ──────────────────────────────────────────────────────

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

function profileFor(item: MatchItem): ListingProfile {
  return PROFILES[item.slug] || fallbackProfile(item);
}

function qualityScore(item: MatchItem): number {
  const n = Number(item.rating?.count || 0);
  const avg = Number(item.rating?.avg || 0);
  const bayes = (avg * n + 4.3 * 6) / (n + 6);
  const usage = Math.min(1, Math.log10(1 + Number(item.installs || 0) + Number(item.runs || 0)) / 5);
  return clamp(((bayes - 3.2) / 1.6) * 82 + usage * 18);
}

function valueScore(price: number): number {
  if (price <= 0) return 100;
  return clamp(100 - Math.min(88, price * 2.1));
}

/** Documentation depth: is the work actually inspectable? */
export function depthScore(item: MatchItem): number {
  let n = 0;
  if (item.prompt && item.prompt.length > 120) n += 30;
  if (Array.isArray(item.inputSchema) && item.inputSchema.length) n += 20;
  if (item.previewOut) n += 8;
  if (item.body && item.body.length > 400) n += 14;
  if (item.runtime) n += 8;
  n += Math.min(12, (item.rating?.count || 0) * 1.5);
  if (/^1\.[1-9]/.test(item.version || "")) n += 8;
  return clamp(n);
}

function factorsFor(item: MatchItem, role: RoleKey | null): Record<FactorKey, number> {
  const p = profileFor(item);
  const r = (n: number) => Math.round(n * 10) / 10;
  return {
    fit: role ? r(clamp(p.roles[role] || 0)) : 70,
    quality: r(qualityScore(item)),
    value: r(valueScore(p.price)),
    speed: r(clamp(p.speed)),
    ease: r(clamp(p.ease)),
    independence: r(clamp(p.independence)),
  };
}

function weightedScore(factors: Record<FactorKey, number>, weights: Record<FactorKey, number>): number {
  let total = 0;
  for (const key of Object.keys(weights) as FactorKey[]) total += factors[key] * weights[key];
  return Math.round(total * 10) / 10;
}

function contributions(factors: Record<FactorKey, number>, weights: Record<FactorKey, number>): Record<FactorKey, number> {
  const out = {} as Record<FactorKey, number>;
  for (const key of Object.keys(weights) as FactorKey[]) out[key] = Math.round(factors[key] * weights[key] * 10) / 10;
  return out;
}

function rankItem(item: MatchItem, role: RoleKey | null, weights: Record<FactorKey, number>, pinned = false): Ranking {
  const p = profileFor(item);
  const factors = factorsFor(item, role);
  const score = weightedScore(factors, weights);
  return {
    slug: item.slug,
    name: item.name,
    tagline: item.tagline,
    category: item.category,
    runtime: item.runtime,
    price: p.price,
    score,
    confidence: 60,
    factors,
    contributions: contributions(factors, weights),
    edge: p.edge,
    watchOut: p.watchOut,
    rating: { avg: Number(item.rating?.avg || 0), count: Number(item.rating?.count || 0) },
    installs: Number(item.installs || 0),
    ...(pinned ? { pinned: true } : {}),
  };
}

function confidenceFor(winner: Ranking, runnerUp: Ranking | null): number {
  const margin = runnerUp ? winner.score - runnerUp.score : 8;
  const history = Math.min(14, winner.rating.count * 1.5);
  const local = winner.runtime && winner.runtime !== "ai" ? 4 : 0;
  return Math.round(clamp(58 + margin * 4 + history + local, 52, 97));
}

function topFactors(ranking: Ranking): FactorKey[] {
  return (Object.keys(ranking.contributions) as FactorKey[])
    .sort((a, b) => ranking.contributions[b] - ranking.contributions[a]);
}

function reasonFor(winner: Ranking, runnerUp: Ranking | null): string {
  const [first, second] = topFactors(winner);
  const lead = `${FACTOR_LABELS[first].toLowerCase()} ${winner.factors[first]}/100 and ${FACTOR_LABELS[second].toLowerCase()} ${winner.factors[second]}/100 carry it`;
  if (!runnerUp) {
    return `${winner.edge} It is the only listing in the catalog that plays this role, so the pick is a default rather than a contest.`;
  }
  const gap = Math.round((winner.score - runnerUp.score) * 10) / 10;
  const strengths = (Object.keys(winner.factors) as FactorKey[])
    .filter((k) => runnerUp.factors[k] - winner.factors[k] > 4)
    .sort((a, b) => runnerUp.factors[b] - winner.factors[b] - (runnerUp.factors[a] - winner.factors[a]))
    .map((k) => FACTOR_LABELS[k].toLowerCase());
  const counter = strengths.length
    ? ` It does edge ahead on ${strengths.slice(0, 2).join(" and ")}, which this mission does not weight heavily.`
    : " It trails on every weighted factor.";
  return `${winner.edge} ${lead[0].toUpperCase() + lead.slice(1)}. ${runnerUp.name} is ${gap} points behind.${counter}`;
}

// ── mission parsing ─────────────────────────────────────────────────────────

function detectRoles(query: string): Array<{ key: RoleKey; need: number }> {
  const q = " " + query.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ") + " ";
  const found: Array<{ key: RoleKey; need: number }> = [];
  for (const key of Object.keys(ROLES) as RoleKey[]) {
    let hits = 0;
    for (const kw of ROLES[key].keywords) {
      if (kw.includes(" ") ? q.includes(" " + kw) : q.includes(" " + kw + " ")) hits += kw.includes(" ") ? 2 : 1;
    }
    if (hits > 0) found.push({ key, need: clamp(38 + hits * 15, 0, 100) });
  }
  return found.sort((a, b) => b.need - a.need);
}

function roleOrder(a: RoleKey, b: RoleKey): number {
  return PIPELINE_ORDER.indexOf(a) - PIPELINE_ORDER.indexOf(b);
}

function namedItems(query: string, items: MatchItem[]): MatchItem[] {
  const q = query.toLowerCase();
  return items.filter((i) => {
    const name = i.name.toLowerCase();
    if (name.length > 5 && q.includes(name)) return true;
    if (q.includes(" " + i.slug.toLowerCase() + " ")) return true;
    return false;
  });
}

// ── engine ──────────────────────────────────────────────────────────────────

export function buildMatch(
  rawItems: MatchItem[],
  input: { q: string; budget?: number; priority?: PriorityKey },
): MatchResult {
  const started = Date.now();
  const query = (input.q || "").trim().slice(0, 400);
  const priority = normalizePriority(input.priority);
  const weights = PRIORITIES[priority].weights;
  const budget = Math.max(0, Math.min(2000, Math.round(Number(input.budget ?? 150) || 0)));

  const items = rawItems.filter((i) => i && i.slug);
  const pinned = namedItems(query, items);

  let detected = detectRoles(query);
  const note =
    detected.length === 0
      ? "No specific job matched, so the engine drafted a general operating stack: research, writing and operations."
      : pinned.length
        ? `Your brief names ${pinned.map((p) => p.name).join(" and ")}, so ${pinned.length === 1 ? "it is" : "they are"} pinned into the draft.`
        : "";

  if (detected.length === 0) {
    detected = [
      { key: "research", need: 70 },
      { key: "writing", need: 60 },
      { key: "ops", need: 50 },
    ];
  }

  // Keep the strongest roles, cap at five, and make sure a one-role brief gets
  // a supporting step rather than a lonely card.
  // One weak keyword mention is not a job. Keep roles with at least two
  // signals (need >= 60), then fall back to the single strongest one.
  const strong = detected.filter((d) => d.need >= 60);
  const pool = strong.length ? strong : detected.slice(0, 1);
  const chosen: Array<{ key: RoleKey; need: number }> = [];
  for (const role of pool.sort((a, b) => b.need - a.need).slice(0, 5)) chosen.push(role);
  if (chosen.length < 2) {
    const extra = COMPLEMENT[chosen[0].key];
    if (extra && !chosen.some((c) => c.key === extra)) chosen.push({ key: extra, need: 45 });
  }
  chosen.sort((a, b) => b.need - a.need || roleOrder(a.key, b.key));

  const taken = new Set<string>();
  const steps: MatchStep[] = [];

  for (const role of chosen) {
    const candidates = items.filter((item) => {
      const p = profileFor(item);
      return (p.roles[role.key] || 0) >= 45;
    });
    const pool = candidates.length ? candidates : items.filter((i) => profileFor(i).roles[role.key]);
    if (!pool.length) continue;

    const ranked = pool
      .map((item) => rankItem(item, role.key, weights, pinned.some((p) => p.slug === item.slug)))
      .sort((a, b) => {
        if (a.slug === b.slug) return 0;
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.score - a.score;
      });

    // A pinned listing wins its strongest role only; other roles choose freely.
    const available = ranked.filter((r) => !taken.has(r.slug));
    if (!available.length) continue;
    const winner = available[0];
    taken.add(winner.slug);
    const rest = available.filter((r) => r.slug !== winner.slug);
    const runnerUp = rest[0] || null;
    winner.confidence = confidenceFor(winner, runnerUp);

    steps.push({
      role: role.key,
      label: ROLES[role.key].label,
      job: ROLES[role.key].job,
      need: Math.round(role.need),
      winner,
      runnerUp,
      delta: runnerUp ? Math.round((winner.score - runnerUp.score) * 10) / 10 : 0,
      alternatives: rest.slice(0, 3).map((r) => ({ ...r, confidence: confidenceFor(r, rest[0] || null) })),
      reason: reasonFor(winner, runnerUp),
    });
  }

  // Budget: model a cheaper swap per step where one exists.
  const totalCost = steps.reduce((sum, s) => sum + s.winner.price, 0);
  const overBy = Math.max(0, totalCost - budget);
  const swaps: MatchResult["swaps"] = [];
  if (overBy > 0) {
    const spendOrder = [...steps].sort((a, b) => b.winner.price - a.winner.price);
    let remaining = overBy;
    for (const step of spendOrder) {
      if (remaining <= 0) break;
      const cheaper = step.alternatives
        .filter((alt) => alt.price < step.winner.price)
        .sort((a, b) => (b.price === a.price ? b.score - a.score : a.price - b.price))[0];
      if (!cheaper) continue;
      const saves = step.winner.price - cheaper.price;
      swaps.push({
        role: step.role,
        roleLabel: step.label,
        fromSlug: step.winner.slug,
        fromName: step.winner.name,
        toSlug: cheaper.slug,
        toName: cheaper.name,
        saves,
        scoreCost: Math.round((step.winner.score - cheaper.score) * 10) / 10,
        applied: true,
      });
      remaining -= saves;
    }
  }
  const swapSavings = swaps.reduce((n, s) => n + s.saves, 0);
  const fittedCost = Math.max(0, totalCost - swapSavings);
  const withinBudget = fittedCost <= budget;

  const avgScore = steps.length
    ? Math.round((steps.reduce((sum, s) => sum + s.winner.score, 0) / steps.length) * 10) / 10
    : 0;
  const needTotal = steps.reduce((sum, s) => sum + s.need, 0) || 1;
  const rawCoverage = Math.round(
    (steps.reduce((sum, s) => sum + s.need * (s.winner.factors.fit / 100), 0) / needTotal) * 100,
  );

  const itemBySlug = new Map(items.map((i) => [i.slug, i]));
  const coveredText = steps
    .map((s) => {
      const item = itemBySlug.get(s.winner.slug);
      return `${s.winner.name} ${s.winner.tagline} ${(item?.tags || []).join(" ")} ${item?.body || ""}`.toLowerCase();
    })
    .join(" ");
  const queryLower = " " + query.toLowerCase() + " ";
  const gaps = ARTIFACT_WORDS.filter(
    (word) => new RegExp(`\\b${word}\\b`).test(queryLower) && !new RegExp(`\\b${word}`).test(coveredText),
  );
  const coverage = clamp(rawCoverage - gaps.length * 12, 0, 100);
  const confidence = steps.length
    ? Math.round(steps.reduce((sum, s) => sum + s.winner.confidence, 0) / steps.length)
    : 0;

  const risks: MatchResult["risks"] = [];
  if (overBy > 0) {
    risks.push({
      severity: withinBudget ? "medium" : "high",
      text: withinBudget
        ? `The winners run about $${Math.round(totalCost)}/mo against a $${budget} budget. Applying ${swaps.length} cheaper ${swaps.length === 1 ? "swap" : "swaps"} lands at $${Math.round(fittedCost)}/mo for ${swaps.reduce((n, s) => n + s.scoreCost, 0).toFixed(1)} points of score.`
        : `The stack is $${Math.round(overBy)}/mo over budget and no cheaper candidate holds the role. Raise the budget or drop a step.`,
    });
  }
  const aiSteps = steps.filter((s) => s.winner.runtime === "ai");
  if (aiSteps.length) {
    risks.push({
      severity: "medium",
      text: `${aiSteps.length} ${aiSteps.length === 1 ? "step needs" : "steps need"} a configured model endpoint. The local runtimes in this stack still work with no key at all.`,
    });
  }
  for (const gap of gaps) {
    risks.push({
      severity: "medium",
      text: `The brief mentions ${gap}, and no listing in the catalog does it. The draft covers the rest and leaves that gap visible rather than inventing an agent for it.`,
    });
  }
  for (const step of steps) {
    if (step.runnerUp && step.delta < 3) {
      risks.push({
        severity: "low",
        text: `${step.label} is a close call: ${step.winner.name} beats ${step.runnerUp.name} by only ${step.delta} points. Re-run with a different priority to see if the verdict holds.`,
      });
    }
    if (!step.runnerUp) {
      risks.push({
        severity: "medium",
        text: `${step.label} has no real alternative in the catalog. Treat the recommendation as a default, not a contest you won.`,
      });
    }
  }
  const unselected = detected.filter((d) => !chosen.some((c) => c.key === d.key));
  if (unselected.length) {
    risks.push({
      severity: "low",
      text: `The brief also touches ${unselected.map((u) => ROLES[u.key].label.toLowerCase()).join(", ")}, which is outside the five-step draft. Add a step in the studio if it matters.`,
    });
  }

  const top = [...steps].sort((a, b) => (b.need - a.need) || (b.winner.score - a.winner.score))[0];
  const firstMove = top
    ? `Start with ${top.winner.name} for ${top.label.toLowerCase()}. ${top.winner.price === 0 ? "It costs nothing to run here." : `It models at about $${top.winner.price}/mo.`} ${top.winner.edge}`
    : "Add at least one listing to the catalog and re-run the brief.";

  return {
    mission: {
      query,
      budget,
      priority,
      priorityLabel: PRIORITIES[priority].label,
      note,
      weights,
      roles: chosen.map((c) => ({ key: c.key, label: ROLES[c.key].label, need: Math.round(c.need), job: ROLES[c.key].job })),
      coverageNote:
        coverage >= 85
          ? "The catalog covers this mission closely."
          : coverage >= 65
            ? "The catalog covers the core of this mission; expect to glue one or two steps by hand."
            : "The catalog covers part of this mission. The gaps are listed as risks rather than filled with invented agents.",
    },
    steps,
    totals: {
      cost: fittedCost,
      budget,
      withinBudget,
      overBy: Math.max(0, fittedCost - budget),
      avgScore,
      coverage,
      confidence,
    },
    swaps,
    risks,
    gaps,
    firstMove,
    evaluated: items.length,
    engine: {
      version: "match-1.0",
      formula: "score = Σ factor × weight, each weight shown in the audit panel; quality uses a Bayesian rating prior, cost uses the modelled monthly run price",
      ms: Math.max(1, Date.now() - started),
    },
  };
}

// ── compare ─────────────────────────────────────────────────────────────────

export interface CompareRow {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  runtime: string | null;
  price: number;
  score: number;
  factors: Record<string, number>;
  depth: number;
  rating: { avg: number; count: number };
  winner: boolean;
}

const COMPARE_FACTORS = ["quality", "value", "speed", "ease", "independence", "depth"] as const;
export type CompareFactor = (typeof COMPARE_FACTORS)[number];

export const COMPARE_FACTOR_LABELS: Record<CompareFactor, string> = {
  quality: "Track record",
  value: "Cost",
  speed: "Time to result",
  ease: "Setup effort",
  independence: "Independence",
  depth: "Documentation",
};

export const DEFAULT_COMPARE_WEIGHTS: Record<CompareFactor, number> = {
  quality: 30,
  value: 20,
  speed: 20,
  ease: 15,
  independence: 15,
  depth: 20,
};

export function compareItems(
  items: MatchItem[],
  weightsInput?: Partial<Record<CompareFactor, number>>,
): { rows: CompareRow[]; weights: Record<CompareFactor, number> } {
  const weights = { ...DEFAULT_COMPARE_WEIGHTS };
  for (const key of COMPARE_FACTORS) {
    const raw = Number(weightsInput?.[key]);
    if (Number.isFinite(raw)) weights[key] = Math.max(0, Math.min(100, raw));
  }
  const sum = COMPARE_FACTORS.reduce((n, k) => n + weights[k], 0) || 1;

  const rows: CompareRow[] = items.map((item) => {
    const p = profileFor(item);
    const factors: Record<string, number> = {
      quality: Math.round(qualityScore(item)),
      value: Math.round(valueScore(p.price)),
      speed: Math.round(clamp(p.speed)),
      ease: Math.round(clamp(p.ease)),
      independence: Math.round(clamp(p.independence)),
      depth: Math.round(depthScore(item)),
    };
    const score = Math.round((COMPARE_FACTORS.reduce((n, k) => n + factors[k] * weights[k], 0) / sum) * 10) / 10;
    return {
      slug: item.slug,
      name: item.name,
      tagline: item.tagline,
      category: item.category,
      runtime: item.runtime,
      price: p.price,
      score,
      factors,
      depth: factors.depth,
      rating: { avg: Number(item.rating?.avg || 0), count: Number(item.rating?.count || 0) },
      winner: false,
    };
  });

  rows.sort((a, b) => b.score - a.score);
  if (rows.length) rows[0].winner = true;
  return { rows, weights };
}
