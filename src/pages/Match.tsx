import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  fetchMatch,
  fetchMatches,
  runMatch,
  saveLibraryStack,
  PRIORITY_OPTIONS,
  type FactorKey,
  type MatchResult,
  type MatchStep,
  type PriorityKey,
  type Ranking,
  type RecentMatch,
} from "../api";
import { useSession } from "../lib/account";
import { Icon, formatDate } from "../components/ui";
import { stackFromMatch, stageStack, saveStack } from "../lib/stack";
import { toast } from "../toast";

const FACTOR_ORDER: FactorKey[] = ["fit", "quality", "value", "speed", "ease", "independence"];
const FACTOR_LABEL: Record<FactorKey, string> = {
  fit: "Fit",
  quality: "Track record",
  value: "Cost",
  speed: "Speed",
  ease: "Ease",
  independence: "Independence",
};

const EXAMPLES = [
  "Review our pull requests for security issues before launch",
  "Write a product spec and red team it",
  "Plan a Solana token launch and do due diligence",
  "Cut our support backlog and draft replies to angry customers",
  "Research competitors and write the launch newsletter",
];

const STAGES = ["Parsing the brief into jobs", "Scoring every listing on six factors", "Pricing the stack against your budget", "Writing the verdict"];

function money(n: number) {
  return n === 0 ? "Free" : `$${n}/mo`;
}

function ScoreRing({ score, size = 68, muted = false }: { score: number; size?: number; muted?: boolean }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  return (
    <span className={"score-ring" + (muted ? " muted" : "")} style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
        <circle cx="32" cy="32" r={r} className="ring-track" />
        <circle
          cx="32"
          cy="32"
          r={r}
          className="ring-value"
          strokeDasharray={`${c * pct} ${c}`}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <span className="score-ring-num">
        {Math.round(score)}
        <em>/{100}</em>
      </span>
    </span>
  );
}

function FactorList({ ranking }: { ranking: Ranking }) {
  return (
    <div className="factor-list">
      {FACTOR_ORDER.map((key) => {
        const value = Math.round(ranking.factors[key]);
        return (
          <div className="factor-row" key={key}>
            <span className="factor-name">{FACTOR_LABEL[key]}</span>
            <span className="factor-track">
              <span className="factor-fill" style={{ width: `${value}%` }} />
            </span>
            <span className="factor-val">{value}</span>
          </div>
        );
      })}
    </div>
  );
}

