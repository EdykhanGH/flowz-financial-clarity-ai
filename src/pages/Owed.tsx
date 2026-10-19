import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, HandCoins } from "lucide-react";
import clsx from "clsx";
import { listDebts, listEntries, upsertEntries } from "@/lib/api";
import { shortDay, todayISO } from "@/lib/dates";
import { KINDS } from "@/lib/kinds";
import { buildDebtBook, formatMoney, type Entry, type PersonBalance } from "@/lib/money";
import { parseLine, type Currency } from "@/lib/parse";
import { EmptyState, ErrorNote, ProgressBar, Sheet, Spinner } from "@/components/ui";

type Tab = "owedToMe" | "iOwe";

export default function Owed() {
  const [tab, setTab] = useState<Tab>("owedToMe");
  const [debts, setDebts] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState<PersonBalance | null>(null);
  const [showSettled, setShowSettled] = useState(false);

  const load = useCallback(() => {
    listDebts()
      .then(setDebts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const book = useMemo(() => buildDebtBook(debts), [debts]);
  const people = book[tab];
  const open = people.filter((p) => p.balance > 0);
  const settled = people.filter((p) => p.balance <= 0);

  const totals = useMemo(() => {
    const out: Partial<Record<Currency, number>> = {};
    for (const p of open) out[p.currency] = (out[p.currency] ?? 0) + p.balance;
    return out;
  }, [open]);

  /** Writes "Joy paid back 20,000" on today's page, which lowers Joy's balance. */
  async function recordPayment(person: PersonBalance, amount: number) {
    const today = todayISO();
    const existing = await listEntries(today, today);
    const theyPaid = tab === "owedToMe";
    const money = amount.toLocaleString("en-NG");
    const sym = person.currency === "USD" ? "$" : "";
    const text = theyPaid ? `${person.name} paid back ${sym}${money}` : `Paid back ${person.name} ${sym}${money}`;
    await upsertEntries([
      {
        id: crypto.randomUUID(),
        entry_date: today,
        position: existing.length,
        text,
        amount,
        currency: person.currency,
        kind: theyPaid ? "repaid_to_me" : "i_repaid",
        category: null,
        person: person.name,
        kind_locked: true,
        settled_at: null,
      },
    ]);
    setPaying(null);
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="pt-1 text-2xl font-extrabold">Money owed</h1>

      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-line/50 p-1">
        {([
          ["owedToMe", "People owe me"],
          ["iOwe", "I owe"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={clsx("rounded-xl py-2.5 font-extrabold transition", tab === value ? "bg-white shadow-card" : "text-muted")}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}

      {loading ? (
        <div className="grid h-40 place-items-center text-brand"><Spinner /></div>
      ) : (
        <>
          {Object.keys(totals).length > 0 && (
            <div className="card bg-sun-soft p-5 text-center">
              <div className="text-sm font-bold text-muted">{tab === "owedToMe" ? "Still to collect" : "Still to pay"}</div>
              <div className="text-3xl font-extrabold">
                {(Object.entries(totals) as [Currency, number][]).map(([c, v]) => formatMoney(v, c)).join(" + ")}
              </div>
            </div>
          )}

          {open.length === 0 ? (
            <EmptyState emoji={tab === "owedToMe" ? "🤝" : "✨"} title={tab === "owedToMe" ? "Nobody owes you" : "You don't owe anyone"}>
              Write it on your page, like{" "}
              <span className="font-hand text-xl text-ink">“{tab === "owedToMe" ? "Joy bought 50k rice on credit" : "I owe Tunde 3k"}”</span>, and it will show here.
              When they pay, write <span className="font-hand text-xl text-ink">“{tab === "owedToMe" ? "Joy paid back 30k" : "Paid Tunde back 3k"}”</span>.
              <div><Link to="/today" className="btn-soft mt-4">Open today's page</Link></div>
            </EmptyState>
          ) : (
            <ul className="space-y-3">
              {open.map((p) => (
                <li key={`${p.key}|${p.currency}`}>
                  <PersonCard person={p} side={tab} onPay={() => setPaying(p)} />
                </li>
              ))}
            </ul>
          )}

          {settled.length > 0 && (
            <div>
              <button className="flex items-center gap-1 text-sm font-bold text-muted hover:text-ink" onClick={() => setShowSettled((s) => !s)}>
                <ChevronDown className={clsx("h-4 w-4 transition", showSettled && "rotate-180")} />
                Paid off ({settled.length})
              </button>
              {showSettled && (
                <ul className="mt-2 space-y-3 opacity-80">
                  {settled.map((p) => (
                    <li key={`${p.key}|${p.currency}`}>
                      <PersonCard person={p} side={tab} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      <PaySheet person={paying} side={tab} onClose={() => setPaying(null)} onSave={recordPayment} />
    </div>
  );
}

function PersonCard({ person, side, onPay }: { person: PersonBalance; side: Tab; onPay?: () => void }) {
  const [open, setOpen] = useState(false);
  const c = person.currency;
  return (
    <div className="card overflow-hidden">
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sun-soft font-extrabold text-amber-700">
              {person.name.charAt(0).toUpperCase()}
            </span>
            <span className="truncate text-lg font-extrabold">{person.name}</span>
          </span>
          <span className="text-right">
            <span className="block text-xl font-extrabold">{person.balance > 0 ? formatMoney(person.balance, c) : "Paid off ✓"}</span>
            {person.balance > 0 && <span className="text-xs font-bold text-muted">{side === "owedToMe" ? "still owes you" : "you still owe"}</span>}
          </span>
        </div>
        {person.repaid > 0 && (
          <div className="mt-3">
            <ProgressBar value={person.repaid} max={person.owed} />
            <div className="mt-1 flex justify-between text-xs font-bold text-muted">
              <span>Paid back {formatMoney(person.repaid, c)}</span>
              <span>of {formatMoney(person.owed, c)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-line px-3 py-2">
        <button className="btn-ghost flex-1 py-2 text-sm" onClick={() => setOpen((o) => !o)}>
          <ChevronDown className={clsx("h-4 w-4 transition", open && "rotate-180")} /> History ({person.lines.length})
        </button>
        {onPay && (
          <button className="btn-soft flex-1 py-2 text-sm" onClick={onPay}>
            <HandCoins className="h-4 w-4" /> Record payment
          </button>
        )}
      </div>

      {open && (
        <ul className="divide-y divide-line border-t border-line">
          {person.lines.map((l) => {
            const isRepay = l.kind === "repaid_to_me" || l.kind === "i_repaid";
            return (
              <li key={l.id}>
                <Link to={`/day/${l.entry_date}`} className="flex items-center gap-3 px-5 py-3 hover:bg-line/20">
                  <span aria-hidden>{KINDS[l.kind].emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className={clsx("block truncate font-hand text-xl", l.settled_at && "line-through")}>{l.text}</span>
                    <span className="text-xs font-bold text-muted">{shortDay(l.entry_date)}{l.settled_at ? " · marked paid" : ""}</span>
                  </span>
                  <span className={clsx("shrink-0 font-extrabold", isRepay && "text-brand-dark")}>
                    {isRepay ? "−" : "+"}
                    {formatMoney(l.amount ?? 0, c, { compact: true })}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function PaySheet({
  person,
  side,
  onClose,
  onSave,
}: {
  person: PersonBalance | null;
  side: Tab;
  onClose: () => void;
  onSave: (p: PersonBalance, amount: number) => Promise<void>;
}) {
  const [amountText, setAmountText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (person) {
      setAmountText(String(person.balance));
      setError(null);
    }
  }, [person]);

  if (!person) return null;
  const amount = parseLine(amountText, person.currency).amount;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!person || !amount) {
      setError("Type how much was paid, like 20,000 or 20k.");
      return;
    }
    setBusy(true);
    try {
      await onSave(person, amount);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const left = amount ? Math.max(0, person.balance - amount) : person.balance;

  return (
    <Sheet open onClose={onClose} title={side === "owedToMe" ? `${person.name} paid you` : `You paid ${person.name}`}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="pay-amount">How much?</label>
          <input id="pay-amount" inputMode="decimal" className="field text-lg font-bold" value={amountText} onChange={(e) => setAmountText(e.target.value)} />
          <p className="mt-2 text-sm text-muted">
            {side === "owedToMe" ? `${person.name} owes` : "You owe"} {formatMoney(person.balance, person.currency)} now.{" "}
            {amount ? (left > 0 ? `After this: ${formatMoney(left, person.currency)} left.` : "After this: paid off ✓") : ""}
          </p>
        </div>
        <p className="rounded-2xl bg-paper px-4 py-3 text-sm text-muted">This adds a line to today's page, so the money shows in today's totals.</p>
        {error && <ErrorNote>{error}</ErrorNote>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? <Spinner /> : "Save payment"}</button>
      </form>
    </Sheet>
  );
}
