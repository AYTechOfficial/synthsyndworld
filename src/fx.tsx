import React, { useEffect, useRef, useState } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   FX layer: a little theatre around the product. Everything here respects
   prefers-reduced-motion and never blocks content when it is unsupported.
   ═══════════════════════════════════════════════════════════════════════════ */

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ── boot overlay: one branded flash per tab session ─────────────────────── */

export function BootGate() {
  const [visible, setVisible] = useState(() => {
    try {
      return !sessionStorage.getItem("synthsynd.boot") && !prefersReducedMotion();
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!visible) return;
    const t = window.setTimeout(() => {
      setVisible(false);
      try {
        sessionStorage.setItem("synthsynd.boot", "1");
      } catch {
        // ignore
      }
    }, 1250);
    return () => window.clearTimeout(t);
  }, [visible]);

  if (!visible) return null;
  return (
    <div className="boot" aria-hidden="true">
      <div className="boot-beam" />
      <span className="boot-word">
        <span>SYNTHSYND</span> <em>World</em>
      </span>
    </div>
  );
}

/* ── pointer aura: a soft gold light that follows the hand ───────────────── */

export function CursorAura() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const el = ref.current;
    if (!el) return;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;
    let moving = false;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!moving) {
        moving = true;
        el.classList.add("on");
      }
    };
    const tick = () => {
      x += (tx - x) * 0.09;
      y += (ty - y) * 0.09;
      el.style.transform = `translate3d(${x - 170}px, ${y - 170}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      moving = false;
      el.classList.remove("on");
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <div ref={ref} className="aura" aria-hidden="true" />;
}

/* ── constellation: particles behind the hero ────────────────────────────── */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  o: number;
}

export function Constellation({ density = 34 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let points: Particle[] = [];
    let raf = 0;
    let last = performance.now();

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      points = Array.from({ length: density }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 7,
        r: 0.6 + Math.random() * 1.4,
        o: 0.25 + Math.random() * 0.55,
      }));
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (document.hidden) {
        raf = requestAnimationFrame(tick);
        return;
      }
      ctx.clearRect(0, 0, width, height);
      for (const p of points) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < -10) p.x = width + 10;
        else if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        else if (p.y > height + 10) p.y = -10;
      }
      ctx.strokeStyle = "rgba(216, 185, 124, 0.055)";
      ctx.lineWidth = 1;
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const a = points[i];
          const b = points[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 140 * 140) {
            ctx.globalAlpha = (1 - d2 / (140 * 140)) * 0.75;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      for (const p of points) {
        ctx.fillStyle = `rgba(243, 223, 180, ${p.o})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    resize();
    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [density]);

  return <canvas ref={canvasRef} className="constellation" aria-hidden="true" />;
}

/* ── tilt: subtle pointer-driven depth ───────────────────────────────────── */

export function Tilt({
  children,
  className = "",
  depth = 12,
  scale = 1.01,
}: {
  children: React.ReactNode;
  className?: string;
  depth?: number;
  scale?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const el = ref.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      const box = el.getBoundingClientRect();
      const px = (e.clientX - box.left) / box.width - 0.5;
      const py = (e.clientY - box.top) / box.height - 0.5;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        el.style.transform = `perspective(1100px) rotateX(${(-py * depth * 0.6).toFixed(2)}deg) rotateY(${(px * depth).toFixed(2)}deg) scale(${scale})`;
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(frame.current);
      el.style.transform = "";
    };
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame.current);
    };
  }, [depth, scale]);

  return (
    <div ref={ref} className={"tilt " + className}>
      {children}
    </div>
  );
}

/* ── route fade: soft cut between screens ────────────────────────────────── */

export function RouteFadeKey({ location, children }: { location: string; children: React.ReactNode }) {
  return (
    <div key={location} className="route-fade">
      {children}
    </div>
  );
}
