import { SEED_ITEMS, type SeedItem } from "./lib/catalog";
import { buildMatch, compareItems, type MatchItem, type MatchResult, type Ranking, type CompareFactor, type MatchStep, type PriorityKey, type FactorKey } from "./lib/match";
import { runDeterministic } from "./lib/runners";
import { supabase, SUPABASE_ENABLED } from "./lib/supabase";

/* ═══════════════════════════════════════════════════════════════════════════
   Synthsynd World — data layer.
   Curated listings ship in the bundle; Postgres (Supabase, row-level security)
   holds published listings, reviews, events, live counters, missions and
   per-account stacks. If the client has no connection, the app still runs
   from the bundled catalog with honest degradation.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface Author {
  name: string;
  role: string;
  hue: number;
}

export interface InputField {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "textarea";
  defaultValue?: string;
}

export interface Item {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  category: "agent" | "tool" | "prompt" | "skill";
  runtime: string | null;
  author: Author;
  tags: string[];
  body: string;
  prompt: string;
  inputSchema: InputField[];
  previewOut: string;
  version: string;
  updated: string;
  created: string;
  installs: number;
  views: number;
  runs: number;
  featured: boolean;
  model?: string | null;
  rating: { avg: number; count: number };
  /** true when the listing comes from Postgres (community-published). */
  community?: boolean;
}

export interface Review {
  id: number;
  author: string;
  rating: number;
  text: string;
  created: string;
}

export interface Stats {
  items: number;
  installs: number;
  runs: number;
  builders: number;
  reviews: number;
  avgRating: number;
  matches?: number;
  categories: Record<string, number>;
}

export interface EventRow {
  id: number;
  type: "install" | "review" | "publish";
  item_slug: string;
  meta: string;
  created: string;
  name: string;
  category: string;
}

export interface RunResult {
  mode: "deterministic" | "ai" | "preview";
  out: string;
  ms: number;
  runs: number;
  note?: string;
  model?: string;
}

/* ── live snapshot ───────────────────────────────────────────────────────── */

interface Snapshot {
  metrics: Map<string, { installs: number; views: number; runs: number }>;
  ratings: Map<string, { avg: number; count: number }>;
  published: Item[];
  events: EventRow[];
  loadedAt: number;
}

let snapshot: Snapshot | null = null;
let snapshotPromise: Promise<Snapshot> | null = null;
const SNAPSHOT_TTL = 18_000;

function seedItemToCatalog(item: SeedItem, index: number): MatchItem {
  return {
    slug: item.slug,
    name: item.name,
    tagline: item.tagline,
    category: item.category,
    runtime: item.runtime,
    tags: item.tags,
    body: item.body,
    prompt: item.prompt || "",
    inputSchema: item.inputSchema || [],
    previewOut: item.previewOut || "",
    version: item.version,
    installs: item.installs,
    runs: item.runs,
    views: item.views,
    rating: { avg: 0, count: 0 },
  };
}

const CURATED: Array<{ item: Item; engine: MatchItem; seed: SeedItem }> = SEED_ITEMS.map((seed, index) => {
  const engine = seedItemToCatalog(seed, index);
  return {
    seed,
    engine,
    item: {
      id: index + 1,
      slug: seed.slug,
      name: seed.name,
      tagline: seed.tagline,
      category: seed.category,
      runtime: seed.runtime,
      author: seed.author,
      tags: seed.tags,
      body: seed.body,
      prompt: seed.prompt || "",
      inputSchema: seed.inputSchema || [],
      previewOut: seed.previewOut || "",
      version: seed.version,
      updated: seed.updated,
      created: seed.created,
      installs: seed.installs,
      views: seed.views,
      runs: seed.runs,
      featured: !!seed.featured,
      rating: { avg: 0, count: 0 },
    },
  };
});

const BY_SLUG = new Map(CURATED.map((c) => [c.item.slug, c]));

function rowToPublished(r: any): Item {
  return {
    id: 10_000 + (typeof r.id === "number" ? r.id : 0),
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    category: r.category,
    runtime: r.runtime || null,
    author: { name: r.author_name, role: r.author_role, hue: r.author_hue },
    tags: Array.isArray(r.tags) ? r.tags : [],
    body: r.body,
    prompt: r.prompt || "",
    inputSchema: Array.isArray(r.input_schema) ? r.input_schema : [],
    previewOut: r.preview_out || "",
    version: r.version,
    updated: r.updated,
    created: r.created,
    installs: Number(r.installs || 0),
    views: Number(r.views || 0),
    runs: Number(r.runs || 0),
    featured: !!r.featured,
    rating: { avg: 0, count: 0 },
    community: true,
  };
}

