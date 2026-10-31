import { useEffect, useState } from "react";
import { supabase, SUPABASE_ENABLED } from "./supabase";

export interface SessionUserState {
  id: string;
  name: string;
  email: string;
}

export interface AccountState {
  ready: boolean;
  enabled: boolean;
  user: SessionUserState | null;
}

let state: AccountState = { ready: false, enabled: SUPABASE_ENABLED, user: null };
const listeners = new Set<(s: AccountState) => void>();
let started = false;

function mapUser(user: any): SessionUserState {
  const email = String(user?.email || "");
  const meta = (user?.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) as string | undefined;
  const name = (meta || email.split("@")[0] || "builder").toLowerCase().replace(/[^a-z0-9_.-]+/g, "").slice(0, 24) || "builder";
  return { id: user.id, name, email };
}

function emit() {
  for (const fn of listeners) fn(state);
}

function start() {
  if (started) return;
  started = true;
  if (!SUPABASE_ENABLED || !supabase) {
    state = { ...state, ready: true };
    emit();
    return;
  }
  supabase.auth
    .getSession()
    .then(({ data }) => {
      state = { ready: true, enabled: true, user: data.session?.user ? mapUser(data.session.user) : null };
      emit();
    })
    .catch(() => {
      state = { ...state, ready: true };
      emit();
    });
  supabase.auth.onAuthStateChange((_event, session) => {
    state = { ...state, user: session?.user ? mapUser(session.user) : null };
    emit();
  });
}

export function useSession(): AccountState {
  const [value, setValue] = useState<AccountState>(state);
  useEffect(() => {
    start();
    const fn = (s: AccountState) => setValue({ ...s });
    listeners.add(fn);
    setValue({ ...state });
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return value;
}

export async function sendMagicLink(email: string) {
  if (!supabase) throw new Error("Database not connected.");
  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean)) throw new Error("That email does not look right.");
  const { error } = await supabase.auth.signInWithOtp({
    email: clean,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw new Error(error.message);
  return { sent: true };
}

export async function signInWithProvider(provider: "github" | "google") {
  if (!supabase) throw new Error("Database not connected.");
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin },
  });
  if (error) throw new Error(error.message);
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}
