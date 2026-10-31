import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchItem, runAgent, type Item, type RunResult } from "../api";
import { Avatar, Chip, CopyButton, Icon, Spinner } from "../components/ui";
import { toast } from "../toast";

export default function Run() {
  const { slug = "" } = useParams();
  const [item, setItem] = useState<Item | null>(null);
  const [error, setError] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [shown, setShown] = useState("");
  const [runError, setRunError] = useState("");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetchItem(slug)
      .then((d) => {
        if (!alive) return;
        setItem(d.item);
        const init: Record<string, string> = {};
        for (const f of d.item.inputSchema) init[f.key] = f.defaultValue || "";
        setValues(init);
      })
      .catch((e: any) => alive && setError(e.message || "Couldn't load this listing."));
    return () => { alive = false; };
  }, [slug]);

  useEffect(() => {
    if (!result) { setShown(""); return; }
    setShown("");
    let i = 0;
    const full = result.out;
    const step = Math.max(24, Math.ceil(full.length / 90));
    const id = window.setInterval(() => {
      i = Math.min(full.length, i + step);
      setShown(full.slice(0, i));
      if (i >= full.length) window.clearInterval(id);
    }, 14);
    timerRef.current = id;
    return () => window.clearInterval(id);
  }, [result]);

  const run = async () => {
    if (!item || running) return;
    if (result) setResult(null);
    setRunError("");
    setRunning(true);
    try {
      const res = await runAgent(item.slug, values);
      setResult(res);
      setItem({ ...item, runs: res.runs });
    } catch (e: any) {
      setRunError(e.message || "Run failed.");
      toast(e.message || "Run failed", "err");
    } finally {
      setRunning(false);
    }
  };

  if (error) {
    return (
      <div className="container" style={{ padding: "100px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: 36, marginBottom: 10 }}>{error}</h1>
        <Link to="/discover" className="btn btn-primary">Back to the catalog</Link>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <div className="skel" style={{ height: 120, marginBottom: 20 }} />
        <div className="run-grid">
          <div className="skel" style={{ height: 380 }} />
          <div className="skel" style={{ height: 460 }} />
        </div>
      </div>
    );
  }

  const runnable = !!item.runtime;
  const modeClass = result?.mode === "preview" ? "mode-preview" : result?.mode === "ai" ? "mode-ai" : "mode-deterministic";

  return (
    <div className="container">
      <div className="crumbs">
        <Link to="/discover">Catalog</Link>
        <Icon name="chevron" size={12} />
        <Link to={"/item/" + item.slug}>{item.name}</Link>
        <Icon name="chevron" size={12} />
        <span style={{ color: "var(--muted)" }}>Runner</span>
      </div>

      <div className="page-head" style={{ paddingBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <Chip category={item.category} />
          <span className="tag mono" style={{ fontSize: 10.5 }}>v{item.version}</span>
          <span className="tag" style={{ color: "var(--sage)" }}>
            <Icon name="bolt" size={10} /> {item.runtime?.startsWith("det:") ? "Local runtime · no key needed" : item.runtime === "ai" ? "Live model" : "Reference only"}
          </span>
          {item.model && (
            <span className="tag model-tag" title="Model answering this agent">
              <Icon name="spark" size={10} /> {item.model}
            </span>
          )}
        </div>
        <h1 style={{ fontSize: "clamp(30px, 4vw, 44px)" }}>{item.name} <span style={{ color: "var(--dim)", fontFamily: "var(--mono)", fontSize: 18, fontWeight: 400 }}>/ runner</span></h1>
        <p style={{ marginTop: 8 }}>{item.tagline}</p>
        <div className="detail-author" style={{ marginTop: 12 }}>
          <Avatar name={item.author.name} hue={item.author.hue} />
          <span>by <b style={{ color: "var(--text)" }}>{item.author.name}</b></span>
          <span className="dim">·</span>
          <span>{item.runs.toLocaleString()} runs</span>
          <span className="dim">·</span>
          <Link to={"/item/" + item.slug} style={{ color: "var(--gold-bright)" }}>view listing</Link>
        </div>
      </div>

      {!runnable ? (
        <div className="panel" style={{ maxWidth: 720, margin: "10px 0 40px" }}>
          <div className="panel-title">Reference material</div>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            {item.category === "prompt" || item.category === "skill"
              ? "This is a prompt/skill, not a hosted runtime. Copy it into any capable model — that is the whole point."
              : "This listing does not expose a runtime. Use the manifest and prompt below to wire it up yourself."}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <CopyButton text={item.prompt || ""} label="Copy the prompt" className="btn btn-primary" />
            <Link to={"/item/" + item.slug} className="btn btn-ghost">Full listing</Link>
          </div>
          {item.prompt && (
            <div className="codeblock" style={{ marginTop: 18 }}>
              <div className="code-head"><span className="dots"><i /><i /><i /></span><span>{item.slug}.prompt.txt</span></div>
              <pre className="code-body">{item.prompt}</pre>
            </div>
          )}
        </div>
      ) : (
        <div className="run-grid">
          <div className="panel">
            <div className="panel-title">Input</div>
            <form
              onSubmit={(e) => { e.preventDefault(); run(); }}
              onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); run(); } }}
            >
              {item.inputSchema.map((f) => (
                <div className="field" key={f.key}>
                  <label className="label" htmlFor={"f-" + f.key}>{f.label}</label>
                  {f.type === "textarea" ? (
                    <textarea
                      id={"f-" + f.key}
                      className="textarea"
                      placeholder={f.placeholder}
                      value={values[f.key] || ""}
                      onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                      rows={6}
                    />
                  ) : (
                    <input
                      id={"f-" + f.key}
                      className="input"
                      placeholder={f.placeholder}
                      value={values[f.key] || ""}
                      onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                    />
                  )}
                </div>
              ))}
              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={running} style={{ marginTop: 6 }}>
                {running ? <><Spinner /> Running…</> : <><Icon name="play" size={15} /> Run {item.category === "agent" ? "agent" : "tool"}</>}
              </button>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <span className="hint">Ctrl/⌘ + Enter to run</span>
                <button
                  type="button"
                  className="hint"
                  style={{ background: "none", border: 0, color: "var(--dim)", display: "inline-flex", alignItems: "center", gap: 5 }}
                  onClick={() => {
                    const init: Record<string, string> = {};
                    for (const f of item.inputSchema) init[f.key] = f.defaultValue || "";
                    setValues(init);
                    setResult(null);
                    setRunError("");
                  }}
                >
                  <Icon name="refresh" size={12} /> Reset example
                </button>
              </div>
            </form>
            {item.runtime === "ai" && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
                <p className="hint" style={{ margin: 0 }}>
                  This agent is answered live by the model shown above, chosen for this task. Requests run in real time and usually take a few seconds.
                </p>
              </div>
            )}
          </div>

          <div>
            <div className="run-head">
              <div className="run-meta">
                <span className="mode-badge mode-deterministic">output</span>
                {result && <span className={"mode-badge " + modeClass}>{result.mode === "preview" ? "preview" : result.mode === "ai" ? "live ai" : "local"}</span>}
                {result && <span>{result.out.length.toLocaleString()} chars</span>}
                {result && <span>· {result.ms}ms</span>}
              </div>
              {result && <CopyButton text={result.out} label="Copy output" className="btn btn-ghost btn-sm" />}
            </div>
            <div className="output-panel">
              <div className="output-head">
                <span className="dots"><i /><i /><i /></span>
                <span>{item.slug} — stdout</span>
                <span className="right">
                  {result?.model && <span className="model-credit">Response by <b>{result.model}</b></span>}
                  {item.runs > 0 && <span>{item.runs.toLocaleString()} runs</span>}
                  <span className="live-dot" style={{ background: running ? "var(--orange)" : "var(--sage)" }} />
                </span>
              </div>
              {running ? (
                <div className="output-empty">
                  <span className="big"><Spinner size={30} /></span>
                  <span>Executing {item.slug}…</span>
                </div>
              ) : runError ? (
                <div className="output-empty">
                  <span className="big">⚠</span>
                  <span style={{ color: "var(--orange)" }}>{runError}</span>
                  <span>Adjust the input and try again.</span>
                </div>
              ) : result ? (
                <>
                  {result.note && (
                    <div style={{ margin: "12px 16px 0", padding: "9px 12px", borderRadius: 9, background: "rgba(223,179,138,.07)", border: "1px solid rgba(223,179,138,.24)", color: "var(--orange)", fontSize: 12 }}>
                      <Icon name="bolt" size={12} /> {result.note}
                    </div>
                  )}
                  <pre className="output-body">{shown}<span className="caret" /></pre>
                </>
              ) : (
                <div className="output-empty">
                  <span className="big"><Icon name="terminal" size={36} /></span>
                  <span>Output appears here.</span>
                  <span style={{ fontSize: 12 }}>Press <b style={{ color: "var(--text)" }}>Run</b> to execute with the inputs on the left.</span>
                  <span className="hint" style={{ marginTop: 8 }}>
                    {item.runtime === "ai" ? "A live model answers in real time; the response is credited to the model." : "Deterministic tools respond instantly with no API key."}
                  </span>
                </div>
              )}
            </div>
            <div className="panel" style={{ marginTop: 14 }}>
              <div className="panel-title">About this runner</div>
              <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>
                {item.body.split("\n")[0]}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