async function loadSnapshot(force = false): Promise<Snapshot> {
  if (snapshot && !force && Date.now() - snapshot.loadedAt < SNAPSHOT_TTL) return snapshot;
  if (snapshotPromise && !force) return snapshotPromise;
  snapshotPromise = (async () => {
    const metrics = new Map<string, { installs: number; views: number; runs: number }>();
    const ratings = new Map<string, { avg: number; count: number }>();
    let published: Item[] = [];
    let events: EventRow[] = [];
    if (SUPABASE_ENABLED && supabase) {
      const [mres, rres, pres, eres] = await Promise.all([
        supabase.from("metrics").select("slug, installs, views, runs"),
        supabase.from("reviews").select("item_slug, rating"),
        supabase.from("published_items").select("*").order("created", { ascending: false }),
        supabase.from("events").select("id, type, item_slug, meta, created").order("id", { ascending: false }).limit(12),
      ]);
      if (!mres.error) {
        for (const row of mres.data || []) {
          metrics.set(row.slug, { installs: Number(row.installs || 0), views: Number(row.views || 0), runs: Number(row.runs || 0) });
        }
      }
      if (!rres.error) {
        const bucket = new Map<string, { sum: number; n: number }>();
        for (const row of rres.data || []) {
          const b = bucket.get(row.item_slug) || { sum: 0, n: 0 };
          b.sum += Number(row.rating || 0);
          b.n += 1;
          bucket.set(row.item_slug, b);
        }
        for (const [slug, b] of bucket) ratings.set(slug, { avg: b.n ? b.sum / b.n : 0, count: b.n });
      }
      if (!pres.error) published = (pres.data || []).map(rowToPublished);
      if (!eres.error) {
        events = (eres.data || []).map((e: any) => {
          const curated = BY_SLUG.get(e.item_slug);
          const pub = published.find((p) => p.slug === e.item_slug);
          return {
            id: e.id,
            type: e.type,
            item_slug: e.item_slug,
            meta: e.meta || "",
            created: e.created,
            name: curated?.item.name || pub?.name || e.item_slug,
            category: curated?.item.category || pub?.category || "agent",
          };
        });
      }
    }
    snapshot = { metrics, ratings, published, events, loadedAt: Date.now() };
    return snapshot;
  })().finally(() => {
    snapshotPromise = null;
  });
  return snapshotPromise;
}

function invalidate() {
  snapshot = null;
}

function rate(snap: Snapshot, item: Item) {
  const r = snap.ratings.get(item.slug);
  return r ? { avg: Math.round(r.avg * 10) / 10, count: r.count } : { avg: 0, count: 0 };
}

function liveCounts(snap: Snapshot, item: Item) {
  const m = snap.metrics.get(item.slug);
  if (m) {
    return { installs: m.installs, views: m.views, runs: m.runs };
  }
  return { installs: item.installs, views: item.views, runs: item.runs };
}

function decorate(snap: Snapshot, item: Item): Item {
  const counts = liveCounts(snap, item);
  return { ...item, ...counts, rating: rate(snap, item) };
}

async function allItems(snap?: Snapshot): Promise<Item[]> {
  const s = snap || (await loadSnapshot());
  const curated = CURATED.map((c) => decorate(s, c.item));
  const published = s.published.map((i) => decorate(s, i));
  return [...published, ...curated];
}

function toMatch(file: Item): MatchItem {
  return {
    slug: file.slug,
    name: file.name,
    tagline: file.tagline,
    category: file.category,
    runtime: file.runtime,
    tags: file.tags,
    body: file.body,
    prompt: file.prompt,
    inputSchema: file.inputSchema,
    previewOut: file.previewOut,
    version: file.version,
    installs: file.installs,
    runs: file.runs,
    views: file.views,
    rating: file.rating,
  };
}

/* ── catalog reads ───────────────────────────────────────────────────────── */

