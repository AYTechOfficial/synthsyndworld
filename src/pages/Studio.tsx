import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchItems, runCompare, fetchLibrary, saveLibraryStack, deleteLibraryStack, type Item, type ServerStack } from "../api";
import { CATEGORY_META, CopyButton, Icon } from "../components/ui";
import { useSession } from "../lib/account";
import {
  deleteStack,
  loadLibrary,
  saveStack,
  stackAverageScore,
  stackCost,
  takeStagedStack,
  type SavedStack,
  type StackStep,
} from "../lib/stack";
import { toast } from "../toast";

const DEFAULT_WEIGHTS = { quality: 35, value: 15, speed: 10, ease: 10, independence: 5, depth: 25 };

function money(n: number) {
  return n === 0 ? "Free" : `$${n}/mo`;
}

function compareRowToItem(row: { name: string; slug: string; tagline: string; category: string; runtime: string | null; score: number; price: number }, i: number): StackStep {
  return {
    role: "step-" + i,
    label: row.category === "agent" ? "Agent step" : row.category === "tool" ? "Tool step" : row.category === "prompt" ? "Prompt step" : "Skill step",
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    score: row.score,
    price: row.price,
    runtime: row.runtime,
    category: row.category,
  };
}

export default function Studio() {
  const [params, setParams] = useSearchParams();
  const [steps, setSteps] = useState<StackStep[]>([]);
  const [name, setName] = useState("Untitled stack");
  const [budget, setBudget] = useState(150);
  const [catalog, setCatalog] = useState<Item[]>([]);
  const [library, setLibrary] = useState<SavedStack[]>([]);
  const [serverStacks, setServerStacks] = useState<ServerStack[]>([]);
  const [picker, setPicker] = useState<{ mode: "add" | "replace"; index?: number } | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncBusy, setSyncBusy] = useState(false);
  const session = useSession();
  const dragIndex = useRef<number | null>(null);

  useEffect(() => {
    setLibrary(loadLibrary());
    fetchItems({ limit: 60 }).then((r) => setCatalog(r.items)).catch(() => {});
    const staged = takeStagedStack();
    if (staged) {
      setSteps(staged.steps);
      setName(staged.name);
      setBudget(staged.budget || 150);
      setLoading(false);
      return;
    }
    const slugs = (params.get("s") || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (!slugs.length) {
      setLoading(false);
      return;
    }
    runCompare(slugs, DEFAULT_WEIGHTS)
      .then(({ rows }) => {
        setSteps(
          rows.map((r, i) => ({
            role: "step-" + i,
            label: r.category === "agent" ? "Agent step" : r.category === "tool" ? "Tool step" : r.category === "prompt" ? "Prompt step" : "Skill step",
            slug: r.slug,
            name: r.name,
            tagline: r.tagline,
            score: r.score,
            price: r.price,
            runtime: r.runtime,
            category: r.category,
          })),
        );
        if (params.get("name")) setName(params.get("name")!);
        if (params.get("budget")) setBudget(Number(params.get("budget")) || 150);
      })
      .catch(() => toast("Could not load that shared stack"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cost = stackCost(steps);
  const avg = stackAverageScore(steps);
  const within = cost <= budget;

  useEffect(() => {
    if (loading || !steps.length) return;
    const next = new URLSearchParams();
    next.set("s", steps.map((s) => s.slug).join(","));
    if (name !== "Untitled stack") next.set("name", name);
    next.set("budget", String(budget));
    setParams(next, { replace: true });
  }, [steps, name, budget, loading, setParams]);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= steps.length) return;
    const next = [...steps];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setSteps(next);
  };

  const remove = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
    toast("Step removed");
  };

  const addItem = (item: Item, at?: number) => {
    const step: StackStep = {
      role: "custom-" + Date.now(),
      label: CATEGORY_META[item.category]?.label || "Step",
      slug: item.slug,
      name: item.name,
      tagline: item.tagline,
      score: 0,
      price: 0,
      runtime: item.runtime,
      category: item.category,
    };
    if (at !== undefined) {
      const next = [...steps];
      next[at] = step;
      setSteps(next);
    } else {
      setSteps([...steps, step]);
    }
    setPicker(null);
    setSearch("");
    toast(at !== undefined ? "Step replaced" : "Step added");
  };

  useEffect(() => {
    if (!session?.user) return;
    fetchLibrary()
      .then((r) => setServerStacks(r.stacks))
      .catch(() => toast("Could not load your synced stacks"));
  }, [session?.user]);

  const persist = async () => {
    if (!steps.length) return;
    const stack: SavedStack = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim() || "Untitled stack",
      query: name,
      budget,
      priority: "custom",
      created: new Date().toISOString(),
      steps,
      totals: { cost, score: avg, coverage: 0, confidence: 0 },
    };
    if (session?.user) {
      setSyncBusy(true);
      try {
        const res = await saveLibraryStack(stack);
        setServerStacks((prev) => [res.stack, ...prev.filter((s) => s.id !== res.stack.id)]);
        toast("Stack synced to your account");
      } catch (e: any) {
        toast(e?.message || "Could not sync the stack");
      } finally {
        setSyncBusy(false);
      }
      return;
    }
    setLibrary(saveStack(stack));
    toast("Stack saved to this browser — sign in to sync");
  };

  const removeSaved = (id: string) => {
    setLibrary(deleteStack(id));
    toast("Saved stack deleted");
  };

  const removeServer = (id: string) => {
    deleteLibraryStack(id)
      .then(() => {
        setServerStacks((prev) => prev.filter((s) => s.id !== id));
        toast("Synced stack deleted");
      })
      .catch(() => toast("Could not delete the synced stack"));
  };

  const openSaved = (stack: SavedStack) => {
    setSteps(stack.steps);
    setName(stack.name);
    setBudget(stack.budget);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const blueprint = () =>
    JSON.stringify(
      {
        name,
        exported: new Date().toISOString(),
        budget,
        totals: { monthly_cost: cost, average_score: avg, steps: steps.length },
        steps: steps.map((s, i) => ({
          order: i + 1,
          role: s.label,
          listing: s.name,
          slug: s.slug,
          runtime: s.runtime || "reference",
          modelled_monthly_cost: s.price,
          source: `https://synthsynd.world/item/${s.slug}`,
        })),
        note: "Costs are modelled run estimates for a small team; local runtimes execute in the Worker at no cost.",
      },
      null,
      2,
    );

  const markdown = () =>
    [
      `# ${name}`,
      "",
      `**Budget:** $${budget}/mo · **Modelled cost:** ${money(cost)} · **Average match score:** ${avg}/100`,
      "",
      ...steps.map(
        (s, i) => `## ${i + 1}. ${s.label} — ${s.name}\n\n${s.tagline}\n\n- Listing: https://synthsynd.world/item/${s.slug}\n- Runtime: ${s.runtime === "ai" ? "Live model" : s.runtime ? "Local (no key)" : "Copy-ready reference"}\n- Cost: ${money(s.price)}`,
      ),
      "",
      "_Exported from Synthsynd World. Local runtimes execute in the Worker; modelled costs are estimates._",
    ].join("\n");

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast("Share link copied");
    } catch {
      toast("Copy failed — the URL is in the address bar");
    }
  };

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return catalog
      .filter((i) => !needle || (i.name + " " + i.tagline + " " + i.tags.join(" ")).toLowerCase().includes(needle))
      .slice(0, 8);
  }, [catalog, search]);

  const exportFile = (content: string, ext: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "stack"}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Downloaded ${a.download}`);
  };

  return (
    <div className="container studio-page">
      <header className="match-hero studio-hero">
        <span className="kicker">The studio · handoff, not screenshots</span>
        <h1>Reorders the work. <em>Ships the plan.</em></h1>
        <p className="match-sub">
          A winning draft becomes an editable pipeline: reorder, replace, re-price, then export a
          blueprint or a brief your team can execute. Nothing is deployed or charged.
        </p>
      </header>

      <div className="studio-toolbar">
        <input
          className="studio-name"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 70))}
          aria-label="Stack name"
        />
        <span className="studio-stats">
          <b>{steps.length}</b> steps · <b>{money(cost)}</b> modelled · <b>{avg || "—"}</b> avg score
        </span>
        <div className="studio-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={persist} disabled={!steps.length || syncBusy}><Icon name="download" size={13} /> {syncBusy ? "Syncing…" : session?.user ? "Save + sync" : "Save"}</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={share} disabled={!steps.length}><Icon name="share" size={13} /> Share</button>
          <Link to="/match" className="btn btn-primary btn-sm"><Icon name="spark" size={13} /> New draft</Link>
        </div>
      </div>

      {loading ? (
        <div className="studio-loading">Loading the stack…</div>
      ) : steps.length === 0 ? (
        <section className="studio-empty">
          <div className="empty-card">
            <h3>Start with a mission</h3>
            <p>Describe the outcome and let the match room nominate a winner for every job. The draft arrives here editable.</p>
            <Link to="/match" className="btn btn-primary btn-sm">Open the match room <Icon name="arrow" size={13} /></Link>
          </div>
          <div className="empty-card">
            <h3>Or build it by hand</h3>
            <p>Pick from the catalog — every listing has a runtime, a version and an author.</p>
            <div className="empty-picks">
              {catalog.slice(0, 5).map((item) => (
                <button key={item.slug} type="button" className="empty-pick" onClick={() => addItem(item)}>
                  <span className={"cat-dot cat-" + item.category} />
                  {item.name}
                  <Icon name="plus" size={12} />
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <div className="studio-grid">
          <div className="studio-steps">
            {steps.map((step, i) => (
              <div
                key={step.role + step.slug + i}
                className="studio-step"
                draggable
                onDragStart={() => { dragIndex.current = i; }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex.current === null) return;
                  move(dragIndex.current, i);
                  dragIndex.current = null;
                }}
              >
                <span className="drag-handle" aria-hidden="true">⋮⋮</span>
                <span className="studio-index">{String(i + 1).padStart(2, "0")}</span>
                <div className="studio-copy">
                  <span className="studio-role">{step.label}</span>
                  <Link to={`/item/${step.slug}`} className="studio-title">{step.name}</Link>
                  <p>{step.tagline}</p>
                </div>
                <span className="studio-price">{money(step.price)}</span>
                <div className="studio-row-actions">
                  <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up">↑</button>
                  <button type="button" onClick={() => move(i, i + 1)} disabled={i === steps.length - 1} aria-label="Move down">↓</button>
                  <button type="button" onClick={() => setPicker({ mode: "replace", index: i })}>Replace</button>
                  <button type="button" className="danger" onClick={() => remove(i)} aria-label="Remove step"><Icon name="close" size={12} /></button>
                </div>
              </div>
            ))}
            <button type="button" className="add-step" onClick={() => setPicker({ mode: "add" })}>
              <Icon name="plus" size={14} /> Add a step
            </button>
          </div>

          <aside className="studio-aside">
            <div className="aside-card">
              <h4>Budget</h4>
              <div className="budget-total"><b>{money(cost)}</b><span>of ${budget}/mo</span></div>
              <div className="budget-bar">
                <span className={within ? "ok" : "over"} style={{ width: `${Math.min(100, budget === 0 ? (cost ? 100 : 0) : (cost / budget) * 100)}%` }} />
              </div>
              <label className="studio-budget">
                <span>Monthly budget</span>
                <input type="number" min={0} max={2000} step={10} value={budget} onChange={(e) => setBudget(Math.max(0, Number(e.target.value) || 0))} />
              </label>
              <p className="budget-note">{within ? "Inside budget. Local runtimes cost nothing to execute." : `Over budget by $${cost - budget}/mo — replace a paid step or raise the budget.`}</p>
            </div>

            <div className="aside-card">
              <h4>Export</h4>
              <div className="export-actions">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => exportFile(blueprint(), "json", "application/json")}><Icon name="file" size={13} /> Blueprint .json</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard.writeText(markdown()).then(() => toast("Markdown brief copied")).catch(() => toast("Copy blocked")); }}><Icon name="copy" size={13} /> Copy markdown brief</button>
              </div>
              <CopyButton text={window.location.href} label="Copy share link" className="btn btn-ghost btn-sm export-copy" />
              <p className="audit-foot dim">A shared link reopens this exact order in the studio. No account needed.</p>
            </div>

            <div className="aside-card">
              <h4>Your library</h4>
              {session?.user ? (
                serverStacks.length === 0 ? (
                  <p className="dim" style={{ fontSize: 12.5 }}>No synced stacks yet. Save one and it follows you everywhere.</p>
                ) : (
                  <ul className="library-list">
                    {serverStacks.map((s) => (
                      <li key={s.id}>
                        <button type="button" className="library-open" onClick={() => openSaved({ ...(s as unknown as SavedStack) })}>
                          <b>{s.name}</b>
                          <span>{(s.steps as unknown as StackStep[]).length} steps · synced · {new Date(s.updated).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        </button>
                        <button type="button" className="library-del" onClick={() => removeServer(s.id)} aria-label={`Delete ${s.name}`}><Icon name="close" size={11} /></button>
                      </li>
                    ))}
                  </ul>
                )
              ) : (
                <>
                  <p className="sync-note">
                    <Link to="/signin">Sign in</Link> to sync stacks across devices. Saved stacks otherwise stay in this browser.
                  </p>
                  {library.length === 0 ? (
                    <p className="dim" style={{ fontSize: 12.5 }}>Saved stacks live in this browser. Nothing is uploaded.</p>
                  ) : (
                    <ul className="library-list">
                      {library.map((s) => (
                        <li key={s.id}>
                          <button type="button" className="library-open" onClick={() => openSaved(s)}>
                            <b>{s.name}</b>
                            <span>{s.steps.length} steps · {money(s.totals.cost)} · {new Date(s.created).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                          </button>
                          <button type="button" className="library-del" onClick={() => removeSaved(s.id)} aria-label={`Delete ${s.name}`}><Icon name="close" size={11} /></button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </aside>
        </div>
      )}

      {picker && (
        <div className="picker-overlay" onMouseDown={() => setPicker(null)} role="dialog" aria-modal="true" aria-label="Choose a listing">
          <div className="picker-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="picker-modal-head">
              <h4>{picker.mode === "add" ? "Add a step" : "Replace this step"}</h4>
              <button type="button" onClick={() => setPicker(null)} aria-label="Close"><Icon name="close" size={14} /></button>
            </div>
            <input
              autoFocus
              className="input"
              placeholder="Search by name, tagline or tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search the catalog"
            />
            <div className="picker-modal-list">
              {filtered.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  className="picker-modal-item"
                  onClick={() => addItem(item, picker.mode === "replace" ? picker.index : undefined)}
                >
                  <span className={"cat-dot cat-" + item.category} />
                  <span className="picker-name">{item.name}</span>
                  <span className="picker-tagline">{item.tagline}</span>
                  <span className="picker-cat">{CATEGORY_META[item.category]?.label}</span>
                </button>
              ))}
              {!filtered.length && <p className="dim picker-empty">No listing matches that.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
