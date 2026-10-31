import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { fetchItems, type Item } from "./api";
import { useSession, signOut } from "./lib/account";
import SignIn from "./pages/SignIn";
import { Icon, Logo, Chip, CopyButton, TokenEmblem, type IconName } from "./components/ui";
import PumpButton from "./components/PumpButton";
import { SSDY } from "./ssdy";
import { Toaster } from "./toast";
import { BootGate, CursorAura, RouteFadeKey } from "./fx";
import Home from "./pages/Home";
import Match from "./pages/Match";
import Compare from "./pages/Compare";
import Studio from "./pages/Studio";
import Discover from "./pages/Discover";
import ItemDetail from "./pages/ItemDetail";
import Submit from "./pages/Submit";
import Run from "./pages/Run";
import Docs from "./pages/Docs";

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" });
        return;
      }
      const t = window.setTimeout(() => {
        document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" });
      }, 80);
      return () => window.clearTimeout(t);
    }
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, hash]);
  return null;
}

function NotFound() {
  return (
    <div className="container" style={{ padding: "128px 24px", textAlign: "center" }}>
      <div className="kicker" style={{ justifyContent: "center" }}>404</div>
      <h1 style={{ fontSize: 56, marginBottom: 16 }}>This page wandered off.</h1>
      <p className="muted" style={{ marginBottom: 28, maxWidth: 480, marginInline: "auto" }}>
        The listing may have moved, or the link was never real. The bazaar is still open.
      </p>
      <Link to="/discover" className="btn btn-primary">Browse the bazaar <Icon name="arrow" size={15} /></Link>
    </div>
  );
}

interface PaletteEntry {
  label: string;
  sub?: string;
  path: string;
  category?: string;
  icon: IconName;
  external?: boolean;
}

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const loaded = useRef(false);

  useEffect(() => {
    if (!open) {
      setQ("");
      setActive(0);
      return;
    }
    setTimeout(() => inputRef.current?.focus(), 30);
    if (!loaded.current) {
      loaded.current = true;
      fetchItems({ limit: 60 })
        .then((r) => setItems(r.items))
        .catch(() => setItems([]));
    }
  }, [open]);

  const entries: PaletteEntry[] = useMemo(() => {
    const pages: PaletteEntry[] = [
      { label: "Draft a stack from a mission", path: "/match", icon: "spark", sub: "Match room" },
      { label: "Compare finalists side by side", path: "/compare", icon: "layers", sub: "Arena" },
      { label: "Edit a stack and export it", path: "/studio", icon: "grid", sub: "Studio" },
      { label: "Browse the whole bazaar", path: "/discover", icon: "search", sub: "Discover" },
      { label: "Publish a listing", path: "/submit", icon: "plus", sub: "Contribute" },
      { label: "Read the documentation", path: "/docs", icon: "book", sub: "Reference" },
      { label: "Open Prompt Forge", path: "/run/promptforge", icon: "terminal", sub: "Run instantly" },
      { label: "Buy $SSDY on pump.fun", path: SSDY.pumpUrl, icon: "pump", sub: "Token", external: true },
    ];
    const list: PaletteEntry[] = items.map((it) => ({
      label: it.name,
      sub: it.tagline,
      path: "/item/" + it.slug,
      category: it.category,
      icon: "search",
    }));
    const needle = q.trim().toLowerCase();
    const filtered = needle
      ? list.filter((e) => (e.label + " " + (e.sub || "") + " " + (e.category || "")).toLowerCase().includes(needle))
      : list.slice(0, 6);
    const filteredPages = needle
      ? pages.filter((e) => e.label.toLowerCase().includes(needle))
      : pages;
    return needle ? [...filtered, ...filteredPages] : [...pages, ...filtered];
  }, [items, q]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  const go = useCallback(
    (entry?: PaletteEntry) => {
      const target = entry || entries[active];
      if (!target) return;
      onClose();
      if (target.external) {
        window.open(target.path, "_blank", "noopener,noreferrer");
        return;
      }
      navigate(target.path);
    },
    [entries, active, onClose, navigate],
  );

  if (!open) return null;

  return (
    <div className="palette-overlay" onMouseDown={onClose} role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="palette" onMouseDown={(e) => e.stopPropagation()}>
        <div className="palette-input">
          <Icon name="search" size={17} />
          <input
            ref={inputRef}
            value={q}
            placeholder="Search listings, pages, actions…"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(entries.length - 1, a + 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
              else if (e.key === "Enter") { e.preventDefault(); go(); }
              else if (e.key === "Escape") { onClose(); }
            }}
            aria-label="Search"
          />
          <kbd>ESC</kbd>
        </div>
        <div className="palette-list">
          {entries.length === 0 && <div style={{ padding: 32, textAlign: "center", color: "var(--dim)", fontSize: 12.5 }}>No matches. Try a category like “prompt”.</div>}
          {entries.map((e, i) => (
            <div
              key={e.path + e.label + i}
              className={"palette-item" + (i === active ? " active" : "")}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(e)}
              role="button"
              tabIndex={-1}
            >
              <span className="ic">
                {e.category ? <Chip category={e.category} /> : <Icon name={e.icon} size={14} />}
              </span>
              <span>{e.label}</span>
              {e.sub && <span className="slug">{e.sub.length > 46 ? e.sub.slice(0, 46) + "…" : e.sub}</span>}
            </div>
          ))}
        </div>
        <div className="palette-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>esc</kbd> close</span>
          <span style={{ marginLeft: "auto" }}>{entries.length} results</span>
        </div>
      </div>
    </div>
  );
}

