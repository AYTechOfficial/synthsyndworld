import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../components/ui";
import { signInPassword, signOut, signUpPassword, useSession } from "../lib/account";
import { toast } from "../toast";

type Mode = "in" | "up";

export default function SignIn() {
  const session = useSession();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);

  if (session.ready && session.user) {
    return (
      <div className="container">
        <div className="signin-shell">
          <span className="kicker">You are signed in</span>
          <h1>{session.user.name}.</h1>
          <p className="match-sub">Signed in as {session.user.email}. Your stacks, published listings and reviews follow this account.</p>
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
    setError("");
    if (mode === "up" && password !== confirm) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "in") {
        await signInPassword(email, password);
        toast("Welcome back");
        navigate("/studio");
      } else {
        await signUpPassword(email, password);
        setCreated(true);
      }
    } catch (err: any) {
      setError(err?.message || "Something refused that attempt.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container">
      <div className="signin-shell">
        <span className="kicker">Accounts</span>
        <h1>Your stacks, <em>everywhere.</em></h1>
        <p className="match-sub">
          One account for the studio, your published listings and your reviews — synced across devices.
          Everything else in the bazaar stays open without one.
        </p>

        {!session.enabled && (
          <div className="signin-note warn" role="note">
            Supabase is not configured in this build. The catalog, match room, compare arena and all nine
            runners work without it; signing in is currently unavailable.
          </div>
        )}

        <section className="signin-card" aria-label={mode === "in" ? "Sign in" : "Create an account"}>
          {created ? (
            <div className="signin-sent">
              <span className="sent-mark"><Icon name="check" size={16} strokeWidth={2.1} /></span>
              <h2>Confirm your email.</h2>
              <p>
                Your account for <b>{email}</b> is created. Supabase just sent a confirmation link —
                click it once, then come back and sign in with your password. That's the only email step.
              </p>
              <button type="button" className="link-btn" onClick={() => { setCreated(false); setMode("in"); }}>
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <div className="auth-tabs" role="tablist" aria-label="Sign in or create account">
                <button type="button" role="tab" aria-selected={mode === "in"} className={"auth-tab" + (mode === "in" ? " active" : "")} onClick={() => { setMode("in"); setError(""); }}>
                  Sign in
                </button>
                <button type="button" role="tab" aria-selected={mode === "up"} className={"auth-tab" + (mode === "up" ? " active" : "")} onClick={() => { setMode("up"); setError(""); }}>
                  Create account
                </button>
              </div>
              <form onSubmit={submit} noValidate>
                <label className="signin-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  className="input signin-field"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  placeholder="you@work.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!session.enabled || busy}
                />
                <label className="signin-label" htmlFor="password">Password</label>
                <div className="password-row">
                  <input
                    id="password"
                    className="input signin-field"
                    type={visible ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete={mode === "in" ? "current-password" : "new-password"}
                    placeholder={mode === "in" ? "Your password" : "At least 8 characters"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={!session.enabled || busy}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={visible ? "Hide password" : "Show password"}
                    onClick={() => setVisible((v) => !v)}
                  >
                    {visible ? <Icon name="close" size={14} /> : <Icon name="globe" size={14} />}
                  </button>
                </div>
                {mode === "up" && (
                  <>
                    <label className="signin-label" htmlFor="confirm">Confirm password</label>
                    <input
                      id="confirm"
                      className="input signin-field"
                      type={visible ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Repeat it once"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      disabled={!session.enabled || busy}
                    />
                  </>
                )}
                {error && <p className="brief-error" role="alert">{error}</p>}
                <button className="btn btn-primary btn-lg btn-block auth-submit" type="submit" disabled={busy || !session.enabled}>
                  {busy ? (mode === "in" ? "Signing in…" : "Creating account…") : mode === "in" ? "Sign in" : "Create the account"}
                </button>
                <p className="signin-hint">
                  Passwords are hashed at the database. The app sees only the session, never the password.
                </p>
              </form>
            </>
          )}
        </section>

        <p className="signin-foot">
          The catalog, match room, compare arena, studio and all nine runners stay free and open — an
          account exists only to carry your work across devices.
        </p>
      </div>
    </div>
  );
}
