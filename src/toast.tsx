import { useEffect, useState } from "react";

type Toast = { id: number; message: string; kind: "ok" | "err" };
let nextId = 1;
const listeners = new Set<(t: Toast[]) => void>();
let current: Toast[] = [];

function emit() {
  for (const fn of listeners) fn([...current]);
}

export function toast(message: string, kind: "ok" | "err" = "ok") {
  const t: Toast = { id: nextId++, message, kind };
  current = [...current, t].slice(-3);
  emit();
  setTimeout(() => {
    current = current.filter((x) => x.id !== t.id);
    emit();
  }, 3600);
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>(current);
  useEffect(() => {
    const fn = (t: Toast[]) => setItems(t);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return (
    <div className="toasts" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={"toast " + t.kind}>
          <span className="toast-dot" />
          {t.message}
        </div>
      ))}
    </div>
  );
}
