import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchEvents, fetchItems, fetchMatch, fetchStats, type EventRow, type Item, type MatchResult, type Stats } from "../api";
import ItemCard from "../components/ItemCard";
import PumpButton from "../components/PumpButton";
import { Avatar, CATEGORY_META, CopyButton, Icon, TokenEmblem, formatNum, formatDate } from "../components/ui";
import { SSDY } from "../ssdy";
import { Constellation, Tilt } from "../fx";

function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 900);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{formatNum(n)}{suffix}</>;
}

function eventLabel(e: EventRow) {
  const name = e.name || e.item_slug;
  if (e.type === "publish") return <><b>{e.meta || "a builder"}</b> published <b>{name}</b></>;
  if (e.type === "review") return <><b>{e.meta || "a builder"}</b> reviewed <b>{name}</b></>;
  return <><b>{e.meta || "a builder"}</b> installed <b>{name}</b></>;
}

const STANDARDS = [
  {
    n: "01",
    title: "Show the work",
    body: "Every listing ships its real prompt or logic, a version and an author. No mystery black boxes, no scraped prompts without credit.",
    to: "/docs#catalog",
  },
  {
    n: "02",
    title: "Run before install",
    body: "Runnable listings open in a live playground. Eight deterministic tools respond instantly with no key, no cost and no rate limit.",
    to: "/run/promptforge",
  },
  {
    n: "03",
    title: "Publish in minutes",
    body: "A validated form, a live preview card and an instant shareable URL. Your work, versioned and credited from the first second.",
    to: "/submit",
  },
  {
    n: "04",
    title: "No empty promises",
    body: "No financial advice, no undisclosed promotion, no “revolutionary” without a mechanism. The catalog earns its trust listing by listing.",
    to: "/docs#publishing",
  },
];

const SHOWCASE_BRIEF = "Plan a Solana token launch and do due diligence";

