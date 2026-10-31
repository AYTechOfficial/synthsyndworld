import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { Icon } from "../components/ui";
import { sendMagicLink, signInWithProvider, signOut, useSession } from "../lib/account";
import { toast } from "../toast";

export default function SignIn() {
  const session = useSession();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  if (session.ready && session.user) {
    return (
      <div className="container">
        <div className="signin-shell">
          <span className="kicker">You are signed in</span>
          <h1>{session.user.name}.</h1>
          <p className="match-sub">Signed in as {session.user.email}. Your stacks sync to this account.</p>
          <div className="signin-actions">
            <Link to="/studio" className="btn btn-primary btn-lg">Open the studio <Icon name="arrow" size={14} /></Link>
            <button type="button" className="btn btn-ghost btn-lg" onClick={() => signOut().then(() => toast("Signed out"))}>Sign out</button>
          </div>
        </div>
      </div>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await sendMagicLink(email);
      setSent(true);
    } catch (err: any) {
      setError(err?.message || "Could not send the link.");
    } finally {
      setBusy(false);
    }
  };

  const provider = async (name: "github" | "google") => {
    try {
      await signInWithProvider(name);
    } catch (err: any) {
      toast(err?.message || `${name} sign-in is not enabled for this project yet`);
    }
  };

  return (
    <div className="container">
      <div className="signin-shell">
        <span className="kicker">Accounts</span>
        <h1>Your stacks, <em>everywhere.</em></h1>
        <p className="match-sub">
          Sign in once and the match room, the studio, your published listings and your reviews follow
          you across devices. Everything else in the bazaar stays open without an account.
        </p>

        {!session.enabled && (
          <div className="signin-note warn" role="note">
            Supabase is not configured in this build (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). The
            catalog, match room, compare arena and all nine runners work without it; signing in is
            currently unavailable.
          </div>
        )}

        <section className="signin-card" aria-label="Sign in">
          {sent ? (
            <div className="signin-sent">
              <span className="sent-mark"><Icon name="check" size={16} strokeWidth={2.1} /></span>
              <h2>Check your inbox.</h2>
              <p>
                We sent a sign-in link to <b>{email}</b>. Open it on this or any other device and you will
                come straight back here, signed in.
              </p>
              <button type="button" className="link-btn" onClick={() => { setSent(false); setBusy(false); }}>
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <label className="signin-label" htmlFor="email">Email</label>
              <div className="signin-row">
                <input
                  id="email"
                  className="input signin-input"
                  type="email"
                  required
                  autoFocus
                  placeholder="you@work.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!session.enabled}
                />
                <button className="btn btn-primary" type="submit" disabled={busy || !session.enabled}>
                  {busy ? "Sending…" : "Send magic link"}
                </button>
              </div>
              {error && <p className="brief-error" role="alert">{error}</p>}
              <p className="signin-hint">No password, no signup form. The link is the account.</p>
              <div className="signin-divider"><span>or</span></div>
              <div className="signin-providers">
                <button type="button" className="btn btn-ghost" onClick={() => provider("github")} disabled={!session.enabled}>
                  <Icon name="globe" size={14} /> Continue with GitHub
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => provider("google")} disabled={!session.enabled}>
                  <Icon name="globe" size={14} /> Continue with Google
                </button>
              </div>
            </form>
          )}
        </section>

        <p className="signin-foot">
          Reviews, published listings and the stack library are tied to your account. Counters and the
          public catalog stay anonymous.
        </p>
      </div>
    </div>
  );
}
