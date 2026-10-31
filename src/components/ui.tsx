import React, { useId, useState } from "react";
import { toast } from "../toast";

/* ── brand mark ─────────────────────────────────────────────────────────── */

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id="markGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6e7c6" />
          <stop offset="0.48" stopColor="#d8b97c" />
          <stop offset="1" stopColor="#9c7a45" />
        </linearGradient>
      </defs>
      <path
        d="M20 3.6 34 11.7v16.6L20 36.4 6 28.3V11.7z"
        fill="none"
        stroke="url(#markGold)"
        strokeWidth="1"
        strokeOpacity="0.5"
        strokeLinejoin="round"
      />
      <path
        d="M20 9.4 29.2 20 20 30.6 10.8 20z"
        fill="none"
        stroke="url(#markGold)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M20 9.4v21.2M10.8 20h18.4" stroke="#f6e7c6" strokeOpacity="0.22" strokeWidth="0.8" />
      <circle cx="20" cy="20" r="2.3" fill="url(#markGold)" />
      <circle cx="20" cy="3.6" r="1.15" fill="#f6e7c6" />
      <circle cx="34" cy="28.3" r="1.15" fill="#d8b97c" />
      <circle cx="6" cy="28.3" r="1.15" fill="#9c7a45" />
    </svg>
  );
}

/** A larger token emblem used in the hero capsule and token band. */
export function TokenEmblem({ size = 64, className = "" }: { size?: number; className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg
      className={"token-emblem " + className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={"rim" + id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f8eacb" />
          <stop offset="0.45" stopColor="#d8b97c" />
          <stop offset="1" stopColor="#8b6a3c" />
        </linearGradient>
        <linearGradient id={"face" + id} x1="0" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#2a2419" />
          <stop offset="0.55" stopColor="#14120e" />
          <stop offset="1" stopColor="#0a0908" />
        </linearGradient>
        <linearGradient id={"gem" + id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbf0d8" />
          <stop offset="0.42" stopColor="#e2c48d" />
          <stop offset="1" stopColor="#a9824c" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30.5" fill={"url(#face" + id + ")"} stroke={"url(#rim" + id + ")"} strokeWidth="1.4" />
      <circle cx="32" cy="32" r="26.6" fill="none" stroke="#e8d4ac" strokeOpacity="0.2" strokeWidth="0.8" />
      <circle cx="32" cy="32" r="22.4" fill="none" stroke="#e8d4ac" strokeOpacity="0.12" strokeWidth="0.8" strokeDasharray="1 3" />
      <path
        d="M32 13.2 44.4 32 32 50.8 19.6 32z"
        fill={"url(#gem" + id + ")"}
        fillOpacity="0.14"
        stroke={"url(#gem" + id + ")"}
        strokeWidth="1.15"
        strokeLinejoin="round"
      />
      <path d="M32 13.2v37.6M19.6 32h24.8" stroke="#f6e7c6" strokeOpacity="0.28" strokeWidth="0.7" />
      <circle cx="32" cy="32" r="3" fill={"url(#gem" + id + ")"} />
      <circle cx="32" cy="32" r="6.4" fill="none" stroke="#f6e7c6" strokeOpacity="0.22" strokeWidth="0.7" />
    </svg>
  );
}

/* ── icons ──────────────────────────────────────────────────────────────── */

export type IconName =
  | "search" | "arrow" | "plus" | "copy" | "check" | "play" | "download" | "star"
  | "terminal" | "spark" | "grid" | "file" | "wrench" | "book" | "menu" | "close"
  | "external" | "bolt" | "users" | "clock" | "chevron" | "share" | "refresh" | "cube"
  | "pump" | "shield" | "layers" | "arrowUpRight" | "globe";

const PATHS: Record<IconName, React.ReactNode> = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  copy: <><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>,
  check: <path d="m5 12 5 5L20 6" />,
  play: <path d="M7 4.5v15l13-7.5z" />,
  download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
  star: <path d="m12 3 2.7 5.7 6.3.8-4.6 4.4 1.2 6.3L12 17.3 6.4 20.2l1.2-6.3L3 9.5l6.3-.8z" />,
  terminal: <><path d="m5 7 5 5-5 5" /><path d="M12 17h7" /></>,
  spark: <><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /><path d="m5 5 2.5 2.5M16.5 16.5 19 19M19 5l-2.5 2.5M7.5 16.5 5 19" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  file: <><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v5h5" /><path d="M9 13h6M9 17h6" /></>,
  wrench: <path d="M14.7 6.3a4.5 4.5 0 0 0-6 6L3 18v3h3l5.7-5.7a4.5 4.5 0 0 0 6-6l-3 3-3-3z" />,
  book: <><path d="M4 4h7a3 3 0 0 1 3 3v14a2.5 2.5 0 0 0-2.5-2.5H4z" /><path d="M20 4h-3a3 3 0 0 0-3 3v14a2.5 2.5 0 0 1 2.5-2.5H20z" /></>,
  menu: <><path d="M4 8h16M4 16h16" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  external: <><path d="M14 3h7v7" /><path d="M21 3 11 13" /><path d="M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" /></>,
  bolt: <path d="M13 2 4 14h6l-1 8 9-12h-6z" />,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 5a3.5 3.5 0 0 1 0 7" /><path d="M18 14a6 6 0 0 1 3.5 6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  chevron: <path d="m6 9 6 6 6-6" />,
  share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.7 10.7 6.6-4.4M8.7 13.3l6.6 4.4" /></>,
  refresh: <><path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" /><path d="M4 3v5h5" /><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16" /><path d="M20 21v-5h-5" /></>,
  cube: <><path d="m12 2 9 5v10l-9 5-9-5V7z" /><path d="m3 7 9 5 9-5M12 12v10" /></>,
  pump: <><path d="M3 17.5 8.5 12l3.6 3.6L20 7.5" /><path d="M14.5 7.5H20V13" /><path d="M3 21h18" /></>,
  shield: <><path d="M12 2.8 20 6v5.6c0 5-3.4 8.3-8 9.6-4.6-1.3-8-4.6-8-9.6V6z" /><path d="m8.7 12 2.3 2.3 4.4-4.5" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5z" /><path d="m4 13 8 4.5L20 13" /><path d="m4 17 8 4.5L20 17" /></>,
  arrowUpRight: <><path d="M7 17 17 7" /><path d="M8 7h9v9" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3.5 9h17M3.5 15h17" /><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z" /></>,
};

export function Icon({ name, size = 18, strokeWidth = 1.7 }: { name: IconName; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
      {PATHS[name]}
    </svg>
  );
}

/* ── shared primitives ──────────────────────────────────────────────────── */

export const CATEGORY_META: Record<string, { label: string; plural: string; icon: IconName; color: string; blurb: string }> = {
  agent: { label: "Agent", plural: "Agents", icon: "spark", color: "var(--gold-bright)", blurb: "Autonomous workers with a defined job." },
  tool: { label: "Tool", plural: "Tools", icon: "wrench", color: "var(--platinum)", blurb: "Precise utilities that remove friction." },
  prompt: { label: "Prompt", plural: "Prompts", icon: "file", color: "var(--mauve)", blurb: "Tested instructions you can use today." },
  skill: { label: "Skill", plural: "Skills", icon: "book", color: "var(--sage)", blurb: "Playbooks your team can adopt." },
};

export function Chip({ category }: { category: string }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.agent;
  return (
    <span className={"chip chip-" + category}>
      <Icon name={meta.icon} size={10.5} strokeWidth={1.9} />
      {meta.label}
    </span>
  );
}

export function Avatar({ name, hue, size }: { name: string; hue: number; size?: "lg" }) {
  const initials = name.replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase() || "S";
  return (
    <span
      className={"avatar" + (size === "lg" ? " avatar-lg" : "")}
      style={{ background: `linear-gradient(145deg, hsl(${hue} 32% 62%), hsl(${hue + 22} 26% 38%))` }}
      title={name}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

export function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <span className="stars" aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={i <= Math.round(value) ? "on" : ""} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="m12 3 2.7 5.7 6.3.8-4.6 4.4 1.2 6.3L12 17.3 6.4 20.2l1.2-6.3L3 9.5l6.3-.8z" />
        </svg>
      ))}
    </span>
  );
}

