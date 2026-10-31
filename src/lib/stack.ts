import type { MatchResult } from "../api";

export interface StackStep {
  role: string;
  label: string;
  slug: string;
  name: string;
  tagline: string;
  score: number;
  price: number;
  runtime: string | null;
  category: string;
}

export interface SavedStack {
  id: string;
  name: string;
  query: string;
  budget: number;
  priority: string;
  created: string;
  steps: StackStep[];
  totals: { cost: number; score: number; coverage: number; confidence: number };
}

const KEY = "synthsynd.stacks.v1";
const STAGE_KEY = "synthsynd.staged.v1";

export function loadLibrary(): SavedStack[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(stacks: SavedStack[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(stacks.slice(0, 40)));
  } catch {
    // Storage can be full or blocked; the UI reports it from the return value.
  }
}

export function saveStack(stack: SavedStack): SavedStack[] {
  const stacks = loadLibrary().filter((s) => s.id !== stack.id);
  stacks.unshift(stack);
  persist(stacks);
  return stacks;
}

export function deleteStack(id: string): SavedStack[] {
  const stacks = loadLibrary().filter((s) => s.id !== id);
  persist(stacks);
  return stacks;
}

export function stackFromMatch(result: MatchResult): SavedStack {
  const name = result.mission.query.replace(/\s+/g, " ").trim();
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: name.slice(0, 70),
    query: result.mission.query,
    budget: result.mission.budget,
    priority: result.mission.priority,
    created: new Date().toISOString(),
    steps: result.steps.map((s) => ({
      role: s.role,
      label: s.label,
      slug: s.winner.slug,
      name: s.winner.name,
      tagline: s.winner.tagline,
      score: s.winner.score,
      price: s.winner.price,
      runtime: s.winner.runtime,
      category: s.winner.category,
    })),
    totals: {
      cost: result.totals.cost,
      score: result.totals.avgScore,
      coverage: result.totals.coverage,
      confidence: result.totals.confidence,
    },
  };
}

/** Hand a stack to the studio tab without a round trip through the server. */
export function stageStack(stack: SavedStack) {
  try {
    sessionStorage.setItem(STAGE_KEY, JSON.stringify(stack));
  } catch {
    // ignore
  }
}

export function takeStagedStack(): SavedStack | null {
  try {
    const raw = sessionStorage.getItem(STAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(STAGE_KEY);
    return JSON.parse(raw) as SavedStack;
  } catch {
    return null;
  }
}

export function stackCost(steps: StackStep[]): number {
  return steps.reduce((n, s) => n + (Number(s.price) || 0), 0);
}

export function stackAverageScore(steps: StackStep[]): number {
  const scored = steps.filter((s) => s.score > 0);
  if (!scored.length) return 0;
  return Math.round((scored.reduce((n, s) => n + s.score, 0) / scored.length) * 10) / 10;
}
