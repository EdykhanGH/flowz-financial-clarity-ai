import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Package, Search, X } from "lucide-react";
import clsx from "clsx";
import { useUser } from "@/hooks/useAuth";
import { listEntries, searchEntries } from "@/lib/api";
import { monthKey, monthRange, prettyMonth, shiftMonth, shortDay, todayISO } from "@/lib/dates";
import { KINDS } from "@/lib/kinds";
import { formatMoney, totalsByCurrency, type Entry } from "@/lib/money";
import type { Currency } from "@/lib/parse";
import TotalsCard from "@/components/TotalsCard";
import { EmptyState, ErrorNote, Spinner } from "@/components/ui";

export default function Notebook() {
  const { settings } = useUser();
  const [month, setMonth] = useState(monthKey(todayISO()));
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Entry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const { start, end } = monthRange(month);
    listEntries(start, end)
      .then((rows) => !cancelled && setEntries(rows))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [month]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    const t = window.setTimeout(() => {
      searchEntries(query).then(setResults).catch(() => setResults([]));
    }, 300);
    return () => window.clearTimeout(t);
  }, [query]);

  const days = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const e of entries) {
      if (!e.text.trim()) continue;
      map.set(e.entry_date, [...(map.get(e.entry_date) ?? []), e]);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [entries]);

  const monthTotals = useMemo(() => totalsByCurrency(entries), [entries]);
  const isCurrent = month === monthKey(todayISO());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 pt-1">
        <h1 className="text-2xl font-extrabold">My notebook</h1>
        <Link to="/inventory" className="flex items-center gap-1.5 rounded-full bg-sky-soft px-3 py-1.5 text-sm font-bold text-sky hover:brightness-95">
          <Package className="h-4 w-4" /> Inventory
        </Link>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          className="field pl-12 pr-10"
          placeholder="Search, e.g. rice, Chioma, fuel"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search your notebook"
        />
        {query && (
          <button className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted" onClick={() => setQuery("")} aria-label="Clear search">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {results ? (
        <SearchResults results={results} />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <button className="rounded-full p-2 hover:bg-line/50" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <span className="text-lg font-extrabold">{prettyMonth(month)}</span>
            <button
              className="rounded-full p-2 hover:bg-line/50 disabled:opacity-30"
              onClick={() => setMonth(shiftMonth(month, 1))}
              disabled={isCurrent}
              aria-label="Next month"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          <TotalsCard totals={monthTotals} fallbackCurrency={settings.default_currency} labels={{ in: "Money in", out: "Money out", net: "Kept" }} />

          {error && <ErrorNote>{error}</ErrorNote>}
          {loading ? (
            <div className="grid h-40 place-items-center text-brand"><Spinner /></div>
          ) : days.length === 0 ? (
            <EmptyState emoji="📒" title="No pages yet this month">
              <Link to="/today" className="btn-primary mt-4">Write today's page</Link>
            </EmptyState>
          ) : (
            <ul className="space-y-3">
              {days.map(([date, rows]) => (
                <li key={date}>
                  <DayCard date={date} rows={rows} fallback={settings.default_currency} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function DayCard({ date, rows, fallback }: { date: string; rows: Entry[]; fallback: Currency }) {
  const totals = totalsByCurrency(rows);
  const curs = (Object.keys(totals) as Currency[]).sort((a) => (a === fallback ? -1 : 1));
  return (
    <Link to={`/day/${date}`} className="card block p-4 transition hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <span className="font-hand text-2xl font-bold">{shortDay(date)}</span>
        <span className="text-xs font-bold text-muted">{rows.length} line{rows.length === 1 ? "" : "s"}</span>
      </div>
      <ul className="mt-1 space-y-0.5 text-muted">
        {rows.slice(0, 3).map((r) => (
          <li key={r.id} className="truncate font-hand text-lg">{r.text}</li>
        ))}
        {rows.length > 3 && <li className="text-xs font-bold">+ {rows.length - 3} more</li>}
      </ul>
      {curs.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2 text-sm font-extrabold">
          {curs.map((c) => (
            <span key={c} className="flex gap-2">
              <span className="text-brand-dark">+{formatMoney(totals[c]!.in, c, { compact: true })}</span>
              <span className="text-coral">−{formatMoney(totals[c]!.out, c, { compact: true })}</span>
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

function SearchResults({ results }: { results: Entry[] }) {
  if (results.length === 0) return <EmptyState emoji="🔍" title="Nothing found">Try another word.</EmptyState>;
  return (
    <ul className="card divide-y divide-line">
      {results.map((r) => (
        <li key={r.id}>
          <Link to={`/day/${r.entry_date}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-line/20">
            <div className="min-w-0">
              <div className="truncate font-hand text-xl">{r.text}</div>
              <div className="text-xs font-bold text-muted">{shortDay(r.entry_date)}</div>
            </div>
            {r.amount != null && r.currency && (
              <span className={clsx("shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold", KINDS[r.kind].chip)}>
                {KINDS[r.kind].emoji} {formatMoney(r.amount, r.currency, { compact: true })}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