function StepCard({ step, index, onOpen }: { step: MatchStep; index: number; onOpen: () => void }) {
  const [altsOpen, setAltsOpen] = useState(false);
  const w = step.winner;
  return (
    <article
      className="step-card"
      style={{ animationDelay: `${index * 70}ms` }}
      aria-label={`${step.label} winner: ${w.name}`}
    >
      <div className="step-top">
        <span className="step-index">{String(index + 1).padStart(2, "0")}</span>
        <span className="step-role">{step.label}</span>
        <span className="winner-seal"><Icon name="check" size={10} strokeWidth={2.4} /> Winner</span>
      </div>

      <div className="step-main">
        <div className="step-copy">
          <Link to={`/item/${w.slug}`} className="step-name">{w.name}</Link>
          <p className="step-tagline">{w.tagline}</p>
          <div className="step-meta">
            <span className={"price-tag" + (w.price === 0 ? " free" : "")}>{money(w.price)}</span>
            <span className="meta-dot" />
            <span>{w.runtime ? (w.runtime === "ai" ? "Live model" : "Runs locally") : "Copy-ready"}</span>
            <span className="meta-dot" />
            <span>★ {w.rating.avg ? w.rating.avg.toFixed(1) : "—"} <em>({w.rating.count})</em></span>
            {w.pinned && <><span className="meta-dot" /><span className="pinned-tag">Named in brief</span></>}
          </div>
        </div>
        <div className="step-score">
          <ScoreRing score={w.score} />
          <span className="score-caption">{w.confidence}% confidence</span>
        </div>
      </div>

      <div className="step-verdict">
        <span className="verdict-label">Why this wins</span>
        <p>{step.reason}</p>
      </div>

      <FactorList ranking={w} />

      <div className="step-foot">
        <span className="delta">
          {step.runnerUp ? <>Leads {step.runnerUp.name} by <b>{step.delta}</b> pts</> : <>Only listing for this role</>}
        </span>
        <div className="step-actions">
          {step.runnerUp && (
            <button type="button" className="link-btn" onClick={() => setAltsOpen((v) => !v)} aria-expanded={altsOpen}>
              {altsOpen ? "Hide runners-up" : `Compare ${step.alternatives.length} ${step.alternatives.length === 1 ? "runner-up" : "runners-up"}`} <Icon name={altsOpen ? "chevron" : "arrow"} size={12} />
            </button>
          )}
          <button type="button" className="link-btn gold" onClick={onOpen}>Open listing <Icon name="arrowUpRight" size={12} /></button>
        </div>
      </div>

      {altsOpen && (
        <div className="step-alts">
          {step.alternatives.map((a) => {
            return (
              <div className="alt-row" key={a.slug}>
                <Link to={`/item/${a.slug}`} className="alt-name">{a.name}</Link>
                <span className="alt-score">{a.score}</span>
                <span className="alt-price">{money(a.price)}</span>
                <span className="alt-delta">−{Math.round((w.score - a.score) * 10) / 10}</span>
              </div>
            );
          })}
          <p className="alt-note">
            Score is weighted for this mission, not a universal ranking. Change the priority and the order can change.
          </p>
        </div>
      )}
      <span className="step-watch"><b>Watch out:</b> {w.watchOut}</span>
    </article>
  );
}

