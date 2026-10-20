import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronLeft, Copy, Info, Printer } from "lucide-react";
import clsx from "clsx";
import { useUser } from "@/hooks/useAuth";
import { listAllEntries } from "@/lib/api";
import { fromISODate, todayISO } from "@/lib/dates";
import { CURRENCY_SYMBOL, formatMoney, type Entry } from "@/lib/money";
import { parseLine, type Currency } from "@/lib/parse";
import { periodOf } from "@/lib/periods";
import {
  buildBalanceSheet,
  buildProfitAndLoss,
  checkCompleteness,
  type BalanceSheet,
  type Completeness,
  type Line,
  type ProfitAndLoss,
} from "@/lib/statements";
import { ErrorNote, Spinner } from "@/components/ui";

type Kind = "pl" | "bs";
type Inputs = { openingStock: string; closingStock: string; openingCash: string; stock: string; otherAssets: string; otherLiabilities: string };

const DEMO = import.meta.env.MODE === "demo";
const PRESETS = ["this month", "last month", "this quarter", "last quarter", "this year", "last year"];
const INPUTS_KEY = "flowz:statement-inputs";
const EMPTY: Inputs = { openingStock: "", closingStock: "", openingCash: "", stock: "", otherAssets: "", otherLiabilities: "" };