export function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00Z");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function CopyButton({ text, label = "Copy", className = "btn btn-ghost btn-sm", silent = false, onDone }: { text: string; label?: string; className?: string; silent?: boolean; onDone?: () => void }) {
  const [done, setDone] = useState(false);
  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setDone(true);
    if (!silent) toast("Copied to clipboard");
    onDone?.();
    setTimeout(() => setDone(false), 1600);
  };
  return (
    <button type="button" className={className} onClick={copy} aria-label={done ? "Copied" : label}>
      <Icon name={done ? "check" : "copy"} size={14} />
      {done ? "Copied" : label}
    </button>
  );
}

// Minimal, safe markdown renderer: headings, lists, quotes, bold, inline code, links.
function inline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\((https?:\/\/[^)\s]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("**")) out.push(<strong key={keyBase + i}>{token.slice(2, -2)}</strong>);
    else if (token.startsWith("`")) out.push(<code key={keyBase + i}>{token.slice(1, -1)}</code>);
    else {
      const link = token.match(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/);
      if (link) out.push(<a key={keyBase + i} href={link[2]} target="_blank" rel="noreferrer noopener">{link[1]}</a>);
      else out.push(token);
    }
    last = m.index + token.length;
    i++;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Prose({ text }: { text: string }) {
  const lines = (text || "").split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  let ordered: string[] = [];

  const flush = () => {
    if (list.length) {
      blocks.push(
        <ul key={"ul" + blocks.length}>
          {list.map((li, i) => <li key={i}>{inline(li, "li" + blocks.length + "-" + i)}</li>)}
        </ul>,
      );
      list = [];
    }
    if (ordered.length) {
      blocks.push(
        <ol key={"ol" + blocks.length}>
          {ordered.map((li, i) => <li key={i}>{inline(li, "oli" + blocks.length + "-" + i)}</li>)}
        </ol>,
      );
      ordered = [];
    }
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    if (!line.trim()) { flush(); return; }
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const num = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet) { if (ordered.length) { flush(); } list.push(bullet[1]); return; }
    if (num) { if (list.length) { flush(); } ordered.push(num[1]); return; }
    flush();
    if (line.startsWith("### ")) blocks.push(<h3 key={idx}>{inline(line.slice(4), "h3" + idx)}</h3>);
    else if (line.startsWith("## ")) blocks.push(<h3 key={idx}>{inline(line.slice(3), "h3" + idx)}</h3>);
    else if (line.startsWith("# ")) blocks.push(<h2 key={idx}>{inline(line.slice(2), "h2" + idx)}</h2>);
    else if (line.startsWith("> ")) blocks.push(<blockquote key={idx}>{inline(line.slice(2), "q" + idx)}</blockquote>);
    else blocks.push(<p key={idx}>{inline(line, "p" + idx)}</p>);
  });
  flush();

  return <div className="prose">{blocks}</div>;
}

export function Spinner({ size = 16 }: { size?: number }) {
  return <span className="spin" style={{ width: size, height: size, border: "2px solid rgba(255,255,255,.16)", borderTopColor: "var(--gold-bright)", borderRadius: "50%", display: "inline-block" }} />;
}