export default function Match() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQ = params.get("q") || "";
  const parsedBudget = Number(params.get("budget") ?? 150);
  const initialBudget = Number.isFinite(parsedBudget) ? parsedBudget : 150;
  const initialPriority = (params.get("priority") as PriorityKey) || "balanced";

  const [q, setQ] = useState(initialQ);
  const [budget, setBudget] = useState(initialBudget);
  const [priority, setPriority] = useState<PriorityKey>(PRIORITY_OPTIONS.some((p) => p.key === initialPriority) ? initialPriority : "balanced");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  const [recent, setRecent] = useState<RecentMatch[]>([]);
  const [saved, setSaved] = useState(false);
  const [savedLabel, setSavedLabel] = useState("");
  const session = useSession();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const requestId = useRef(0);

  const draft = useCallback(
    async (input?: { q: string; budget: number; priority: PriorityKey }) => {
      const payload = input || { q, budget, priority };
      if (payload.q.trim().length < 6) {
        setError("Describe the mission in a sentence — six characters minimum.");
        inputRef.current?.focus();
        return;
      }
      const id = ++requestId.current;
      setLoading(true);
      setError("");
      setStage(0);
      setSaved(false);
      try {
        const res = await runMatch({ q: payload.q.trim(), budget: payload.budget, priority: payload.priority });
        if (requestId.current !== id) return;
        setResult(res);
        const next = new URLSearchParams();
        next.set("q", res.mission.query);
        next.set("budget", String(res.mission.budget));
        next.set("priority", res.mission.priority);
        setParams(next, { replace: true });
      } catch (e: any) {
        if (requestId.current !== id) return;
        setError(e?.message || "The engine could not score that brief. Try again.");
        setResult(null);
      } finally {
        if (requestId.current === id) setLoading(false);
      }
    },
    [q, budget, priority, setParams],
  );

  useEffect(() => {
    fetchMatches().then((r) => setRecent(r.matches)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!initialQ || initialQ.trim().length < 6) return;
    // A shared link replays the deterministic verdict without recording a new
    // mission, so opening a link does not inflate the mission count.
    const id = ++requestId.current;
    setLoading(true);
    fetchMatch({ q: initialQ, budget: initialBudget, priority: initialPriority })
      .then((res) => {
        if (requestId.current !== id) return;
        setResult(res);
        const next = new URLSearchParams();
        next.set("q", res.mission.query);
        next.set("budget", String(res.mission.budget));
        next.set("priority", res.mission.priority);
        setParams(next, { replace: true });
      })
      .catch((e: any) => {
        if (requestId.current === id) setError(e?.message || "Could not replay that verdict.");
      })
      .finally(() => {
        if (requestId.current === id) setLoading(false);
      });
    // Only replay the link once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) return;
    setStage(0);
    const t = setInterval(() => setStage((s) => Math.min(STAGES.length - 1, s + 1)), 340);
    return () => clearInterval(t);
  }, [loading]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.href;
  }, [result]);

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast("Share link copied — it replays the same verdict");
    } catch {
      toast("Copy failed — select the URL from the address bar");
    }
  };

  const openStudio = () => {
    if (!result) return;
    const stack = stackFromMatch(result);
    stageStack(stack);
    navigate("/studio");
  };

  const keep = async () => {
    if (!result) return;
    const stack = stackFromMatch(result);
    if (session?.user) {
      try {
        await saveLibraryStack(stack);
        setSaved(true);
        setSavedLabel("Synced to your account");
        toast("Saved and synced to your account");
      } catch (e: any) {
        toast(e?.message || "Could not save to your account");
      }
      return;
    }
    saveStack(stack);
    setSaved(true);
    setSavedLabel("Saved in this browser");
    toast("Saved to this browser — sign in to sync everywhere");
  };

  const rerun = (p: PriorityKey) => {
    setPriority(p);
    draft({ q, budget, priority: p });
  };

  const hasResult = !!result && !loading;

  return (
    <div className="container match-page">
      <header className="match-hero">
        <span className="kicker">The match room · deterministic verdicts</span>
        <h1>Every job gets <em>a winner.</em></h1>
        <p className="match-sub">
          Describe the outcome once. The engine splits it into jobs, scores every listing on six
          factors, prices the stack against your budget, and shows the runner-up margin — so you can
          argue with the reasoning, not the vibes.
        </p>
      </header>

      <section className="brief-card" aria-label="Mission brief">
        <div className="brief-head">
          <span className="brief-label"><Icon name="spark" size={13} /> Mission brief</span>
          <span className="brief-hint">No account · no model key · deterministic</span>
        </div>
        <textarea
          ref={inputRef}
          className="brief-input"
          rows={2}
          value={q}
          maxLength={400}
          placeholder="e.g. Review our pull requests for security issues before launch"
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) draft();
          }}
          aria-label="Describe the mission"
        />
        <div className="brief-controls">
          <div className="priority-row" role="group" aria-label="Priority">
            {PRIORITY_OPTIONS.map((p) => (
              <button
                key={p.key}
                type="button"
                className={"prio-btn" + (priority === p.key ? " active" : "")}
                onClick={() => { setPriority(p.key); if (result) draft({ q, budget, priority: p.key }); }}
                title={p.hint}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="budget-field">
            <label htmlFor="budget">Monthly budget</label>
            <span className="budget-value">${budget}</span>
            <input
              id="budget"
              type="range"
              min={0}
              max={400}
              step={10}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              aria-label="Monthly budget in dollars"
            />
          </div>
          <button type="button" className="btn btn-primary draft-btn" onClick={() => draft()} disabled={loading}>
            {loading ? "Drafting…" : "Draft the stack"} <Icon name="arrow" size={15} />
          </button>
        </div>
        <div className="example-row">
          <span>Try</span>
          {EXAMPLES.slice(0, 3).map((ex) => (
            <button key={ex} type="button" className="example-chip" onClick={() => { setQ(ex); draft({ q: ex, budget, priority }); }}>
              {ex}
            </button>
          ))}
        </div>
        {error && <p className="brief-error" role="alert">{error}</p>}
      </section>

      {loading && (
        <section className="analyse-panel" aria-live="polite" aria-label="Engine progress">
          <div className="analyse-head">
            <span className="live-dot" /> <b>Engine running</b> <span>· {STAGES.length} passes</span>
          </div>
          <ol className="analyse-list">
            {STAGES.map((label, i) => (
              <li key={label} className={i < stage ? "done" : i === stage ? "active" : ""}>
                <span className="analyse-mark">{i < stage ? <Icon name="check" size={12} strokeWidth={2.4} /> : String(i + 1).padStart(2, "0")}</span>
                {label}
              </li>
            ))}
          </ol>
          <div className="analyse-bar"><span style={{ width: `${((stage + 1) / STAGES.length) * 100}%` }} /></div>
        </section>
      )}

      {!loading && !result && (
        <section className="match-idle">
          <div className="idle-card">
            <h3>How a verdict is formed</h3>
            <ol className="idle-steps">
              <li><b>Split</b> the brief into jobs — research, writing, engineering, support, risk, markets.</li>
              <li><b>Score</b> every listing on fit, track record, cost, speed, setup and independence.</li>
              <li><b>Weight</b> those six factors by your priority, then pick one winner per job.</li>
              <li><b>Audit</b> the stack against budget, coverage and the runner-up margin — gaps stay visible.</li>
            </ol>
            <p className="idle-note">
              The same brief and settings always produce the same verdict, so a shared link replays
              exactly what you saw. The full weighting table is printed with every result.
            </p>
          </div>
          <div className="idle-card recent-card">
            <h3>Recent drafts</h3>
            {recent.length === 0 ? (
              <p className="dim" style={{ fontSize: 13 }}>No missions yet. The first one is yours.</p>
            ) : (
              <ul className="recent-list">
                {recent.map((m) => (
                  <li key={m.id}>
                    <button type="button" onClick={() => { setQ(m.query); setBudget(m.budget); setPriority((m.priority as PriorityKey) || "balanced"); draft({ q: m.query, budget: m.budget, priority: (m.priority as PriorityKey) || "balanced" }); }}>
                      <span className="recent-q">{m.query}</span>
                      <span className="recent-meta">{m.winner || "—"} · {formatDate(m.created.slice(0, 10))}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {hasResult && result && (
        <div className="verdict-shell">
          <section className="verdict-bar" aria-label="Stack verdict">
            <div className="verdict-title">
              <span className="kicker small">Verdict ready</span>
              <h2>{result.steps.length} roles. {result.steps.length} winners.</h2>
              <p className="verdict-query">“{result.mission.query}”</p>
            </div>
            <div className="verdict-stats">
              <div className="vstat"><b>{result.totals.avgScore}</b><span>avg score</span></div>
              <div className="vstat"><b>{result.totals.coverage}%</b><span>coverage</span></div>
              <div className="vstat"><b>{result.totals.confidence}%</b><span>confidence</span></div>
              <div className="vstat"><b>{money(result.totals.cost)}</b><span>modelled</span></div>
            </div>
            <div className="verdict-actions">
              <button type="button" className="btn btn-primary btn-sm" onClick={openStudio}>Open in studio <Icon name="arrow" size={13} /></button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={keep}>{saved ? <><Icon name="check" size={13} /> Saved</> : <><Icon name="download" size={13} /> Save stack</>}</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={copyShare}><Icon name="share" size={13} /> Share</button>
              {saved && savedLabel && <span className="saved-caption">{savedLabel}</span>}
            </div>
          </section>

          {result.mission.note && <p className="mission-note">{result.mission.note}</p>}

          <div className="result-grid">
            <div className="stack-col">
              <div className="col-head">
                <h3>The draft</h3>
                <div className="whatif">
                  <span>Re-score as</span>
                  {PRIORITY_OPTIONS.filter((p) => p.key !== priority).slice(0, 3).map((p) => (
                    <button key={p.key} type="button" onClick={() => rerun(p.key)}>{p.label}</button>
                  ))}
                </div>
              </div>
              {result.steps.map((step, i) => (
                <StepCard key={step.role} step={step} index={i} onOpen={() => navigate(`/item/${step.winner.slug}`)} />
              ))}
              <div className="first-move">
                <span className="kicker small">Recommended first move</span>
                <p>{result.firstMove}</p>
              </div>
            </div>

            <aside className="match-aside">
              <div className="aside-card">
                <h4>Budget audit</h4>
                <div className="budget-total">
                  <b>{money(result.totals.cost)}</b>
                  <span>of ${result.mission.budget}/mo</span>
                </div>
                <div className="budget-bar">
                  <span
                    className={result.totals.withinBudget ? "ok" : "over"}
                    style={{ width: `${Math.min(100, result.mission.budget === 0 ? (result.totals.cost === 0 ? 0 : 100) : (result.totals.cost / result.mission.budget) * 100)}%` }}
                  />
                </div>
                <p className="budget-note">
                  {result.totals.withinBudget
                    ? result.totals.cost === 0
                      ? "Nothing here needs a subscription — the whole draft runs on local logic."
                      : `Leaves $${Math.max(0, result.mission.budget - result.totals.cost)}/mo of headroom.`
                    : `Over by $${result.totals.overBy}/mo even after cheaper swaps.`}
                </p>
                {result.swaps.length > 0 && (
                  <div className="swap-list">
                    <span className="swap-title">Cheaper swap modelled</span>
                    {result.swaps.map((s) => (
                      <div key={s.toSlug} className="swap-row">
                        <span>{s.fromName} → <b>{s.toName}</b></span>
                        <em>saves ${s.saves} · −{s.scoreCost} pts</em>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="aside-card">
                <h4>Risk register</h4>
                <ul className="risk-list">
                  {result.risks.length === 0 && <li className="low"><span className="risk-dot" /><span>No material risks surfaced for this brief.</span></li>}
                  {result.risks.map((r, i) => (
                    <li key={i} className={r.severity}>
                      <span className="risk-dot" />
                      <span>{r.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="aside-card audit">
                <h4>The maths</h4>
                <p className="audit-note">{result.engine.formula}</p>
                <table className="audit-table">
                  <thead><tr><th>Factor</th><th>Weight</th></tr></thead>
                  <tbody>
                    {FACTOR_ORDER.map((k) => (
                      <tr key={k}><td>{FACTOR_LABEL[k]}</td><td>{Math.round(result.mission.weights[k] * 100)}%</td></tr>
                    ))}
                  </tbody>
                </table>
                <p className="audit-foot">
                  Priority: <b>{result.mission.priorityLabel}</b> · {result.mission.roles.map((r) => r.label).join(" · ")}
                </p>
                <p className="audit-foot dim">
                  {result.evaluated} listings scored · engine {result.engine.version} · {result.engine.ms}ms
                </p>
                <p className="audit-foot">{result.mission.coverageNote}</p>
              </div>

              <div className="aside-card">
                <h4>Go further</h4>
                <div className="aside-links">
                  <Link to={`/compare?slugs=${result.steps.map((s) => s.winner.slug).slice(0, 4).join(",")}`}><Icon name="layers" size={13} /> Compare this stack side by side</Link>
                  <Link to="/studio"><Icon name="grid" size={13} /> Edit the stack in the studio</Link>
                  <Link to="/docs#match"><Icon name="book" size={13} /> Read the scoring spec</Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}

      {!result && !loading && (
        <p className="match-foot">
          Scoring runs server-side in milliseconds with no model key, no rate limit and no hidden ranking. Every factor is printed with the result.
        </p>
      )}
    </div>
  );
}
