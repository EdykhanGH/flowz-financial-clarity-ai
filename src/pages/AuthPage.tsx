import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ErrorNote, Logo, PasswordInput, Spinner } from "@/components/ui";

export default function AuthPage({ mode }: { mode: "signin" | "signup" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<null | "confirm" | "reset">(null);
  const [resent, setResent] = useState(false);
  const isSignup = mode === "signup";
  const navigate = useNavigate();

  // /signin and /signup share this screen, so clear the "check your email" state when switching.
  useEffect(() => {
    setSent(null);
    setError(null);
    setResent(false);
  }, [mode]);

  function backToSignIn() {
    setSent(null);
    setError(null);
    setResent(false);
    setPassword("");
    navigate("/signin");
  }

  async function resend() {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${window.location.origin}/setup` } });
    setBusy(false);
    if (error) setError(friendly(error.message));
    else setResent(true);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/setup` },
        });
        if (error) throw error;
        // Supabase doesn't send a link, or say so, when the email already has an account.
        if (data.user && data.user.identities?.length === 0) {
          setError("You already have an account with this email. Sign in, or tap “Forgot password” on the sign-in page.");
          return;
        }
        if (!data.session) setSent("confirm");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(friendly((err as Error).message));
    } finally {
      setBusy(false);
    }
  }

  async function forgot() {
    if (!email) {
      setError("Type your email first, then tap “Forgot password”.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/settings#password`,
    });
    setBusy(false);
    if (error) setError(friendly(error.message));
    else setSent("reset");
  }

  if (sent) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
        <MailCheck className="h-14 w-14 text-brand" />
        <h1 className="mt-4 text-2xl font-extrabold">Check your email</h1>
        <p className="mt-2 text-muted">
          {sent === "confirm"
            ? <>We sent a link to <b>{email}</b>. Tap it to open your Flowz notebook.</>
            : <>We sent a password reset link to <b>{email}</b>.</>}
        </p>
        <p className="mt-3 text-sm text-muted">
          It can take a few minutes. If you can't find it, check your Spam or Promotions folder for an email from Flowz (hello@flowz.ng).
        </p>
        {sent === "confirm" && (
          <button type="button" onClick={resend} disabled={busy || resent} className="btn-primary mt-6">
            {busy ? <Spinner /> : resent ? "Sent again. Check your email" : "Send the link again"}
          </button>
        )}
        {error && <div className="mt-3 w-full"><ErrorNote>{error}</ErrorNote></div>}
        <button type="button" onClick={backToSignIn} className="btn-ghost mt-3">Back to sign in</button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-6">
      <Link to="/" className="block">
        <Logo />
        <span className="mt-1 block text-sm font-bold text-muted">Your interactive accounts notebook</span>
      </Link>
      <div className="my-auto py-10">
        <h1 className="text-3xl font-extrabold">{isSignup ? "Create your notebook" : "Welcome back"}</h1>
        <p className="mt-2 text-muted">
          {isSignup ? "It takes less than a minute." : "Sign in to open your money notebook."}
        </p>
        {import.meta.env.MODE === "demo" && (
          <p className="mt-4 rounded-2xl bg-sun-soft px-4 py-3 text-sm font-semibold text-amber-800">
            This is a demo. Use any email and password; nothing is sent. Your notebook is saved only in this browser.
          </p>
        )}

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <PasswordInput
              id="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? "At least 6 characters" : "Your password"}
            />
          </div>
          {error && <ErrorNote>{error}</ErrorNote>}
          <button className="btn-primary w-full text-lg" disabled={busy}>
            {busy ? <Spinner /> : isSignup ? "Create account" : "Sign in"}
          </button>
          {!isSignup && (
            <button type="button" onClick={forgot} className="w-full text-center text-sm font-bold text-muted hover:text-ink">
              Forgot password?
            </button>
          )}
        </form>

        <p className="mt-8 text-center text-muted">
          {isSignup ? "Already have an account? " : "New to Flowz? "}
          <Link to={isSignup ? "/signin" : "/signup"} className="font-bold text-brand">
            {isSignup ? "Sign in" : "Create one"}
          </Link>
        </p>
        {isSignup && (
          <p className="mt-3 text-center text-xs text-muted">
            By creating an account you agree to how Flowz handles your data in our{" "}
            <Link to="/privacy" className="font-bold underline">privacy policy</Link>.
          </p>
        )}
      </div>
    </div>
  );
}

function friendly(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "That email and password don't match. Please try again.";
  if (m.includes("already registered")) return "You already have an account with this email. Try signing in.";
  if (m.includes("email not confirmed")) return "Please confirm your email first — check your inbox for our link.";
  if (m.includes("rate limit") || m.includes("security purposes") || m.includes("too many")) return "Please wait a minute before asking for another email.";
  if (m.includes("error sending")) return "We couldn't send the email just now. Please try again in a few minutes.";
  if (m.includes("password")) return message;
  if (m.includes("fetch") || m.includes("network")) return "No internet connection. Please check and try again.";
  return message;
}
