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

export function validateEmail(email: string): string {
  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean)) throw new Error("That email does not look right.");
  return clean;
}

export function validatePassword(password: string): string {
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  if (password.length > 72) throw new Error("Password is too long.");
  return password;
}

export async function signInPassword(email: string, password: string) {
  if (!supabase) throw new Error("Database not connected.");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: validateEmail(email),
    password: validatePassword(password),
  });
  if (error) {
    if (/invalid login credentials/i.test(error.message)) throw new Error("Wrong email or password.");
    if (/email not confirmed/i.test(error.message)) throw new Error("Confirm your email first — check your inbox.");
    throw new Error(error.message);
  }
  return data;
}

export async function signUpPassword(email: string, password: string) {
  if (!supabase) throw new Error("Database not connected.");
  const { data, error } = await supabase.auth.signUp({
    email: validateEmail(email),
    password: validatePassword(password),
  });
  if (error) {
    if (/already registered/i.test(error.message)) throw new Error("That email already has an account — sign in instead.");
    throw new Error(error.message);
  }
  // When email confirmation is enabled in Supabase, signUp succeeds but no
  // session is issued until the user clicks the confirm link.
  return data;
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}
