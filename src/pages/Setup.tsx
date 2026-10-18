import { useState, type FormEvent } from "react";
import clsx from "clsx";
import { useAuth } from "@/hooks/useAuth";
import { saveSettings } from "@/lib/api";
import type { Mode } from "@/lib/kinds";
import type { Currency } from "@/lib/parse";
import { ErrorNote, Logo, Spinner } from "@/components/ui";
import { deviceTimeZone } from "@/lib/reminders";

export default function Setup() {
  const { session, setSettings } = useAuth();
  const [name, setName] = useState("");
  const [mode, setMode] = useState<Mode>("personal");
  const [businessName, setBusinessName] = useState("");
  const [currency, setCurrency] = useState<Currency>("NGN");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      const saved = await saveSettings(session.user.id, {
        display_name: name.trim(),
        mode,
        business_name: mode === "business" ? businessName.trim() || null : null,
        default_currency: currency,
        time_zone: deviceTimeZone(),
      });
      setSettings(saved);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md px-5 py-6">
      <Logo />
      <h1 className="mt-10 text-3xl font-extrabold">Let's set up your notebook</h1>
      <p className="mt-2 text-muted">Three quick questions. You can change these later.</p>

      <form onSubmit={submit} className="mt-8 space-y-7">
        <div>
          <label className="label" htmlFor="name">What should we call you?</label>
          <input id="name" required className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ada" autoComplete="given-name" />
        </div>

        <fieldset>
          <legend className="label">What will you use Flowz for?</legend>
          <div className="grid grid-cols-2 gap-3">
            {([
              { value: "personal", emoji: "🏠", title: "Me & my home", body: "Income, spending, gifts" },
              { value: "business", emoji: "🏪", title: "My business", body: "Sales, purchases, expenses" },
            ] as const).map((o) => (
              <button
                type="button"
                key={o.value}
                onClick={() => setMode(o.value)}
                aria-pressed={mode === o.value}
                className={clsx(
                  "rounded-3xl border-2 p-4 text-left transition",
                  mode === o.value ? "border-brand bg-brand-soft" : "border-line bg-white",
                )}
              >
                <div className="text-3xl">{o.emoji}</div>
                <div className="mt-2 font-extrabold">{o.title}</div>
                <div className="text-sm text-muted">{o.body}</div>
              </button>
            ))}
          </div>
        </fieldset>

        {mode === "business" && (
          <div>
            <label className="label" htmlFor="biz">Business name (optional)</label>
            <input id="biz" className="field" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Ada's Provisions" />
          </div>
        )}

        <fieldset>
          <legend className="label">Which money do you use most?</legend>
          <div className="grid grid-cols-2 gap-3">
            {([
              { value: "NGN", symbol: "₦", title: "Naira" },
              { value: "USD", symbol: "$", title: "Dollars" },
            ] as const).map((o) => (
              <button
                type="button"
                key={o.value}
                onClick={() => setCurrency(o.value)}
                aria-pressed={currency === o.value}
                className={clsx(
                  "flex items-center gap-3 rounded-3xl border-2 p-4 transition",
                  currency === o.value ? "border-brand bg-brand-soft" : "border-line bg-white",
                )}
              >
                <span className="text-3xl font-extrabold">{o.symbol}</span>
                <span className="font-extrabold">{o.title}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted">You can still write the other one any time — just add ₦ or $.</p>
        </fieldset>

        {error && <ErrorNote>{error}</ErrorNote>}
        <button className="btn-primary w-full text-lg" disabled={busy}>
          {busy ? <Spinner /> : "Open my notebook"}
        </button>
      </form>
    </div>
  );
}
