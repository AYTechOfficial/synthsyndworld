import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchItems, runCompare, type CompareFactor, type CompareRow, type Item } from "../api";
import { CATEGORY_META, Icon } from "../components/ui";
import { toast } from "../toast";

const FACTORS: Array<{ key: CompareFactor; label: string }> = [
  { key: "quality", label: "Track record" },
  { key: "value", label: "Cost" },
  { key: "speed", label: "Time to result" },
  { key: "ease", label: "Setup effort" },
  { key: "independence", label: "Independence" },
  { key: "depth", label: "Documentation" },
];

const DEFAULT_WEIGHTS: Record<CompareFactor, number> = {
  quality: 35,
  value: 15,
  speed: 10,
  ease: 10,
  independence: 5,
  depth: 25,
};

const DEFAULT_SLUGS = ["code-review-copilot", "deep-research", "support-triage"];
const SERIES = ["var(--gold-bright)", "var(--mauve)", "var(--sage)", "var(--blue)"];

function RadarChart({ rows }: { rows: CompareRow[] }) {
  const cx = 150;
  const cy = 150;
  const radius = 104;
  const axes = FACTORS.length;
  const point = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / axes - Math.PI / 2;
    const r = (Math.max(0, Math.min(100, value)) / 100) * radius;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
  };
  return (
    <svg className="radar" viewBox="0 0 300 300" role="img" aria-label="Capability radar comparison">
      {[0.25, 0.5, 0.75, 1].map((ring) => (
        <polygon
          key={ring}
          points={Array.from({ length: axes }, (_, i) => point(i, ring * 100).join(",")).join(" ")}
          className="radar-ring"
        />
      ))}
      {FACTORS.map((f, i) => {
        const [x, y] = point(i, 100);
        return <line key={f.key} x1={cx} y1={cy} x2={x} y2={y} className="radar-axis" />;
      })}
      {rows.map((row, idx) => (
        <polygon
          key={row.slug}
          points={FACTORS.map((f, i) => point(i, row.factors[f.key]).join(",")).join(" ")}
          className={"radar-shape" + (row.winner ? " winner" : "")}
          style={{ stroke: SERIES[idx % SERIES.length], fill: SERIES[idx % SERIES.length] }}
        />
      ))}
      {FACTORS.map((f, i) => {
        const [x, y] = point(i, 118);
        return (
          <text key={f.key} x={x} y={y} className="radar-label" textAnchor="middle" dominantBaseline="middle">
            {f.label.split(" ")[0]}
          </text>
        );
      })}
    </svg>
  );
}

