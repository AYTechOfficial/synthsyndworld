import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { addReview, buildManifest, fetchItem, installItem, type Item, type Review } from "../api";
import { Avatar, Chip, CopyButton, Icon, Prose, Stars, formatDate, formatNum } from "../components/ui";
import { toast } from "../toast";
import { stageStack } from "../lib/stack";
import { useSession } from "../lib/account";

function runtimeLabel(runtime: string | null) {
  if (!runtime) return "Reference";
  if (runtime.startsWith("det:")) return "Local runner · instant";
  if (runtime === "ai") return "AI runtime";
  return runtime;
}

export default function ItemDetail({ onSearch }: { onSearch: () => void }) {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<{ item: Item; reviews: Review[]; related: Item[] } | null>(null);
  const [error, setError] = useState("");
  const [installed, setInstalled] = useState(false);
  const [busyInstall, setBusyInstall] = useState(false);

  const [reviewAuthor, setReviewAuthor] = useState("");
  const session = useSession();
  useEffect(() => {
    if (!reviewAuthor && session.user?.name) setReviewAuthor(session.user.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.user?.name]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let alive = true;
    setData(null);
    setError("");
    fetchItem(slug)
      .then((d) => alive && setData(d))
      .catch((e: any) => alive && setError(e.message || "Couldn't load this listing."));
    return () => { alive = false; };
  }, [slug]);

  const manifest = useMemo(() => (data ? buildManifest(data.item) : ""), [data]);

  const install = async () => {
    if (!data) return;
    setBusyInstall(true);
    try {
      await navigator.clipboard.writeText(manifest);
      const res = await installItem(data.item.slug);
      setInstalled(true);
      setData({ ...data, item: { ...data.item, installs: res.installs } });
      toast("Manifest copied — listing installed");
      setTimeout(() => setInstalled(false), 2500);
    } catch (e: any) {
      toast(e.message || "Install failed", "err");
    } finally {
      setBusyInstall(false);
    }
  };

  const download = () => {
    if (!data) return;
    const blob = new Blob([manifest], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.item.slug}-${data.item.version}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Manifest downloaded");
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: data?.item.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast("Link copied");
      }
    } catch { /* dismissed */ }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    if (reviewText.trim().length < 5) {
      toast("Write at least a sentence.", "err");
      return;
    }
    setPosting(true);
    try {
      const res = await addReview(data.item.slug, {
        author: reviewAuthor.trim() || session.user?.name || "anon_builder",
        rating: reviewRating,
        text: reviewText.trim(),
      });
      const review: Review = {
        id: Date.now(),
        author: reviewAuthor.trim() || session.user?.name || "anon_builder",
        rating: reviewRating,
        text: reviewText.trim(),
        created: new Date().toISOString().slice(0, 10),
      };
      setData({
        ...data,
        item: { ...data.item, rating: res.rating },
        reviews: [review, ...data.reviews],
      });
      setReviewText("");
      setReviewAuthor("");
      toast("Review posted — thank you");
    } catch (err: any) {
      toast(err.message || "Could not post review", "err");
    } finally {
      setPosting(false);
    }
  };

  if (error) {
    return (
      <div className="container" style={{ padding: "100px 24px", textAlign: "center" }}>
        <div className="kicker">Not found</div>
        <h1 style={{ fontSize: 40, marginBottom: 10 }}>{error}</h1>
        <p className="muted" style={{ marginBottom: 22 }}>The listing might have been renamed, or the link is wrong.</p>
        <Link to="/discover" className="btn btn-primary">Back to the catalog <Icon name="arrow" size={15} /></Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <div className="skel" style={{ height: 180, marginBottom: 20 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 32 }}>
          <div className="skel" style={{ height: 380 }} />
          <div className="skel" style={{ height: 260 }} />
        </div>
      </div>
    );
  }

  const { item, reviews, related } = data;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({ star, n: reviews.filter((r) => r.rating === star).length }));

  return (
    <div className="container">
      <div className="crumbs">
        <Link to="/discover">Catalog</Link>
        <Icon name="chevron" size={12} />
        <Link to={"/discover?category=" + item.category}>{item.category}</Link>
        <Icon name="chevron" size={12} />
        <span style={{ color: "var(--muted)" }}>{item.name}</span>
      </div>

      <div className="detail-head">
        <div className="detail-title-row">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              <Chip category={item.category} />
              {item.featured && <span className="featured-star"><Icon name="star" size={11} /> Featured</span>}
              <span className="tag mono" style={{ fontSize: 10.5 }}>v{item.version}</span>
              {item.model && (
                <span className="tag model-tag" title="Model answering this agent live">
                  <Icon name="spark" size={10} /> {item.model}
                </span>
              )}
            </div>
            <h1 className="detail-title">{item.name}</h1>
            <p className="detail-tagline">{item.tagline}</p>
            <div className="detail-author">
              <Avatar name={item.author.name} hue={item.author.hue} />
              <span>by <b style={{ color: "var(--text)" }}>{item.author.name}</b> · {item.author.role}</span>
              <span className="dim">·</span>
              <span>updated {formatDate(item.updated)}</span>
            </div>
          </div>
          <div className="detail-actions" style={{ marginTop: 6 }}>
            {item.runtime && (
              <Link to={"/run/" + item.slug} className="btn btn-primary">
                <Icon name="play" size={14} /> Run {item.runtime === "ai" ? "agent" : "tool"}
              </Link>
            )}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                stageStack({
                  id: "single-" + Date.now().toString(36),
                  name: "Stack starting with " + data.item.name,
                  query: "Custom stack",
                  budget: 150,
                  priority: "custom",
                  created: new Date().toISOString(),
                  steps: [{
                    role: data.item.category,
                    label: data.item.category.charAt(0).toUpperCase() + data.item.category.slice(1),
                    slug: data.item.slug,
                    name: data.item.name,
                    tagline: data.item.tagline,
                    score: 0,
                    price: 0,
                    runtime: data.item.runtime,
                    category: data.item.category,
                  }],
                  totals: { cost: 0, score: 0, coverage: 0, confidence: 0 },
                });
                navigate("/studio");
              }}
            >
              <Icon name="layers" size={14} /> Add to stack
            </button>
            <button type="button" className="btn btn-ghost" onClick={install} disabled={busyInstall}>
              <Icon name={installed ? "check" : "download"} size={14} /> {installed ? "Installed" : "Install"}
            </button>
            <button type="button" className="btn-icon btn" onClick={share} aria-label="Share listing">
              <Icon name="share" size={15} />
            </button>
          </div>
        </div>
        <div className="detail-stats">
          <div className="detail-stat"><b>{formatNum(item.installs)}</b>Installs</div>
          <div className="detail-stat"><b>{formatNum(item.runs)}</b>Runs</div>
          <div className="detail-stat"><b>{formatNum(item.views)}</b>Views</div>
          <div className="detail-stat"><b>{item.rating.count ? item.rating.avg.toFixed(1) : "—"}</b>Rating ({item.rating.count})</div>
          <div className="detail-stat"><b style={{ fontSize: 14, paddingTop: 3 }}>{runtimeLabel(item.runtime)}</b>Runtime</div>
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <Prose text={item.body} />

          {item.prompt && (
            <>
              <h2 style={{ fontSize: 21, margin: "30px 0 4px" }}>{item.category === "prompt" || item.category === "skill" ? "The full prompt" : "System prompt"}</h2>
              <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
                {item.category === "prompt" || item.category === "skill"
                  ? "Copy this into any capable model. It is the entire deliverable — no hidden steps."
                  : "This is the exact instruction set the agent sends to the model."}
              </p>
              <div className="codeblock">
                <div className="code-head">
                  <span className="dots"><i /><i /><i /></span>
                  <span>{item.slug}.prompt.txt</span>
                  <span className="spacer" />
                  <CopyButton text={item.prompt} label="Copy prompt" className="btn btn-ghost btn-sm" />
                </div>
                <pre className="code-body scroll-y">{item.prompt}</pre>
              </div>
            </>
          )}

          <h2 style={{ fontSize: 21, margin: "30px 0 4px" }}>Install manifest</h2>
          <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
            A portable, versioned description of this listing. Install copies it to your clipboard and counts the install.
          </p>
          <div className="codeblock">
            <div className="code-head">
              <span className="dots"><i /><i /><i /></span>
              <span>{item.slug}.manifest.json</span>
              <span className="spacer" />
              <CopyButton text={manifest} label="Copy" className="btn btn-ghost btn-sm" />
              <button type="button" className="btn btn-ghost btn-sm" onClick={download}>
                <Icon name="download" size={13} /> Download
              </button>
            </div>
            <pre className="code-body">{manifest}</pre>
          </div>

          <div style={{ marginTop: 34 }}>
            <div className="run-head">
              <h2 style={{ fontSize: 21 }}>Reviews</h2>
              <span className="muted" style={{ fontSize: 12.5 }}>{item.rating.count} verified builds in the wild</span>
            </div>
            <div className="review-summary">
              <div>
                <div className="rating-big">{item.rating.count ? item.rating.avg.toFixed(1) : "—"}</div>
                <Stars value={item.rating.avg} size={14} />
              </div>
              <div style={{ flex: 1, maxWidth: 260 }}>
                {distribution.map((d) => (
                  <div key={d.star} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--dim)", padding: "1px 0" }}>
                    <span style={{ width: 8 }}>{d.star}</span>
                    <Icon name="star" size={9} />
                    <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,.06)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: reviews.length ? (d.n / reviews.length) * 100 + "%" : 0, height: "100%", background: "var(--gold)" }} />
                    </div>
                    <span style={{ width: 14, textAlign: "right" }}>{d.n}</span>
                  </div>
                ))}
              </div>
            </div>

            {session.ready && !session.user && (
              <div className="panel review-gate" style={{ marginBottom: 10 }}>
                <div className="panel-title">Leave a review</div>
                <p className="muted" style={{ fontSize: 12.5, marginBottom: 12 }}>
                  Reviews are attributed and permanent, so they need an account.
                </p>
                <Link to="/signin" className="btn btn-ghost btn-sm">Sign in <Icon name="arrow" size={12} /></Link>
              </div>
            )}
            <form onSubmit={submitReview} className="panel" style={{ marginBottom: 10, display: session.ready && !session.user ? "none" : undefined }}>
              <div className="panel-title">Leave a review</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 2 }} aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button type="button" key={s} className={"star-btn" + (s <= reviewRating ? " on" : "")} onClick={() => setReviewRating(s)} aria-label={`${s} star${s > 1 ? "s" : ""}`}>★</button>
                  ))}
                </div>
                <input className="input" style={{ flex: 1, minWidth: 180, height: 38 }} placeholder="Your handle (optional)" value={reviewAuthor} onChange={(e) => setReviewAuthor(e.target.value)} maxLength={24} />
              </div>
              <textarea className="textarea" style={{ minHeight: 84 }} placeholder="What did you build with it? What worked, what didn't?" value={reviewText} onChange={(e) => setReviewText(e.target.value)} maxLength={600} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <span className="hint">{reviewText.length}/600</span>
                <button className="btn btn-primary btn-sm" type="submit" disabled={posting || reviewText.trim().length < 5}>
                  {posting ? "Posting…" : "Post review"}
                </button>
              </div>
            </form>

            {reviews.length === 0 ? (
              <p className="muted" style={{ fontSize: 13 }}>No reviews yet. Be the first to say something useful.</p>
            ) : (
              reviews.map((r) => (
                <div className="review" key={r.id}>
                  <div className="review-head">
                    <Avatar name={r.author} hue={(r.author.charCodeAt(0) * 17) % 360} />
                    <span className="review-author">{r.author}</span>
                    <Stars value={r.rating} size={11} />
                    <span className="review-date">{formatDate(r.created)}</span>
                  </div>
                  <p>{r.text}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <aside className="side-sticky">
          <div className="panel">
            <div className="panel-title">At a glance</div>
            <div className="kv"><span className="k">Version</span><span className="v mono">{item.version}</span></div>
            <div className="kv"><span className="k">Type</span><span className="v">{item.category}</span></div>
            <div className="kv"><span className="k">Runtime</span><span className="v">{runtimeLabel(item.runtime)}</span></div>
            {item.model && <div className="kv"><span className="k">Model</span><span className="v">{item.model}</span></div>}
            <div className="kv"><span className="k">Published</span><span className="v">{formatDate(item.created)}</span></div>
            <div className="kv"><span className="k">Updated</span><span className="v">{formatDate(item.updated)}</span></div>
            <div className="kv"><span className="k">Author</span><span className="v">{item.author.name}</span></div>
            <div className="form-divider" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {item.runtime && (
                <Link to={"/run/" + item.slug} className="btn btn-primary btn-block"><Icon name="play" size={14} /> Open the runner</Link>
              )}
              <CopyButton text={item.prompt || buildManifest(item)} label={item.prompt ? "Copy the prompt" : "Copy manifest"} className="btn btn-ghost btn-block" />
              <button type="button" className="btn btn-ghost btn-block" onClick={download}><Icon name="download" size={14} /> Download manifest</button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">Tags</div>
            <div className="card-tags">
              {item.tags.map((t) => (
                <Link to={"/discover?tag=" + encodeURIComponent(t)} className="tag" key={t}>#{t}</Link>
              ))}
            </div>
          </div>

          {related.length > 0 && (
            <div className="panel">
              <div className="panel-title">More {item.category}s</div>
              <div className="related-list" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {related.map((r) => (
                  <Link to={"/item/" + r.slug} key={r.slug} className="card">
                    <div className="card-name">{r.name}</div>
                    <div className="card-tag" style={{ fontSize: 12.5 }}>{r.tagline}</div>
                    <div className="card-meta" style={{ marginLeft: 0 }}>
                      <span className="meta-item"><Icon name="download" size={11} /> {formatNum(r.installs)}</span>
                      <span className="rating-inline"><Icon name="star" size={10} /> {r.rating.avg.toFixed(1)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="panel" style={{ background: "rgba(216,185,124,.035)", borderColor: "rgba(216,185,124,.16)" }}>
            <div className="panel-title">Found an issue?</div>
            <p className="muted" style={{ fontSize: 12.5, marginBottom: 10 }}>Every listing is versioned. If the prompt or manifest is wrong, tell the author with a review above.</p>
            <Link to="/docs#publishing" className="section-link" style={{ fontSize: 12.5 }}>Publishing guidelines <Icon name="arrow" size={12} /></Link>
          </div>
          <button type="button" onClick={onSearch} className="section-link" style={{ background: "none", border: 0, paddingLeft: 0 }}>
            <Icon name="search" size={13} /> Search the bazaar <kbd>Ctrl K</kbd>
          </button>
        </aside>
      </div>
    </div>
  );
}