function AccountMenu({ location }: { location: ReturnType<typeof useLocation> }) {
  const session = useSession();
  const [open, setOpen] = useState(false);
  if (!session.ready) return <span className="acct-skel" aria-hidden="true" />;
  if (!session.user) {
    return (
      <Link
        to={{ pathname: "/signin", search: location.pathname !== "/" && location.pathname !== "/signin" ? "?next=" + encodeURIComponent(location.pathname + location.search) : "" }}
        className="btn btn-ghost btn-sm"
      >
        <Icon name="users" size={13} /> Sign in
      </Link>
    );
  }
  const initial = (session.user.name || session.user.email || "S").slice(0, 1).toUpperCase();
  return (
    <div className="acct">
      <button
        type="button"
        className="acct-btn"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <span className="acct-initial">{initial}</span>
        <Icon name="chevron" size={10} />
      </button>
      {open && (
        <div className="acct-menu" role="menu">
          <div className="acct-head">
            <b>{session.user.name}</b>
            {session.user.email && <span>{session.user.email}</span>}
          </div>
          <Link to="/studio" onClick={() => setOpen(false)} role="menuitem">
            <span>My stacks</span>
            <em className="synced">Synced</em>
          </Link>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); signOut(); }}>
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <ScrollToTop />
      <div className="grain" aria-hidden="true" />

      <header className="nav">
        <div className="container nav-inner">
          <Link to="/" className="brand" aria-label="Synthsynd World home">
            <Logo size={30} />
            <span className="brand-word">
              <span className="brand-name">SYNTHSYND</span>
              <span className="brand-sub">World</span>
            </span>
          </Link>
          <nav className="nav-links" aria-label="Main">
            <NavLink to="/match" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>Match</NavLink>
            <NavLink to="/discover" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>Bazaar</NavLink>
            <NavLink to="/compare" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>Compare</NavLink>
            <NavLink to="/studio" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>Studio</NavLink>
            <NavLink to="/docs" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>Docs</NavLink>
          </nav>
          <div className="nav-spacer" />
          <div className="nav-actions">
            <button type="button" className="searchbtn" onClick={() => setPaletteOpen(true)} aria-label="Search (Control K)">
              <Icon name="search" size={14} />
              <span className="search-label">Search</span>
              <kbd>Ctrl K</kbd>
            </button>
            <PumpButton size="sm" label="Buy $SSDY" mobileLabel="$SSDY" />
            <AccountMenu location={location} />
            <Link to="/submit" className="btn btn-primary btn-sm">
              <Icon name="plus" size={13} strokeWidth={2} /> Publish
            </Link>
            <button type="button" className="burger" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu" aria-expanded={menuOpen}>
              <Icon name={menuOpen ? "close" : "menu"} size={17} />
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="mobile-menu">
            <div className="mm-links">
              <button
                type="button"
                className="mm-search"
                onClick={() => {
                  setMenuOpen(false);
                  setPaletteOpen(true);
                }}
              >
                Search the bazaar <span>Ctrl K</span>
              </button>
              <Link to="/match">Match room <span>Goal to winner stack</span></Link>
              <Link to="/discover">Bazaar <span>Curated catalog</span></Link>
              <Link to="/compare">Compare <span>Weighted verdict</span></Link>
              <Link to="/studio">Studio <span>Edit and export</span></Link>
              <Link to="/docs">Documentation <span>How it works</span></Link>
            </div>
            <div className="mm-actions">
              <Link to="/submit" className="btn btn-primary btn-sm"><Icon name="plus" size={13} /> Publish a listing</Link>
              <PumpButton size="sm" label="Buy $SSDY on pump.fun" />
            </div>
          </div>
        )}
      </header>

      <main>
        <RouteFadeKey location={location.pathname}>
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/match" element={<Match />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/item/:slug" element={<ItemDetail onSearch={() => setPaletteOpen(true)} />} />
          <Route path="/run/:slug" element={<Run />} />
          <Route path="/submit" element={<Submit />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="*" element={<NotFound />} />
          </Routes>
        </RouteFadeKey>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-token">
            <div className="ft-left">
              <TokenEmblem size={42} />
              <div>
                <div className="ft-name">$SSDY <em>on pump.fun</em></div>
                <div className="ft-sub">The creator’s token · Solana</div>
              </div>
            </div>
            <div className="ft-right">
              <span className="ft-contract">
                <span className="ft-contract-label">CA</span>
                <code className="ca-full" title={SSDY.mint}>{SSDY.mint}</code>
                <code className="ca-short" title={SSDY.mint}>{SSDY.mintShort}</code>
                <CopyButton text={SSDY.mint} label="Copy" silent className="tag" />
              </span>
              <PumpButton size="sm" label="Creator’s $SSDY on pump.fun" />
            </div>
          </div>

          <div className="footer-top">
            <div className="footer-brand">
              <Link to="/" className="brand" aria-label="Synthsynd World home">
                <Logo size={26} />
                <span className="brand-word">
                  <span className="brand-name">SYNTHSYND</span>
                  <span className="brand-sub">World</span>
                </span>
              </Link>
              <p>
                A curated marketplace for the building blocks of AI work — agents, tools, prompts and
                skills. Every listing is documented, versioned and demonstrable before you install it.
              </p>
              <Link to="/submit" className="section-link"><span>Publish your work</span> <Icon name="arrow" size={13} /></Link>
            </div>
            <div className="footer-links">
              <div className="footer-col">
                <h4>Explore</h4>
                <Link to="/discover">All listings</Link>
                <Link to="/discover?category=agent">Agents</Link>
                <Link to="/discover?category=tool">Tools</Link>
                <Link to="/discover?category=prompt">Prompts</Link>
                <Link to="/discover?category=skill">Skills</Link>
              </div>
              <div className="footer-col">
                <h4>Build</h4>
                <Link to="/match">Match room</Link>
                <Link to="/compare">Compare arena</Link>
                <Link to="/studio">Stack studio</Link>
                <Link to="/submit">Publish a listing</Link>
                <Link to="/docs">Documentation</Link>
                <Link to="/docs#api">API reference</Link>
                <Link to="/run/promptforge">Prompt Forge</Link>
              </div>
              <div className="footer-col">
                <h4>Token</h4>
                <a href={SSDY.pumpUrl} target="_blank" rel="noopener noreferrer">pump.fun <Icon name="external" size={10} /></a>
                <a href={`https://dexscreener.com/solana/${SSDY.mint}`} target="_blank" rel="noopener noreferrer">DexScreener <Icon name="external" size={10} /></a>
                <a href={`https://solscan.io/token/${SSDY.mint}`} target="_blank" rel="noopener noreferrer">Solscan <Icon name="external" size={10} /></a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("The agent bazaar — $SSDY is live on pump.fun")}&url=${encodeURIComponent(SSDY.pumpUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Share on X <Icon name="external" size={10} />
                </a>
              </div>
            </div>
          </div>

          <p className="footer-disclaimer">
            <b>$SSDY is a community token launched on pump.fun.</b> Nothing on this site is financial
            advice, an offer, or a promise of return. Digital assets are volatile and you can lose
            everything you put in. Always verify the contract address above and do your own research
            before trading. The creator’s official token page is linked directly from this site.
          </p>

          <div className="footer-bottom">
            <span>© 2026 Synthsynd World. Built in the open for the Synthsynd bounty.</span>
            <span className="fb-meta">
              <span><span className="live-dot" /> Marketplace live</span>
              <span>v1.0.0</span>
              <span>Solana</span>
            </span>
          </div>
        </div>
      </footer>

      <BootGate />
      <CursorAura />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <Toaster />
    </>
  );
}