export async function fetchStats(): Promise<Stats> {
  const snap = await loadSnapshot();
  const items = await allItems(snap);
  const categories: Record<string, number> = { agent: 0, tool: 0, prompt: 0, skill: 0 };
  let installs = 0;
  let runs = 0;
  const builders = new Set<string>();
  for (const item of items) {
    categories[item.category] = (categories[item.category] || 0) + 1;
    installs += item.installs;
    runs += item.runs;
    builders.add(item.author.name);
  }
  let sum = 0;
  let reviews = 0;
  for (const [, r] of snap.ratings) {
    sum += r.avg * r.count;
    reviews += r.count;
  }
  const avgRating = reviews ? sum / reviews : 0;
  let matches = 0;
  if (SUPABASE_ENABLED && supabase) {
    const mres = await supabase.from("matches").select("id", { count: "exact", head: true });
    if (!mres.error) matches = Number(mres.count || 0);
  }
  return { items: items.length, installs, runs, builders: builders.size, reviews, avgRating, matches, categories };
}

export async function fetchEvents(): Promise<{ events: EventRow[] }> {
  const snap = await loadSnapshot();
  return { events: snap.events.slice(0, 10) };
}

export async function fetchItems(params: { q?: string; category?: string; sort?: string; tag?: string; limit?: number } = {}) {
  const items = await allItems();
  const q = (params.q || "").trim().toLowerCase();
  let out = items.filter((item) => {
    if (params.category && item.category !== params.category) return false;
    if (params.tag && !item.tags.includes(params.tag.toLowerCase())) return false;
    if (q) {
      const hay = (item.name + " " + item.tagline + " " + item.tags.join(" ") + " " + item.body).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const sort = params.sort || "trending";
  const by = (a: Item, b: Item, key: (i: Item) => number) => key(b) - key(a);
  if (sort === "new") out = out.sort((a, b) => (a.created < b.created ? 1 : a.created > b.created ? -1 : 0));
  else if (sort === "installs") out = out.sort((a, b) => by(a, b, (i) => i.installs));
  else if (sort === "rating") out = out.sort((a, b) => by(a, b, (i) => i.rating.avg * 10 + i.rating.count / 10));
  else
    out = out.sort((a, b) =>
      by(a, b, (i) => (i.featured ? 4000 : 0) + i.installs * 0.7 + i.runs * 0.4 + i.views * 0.05),
    );
  const limit = Math.max(1, Math.min(60, params.limit || 48));
  return { items: out.slice(0, limit), count: out.length };
}

export async function fetchItem(slug: string) {
  const snap = await loadSnapshot();
  const curated = BY_SLUG.get(slug);
  const published = snap.published.find((p) => p.slug === slug);
  if (!curated && !published) throw new Error("Listing not found.");

  if (SUPABASE_ENABLED && supabase) {
    await supabase.rpc("bump_metric", { p_slug: slug, p_field: "views" }).then(({ error }) => error && void 0);
  }

  let reviews: Review[] = [];
  if (SUPABASE_ENABLED && supabase) {
    const res = await supabase.from("reviews").select("id, author, rating, text, created").eq("item_slug", slug).order("created", { ascending: false }).limit(24);
    if (!res.error) reviews = res.data || [];
  }

  const item = decorate(snap, (curated?.item || published)!);
  const others = (await allItems(snap))
    .filter((i) => i.category === item.category && i.slug !== item.slug)
    .sort((a, b) => b.installs - a.installs)
    .slice(0, 3);
  return { item: { ...item, views: item.views + 1 }, reviews, related: others };
}

/* ── writes ──────────────────────────────────────────────────────────────── */

async function recordEvent(type: EventRow["type"], slug: string, meta: string) {
  if (!SUPABASE_ENABLED || !supabase) return;
  await supabase.from("events").insert({ type, item_slug: slug, meta, created: new Date().toISOString().slice(0, 10) }).then(({ error }) => error && console.warn("[events]", error.message));
}

export async function installItem(slug: string) {
  if (!SUPABASE_ENABLED || !supabase) throw new Error("Database not connected.");
  await supabase.rpc("bump_metric", { p_slug: slug, p_field: "installs" });
  invalidate();
  const snap = await loadSnapshot();
  const item = await findItem(snap, slug);
  if (!item) throw new Error("Listing not found.");
  recordEvent("install", slug, "a builder");
  return { ok: true, installs: decorate(snap, item).installs };
}

async function findItem(snap: Snapshot, slug: string): Promise<Item | null> {
  const curated = BY_SLUG.get(slug)?.item;
  if (curated) return curated;
  return snap.published.find((p) => p.slug === slug) || null;
}

export async function addReview(slug: string, input: { author: string; rating: number; text: string }) {
  if (!SUPABASE_ENABLED || !supabase) throw new Error("Database not connected.");
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Sign in to leave a review.");
  const item = await findItem(await loadSnapshot(), slug);
  if (!item) throw new Error("Listing not found.");
  const rating = Math.round(Number(input.rating));
  const text = String(input.text || "").trim();
  if (!(rating >= 1 && rating <= 5)) throw new Error("Rating must be 1–5.");
  if (text.length < 5 || text.length > 600) throw new Error("Review must be 5–600 characters.");
  const author = String(input.author || displayName(session.session.user) || "builder").trim().slice(0, 24);

  const { error } = await supabase.from("reviews").insert({ item_slug: slug, author, rating, text, created: new Date().toISOString().slice(0, 10) });
  if (error) throw new Error(error.message);
  await recordEvent("review", slug, author);
  invalidate();
  const snap = await loadSnapshot();
  return { ok: true, rating: rate(snap, item) };
}

export interface NewListing {
  name: string;
  tagline: string;
  category: string;
  body: string;
  tags: string[];
  author: string;
  prompt?: string;
}

export async function createListing(input: NewListing) {
  if (!SUPABASE_ENABLED || !supabase) throw new Error("Database not connected.");
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Sign in to publish.");
  const name = String(input.name || "").trim();
  const tagline = String(input.tagline || "").trim();
  const category = String(input.category || "");
  const description = String(input.body || "").trim();
  if (name.length < 3 || name.length > 60) throw new Error("Name must be 3–60 characters.");
  if (tagline.length < 10 || tagline.length > 160) throw new Error("Tagline must be 10–160 characters.");
  if (!["agent", "tool", "prompt", "skill"].includes(category)) throw new Error("Pick a category.");
  if (description.length < 30 || description.length > 4000) throw new Error("Description must be 30–4000 characters.");

  const base = name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  if (!base) throw new Error("Name must contain letters or numbers.");
  let slug = base;
  let n = 2;
  const existing = new Set<string>(CURATED.map((c) => c.item.slug));
  const snap = await loadSnapshot();
  for (const p of snap.published) existing.add(p.slug);
  while (existing.has(slug)) slug = `${base}-${n++}`;

  const today = new Date().toISOString().slice(0, 10);
  const authorName = String(input.author || displayName(session.session.user) || "builder").trim().slice(0, 24) || "builder";
  const fullBody = description;
  const { data, error } = await supabase.from("published_items").insert({
    slug,
    name,
    tagline,
    category,
    runtime: null,
    author_name: authorName,
    author_role: "Community builder",
    author_hue: (name.charCodeAt(0) * 37) % 360,
    tags: input.tags.slice(0, 5),
    body: fullBody,
    prompt: input.prompt || "",
    input_schema: [],
    preview_out: "",
    version: "0.1.0",
    updated: today,
    created: today,
  }).select();

  if (error) throw new Error(error.message);
  await supabase.rpc("bump_metric", { p_slug: slug, p_field: "views" }).then(({ error }) => error && void 0);
  await recordEvent("publish", slug, authorName);
  invalidate();
  const item = rowToPublished((data as any[])[0]);
  return { item: { ...item, rating: { avg: 0, count: 0 } } };
}

function displayName(user: any): string {
  const email = String(user?.email || "");
  const meta = (user?.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) as string | undefined;
  const base = (meta || email.split("@")[0] || "builder").toLowerCase().replace(/[^a-z0-9_.-]+/g, "").slice(0, 24);
  return base || "builder";
}

/* ── deterministic runners + engines (all client-side) ───────────────────── */

export async function runAgent(slug: string, values: Record<string, string>) {
  const item = await findItem(await loadSnapshot(), slug);
  if (!item) throw new Error("Listing not found.");
  const runtime = item.runtime || "";
  if (!runtime) throw new Error("This listing is reference material — copy it into your own agent runtime.");
  const started = Date.now();

  const recordRun = async () => {
    if (!SUPABASE_ENABLED || !supabase) return item.runs;
    await supabase.rpc("bump_metric", { p_slug: slug, p_field: "runs" });
    invalidate();
    const snap = await loadSnapshot();
    const m = snap.metrics.get(slug);
    return m ? m.runs : item.runs + 1;
  };

  if (runtime.startsWith("det:")) {
    const out = runDeterministic(runtime, values);
    const runs = await recordRun();
    return { mode: "deterministic", out, ms: Date.now() - started, runs } as RunResult;
  }
  throw new Error(
    "Live model runs need a model endpoint on a server — the catalog, match room, compare arena and every local runtime work without one.",
  );
}

export async function fetchModelsStatic() {
  return {
    agents: [
      { slug: "deep-research", name: "Deep Research Copilot", model: "Long-context model", capability: "long-context" },
      { slug: "code-review-copilot", name: "Code Review Copilot", model: "Code model", capability: "code" },
      { slug: "spec-whisperer", name: "Product Spec Whisperer", model: "General model", capability: "general" },
      { slug: "support-triage", name: "Support Triage Unit", model: "Fast model", capability: "triage" },
      { slug: "sql-sensei", name: "SQL Sensei", model: "Data model", capability: "data" },
      { slug: "synth-muse", name: "Synth Muse", model: "Creative model", capability: "creative" },
    ],
  };
}

export type { MatchResult, Ranking, MatchStep, PriorityKey, FactorKey } from "./lib/match";
export type { CompareFactor };

export const PRIORITY_OPTIONS: Array<{ key: PriorityKey; label: string; hint: string }> = [
  { key: "balanced", label: "Balanced", hint: "Fit and track record lead" },
  { key: "quality", label: "Best result", hint: "Quality first, cost second" },
  { key: "budget", label: "Lean budget", hint: "Cost and fit decide" },
  { key: "speed", label: "Fastest path", hint: "Time to result wins" },
  { key: "control", label: "Data control", hint: "Local and independent" },
];

async function matchItems(): Promise<MatchItem[]> {
  const items = await allItems();
  return items.map(toMatch);
}

export interface RecentMatch {
  id: number;
  query: string;
  budget: number;
  priority: string;
  score: number;
  created: string;
  winner: string | null;
}

export async function runMatch(input: { q: string; budget: number; priority: PriorityKey }): Promise<MatchResult> {
  const q = String(input.q || "").trim();
  if (q.length < 6) throw new Error("Describe the mission in at least 6 characters.");
  if (q.length > 400) throw new Error("Keep the brief under 400 characters.");
  const items = await matchItems();
  const result = buildMatch(items, { q, budget: input.budget, priority: input.priority }) as unknown as MatchResult;
  const top = [...result.steps].sort((a, b) => b.need - a.need || b.winner.score - a.winner.score)[0];
  if (SUPABASE_ENABLED && supabase) {
    supabase.from("matches").insert({
      query: q.slice(0, 240),
      budget: Math.round(result.totals.cost),
      priority: result.mission.priority,
      winner_slug: top?.winner.slug || "",
      score: result.totals.avgScore,
      created: new Date().toISOString(),
    }).then(({ error }) => error && console.warn("[matches]", error.message));
  }
  return result;
}

export async function fetchMatch(params: { q: string; budget: number; priority: PriorityKey }): Promise<MatchResult> {
  const q = String(params.q || "").trim();
  if (q.length < 6) throw new Error("Describe the mission in at least 6 characters.");
  const items = await matchItems();
  return buildMatch(items, { q, budget: params.budget, priority: params.priority }) as unknown as MatchResult;
}

export async function fetchMatches(): Promise<{ matches: RecentMatch[] }> {
  if (!SUPABASE_ENABLED || !supabase) return { matches: [] };
  const { data, error } = await supabase.from("matches").select("id, query, budget, priority, score, created, winner_slug").order("id", { ascending: false }).limit(6);
  if (error) return { matches: [] };
  return {
    matches: (data || []).map((row: any) => ({
      id: row.id,
      query: row.query,
      budget: row.budget,
      priority: row.priority,
      score: row.score,
      created: row.created,
      winner: BY_SLUG.get(row.winner_slug)?.item.name || row.winner_slug,
    })),
  };
}

/* ── compare (browser) ───────────────────────────────────────────────────── */



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

export async function runCompare(slugs: string[], weights: Record<string, number> | any) {
  const items = await matchItems();
  const selected = slugs
    .map((slug) => items.find((i) => i.slug === slug))
    .filter(Boolean) as MatchItem[];
  if (!selected.length) throw new Error("None of those listings exist.");
  return compareItems(selected, weights) as { rows: CompareRow[]; weights: Record<string, number> };
}

/* ── accounts ────────────────────────────────────────────────────────────── */

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new Error("Sign in required.");
  return user;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  if (!SUPABASE_ENABLED || !supabase) return null;
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return null;
  return { id: user.id, name: displayName(user), email: user.email || "" };
}

export interface ServerStack {
  id: string;
  name: string;
  query: string;
  budget: number;
  priority: string;
  steps: Array<Record<string, unknown>>;
  totals: Record<string, number>;
  created: string;
  updated: string;
}

export async function fetchLibrary(): Promise<{ stacks: ServerStack[] }> {
  if (!SUPABASE_ENABLED || !supabase) throw new Error("Database not connected.");
  const user = await requireUser();
  const { data, error } = await supabase
    .from("stacks")
    .select("id, name, query, budget, priority, steps, totals, created, updated")
    .eq("owner", user.id)
    .order("updated", { ascending: false })
    .limit(60);
  if (error) throw new Error(error.message);
  return { stacks: (data || []) as ServerStack[] };
}

export async function saveLibraryStack(stack: SavedStackBody): Promise<{ stack: ServerStack }> {
  if (!SUPABASE_ENABLED || !supabase) throw new Error("Database not connected.");
  const user = await requireUser();
  const name = String(stack.name || "").trim().slice(0, 70);
  if (name.length < 3) throw new Error("Give the stack a name.");
  if (!Array.isArray(stack.steps) || !stack.steps.length) throw new Error("A stack needs at least one step.");
  const id = String(stack.id || "").replace(/[^a-z0-9-]/gi, "").slice(0, 40) || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("stacks")
    .upsert(
      {
        id,
        owner: user.id,
        name,
        query: String(stack.query || "").slice(0, 400),
        budget: Math.max(0, Math.min(2000, Math.round(stack.budget || 0))),
        priority: String(stack.priority || "custom").slice(0, 16),
        steps: stack.steps.slice(0, 24),
        totals: {
          cost: Number(stack.totals?.cost || 0),
          score: Number(stack.totals?.score || 0),
          coverage: Number(stack.totals?.coverage || 0),
          confidence: Number(stack.totals?.confidence || 0),
        },
        updated: now,
        created: now,
      },
      { onConflict: "owner,id" },
    )
    .select();
  if (error) throw new Error(error.message);
  return { stack: (data as any[])[0] as ServerStack };
}

export async function deleteLibraryStack(id: string): Promise<{ ok: boolean }> {
  if (!SUPABASE_ENABLED || !supabase) throw new Error("Database not connected.");
  const user = await requireUser();
  const clean = String(id || "").slice(0, 40);
  const { error } = await supabase.from("stacks").delete().eq("owner", user.id).eq("id", clean);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export interface SavedStackBody {
  id: string;
  name: string;
  query: string;
  budget: number;
  priority: string;
  steps: unknown[];
  totals: { cost: number; score: number; coverage: number; confidence: number };
}

/* ── $SSDY market feed (browser direct, CORS-safe) ──────────────────────── */

let ssdyCache: { at: number; data: any } | null = null;
const SSDY_MINT = "5kkYSNkWgn6DCkTkPRbKKEZtmzVzVWXSR9R9PK5Ppump";

export async function fetchSsdY() {
  if (ssdyCache && Date.now() - ssdyCache.at < 60_000) return ssdyCache.data;
  const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${SSDY_MINT}`);
  if (!res.ok) throw new Error("market feed unavailable");
  const raw: any = await res.json();
  const pair = raw?.pairs?.[0];
  if (!pair) throw new Error("no pair");
  const data = {
    priceUsd: Number(pair.priceUsd) || null,
    marketCap: Number(pair.marketCap) || null,
    volume24h: Number(pair.volume?.h24) || null,
    liquidity: Number(pair.liquidity?.usd) || null,
    change24h: Number(pair.priceChange?.h24) || null,
    txns24h: Number(pair.txns?.h24?.buys) + Number(pair.txns?.h24?.sells) || null,
    buys24h: Number(pair.txns?.h24?.buys) || null,
    sells24h: Number(pair.txns?.h24?.sells) || null,
    live: true,
  };
  ssdyCache = { at: Date.now(), data };
  return data;
}

/* ── manifest ───────────────────────────────────────────────────────────── */

export function buildManifest(item: Item) {
  return JSON.stringify(
    {
      name: item.name,
      slug: item.slug,
      version: item.version,
      category: item.category,
      runtime: item.runtime || "reference",
      author: item.author.name,
      tags: item.tags,
      input: item.inputSchema.map((f) => ({ key: f.key, type: f.type || "text", required: true })),
      prompt: item.prompt || undefined,
      source: `synthsynd://${item.slug}`,
    },
    null,
    2,
  );
}