const longDate = (d: string) => fromISODate(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

function amountOf(text: string, cur: Currency) {
  if (!text.trim()) return null;
  return parseLine(text, cur).amount ?? null;
}

export default function Statements() {
  const { userId, settings } = useUser();
  const [params, setParams] = useSearchParams();
  const today = todayISO();
  const kind: Kind = params.get("type") === "bs" ? "bs" : "pl";
  const fallback = periodOf("this month", today);
  const start = params.get("start") ?? fallback.start;
  const end = params.get("end") ?? fallback.end;

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>(settings.default_currency);
  const [inputs, setInputs] = useState<Inputs>(() => {
    try {
      return { ...EMPTY, ...JSON.parse(localStorage.getItem(`${INPUTS_KEY}:${userId}`) ?? "{}") };
    } catch {
      return EMPTY;
    }
  });
  const [showInputs, setShowInputs] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(`${INPUTS_KEY}:${userId}`, JSON.stringify(inputs));
    } catch {
      // only a convenience
    }
  }, [inputs, userId]);

  useEffect(() => {
    setLoading(true);
    listAllEntries(end > today ? end : today)
      .then(setEntries)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [end, today]);

  const currencies = useMemo(() => {
    const set = new Set(entries.filter((e) => e.amount != null && e.currency).map((e) => e.currency as Currency));
    return set.size ? [...set] : [settings.default_currency];
  }, [entries, settings.default_currency]);

  const nums = {
    openingStock: amountOf(inputs.openingStock, currency),
    closingStock: amountOf(inputs.closingStock, currency),
    openingCash: amountOf(inputs.openingCash, currency),
    stock: amountOf(inputs.stock, currency),
    otherAssets: amountOf(inputs.otherAssets, currency),
    otherLiabilities: amountOf(inputs.otherLiabilities, currency),
  };

  const pl = useMemo(
    () => buildProfitAndLoss(entries, { start, end, currency, mode: settings.mode, openingStock: nums.openingStock, closingStock: nums.closingStock }),
    [entries, start, end, currency, settings.mode, nums.openingStock, nums.closingStock],
  );
  const bs = useMemo(
    () =>
      buildBalanceSheet(entries, {
        asOf: end > today ? today : end,
        currency,
        openingCash: nums.openingCash,
        stock: nums.stock ?? nums.closingStock,
        otherAssets: nums.otherAssets,
        otherLiabilities: nums.otherLiabilities,
      }),
    [entries, end, today, currency, nums.openingCash, nums.stock, nums.closingStock, nums.otherAssets, nums.otherLiabilities],
  );
  const check = useMemo(
    () =>
      checkCompleteness(entries, {
        kind,
        start,
        end,
        currency,
        mode: settings.mode,
        today,
        openingStock: nums.openingStock,
        closingStock: nums.closingStock,
        openingCash: nums.openingCash,
      }),
    [entries, kind, start, end, currency, settings.mode, today, nums.openingStock, nums.closingStock, nums.openingCash],
  );

  const set = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => next.set(k, v));
    setParams(next, { replace: true });
  };
  const pick = (words: string) => {
    const p = periodOf(words, today);
    set({ start: p.start, end: p.end });
  };

  const owner = settings.business_name || settings.display_name;
  const title = kind === "pl" ? (settings.mode === "business" ? "Profit and Loss Statement" : "Income and Spending Statement") : "Balance Sheet";
  const periodText = kind === "pl" ? `${longDate(start)} to ${longDate(end > today ? today : end)}` : `As at ${longDate(end > today ? today : end)}`;

  async function copyText() {
    const text = kind === "pl" ? plText(pl, title, owner, periodText) : bsText(bs, owner, periodText);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy on this device.");
    }
  }

  return (
    <div className="space-y-4 pt-1">
      <div className="no-print flex items-center gap-2">
        <Link to="/month" className="rounded-full p-2 hover:bg-line/50" aria-label="Back to summary">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl font-extrabold">Statements</h1>
      </div>

      <div className="no-print grid grid-cols-2 gap-1 rounded-2xl bg-line/50 p-1">
        {([
          ["pl", settings.mode === "business" ? "Profit & Loss" : "Income & Spending"],
          ["bs", "Balance Sheet"],
        ] as const).map(([v, label]) => (
          <button key={v} onClick={() => set({ type: v })} className={clsx("rounded-xl py-2.5 font-extrabold transition", kind === v ? "bg-white shadow-card" : "text-muted")}>
            {label}
          </button>
        ))}
      </div>

      <div className="no-print card space-y-3 p-4">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const r = periodOf(p, today);
            const active = r.start === start && r.end === end;
            return (
              <button key={p} onClick={() => pick(p)} className={clsx("rounded-full border-2 px-3 py-1.5 text-sm font-bold capitalize", active ? "border-brand bg-brand-soft" : "border-line bg-white")}>
                {p}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {kind === "pl" && (
            <div>
              <label className="label" htmlFor="st-start">From</label>
              <input id="st-start" type="date" className="field py-2" value={start} max={end} onChange={(e) => e.target.value && set({ start: e.target.value })} />
            </div>
          )}
          <div className={clsx(kind === "bs" && "col-span-2")}>
            <label className="label" htmlFor="st-end">{kind === "pl" ? "To" : "As at"}</label>
            <input id="st-end" type="date" className="field py-2" value={end} min={kind === "pl" ? start : undefined} onChange={(e) => e.target.value && set({ end: e.target.value })} />
          </div>
        </div>
        {currencies.length > 1 && (
          <div className="flex gap-2">
            {currencies.map((c) => (
              <button key={c} onClick={() => setCurrency(c)} className={clsx("rounded-full border-2 px-3 py-1.5 text-sm font-bold", currency === c ? "border-brand bg-brand-soft" : "border-line bg-white")}>
                {CURRENCY_SYMBOL[c]} {c === "NGN" ? "Naira" : "Dollars"}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}

      {loading ? (
        <div className="grid h-48 place-items-center text-brand"><Spinner className="h-8 w-8" /></div>
      ) : (
        <>
          <CompletenessBox check={check} />

          <div className="no-print card overflow-hidden">
            <button className="flex w-full items-center justify-between px-4 py-3 text-left font-extrabold" onClick={() => setShowInputs((s) => !s)}>
              <span>Add what Flowz can't see</span>
              <ChevronDown className={clsx("h-5 w-5 transition", showInputs && "rotate-180")} />
            </button>
            {showInputs && (
              <div className="grid gap-3 border-t border-line p-4 sm:grid-cols-2">
                {kind === "pl" && settings.mode === "business" && (
                  <>
                    <MoneyInput id="in-os" label="Stock you had at the start" value={inputs.openingStock} onChange={(v) => setInputs({ ...inputs, openingStock: v })} cur={currency} />
                    <MoneyInput id="in-cs" label="Stock left at the end" value={inputs.closingStock} onChange={(v) => setInputs({ ...inputs, closingStock: v })} cur={currency} />
                  </>
                )}
                {kind === "bs" && (
                  <>
                    <MoneyInput id="in-oc" label="Cash you had on your first day in Flowz" value={inputs.openingCash} onChange={(v) => setInputs({ ...inputs, openingCash: v })} cur={currency} />
                    <MoneyInput id="in-st" label="Value of stock you have now" value={inputs.stock} onChange={(v) => setInputs({ ...inputs, stock: v })} cur={currency} />
                    <MoneyInput id="in-oa" label="Things you own (equipment, shop, bike)" value={inputs.otherAssets} onChange={(v) => setInputs({ ...inputs, otherAssets: v })} cur={currency} />
                    <MoneyInput id="in-ol" label="Other debts not in Flowz (loans)" value={inputs.otherLiabilities} onChange={(v) => setInputs({ ...inputs, otherLiabilities: v })} cur={currency} />
                  </>
                )}
                {kind === "pl" && settings.mode !== "business" && <p className="text-sm text-muted">Nothing extra is needed for this statement.</p>}
                <p className="text-xs text-muted sm:col-span-2">Saved on this phone only, and used only for your statements.</p>
              </div>
            )}
          </div>

          <section className="print-sheet card p-5">
            <header className="border-b-2 border-ink pb-3">
              <div className="text-sm font-bold text-muted">{owner}</div>
              <h2 className="text-xl font-extrabold">{title}</h2>
              <div className="text-sm text-muted">{periodText} · {currency === "NGN" ? "Naira (₦)" : "US dollars ($)"}</div>
            </header>
            {kind === "pl" ? <PLTable pl={pl} /> : <BSTable bs={bs} />}
            <footer className="mt-5 space-y-1 border-t border-line pt-3 text-xs text-muted">
              <p>
                {kind === "pl"
                  ? "Cash basis: money is counted when you wrote it as received or paid. Sales on credit count when they are paid back."
                  : bs.cashEstimated
                    ? "Cash is worked out from your notebook since your first day in Flowz, without the cash you started with."
                    : "Cash is the cash you started with plus everything written in your notebook since."}
              </p>
              <p>Prepared with Flowz · Your interactive account notebook · {longDate(today)}</p>
            </footer>
          </section>

          <div className="no-print grid grid-cols-2 gap-2">
            <button className="btn-soft" onClick={copyText}>
              <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy as text"}
            </button>
            {!DEMO && (
              <button className="btn-soft" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Print or save PDF
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MoneyInput({ id, label, value, onChange, cur }: { id: string; label: string; value: string; onChange: (v: string) => void; cur: Currency }) {
  const amount = amountOf(value, cur);
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <input id={id} inputMode="decimal" className="field py-2" placeholder="e.g. 50k" value={value} onChange={(e) => onChange(e.target.value)} />
      {amount != null && <p className="mt-1 text-xs font-bold text-muted">{formatMoney(amount, cur)}</p>}
    </div>
  );
}

function CompletenessBox({ check }: { check: Completeness }) {
  const Icon = check.level === "good" ? CheckCircle2 : check.level === "partial" ? Info : AlertTriangle;
  return (
    <div
      className={clsx(
        "no-print rounded-3xl p-4",
        check.level === "good" && "bg-brand-soft text-brand-dark",
        check.level === "partial" && "bg-sun-soft text-amber-800",
        check.level === "low" && "bg-coral-soft text-coral",
      )}
    >
      <div className="flex items-start gap-2 font-extrabold">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" /> {check.headline}
      </div>
      {check.notes.length > 0 && (
        <ul className="mt-2 space-y-1 pl-7 text-sm text-ink">
          {check.notes.map((n, i) => (
            <li key={i} className="list-disc">{n}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Row({ label, amount, cur, bold, indent, note, negative }: { label: string; amount: number | null; cur: Currency; bold?: boolean; indent?: boolean; note?: string; negative?: boolean }) {
  return (
    <div className={clsx("flex items-baseline justify-between gap-4 py-1.5", bold && "font-extrabold", indent && "pl-4")}>
      <span className="min-w-0">
        {label}
        {note && <span className="block text-xs font-normal text-muted">{note}</span>}
      </span>
      <span className="shrink-0 tabular-nums">
        {amount == null ? <span className="text-muted">not entered</span> : negative && amount ? `(${formatMoney(amount, cur)})` : formatMoney(amount, cur)}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-4">
      <div className="mb-1 text-xs font-extrabold uppercase tracking-wide text-muted">{title}</div>
      {children}
    </div>
  );
}

function Total({ label, amount, cur, strong }: { label: string; amount: number; cur: Currency; strong?: boolean }) {
  return (
    <div className={clsx("mt-1 flex justify-between border-t border-line pt-2 font-extrabold", strong && "border-t-2 border-ink text-lg")}>
      <span>{label}</span>
      <span className={clsx("tabular-nums", amount < 0 && "text-coral")}>{formatMoney(amount, cur)}</span>
    </div>
  );
}

function lines(list: Line[], cur: Currency, negative?: boolean) {
  return list.length === 0 ? <Row label="None written" amount={0} cur={cur} indent /> : list.map((l) => <Row key={l.label} label={l.label} amount={l.amount} cur={cur} note={l.note} indent negative={negative} />);
}

function PLTable({ pl }: { pl: ProfitAndLoss }) {
  const c = pl.currency;
  const business = pl.mode === "business";
  return (
    <div>
      <Section title={business ? "Income" : "Money in"}>
        {lines(pl.income, c)}
        <Total label={business ? "Total income" : "Total money in"} amount={pl.totalIncome} cur={c} />
      </Section>
      {business && (
        <Section title="Cost of stock sold">
          <Row label="Stock at the start" amount={pl.stock.opening} cur={c} indent />
          <Row label="Stock bought" amount={pl.stock.purchases} cur={c} indent />
          <Row label="Less: stock left at the end" amount={pl.stock.closing} cur={c} indent negative />
          <Total label="Cost of stock sold" amount={pl.stock.cost} cur={c} />
          <Total label="Gross profit" amount={pl.grossProfit} cur={c} />
        </Section>
      )}
      <Section title={business ? "Business expenses" : "Spending"}>
        {lines(pl.expenses, c)}
        <Total label={business ? "Total expenses" : "Total spending"} amount={pl.totalExpenses} cur={c} />
      </Section>
      <Total label={business ? (pl.netProfit >= 0 ? "Net profit" : "Net loss") : "What you kept"} amount={pl.netProfit} cur={c} strong />
      {business && pl.personal.length > 0 && (
        <Section title="Personal spending (not counted in profit)">
          {lines(pl.personal, c)}
          <Total label="Taken out for personal use" amount={pl.totalPersonal} cur={c} />
        </Section>
      )}
      {pl.notCounted.length > 0 && (
        <Section title="Not part of profit or loss">
          {lines(pl.notCounted, c)}
        </Section>
      )}
    </div>
  );
}

function BSTable({ bs }: { bs: BalanceSheet }) {
  const c = bs.currency;
  return (
    <div>
      <Section title="What you have (assets)">
        <Row label="Cash" amount={bs.cash} cur={c} indent note={bs.cashEstimated ? "Estimated from your notebook" : undefined} />
        <Row label="Money people owe you" amount={bs.totalReceivables} cur={c} indent />
        {bs.receivables.map((r) => <Row key={r.label} label={`· ${r.label}`} amount={r.amount} cur={c} indent />)}
        <Row label="Stock" amount={bs.stock} cur={c} indent />
        <Row label="Things you own" amount={bs.otherAssets} cur={c} indent />
        <Total label="Total assets" amount={bs.totalAssets} cur={c} />
      </Section>
      <Section title="What you owe (liabilities)">
        <Row label="Money you owe people" amount={bs.totalPayables} cur={c} indent />
        {bs.payables.map((r) => <Row key={r.label} label={`· ${r.label}`} amount={r.amount} cur={c} indent />)}
        <Row label="Other debts" amount={bs.otherLiabilities} cur={c} indent />
        <Total label="Total liabilities" amount={bs.totalLiabilities} cur={c} />
      </Section>
      <Total label="What it's worth (assets − liabilities)" amount={bs.worth} cur={c} strong />
    </div>
  );
}

function plText(pl: ProfitAndLoss, title: string, owner: string, period: string) {
  const c = pl.currency;
  const m = (n: number | null) => (n == null ? "not entered" : formatMoney(n, c));
  const out = [owner, title, period, ""];
  out.push("INCOME", ...pl.income.map((l) => `  ${l.label}: ${m(l.amount)}`), `  Total: ${m(pl.totalIncome)}`, "");
  if (pl.mode === "business") {
    out.push("COST OF STOCK SOLD", `  Stock at start: ${m(pl.stock.opening)}`, `  Stock bought: ${m(pl.stock.purchases)}`, `  Stock left at end: ${m(pl.stock.closing)}`, `  Cost of stock sold: ${m(pl.stock.cost)}`, `GROSS PROFIT: ${m(pl.grossProfit)}`, "");
  }
  out.push(pl.mode === "business" ? "EXPENSES" : "SPENDING", ...pl.expenses.map((l) => `  ${l.label}: ${m(l.amount)}`), `  Total: ${m(pl.totalExpenses)}`, "");
  out.push(`${pl.mode === "business" ? (pl.netProfit >= 0 ? "NET PROFIT" : "NET LOSS") : "WHAT YOU KEPT"}: ${m(pl.netProfit)}`);
  if (pl.personal.length) out.push("", "Personal spending (not in profit):", ...pl.personal.map((l) => `  ${l.label}: ${m(l.amount)}`));
  out.push("", "Prepared with Flowz · Your interactive account notebook");
  return out.join("\n");
}

function bsText(bs: BalanceSheet, owner: string, period: string) {
  const c = bs.currency;
  const m = (n: number | null) => (n == null ? "not entered" : formatMoney(n, c));
  return [
    owner,
    "Balance Sheet",
    period,
    "",
    "ASSETS",
    `  Cash: ${m(bs.cash)}${bs.cashEstimated ? " (estimated)" : ""}`,
    `  Money people owe you: ${m(bs.totalReceivables)}`,
    ...bs.receivables.map((r) => `    ${r.label}: ${m(r.amount)}`),
    `  Stock: ${m(bs.stock)}`,
    `  Things you own: ${m(bs.otherAssets)}`,
    `  Total assets: ${m(bs.totalAssets)}`,
    "",
    "LIABILITIES",
    `  Money you owe people: ${m(bs.totalPayables)}`,
    ...bs.payables.map((r) => `    ${r.label}: ${m(r.amount)}`),
    `  Other debts: ${m(bs.otherLiabilities)}`,
    `  Total liabilities: ${m(bs.totalLiabilities)}`,
    "",
    `WHAT IT'S WORTH: ${m(bs.worth)}`,
    "",
    "Prepared with Flowz · Your interactive account notebook",
  ].join("\n");
}
