import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchItems, fetchStats, type Item, type Stats } from "../api";
import ItemCard from "../components/ItemCard";
import { CATEGORY_META, Icon } from "../components/ui";

const SORTS = [
  { key: "trending", label: "Trending" },
  { key: "installs", label: "Most installed" },
  { key: "rating", label: "Top rated" },
  { key: "new", label: "Newest" },
];

export default function Discover() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [category, setCategory] = useState(params.get("category") || "");
  const [sort, setSort] = useState(params.get("sort") || "trending");
  const [tag, setTag] = useState(params.get("tag") || "");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [tagPool, setTagPool] = useState<string[]>([]);

  useEffect(() => {
    fetchStats().then(setStats).catch(() => {});
    fetchItems({ limit: 60 })
      .then((r) => {
        const counts = new Map<string, number>();
        for (const it of r.items) for (const t of it.tags) counts.set(t, (counts.get(t) || 0) + 1);
        setTagPool([...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t]) => t));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (category) p.set("category", category);
    if (sort && sort !== "trending") p.set("sort", sort);
    if (tag) p.set("tag", tag);
    setParams(p, { replace: true });
  }, [q, category, sort, tag, setParams]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const t = setTimeout(() => {
      fetchItems({ q: q.trim(), category, sort, tag })
        .then((r) => {
          if (!alive) return;
          setItems(r.items);
          setError("");
        })
        .catch((e: any) => alive && setError(e.message || "Couldn't load the catalog."))
        .finally(() => alive && setLoading(false));
    }, q ? 240 : 0);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q, category, sort, tag]);

  const counts = stats?.categories || {};
  const heading = useMemo(() => {
    if (tag) return `Tagged “${tag}”`;
    if (category && CATEGORY_META[category]) return CATEGORY_META[category].plural;
    if (q.trim()) return `Results for “${q.trim()}”`;
    return "The whole bazaar";
  }, [tag, category, q]);

  return (
    <div className="container">
      <div className="page-head">
        <span className="kicker">Catalog · {stats ? stats.items : "—"} listings</span>
        <h1>{heading}</h1>
        <p>Search across agents, tools, prompts and skills. Every entry has an author, a version and a real demo path.</p>
      </div>

      <div className="filterbar">
        <div className="filter-top">
          <div className="searchbox">
            <Icon name="search" size={16} />
            <input
              className="input"
              placeholder="Search by name, tagline, tag or body text…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search listings"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: 0, color: "var(--dim)", padding: 4 }}
                aria-label="Clear search"
              >
                <Icon name="close" size={14} />
              </button>
            )}
          </div>
          <select className="select filter-sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort listings">
            {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <div className="seg" role="tablist" aria-label="Categories">
          <button type="button" className={"seg-btn" + (!category ? " active" : "")} onClick={() => setCategory("")}>All <span className="seg-count">{stats?.items ?? ""}</span></button>
          {Object.keys(CATEGORY_META).map((key) => (
            <button type="button" key={key} className={"seg-btn" + (category === key ? " active" : "")} onClick={() => setCategory(category === key ? "" : key)}>
              {CATEGORY_META[key].plural} <span className="seg-count">{counts[key] ?? ""}</span>
            </button>
          ))}
        </div>
        <div className="tagrow">
          <span className="dim" style={{ fontSize: 11.5, marginRight: 2 }}>Tags</span>
          {tagPool.map((t) => (
            <button type="button" key={t} className={"tagchip" + (tag === t ? " active" : "")} onClick={() => setTag(tag === t ? "" : t)}>{t}</button>
          ))}
          {tag && !tagPool.includes(tag) && (
            <button type="button" className="tagchip active" onClick={() => setTag("")}>{tag} ×</button>
          )}
        </div>
      </div>

      <div className="results-line">
        <span>{loading ? "Searching the bazaar…" : `${items.length} ${items.length === 1 ? "listing" : "listings"}`}</span>
        {(q || category || tag || sort !== "trending") && (
          <button type="button" onClick={() => { setQ(""); setCategory(""); setTag(""); setSort("trending"); }} style={{ background: "none", border: 0, color: "var(--gold-bright)", fontSize: 12 }}>
            Reset filters
          </button>
        )}
      </div>

      {error ? (
        <div className="empty">
          <h3>Couldn’t load the catalog</h3>
          <p>{error}</p>
          <button className="btn btn-ghost btn-sm" onClick={() => setSort(sort)}>Try again</button>
        </div>
      ) : loading ? (
        <div className="grid">{Array.from({ length: 6 }).map((_, i) => <div className="skel" key={i} />)}</div>
      ) : items.length === 0 ? (
        <div className="empty">
          <h3>Nothing matches that yet.</h3>
          <p>Try a broader search, or be the first to publish something in this space.</p>
          <Link className="btn btn-primary btn-sm" to="/submit" style={{ marginTop: 14 }}>Publish a listing</Link>
        </div>
      ) : (
        <div className="grid" style={{ paddingBottom: 40 }}>
          {items.map((item) => <ItemCard key={item.slug} item={item} />)}
        </div>
      )}
    </div>
  );
}
