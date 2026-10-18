import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle } from "lucide-react";
import clsx from "clsx";
import { listDebts, setSettled } from "@/lib/api";
import { shortDay } from "@/lib/dates";
import { formatMoney, type Entry } from "@/lib/money";
import type { Currency } from "@/lib/parse";
import { EmptyState, ErrorNote, Spinner } from "@/components/ui";

type Tab = "owed_to_me" | "i_owe";

export default function Owed() {
  const [tab, setTab] = useState<Tab>("owed_to_me");
  const [debts, setDebts] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaid, setShowPaid] = useState(false);

  useEffect(() => {
    listDebts()
      .then(setDebts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function toggle(e: Entry) {
    const settled = !e.settled_at;
    setDebts((all) => all.map((d) => (d.id === e.id ? { ...d, settled_at: settled ? new Date().toISOString() : null } : d)));
    try {
      await setSettled(e.id, settled);
    } catch (err) {
      setError((err as Error).message);
      setDebts((all) => all.map((d) => (d.id === e.id ? e : d)));
    }
  }

  const mine = debts.filter((d) => d.kind === tab);
  const open = mine.filter((d) => !d.settled_at);
  const paid = mine.filter((d) => d.settled_at);

  const people = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const d of open) map.set(d.person ?? "Someone", [...(map.get(d.person ?? "Someone") ?? []), d]);
    return [...map.entries()].sort((a, b) => sum(b[1]) - sum(a[1]));
  }, [open]);

  const totals = totalsOf(open);

  return (
    <div className="space-y-4">
      <h1 className="pt-1 text-2xl font-extrabold">Money owed</h1>

      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-line/50 p-1">
        {([
          ["owed_to_me", "People owe me"],
          ["i_owe", "I owe"],
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
              <div className="text-sm font-bold text-muted">{tab === "owed_to_me" ? "Still to collect" : "Still to pay"}</div>
              <div className="text-3xl font-extrabold">
                {(Object.entries(totals) as [Currency, number][]).map(([c, v]) => formatMoney(v, c)).join(" + ")}
              </div>
            </div>
          )}

          {people.length === 0 ? (
            <EmptyState emoji={tab === "owed_to_me" ? "🤝" : "✨"} title={tab === "owed_to_me" ? "Nobody owes you" : "You don't owe anyone"}>
              Write it on your page, like <span className="font-hand text-xl text-ink">“{tab === "owed_to_me" ? "Chioma owes me 5,000" : "I owe Tunde 3k"}”</span>, and it will show here.
              <div><Link to="/today" className="btn-soft mt-4">Open today's page</Link></div>
            </EmptyState>
          ) : (
            <ul className="space-y-3">
              {people.map(([name, rows]) => (
                <li key={name} className="card overflow-hidden">
                  <div className="flex items-center justify-between px-5 pt-4">
                    <span className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-sun-soft font-extrabold text-amber-700">
                        {name.charAt(0).toUpperCase()}
                      </span>
                      <span className="text-lg font-extrabold">{name}</span>
                    </span>
                    <span className="font-extrabold">
                      {(Object.entries(totalsOf(rows)) as [Currency, number][]).map(([c, v]) => formatMoney(v, c)).join(" + ")}
                    </span>
                  </div>
                  <ul className="mt-2 divide-y divide-line">
                    {rows.map((d) => <DebtRow key={d.id} debt={d} onToggle={() => toggle(d)} />)}
                  </ul>
                </li>
              ))}
            </ul>
          )}

          {paid.length > 0 && (
            <div>
              <button className="text-sm font-bold text-muted hover:text-ink" onClick={() => setShowPaid((s) => !s)}>
                {showPaid ? "Hide" : "Show"} paid ({paid.length})
              </button>
              {showPaid && (
                <ul className="card mt-2 divide-y divide-line opacity-70">
                  {paid.map((d) => <DebtRow key={d.id} debt={d} onToggle={() => toggle(d)} />)}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DebtRow({ debt, onToggle }: { debt: Entry; onToggle: () => void }) {
  const paid = Boolean(debt.settled_at);
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <button onClick={onToggle} className={clsx("shrink-0", paid ? "text-brand" : "text-muted hover:text-brand")} aria-label={paid ? "Mark as not paid" : "Mark as paid"}>
        {paid ? <CheckCircle2 className="h-7 w-7" /> : <Circle className="h-7 w-7" />}
      </button>
      <Link to={`/day/${debt.entry_date}`} className="min-w-0 flex-1">
        <div className={clsx("truncate font-hand text-xl", paid && "line-through")}>{debt.text}</div>
        <div className="text-xs font-bold text-muted">{shortDay(debt.entry_date)}{paid ? " · paid" : ""}</div>
      </Link>
      <span className="shrink-0 font-extrabold">{formatMoney(debt.amount ?? 0, debt.currency ?? "NGN", { compact: true })}</span>
    </li>
  );
}

function sum(rows: Entry[]) {
  return rows.reduce((s, r) => s + (r.amount ?? 0), 0);
}

function totalsOf(rows: Entry[]) {
  const out: Partial<Record<Currency, number>> = {};
  for (const r of rows) if (r.currency) out[r.currency] = (out[r.currency] ?? 0) + (r.amount ?? 0);
  return out;
}