export default function Home() {
  const navigate = useNavigate();
  const [mission, setMission] = useState("");
  const [preview, setPreview] = useState<MatchResult | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [trending, setTrending] = useState<Item[]>([]);
  const [fresh, setFresh] = useState<Item[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const artRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStats().then(setStats).catch(() => {});
    fetchItems({ sort: "trending", limit: 6 }).then((r) => setTrending(r.items)).catch(() => {});
    fetchItems({ sort: "new", limit: 3 }).then((r) => setFresh(r.items)).catch(() => {});
    fetchEvents().then((r) => setEvents(r.events)).catch(() => {});
    const t = setInterval(() => fetchEvents().then((r) => setEvents(r.events)).catch(() => {}), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetchMatch({ q: SHOWCASE_BRIEF, budget: 120, priority: "balanced" })
      .then(setPreview)
      .catch(() => {});
  }, []);

  const counts = stats?.categories || {};
  const ticker = useMemo(() => (events.length ? events.slice(0, 8) : []), [events]);

  const draftFromHero = (e: FormEvent) => {
    e.preventDefault();
    const q = mission.trim() || SHOWCASE_BRIEF;
    navigate(`/match?q=${encodeURIComponent(q)}&budget=150&priority=balanced`);
  };
  const rating = stats && stats.avgRating ? stats.avgRating.toFixed(1) : "4.8";
  const listingCount = stats?.items ?? 25;

  const onArtMove = (e: MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = artRef.current?.getBoundingClientRect();
    if (!box) return;
    const x = (e.clientX - box.left) / box.width - 0.5;
    const y = (e.clientY - box.top) / box.height - 0.5;
    setTilt({ x: x * 12, y: y * 9 });
  };

  return (
    <>
      {/* ── hero ───────────────────────────────────────────────────────── */}
      <section className="hero">
        <Constellation density={30} />
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="live-dot" />
              <span>Live marketplace</span>
              <span className="sep" />
              <span className="eyebrow-soft">{listingCount} curated builds</span>
            </div>
            <h1>
              The work of machines,
              <br />
              <em>curated.</em>
            </h1>
            <p className="hero-sub">
              Synthsynd World is a marketplace for AI agents, tools, prompts and skills.
              Describe the outcome you need and the match room names a winner for every job —
              <strong> scored, priced and explained.</strong>
            </p>
            <form className="hero-mission" onSubmit={draftFromHero}>
              <span className="hm-icon" aria-hidden="true"><Icon name="spark" size={15} /></span>
              <input
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                placeholder="e.g. Cut our support backlog and draft replies"
                aria-label="Describe the mission"
                maxLength={240}
              />
              <button type="submit" className="btn btn-primary btn-sm">
                Draft the stack <Icon name="arrow" size={14} />
              </button>
            </form>
            <p className="hero-mission-hint">One brief → a scored winner per role · six weighted factors · no model key</p>
            <div className="hero-cta">
              <Link to="/discover" className="btn btn-ghost btn-lg">
                Enter the bazaar <Icon name="arrow" size={15} />
              </Link>
              <PumpButton size="lg" />
            </div>
            <div className="hero-proof">
              <span><b>{stats ? <CountUp value={stats.installs} /> : "—"}</b> installs</span>
              <span className="dot-sep" aria-hidden="true" />
              <span><b>{stats ? <CountUp value={stats.runs} /> : "—"}</b> agent runs</span>
              <span className="dot-sep" aria-hidden="true" />
              <span><b>{rating}</b> average rating</span>
              <span className="dot-sep" aria-hidden="true" />
              <span><b>9</b> local runtimes</span>
              {stats?.matches ? (
                <>
                  <span className="dot-sep" aria-hidden="true" />
                  <span><b>{stats.matches}</b> missions matched</span>
                </>
              ) : null}
            </div>
          </div>

          <div className="hero-art" ref={artRef} onMouseMove={onArtMove} onMouseLeave={() => setTilt({ x: 0, y: 0 })}>
            <span className="hero-rim" aria-hidden="true" />
            <Tilt depth={5} scale={1.005} className="hero-art-tilt">
            <div
              className="hero-art-inner"
              style={{ transform: `translate3d(${tilt.x}px, ${tilt.y}px, 0)` }}
            >
              <div className="hero-glow" aria-hidden="true" />
              <div className="orbit" aria-hidden="true">
                <span className="orbit-node a" />
                <span className="orbit-node b" />
                <span className="orbit-node c" />
              </div>

              <Link to="/item/promptforge" className="console" aria-label="Open the Prompt Forge runner">
                <div className="console-bar">
                  <span className="dots" aria-hidden="true"><i /><i /><i /></span>
                  <span className="console-path">promptforge / run</span>
                  <span className="live-pill"><i /> local</span>
                </div>
                <div className="console-body">
                  <div className="console-line"><span className="cl-key">role</span><span className="cl-val">senior code reviewer</span></div>
                  <div className="console-line"><span className="cl-key">constraints</span><span className="cl-val">3 · security first</span></div>
                  <div className="console-line"><span className="cl-comment">// output contract</span></div>
                  <div className="console-out">
                    <div className="console-out-title">Generated brief</div>
                    <div><b>01</b> &nbsp;blocking issues</div>
                    <div><b>02</b> &nbsp;risks &amp; failure modes</div>
                    <div><b>03</b> &nbsp;patch-ready nits</div>
                  </div>
                  <div className="console-foot">
                    <span className="ok"><Icon name="check" size={11} /> 14ms · no key needed</span>
                    <span>v1.4.2</span>
                  </div>
                </div>
              </Link>

              <div className="float-card hero-card-build" aria-hidden="true">
                <div className="fc-label"><Icon name="spark" size={10} /> Curated this week</div>
                <div className="fc-value">{rating}<span style={{ fontFamily: "var(--font)", fontSize: 11, color: "var(--faint)", marginLeft: 6 }}>/ 5</span></div>
                <div className="fc-sub">Across {listingCount} documented listings</div>
                <div className="hero-faces">
                  <Avatar name="Synth Core" hue={158} />
                  <Avatar name="Kaito" hue={205} />
                  <Avatar name="Nova" hue={190} />
                  <span className="rating"><Icon name="star" size={9} /> {rating}</span>
                </div>
              </div>

              <a
                href={SSDY.pumpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="float-card hero-card-token"
                aria-label="Buy $SSDY on pump.fun — opens in a new tab"
              >
                <TokenEmblem size={44} />
                <div className="token-meta">
                  <div className="token-sym">$SSDY</div>
                  <div className="token-sub">Live on pump.fun</div>
                </div>
                <span className="token-arrow"><Icon name="arrowUpRight" size={15} /></span>
              </a>
            </div>
            </Tilt>
          </div>
        </div>
      </section>

      {/* ── live activity ──────────────────────────────────────────────── */}
      <div className="ticker" aria-label="Recent marketplace activity">
        <div className="ticker-track">
          {(ticker.length ? ticker : [
            { id: -1, type: "install", item_slug: "promptforge", name: "Prompt Forge", meta: "a builder", created: "2026-10-29", category: "agent" } as EventRow,
            { id: -2, type: "publish", item_slug: "release-radar", name: "Release Radar", meta: "synth_core", created: "2026-10-29", category: "agent" } as EventRow,
          ]).map((e) => (
            <span className="ticker-item" key={e.id}>
              <span className="dot" />
              {eventLabel(e)}
              <span className="tick-date">{formatDate(e.created)}</span>
            </span>
          ))}
          {(ticker.length ? ticker : []).map((e) => (
            <span className="ticker-item" key={"dup" + e.id} aria-hidden="true">
              <span className="dot" />
              {eventLabel(e)}
              <span className="tick-date">{formatDate(e.created)}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── the match room ─────────────────────────────────────────────── */}
      <section className="section section-tight">
        <div className="container">
          <div className="section-head reveal">
            <div>
              <span className="kicker">The match room</span>
              <h2>One brief in. <em>A winning stack out.</em></h2>
              <p>
                Every job gets a winner. The engine splits the brief into roles, scores every
                listing on six factors and shows the runner-up margin — so you can inspect the
                reasoning instead of trusting a black box.
              </p>
            </div>
            <Link to="/match" className="section-link">Open the match room <Icon name="arrow" size={13} /></Link>
          </div>
          {preview && preview.steps.length > 0 && (
            <div className="vp-shell reveal">
              <div className="vp-brief">
                <span className="vp-label">Live example brief</span>
                <p>“{preview.mission.query}”</p>
                <span className="vp-sub">${preview.mission.budget}/mo budget · {preview.mission.priorityLabel} priority</span>
              </div>
              <div className="vp-grid">
                {preview.steps.slice(0, 3).map((step) => (
                  <Link key={step.role} to={`/item/${step.winner.slug}`} className="vp-card">
                    <div className="vp-top">
                      <span className="vp-role">{step.label}</span>
                      <span className="vp-win">Winner</span>
                    </div>
                    <h3>{step.winner.name}</h3>
                    <p>{step.winner.tagline}</p>
                    <div className="vp-foot">
                      <span className="vp-score">{Math.round(step.winner.score)}<em>/100</em></span>
                      <span className="vp-price">{step.winner.price === 0 ? "Free" : `$${step.winner.price}/mo`}</span>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="vp-stats">
                <span><b>{preview.totals.coverage}%</b> coverage</span>
                <span><b>{preview.totals.confidence}%</b> confidence</span>
                <span><b>{preview.totals.avgScore}</b> average score</span>
                <Link to={`/match?q=${encodeURIComponent(preview.mission.query)}&budget=${preview.mission.budget}&priority=balanced`}>
                  See the full verdict <Icon name="arrow" size={12} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── trending ───────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-head reveal">
            <div>
              <span className="kicker">The collection</span>
              <h2>Trending in <em>the bazaar.</em></h2>
              <p>Ranked by installs, live runs and ratings — not by who shouted loudest.</p>
            </div>
            <Link to="/discover" className="section-link">Browse all {listingCount} <Icon name="arrow" size={13} /></Link>
          </div>
          <div className="grid reveal">
            {trending.length === 0
              ? Array.from({ length: 6 }).map((_, i) => <div className="skel" key={i} />)
              : trending.map((item) => <ItemCard key={item.slug} item={item} />)}
          </div>
        </div>
      </section>

      {/* ── categories ─────────────────────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head reveal">
            <div>
              <span className="kicker">Four disciplines</span>
              <h2>Browse by <em>kind.</em></h2>
              <p>A small, deliberate catalog. Each entry earns its place.</p>
            </div>
          </div>
          <div className="cats reveal">
            {(Object.keys(CATEGORY_META) as Array<keyof typeof CATEGORY_META>).map((key) => {
              const meta = CATEGORY_META[key];
              return (
                <Link to={"/discover?category=" + key} className="cat-card" key={key}>
                  <span className="cat-count">{counts[key] ?? 0} listings</span>
                  <span className="cat-icon" style={{ color: meta.color }}>
                    <Icon name={meta.icon} size={19} />
                  </span>
                  <h3>{meta.plural}</h3>
                  <p>{meta.blurb}</p>
                  <span className="cat-arrow" aria-hidden="true"><Icon name="arrowUpRight" size={15} /></span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── the standard ───────────────────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container standard-grid">
          <div className="standard-intro reveal">
            <span className="kicker">The standard</span>
            <h2>Curated, not <em>scraped.</em></h2>
            <p>
              The internet already has more prompts than anyone can read. What it lacks is a
              place where the work is shown, tested and versioned. That is the entire premise
              of the bazaar.
            </p>
            <Link to="/docs" className="btn btn-ghost btn-sm">
              Read the standard <Icon name="arrow" size={13} />
            </Link>
            <div className="standard-note" style={{ marginTop: 32 }}>
              <span><b>{listingCount}</b> listings</span>
              <span aria-hidden="true">·</span>
              <span><b>9</b> local runtimes</span>
              <span aria-hidden="true">·</span>
              <span>zero empty claims</span>
            </div>
            <figure className="standard-quote reveal d2">
              <span className="sq-mark" aria-hidden="true">“</span>
              <blockquote>A catalog is only as good as the work it can show.</blockquote>
              <figcaption>The Synthsynd editorial standard</figcaption>
            </figure>
          </div>
          <div className="standard-list reveal d1">
            {STANDARDS.map((s) => (
              <Link to={s.to} className="standard-row" key={s.n}>
                <span className="s-num">{s.n}</span>
                <span>
                  <span className="s-title">{s.title}</span>
                  <p className="s-body">{s.body}</p>
                </span>
                <span className="standard-arrow"><Icon name="arrowUpRight" size={16} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── $SSDY ──────────────────────────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="token-band reveal">
            <span className="token-watermark" aria-hidden="true">$SSDY</span>
            <div className="token-copy">
              <div className="token-head">
                <TokenEmblem size={58} />
                <div>
                  <span className="kicker" style={{ marginBottom: 10 }}>The token</span>
                  <h2>$SSDY is live <em>on pump.fun.</em></h2>
                </div>
              </div>
              <p>
                The creator’s token for Synthsynd World. One contract, one official page.
                The button opens the pump.fun token page directly — no redirects, no mirrors.
              </p>
              <div className="token-contract">
                <span className="tc-label">Contract</span>
                <code>{SSDY.mint}</code>
                <CopyButton text={SSDY.mint} label="Copy" silent className="tag" />
              </div>
            </div>
            <div className="token-actions">
              <PumpButton size="lg" label="Buy $SSDY on pump.fun" />
              <a
                href={`https://dexscreener.com/solana/${SSDY.mint}`}
                target="_blank"
                rel="noopener noreferrer"
                className="section-link"
              >
                View the live chart <Icon name="external" size={12} />
              </a>
              <span className="micro">
                <Icon name="shield" size={12} />
                Digital assets are volatile. Verify the contract and do your own research.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── fresh ──────────────────────────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head reveal">
            <div>
              <span className="kicker">Fresh drops</span>
              <h2>Just <em>published.</em></h2>
            </div>
            <Link to="/discover?sort=new" className="section-link">Newest first <Icon name="arrow" size={13} /></Link>
          </div>
          <div className="grid reveal">
            {fresh.length === 0
              ? Array.from({ length: 3 }).map((_, i) => <div className="skel" key={i} />)
              : fresh.map((item) => <ItemCard key={item.slug} item={item} />)}
          </div>
        </div>
      </section>

      {/* ── closing call ───────────────────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 0, paddingBottom: 96 }}>
        <div className="container">
          <div className="cta-banner reveal">
            <div>
              <span className="kicker">Open call</span>
              <h2>Put your work in <em>the bazaar.</em></h2>
              <p>
                Publishing takes two minutes. Show your prompt, your tool, or the agent that
                saved your week — the catalog is better with your work in it.
              </p>
            </div>
            <div className="cta-actions">
              <Link to="/submit" className="btn btn-primary btn-lg"><Icon name="plus" size={15} /> Publish a listing</Link>
              <Link to="/docs" className="btn btn-ghost btn-lg">Read the docs</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
