import { useEffect, useState, type FormEvent } from "react";
import { LogOut } from "lucide-react";
import clsx from "clsx";
import { useAuth, useUser } from "@/hooks/useAuth";
import { saveSettings } from "@/lib/api";
import type { Mode } from "@/lib/kinds";
import type { Currency } from "@/lib/parse";
import { supabase } from "@/lib/supabase";
import { ErrorNote, Spinner } from "@/components/ui";
import { ReminderSettings } from "@/components/Reminders";
import { deviceTimeZone } from "@/lib/reminders";

export default function SettingsPage() {
  const { userId, settings } = useUser();
  const { session, setSettings, signOut } = useAuth();
  const [name, setName] = useState(settings.display_name);
  const [mode, setMode] = useState<Mode>(settings.mode);
  const [businessName, setBusinessName] = useState(settings.business_name ?? "");
  const [currency, setCurrency] = useState<Currency>(settings.default_currency);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      setSettings(
        await saveSettings(userId, {
          display_name: name.trim(),
          mode,
          business_name: mode === "business" ? businessName.trim() || null : null,
          default_currency: currency,
          time_zone: deviceTimeZone(),
        }),
      );
      setMessage("Saved.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 pt-1">
      <h1 className="text-2xl font-extrabold">Settings</h1>

      <form onSubmit={submit} className="card space-y-5 p-5">
        <div>
          <label className="label" htmlFor="name">Your name</label>
          <input id="name" required className="field" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <div className="label">I use Flowz for</div>
          <div className="grid grid-cols-2 gap-2">
            {([["personal", "🏠 Me & my home"], ["business", "🏪 My business"]] as const).map(([v, label]) => (
              <button type="button" key={v} onClick={() => setMode(v)} className={clsx("rounded-2xl border-2 px-3 py-2.5 font-bold", mode === v ? "border-brand bg-brand-soft" : "border-line bg-white")}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {mode === "business" && (
          <div>
            <label className="label" htmlFor="biz">Business name</label>
            <input id="biz" className="field" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </div>
        )}

        <div>
          <div className="label">Main money</div>
          <div className="grid grid-cols-2 gap-2">
            {([["NGN", "₦ Naira"], ["USD", "$ Dollars"]] as const).map(([v, label]) => (
              <button type="button" key={v} onClick={() => setCurrency(v)} className={clsx("rounded-2xl border-2 px-3 py-2.5 font-bold", currency === v ? "border-brand bg-brand-soft" : "border-line bg-white")}>
                {label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-sm text-muted">Lines without ₦ or $ use this. Lines you already wrote keep their money type.</p>
        </div>

        {error && <ErrorNote>{error}</ErrorNote>}
        {message && <p className="text-sm font-bold text-brand">{message}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? <Spinner /> : "Save changes"}</button>
      </form>

      <ReminderSettings />

      <PasswordCard />

      <div className="card p-5">
        <div className="text-sm text-muted">Signed in as</div>
        <div className="font-bold">{session?.user.email}</div>
        <button className="btn-ghost mt-3 w-full text-coral" onClick={signOut}>
          <LogOut className="h-5 w-5" /> Sign out
        </button>
      </div>
    </div>
  );
}

function PasswordCard() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(false);

  // Arriving from a "reset password" email lands here.
  useEffect(() => {
    if (window.location.hash.includes("password")) setHighlight(true);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setError(error.message);
    else {
      setPassword("");
      setMessage("Your password has been changed.");
    }
  }

  return (
    <form id="password" onSubmit={submit} className={clsx("card space-y-3 p-5", highlight && "ring-2 ring-brand")}>
      <label className="label" htmlFor="new-password">{highlight ? "Choose a new password" : "Change password"}</label>
      <input id="new-password" type="password" minLength={6} required autoComplete="new-password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
      {error && <ErrorNote>{error}</ErrorNote>}
      {message && <p className="text-sm font-bold text-brand">{message}</p>}
      <button className="btn-soft w-full" disabled={busy}>{busy ? <Spinner /> : "Update password"}</button>
    </form>
  );
}
