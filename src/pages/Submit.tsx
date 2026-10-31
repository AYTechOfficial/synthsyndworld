import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { buildManifest, createListing, type Item } from "../api";
import { useSession } from "../lib/account";
import { Avatar, CATEGORY_META, Chip, CopyButton, Icon, Spinner } from "../components/ui";
import { toast } from "../toast";

const TAG_SUGGESTIONS: Record<string, string[]> = {
  agent: ["research", "engineering", "automation", "writing", "support"],
  tool: ["json", "formatting", "llm", "regex", "data"],
  prompt: ["education", "editing", "strategy", "copy", "solana"],
  skill: ["workflow", "debugging", "process", "curriculum", "data-viz"],
};

export default function Submit() {
  const [category, setCategory] = useState("agent");
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [author, setAuthor] = useState("");
  const session = useSession();
  const filled = useRef(false);
  useEffect(() => {
    if (!filled.current && session.user?.name) {
      filled.current = true;
      setAuthor(session.user.name);
    }
  }, [session.user?.name]);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<Item | null>(null);

  const preview = useMemo(() => ({ name: name || "Your listing", tagline: tagline || "A one-line promise of what this does and who it is for.", tags: tags.length ? tags : ["your", "tags"], author: author || "you" }), [name, tagline, tags, author]);

  const addTag = (t: string) => {
    const clean = t.trim().toLowerCase().replace(/^#/, "").replace(/[^a-z0-9-]/g, "-").slice(0, 24);
    if (!clean || tags.includes(clean) || tags.length >= 5) return;
    setTags([...tags, clean]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (name.trim().length < 3) errs.name = "Give it a name of at least 3 characters.";
    if (tagline.trim().length < 10) errs.tagline = "A useful tagline is at least 10 characters.";
    if (description.trim().length < 30) errs.description = "Describe the work — at least 30 characters.";
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast("Check the highlighted fields", "err");
      return;
    }
    setPosting(true);
    try {
      const res = await createListing({
        name: name.trim(),
        tagline: tagline.trim(),
        category,
        body: description.trim(),
        tags,
        author: author.trim() || "anon_builder",
        prompt: content.trim(),
      });
      setCreated(res.item);
      toast("Listing published — it is live in the catalog");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      toast(err.message || "Publishing failed", "err");
    } finally {
      setPosting(false);
    }
  };

  if (created) {
    return (
      <div className="container">
        <div className="panel success-card">
          <div className="success-icon">✓</div>
          <h1 style={{ fontSize: 32, marginBottom: 8 }}>You’re in the bazaar.</h1>
          <p className="muted" style={{ marginBottom: 22 }}>
            <b style={{ color: "var(--text)" }}>{created.name}</b> is live at <span className="mono" style={{ color: "var(--gold-bright)" }}>/item/{created.slug}</span>. It is installed by copying the manifest, and it counts real installs from this moment.
          </p>
          <div className="section" style={{ padding: 0, marginBottom: 22 }}>
            <div className="card" style={{ textAlign: "left" }}>
              <div className="card-top"><Chip category={created.category} /><span className="featured-star">v{created.version}</span></div>
              <div className="card-name">{created.name}</div>
              <div className="card-tag">{created.tagline}</div>
              <div className="card-tags">{created.tags.map((t) => <span key={t} className="tag">#{t}</span>)}</div>
              <div className="card-foot">
                <Avatar name={created.author.name} hue={created.author.hue} />
                <span className="card-author">{created.author.name}</span>
                <span className="card-meta">{created.category} · just now</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to={"/item/" + created.slug} className="btn btn-primary">View your listing <Icon name="arrow" size={14} /></Link>
            <CopyButton text={buildManifest(created)} label="Copy manifest" className="btn btn-ghost" />
            <button type="button" className="btn btn-ghost" onClick={() => { setCreated(null); setName(""); setTagline(""); setDescription(""); setContent(""); setTags([]); setAuthor(""); }}>
              Publish another
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session.ready) {
    return (
      <div className="container">
        <div className="page-head">
          <span className="kicker">Contribute</span>
          <h1>Publish a listing</h1>
          <p>Checking your account…</p>
        </div>
      </div>
    );
  }

  if (session.enabled && !session.user) {
    return (
      <div className="container">
        <div className="page-head">
          <span className="kicker">Contribute</span>
          <h1>Publish a listing</h1>
          <p>
            Publishing writes a permanent, versioned listing to Postgres signed by your handle —
            so it needs an account. Magic link, one tap, no password.
          </p>
        </div>
        <div className="signin-shell" style={{ maxWidth: 560, padding: 0 }}>
          <div className="signin-card">
            <h2 style={{ fontSize: 24, marginBottom: 8 }}>Sign in to publish</h2>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 18 }}>
              Your name goes on the listing, your reviews are attributed, and your stacks sync.
            </p>
            <Link to="/signin" className="btn btn-primary btn-lg btn-block">Sign in with a magic link <Icon name="arrow" size={14} /></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-head">
        <span className="kicker">Contribute</span>
        <h1>Publish a listing</h1>
        <p>Add a real building block to the bazaar. Be specific about what it does, show the actual prompt, and skip the hype — the catalog has no room for empty promises.</p>
      </div>

      <div className="submit-grid">
        <form onSubmit={submit} noValidate>
          <div className="panel">
            <div className="panel-title">1 · What are you publishing?</div>
            <div className="seg-tabs">
              {Object.keys(CATEGORY_META).map((key) => {
                const meta = CATEGORY_META[key];
                return (
                  <button type="button" key={key} className={"seg-tab" + (category === key ? " active" : "")} onClick={() => setCategory(key)} aria-pressed={category === key}>
                    <Icon name={meta.icon} size={18} />
                    {meta.plural}
                  </button>
                );
              })}
            </div>
            <div className="form-divider" />

            <div className="field">
              <label className="label" htmlFor="name">Name</label>
              <input id="name" className="input" placeholder="e.g. Changelog Scribe" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
              <span className="hint" style={{ color: errors.name ? "var(--red)" : undefined }}>{errors.name || "Short, memorable, no version numbers."}</span>
            </div>
            <div className="field">
              <label className="label" htmlFor="tagline">One-line promise</label>
              <input id="tagline" className="input" placeholder="What does it do, for whom, and why is it better than a blank page?" value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={160} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="hint" style={{ color: errors.tagline ? "var(--red)" : undefined }}>{errors.tagline || "10–160 characters."}</span>
                <span className="hint">{tagline.length}/160</span>
              </div>
            </div>
            <div className="field">
              <label className="label" htmlFor="description">What it is, how it works, what it does not do</label>
              <textarea id="description" className="textarea" style={{ minHeight: 150 }} placeholder="Describe the real work. Include limitations. Markdown bullets are supported." value={description} onChange={(e) => setDescription(e.target.value)} maxLength={4000} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="hint" style={{ color: errors.description ? "var(--red)" : undefined }}>{errors.description || "Specifics beat adjectives. 30–4000 characters."}</span>
                <span className="hint">{description.length}/4000</span>
              </div>
            </div>
            <div className="field">
              <label className="label" htmlFor="tags">Tags (up to 5)</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {tags.map((t) => (
                  <button type="button" key={t} className="tagchip active" onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={`Remove ${t}`}>#{t} ×</button>
                ))}
              </div>
              <input
                id="tags"
                className="input"
                placeholder="Type a tag and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag(tagInput);
                    setTagInput("");
                  }
                }}
              />
              <div className="sample-row" style={{ marginTop: 8 }}>
                {(TAG_SUGGESTIONS[category] || []).filter((t) => !tags.includes(t)).map((t) => (
                  <button type="button" key={t} className="tagchip" onClick={() => addTag(t)}>+ {t}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="panel" style={{ marginTop: 16 }}>
            <div className="panel-title">2 · The actual work</div>
            <div className="field">
              <label className="label" htmlFor="content">
                {category === "prompt" || category === "skill" ? "The full prompt / playbook" : "System prompt or usage notes"}
              </label>
              <textarea id="content" className="textarea" style={{ minHeight: 200, fontFamily: "var(--mono)", fontSize: 12.5, lineHeight: 1.7 }} placeholder={category === "prompt" ? "Paste the complete prompt. This is what people will copy." : "Paste the instruction set, setup notes, or the exact runtime contract."} value={content} onChange={(e) => setContent(e.target.value)} maxLength={20000} />
              <span className="hint">Optional, but listings with the real prompt get installed far more. There is no hidden step — what you paste is what they get.</span>
            </div>
            <div className="field">
              <label className="label" htmlFor="author">Your handle</label>
              <input id="author" className="input" placeholder="anon_builder" value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={24} />
            </div>
            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={posting}>
              {posting ? <><Spinner /> Publishing…</> : <><Icon name="plus" size={16} /> Publish to the bazaar</>}
            </button>
            <p className="hint" style={{ textAlign: "center", marginTop: 10 }}>Publishing is instant and free. It creates a real, shareable listing.</p>
          </div>
        </form>

        <aside className="preview-sticky">
          <div className="preview-label"><span className="live-dot" /> Live preview</div>
          <div className="card" style={{ transform: "none", boxShadow: "none" }}>
            <div className="card-top">
              <Chip category={category} />
              <span className="featured-star">v0.1.0</span>
            </div>
            <div className="card-name">{preview.name}</div>
            <div className="card-tag">{preview.tagline}</div>
            <div className="card-tags">{preview.tags.map((t) => <span className="tag" key={t}>#{t}</span>)}</div>
            <div className="card-foot">
              <Avatar name={preview.author} hue={(preview.author.charCodeAt(0) * 37) % 360} />
              <span className="card-author">{preview.author}</span>
              <span className="card-meta">{CATEGORY_META[category].label} · new</span>
            </div>
          </div>
          <div className="panel" style={{ marginTop: 16 }}>
            <div className="panel-title">What good looks like</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "var(--muted)", lineHeight: 1.7 }}>
              <li style={{ marginBottom: 8 }}><b style={{ color: "var(--text)" }}>Show the work.</b> Paste the real prompt or the actual logic.</li>
              <li style={{ marginBottom: 8 }}><b style={{ color: "var(--text)" }}>Name the limits.</b> What it does not do is as useful as what it does.</li>
              <li style={{ marginBottom: 8 }}><b style={{ color: "var(--text)" }}>Be specific.</b> “Cuts support replies to 90 words” beats “revolutionary”.</li>
              <li><b style={{ color: "var(--text)" }}>No promises of returns.</b> Financial-outcome claims get removed.</li>
            </ul>
          </div>
          <div className="panel" style={{ marginTop: 16 }}>
            <div className="panel-title">Publisher notes</div>
            <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>
              Listings are versioned <span className="mono">0.1.0</span> at publish time. Anyone can install, review and fork them. You keep your handle as the author.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
