import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, RefreshCw, Sparkles } from "lucide-react";
import clsx from "clsx";
import { useUser } from "@/hooks/useAuth";
import { generateSummary, getSummary, listBudgets, listDebts, listEntries, type Summary } from "@/lib/api";
import { monthKey, monthRange, prettyMonth, shiftMonth, shortDay, todayISO } from "@/lib/dates";
import { CATEGORY_BY_ID, KINDS, kindLabel, type Kind } from "@/lib/kinds";
import { buildMonthStats, formatMoney, type Budget, type Entry } from "@/lib/money";
import type { Currency } from "@/lib/parse";
import { EmptyState, ErrorNote, ProgressBar, Spinner } from "@/components/ui";
import AskFlowz from "@/components/AskFlowz";

export default function MonthPage() {
  const params = useParams();
  const navigate = useNavigate();
  const { settings } = useUser();
  const current = monthKey(todayISO());
  const month = params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : current;

  const [entries, setEntries] = useState<Entry[]>([]);
  const [previous, setPrevious] = useState<Entry[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [debts, setDebts] = useState<Entry[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [writing, setWriting] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSummaryError(null);
    const r = monthRange(month);
    const p = monthRange(shiftMonth(month, -1));
    Promise.all([listEntries(r.start, r.end), listEntries(p.start, p.end), listBudgets(), getSummary(month), listDebts().catch(() => [] as Entry[])])
      .then(([e, prev, b, s, d]) => {
        if (cancelled) return;
        setDebts(d);
        setEntries(e);
        setPrevious(prev);
        setBudgets(b);
        setSummary(s);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [month]);

  const stats = useMemo(
    () => buildMonthStats({ month, mode: settings.mode, entries, previousEntries: previous, budgets, today: new Date(), debts }),
    [month, settings.mode, entries, previous, budgets, debts],
  );

  const hasMoney = Object.keys(stats.currencies).length > 0;
  const lastChange = entries.reduce((max, e) => (e.updated_at && e.updated_at > max ? e.updated_at : max), "");
  const stale = Boolean(summary && lastChange && lastChange > summary.generated_at);

  async function write() {
    setWriting(true);
    setSummaryError(null);
    try {
      setSummary(await generateSummary(stats));
    } catch (e) {
      setSummaryError((e as Error).message);
    } finally {
      setWriting(false);
    }
  }

  const go = (m: string) => navigate(m === current ? "/month" : `/month/${m}`);
  const currencies = (Object.keys(stats.currencies) as Currency[]).sort((a) => (a === settings.default_currency ? -1 : 1));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pt-1">
        <button className="rounded-full p-2 hover:bg-line/50" onClick={() => go(shiftMonth(month, -1))} aria-label="Previous month">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="text-center">
          <div className="text-xs font-bold uppercase tracking-wide text-muted">Summary for</div>
          <div className="text-xl font-extrabold">{prettyMonth(month)}</div>
        </div>
        <button
          className="rounded-full p-2 hover:bg-line/50 disabled:opacity-30"
          onClick={() => go(shiftMonth(month, 1))}
          disabled={month >= current}
          aria-label="Next month"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}

      {loading ? (
        <div className="grid h-60 place-items-center text-brand"><Spinner className="h-8 w-8" /></div>
      ) : !hasMoney ? (
        <EmptyState emoji="🌱" title="Nothing written this month yet">
          Write what you sell, buy and spend each day, and your summary will appear here.
          <div><Link to="/today" className="btn-primary mt-4">Open today's page</Link></div>
        </EmptyState>
      ) : (
        <>
          {/* Smart summary */}
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between bg-gradient-to-r from-brand to-brand-dark px-5 py-3 text-white">
              <span className="flex items-center gap-2 font-extrabold"><Sparkles className="h-5 w-5" /> Smart summary</span>
              {summary && (
                <button onClick={write} disabled={writing} className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-bold hover:bg-white/25 disabled:opacity-60">
                  <RefreshCw className={clsx("h-3.5 w-3.5", writing && "animate-spin")} /> Refresh
                </button>
              )}
            </div>
            <div className="p-5">
              {summary ? (
                <>
                  <p className="text-lg font-extrabold leading-snug">{summary.headline}</p>
                  <ul className="mt-3 space-y-2">
                    {summary.points.map((p, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                  {summary.tip && (
                    <p className="mt-4 rounded-2xl bg-sun-soft px-4 py-3 text-sm">
                      <b>💡 Tip:</b> {summary.tip}
                    </p>
                  )}
                  {import.meta.env.MODE === "demo" && (
                    <p className="mt-3 text-xs font-bold text-muted">Demo: this summary is written on your device from your numbers. The live app has AI write it.</p>
                  )}
                  {stale && !writing && (
                    <p className="mt-3 text-xs font-bold text-muted">You've written more since this summary. Tap Refresh to update it.</p>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <p className="text-muted">Get a short, plain-English explanation of your month and a tip for next month.</p>
                  <button className="btn-primary mt-4" onClick={write} disabled={writing}>
                    {writing ? <><Spinner /> Writing…</> : <><Sparkles className="h-5 w-5" /> Write my summary</>}
                  </button>
                </div>
              )}
              {summaryError && <div className="mt-3"><ErrorNote>{summaryError}</ErrorNote></div>}
            </div>
          </section>

          <AskFlowz />

          {currencies.map((cur) => {
            const c = stats.currencies[cur]!;
            return (
              <section key={cur} className="space-y-4">
                {currencies.length > 1 && <h2 className="pt-2 text-lg font-extrabold">{cur === "NGN" ? "₦ Naira" : "$ Dollars"}</h2>}

                <div className="grid grid-cols-3 gap-2">
                  <BigStat label="Money in" value={c.in} prev={c.previous?.in} cur={cur} tone="in" />
                  <BigStat label="Money out" value={c.out} prev={c.previous?.out} cur={cur} tone="out" />
                  <BigStat label="You kept" value={c.net} cur={cur} tone="net" />
                </div>

                <div className="card p-5">
                  <h3 className="font-extrabold">By type</h3>
                  <ul className="mt-3 space-y-2">
                    {(Object.entries(c.byKind) as [Kind, number][])
                      .filter(([k]) => KINDS[k].flow === "in" || KINDS[k].flow === "out")
                      .sort((a, b) => b[1] - a[1])
                      .map(([k, v]) => (
                        <li key={k} className="flex items-center justify-between">
                          <span className="flex items-center gap-2"><span>{KINDS[k].emoji}</span>{kindLabel(k, settings.mode)}</span>
                          <span className="font-extrabold">{formatMoney(v, cur)}</span>
                        </li>
                      ))}
                  </ul>
                </div>

                {c.topSpending.length > 0 && (
                  <div className="card p-5">
                    <h3 className="font-extrabold">Where your money went</h3>
                    <ul className="mt-3 space-y-3">
                      {c.topSpending.map((s) => (
                        <li key={s.category}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="font-bold">{CATEGORY_BY_ID[s.category]?.emoji} {s.label}</span>
                            <span className="font-extrabold">{formatMoney(s.amount, cur)}</span>
                          </div>
                          <div className="h-3 w-full overflow-hidden rounded-full bg-line/60">
                            <div className="h-full rounded-full bg-coral" style={{ width: `${(s.amount / c.topSpending[0].amount) * 100}%` }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {c.budgets.length > 0 && (
                  <Link to="/budgets" className="card block p-5">
                    <h3 className="font-extrabold">Budgets</h3>
                    <ul className="mt-3 space-y-3">
                      {c.budgets.map((b) => (
                        <li key={b.category}>
                          <div className="mb-1 flex justify-between text-sm">
                            <span className="font-bold">{CATEGORY_BY_ID[b.category]?.emoji} {b.label}</span>
                            <span className={clsx("font-bold", b.spent > b.limit ? "text-coral" : "text-muted")}>
                              {formatMoney(b.spent, cur, { compact: true })} of {formatMoney(b.limit, cur, { compact: true })}
                            </span>
                          </div>
                          <ProgressBar value={b.spent} max={b.limit} />
                        </li>
                      ))}
                    </ul>
                  </Link>
                )}

                {(c.bestDay || c.owedToMe > 0 || c.iOwe > 0) && (
                  <div className="grid grid-cols-2 gap-2">
                    {c.bestDay && (
                      <Link to={`/day/${c.bestDay.date}`} className="card p-4">
                        <div className="text-xs font-bold text-muted">Best day</div>
                        <div className="font-extrabold">{shortDay(c.bestDay.date)}</div>
                        <div className="text-sm text-brand-dark">+{formatMoney(c.bestDay.amount, cur, { compact: true })}</div>
                      </Link>
                    )}
                    {(c.owedToMe > 0 || c.iOwe > 0) && (
                      <Link to="/owed" className="card p-4">
                        <div className="text-xs font-bold text-muted">Still owed</div>
                        {c.owedToMe > 0 && <div className="text-sm"><b>{formatMoney(c.owedToMe, cur, { compact: true })}</b> to you</div>}
                        {c.iOwe > 0 && <div className="text-sm"><b>{formatMoney(c.iOwe, cur, { compact: true })}</b> by you</div>}
                      </Link>
                    )}
                  </div>
                )}
              </section>
            );
          })}

          <p className="text-center text-sm font-bold text-muted">
            You wrote in Flowz on {stats.daysRecorded} of {stats.daysInMonth} days{stats.daysRecorded >= 20 ? " 🔥" : ""}.
          </p>
        </>
      )}
    </div>
  );
}

function BigStat({ label, value, prev, cur, tone }: { label: string; value: number; prev?: number; cur: Currency; tone: "in" | "out" | "net" }) {
  const change = prev && prev > 0 ? Math.round(((value - prev) / prev) * 100) : null;
  const good = tone === "in" ? (change ?? 0) >= 0 : (change ?? 0) <= 0;
  return (
    <div className="card p-3">
      <div className="text-xs font-bold text-muted">{label}</div>
      <div className={clsx("mt-0.5 text-lg font-extrabold", tone === "in" && "text-brand-dark", tone === "out" && "text-coral", tone === "net" && value < 0 && "text-coral")}>
        {formatMoney(value, cur, { compact: true })}
      </div>
      {change !== null && change !== 0 && (
        <div className={clsx("flex items-center text-xs font-bold", good ? "text-brand" : "text-coral")}>
          {change > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {Math.abs(change)}% vs last month
        </div>
      )}
    </div>
  );
}