export default function Compare() {
  const [params, setParams] = useSearchParams();
  const initialSlugs = (params.get("slugs") || "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4);
  const initialWeights = useMemo(() => {
    const w = { ...DEFAULT_WEIGHTS };
    for (const f of FACTORS) {
      const raw = Number(params.get("w_" + f.key));
      if (Number.isFinite(raw) && params.get("w_" + f.key)) w[f.key] = Math.max(0, Math.min(100, raw));
    }
    return w;
  }, [params]);

  const [catalog, setCatalog] = useState<Item[]>([]);
  const [slugs, setSlugs] = useState<string[]>(initialSlugs.length ? initialSlugs : DEFAULT_SLUGS);
  const [weights, setWeights] = useState<Record<CompareFactor, number>>(initialWeights);
  const [rows, setRows] = useState<CompareRow[]>([]);
  const [query, setQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    fetchItems({ limit: 60 }).then((r) => setCatalog(r.items)).catch(() => {});
  }, []);

  useEffect(() => {
    const next = new URLSearchParams();
    next.set("slugs", slugs.join(","));
    let dirty = false;
    for (const f of FACTORS) {
      if (weights[f.key] !== DEFAULT_WEIGHTS[f.key]) {
        next.set("w_" + f.key, String(weights[f.key]));
        dirty = true;
      }
    }
    if (dirty || slugs.length) setParams(next, { replace: true });
  }, [slugs, weights, setParams]);

  useEffect(() => {
    if (!slugs.length) {
      setRows([]);
      setLoading(false);
      return;
    }
    window.clearTimeout(timer.current);
    setLoading(true);
    timer.current = window.setTimeout(() => {
      runCompare(slugs, weights as any)
        .then((r) => { setRows(r.rows); setError(""); })
        .catch((e: any) => setError(e?.message || "Could not compare those listings."))
        .finally(() => setLoading(false));
    }, 180);
    return () => window.clearTimeout(timer.current);
  }, [slugs, weights]);

  const winner = rows.find((r) => r.winner);
  const runnerUp = rows.filter((r) => !r.winner)[0];
  const labelOf = (slug: string) => catalog.find((c) => c.slug === slug)?.name || slug;

  const add = (slug: string) => {
    if (slugs.includes(slug)) return;
    if (slugs.length >= 4) { toast("Four finalists max — remove one first"); return; }
    setSlugs([...slugs, slug]);
    setQuery("");
    setPickerOpen(false);
  };

  const suggestions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return catalog
      .filter((i) => !slugs.includes(i.slug))
      .filter((i) => !needle || (i.name + " " + i.tagline + " " + i.tags.join(" ")).toLowerCase().includes(needle))
      .slice(0, 7);
  }, [catalog, slugs, query]);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast("Arena link copied");
    } catch {
      toast("Copy failed — the URL is in the address bar");
    }
  };

  return (
    <div className="container compare-page">
      <header className="match-hero">
        <span className="kicker">The compare arena · weighted, not vibes</span>
        <h1>Four finalists. <em>One winner.</em></h1>
        <p className="match-sub">
          Put the shortlist on one board, set what actually matters, and watch the ranking move.
          The winner is computed from the same six factors as the match room — never a popularity vote.
        </p>
      </header>

      <section className="arena-controls">
        <div className="finalists">
          {slugs.map((slug, i) => {
            const item = catalog.find((c) => c.slug === slug);
            return (
              <div className="finalist-chip" key={slug} style={{ borderColor: SERIES[i % SERIES.length] }}>
                <span className="finalist-dot" style={{ background: SERIES[i % SERIES.length] }} />
                <Link to={`/item/${slug}`}>{item?.name || labelOf(slug)}</Link>
                <button type="button" onClick={() => setSlugs(slugs.filter((s) => s !== slug))} aria-label={`Remove ${labelOf(slug)}`}>
                  <Icon name="close" size={12} />
                </button>
              </div>
            );
          })}
          {slugs.length < 4 && (
            <div className="picker">
              <button type="button" className="add-finalist" onClick={() => setPickerOpen((v) => !v)}>
                <Icon name="plus" size={13} /> Add finalist
              </button>
              {pickerOpen && (
                <div className="picker-pop">
                  <input
                    autoFocus
                    className="input"
                    placeholder="Search the catalog…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search listings to compare"
                  />
                  <div className="picker-list">
                    {suggestions.map((s) => (
                      <button type="button" key={s.slug} className="picker-item" onClick={() => add(s.slug)}>
                        <span className={"cat-dot cat-" + s.category} />
                        <span className="picker-name">{s.name}</span>
                        <span className="picker-cat">{CATEGORY_META[s.category]?.label}</span>
                      </button>
                    ))}
                    {!suggestions.length && <p className="dim picker-empty">No matches.</p>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="weights">
          {FACTORS.map((f) => (
            <label className="weight" key={f.key}>
              <span className="weight-head"><span>{f.label}</span><b>{weights[f.key]}</b></span>
              <input
                type="range"
                min={0}
                max={60}
                step={5}
                value={weights[f.key]}
                onChange={(e) => setWeights({ ...weights, [f.key]: Number(e.target.value) })}
                aria-label={`${f.label} weight`}
              />
            </label>
          ))}
          <button type="button" className="link-btn reset-weights" onClick={() => setWeights(DEFAULT_WEIGHTS)}>
            Reset weights
          </button>
        </div>
      </section>

      {error && <div className="empty"><h3>Comparison unavailable</h3><p>{error}</p></div>}

      {winner && (
        <section className="arena-verdict" aria-live="polite">
          <div className="arena-winner">
            <span className="kicker small">The winner</span>
            <h2><Link to={`/item/${winner.slug}`}>{winner.name}</Link></h2>
            <p>{winner.tagline}</p>
            <div className="arena-tags">
              <span className="price-tag">{winner.price === 0 ? "Free" : `$${winner.price}/mo`}</span>
              <span className="meta-dot" />
              <span>{CATEGORY_META[winner.category]?.label}</span>
              <span className="meta-dot" />
              <span>★ {winner.rating.avg ? winner.rating.avg.toFixed(1) : "—"} ({winner.rating.count})</span>
            </div>
          </div>
          <div className="arena-score">
            <b>{winner.score}</b>
            <span>weighted score</span>
            {runnerUp && <em>+{Math.round((winner.score - runnerUp.score) * 10) / 10} over {runnerUp.name}</em>}
          </div>
          <div className="arena-cta">
            <Link to={`/item/${winner.slug}`} className="btn btn-primary btn-sm">Open listing <Icon name="arrow" size={13} /></Link>
            <button type="button" className="btn btn-ghost btn-sm" onClick={share}><Icon name="share" size={13} /> Share arena</button>
          </div>
        </section>
      )}

      <div className="arena-grid">
        <div className="arena-chart-card">
          <div className="col-head"><h3>Capability shape</h3><span className="dim" style={{ fontSize: 11.5 }}>Bigger is stronger · same six axes as the match room</span></div>
          <RadarChart rows={rows} />
          <div className="legend">
            {rows.map((r, i) => (
              <span key={r.slug} className={r.winner ? "legend-item winner" : "legend-item"}>
                <i style={{ background: SERIES[i % SERIES.length] }} /> {r.name}
              </span>
            ))}
          </div>
        </div>

        <div className="arena-table-card">
          <div className="col-head"><h3>Line by line</h3><span className="dim" style={{ fontSize: 11.5 }}>{loading ? "Scoring…" : "Best value per row is marked"}</span></div>
          <div className="arena-scroll">
            <table className="arena-table">
              <thead>
                <tr>
                  <th>Factor</th>
                  {rows.map((r) => <th key={r.slug} className={r.winner ? "col-winner" : ""}>{r.name.length > 22 ? r.name.slice(0, 21) + "…" : r.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {FACTORS.map((f) => {
                  const best = Math.max(...rows.map((r) => r.factors[f.key]));
                  return (
                    <tr key={f.key}>
                      <td className="factor-cell">{f.label}</td>
                      {rows.map((r) => (
                        <td key={r.slug} className={r.factors[f.key] === best ? "best" : ""}>
                          {r.factors[f.key]}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                <tr className="score-row">
                  <td className="factor-cell">Weighted score</td>
                  {rows.map((r) => <td key={r.slug} className={r.winner ? "won" : ""}>{r.score}</td>)}
                </tr>
                <tr>
                  <td className="factor-cell">Modelled cost</td>
                  {rows.map((r) => <td key={r.slug}>{r.price === 0 ? "Free" : `$${r.price}/mo`}</td>)}
                </tr>
                <tr>
                  <td className="factor-cell">Runtime</td>
                  {rows.map((r) => <td key={r.slug}>{r.runtime === "ai" ? "Live model" : r.runtime ? "Local" : "Copy-ready"}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="arena-foot">
            Changing a weight changes the verdict instantly. The formula is printed on every match result,
            so two people can disagree with the ranking and still see exactly why it happened.
          </p>
        </div>
      </div>

      <div className="arena-more">
        <h3>Not the right finalists?</h3>
        <p>Start from a mission and let the engine nominate the shortlist for each job.</p>
        <Link to="/match" className="btn btn-primary btn-sm">Open the match room <Icon name="arrow" size={13} /></Link>
      </div>
    </div>
  );
}
