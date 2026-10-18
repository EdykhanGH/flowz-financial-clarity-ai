import { CATEGORY_BY_ID, KINDS, type Kind } from "./kinds";
import type { Currency } from "./parse";

export const CURRENCIES: Currency[] = ["NGN", "USD"];
export const CURRENCY_SYMBOL: Record<Currency, string> = { NGN: "₦", USD: "$" };

export interface Entry {
  id: string;
  user_id?: string;
  entry_date: string; // yyyy-mm-dd
  position: number;
  text: string;
  amount: number | null;
  currency: Currency | null;
  kind: Kind;
  category: string | null;
  person: string | null;
  kind_locked: boolean;
  settled_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  currency: Currency;
}

export function formatMoney(amount: number, currency: Currency, opts: { compact?: boolean; sign?: boolean } = {}) {
  const abs = Math.abs(amount);
  let body: string;
  if (opts.compact && abs >= 1_000_000) body = `${trim(abs / 1_000_000)}m`;
  else if (opts.compact && abs >= 10_000) body = `${trim(abs / 1_000)}k`;
  else body = abs.toLocaleString("en-NG", { maximumFractionDigits: 2, minimumFractionDigits: Number.isInteger(abs) ? 0 : 2 });
  const sign = amount < 0 ? "−" : opts.sign && amount > 0 ? "+" : "";
  return `${sign}${CURRENCY_SYMBOL[currency]}${body}`;
}

function trim(n: number) {
  return n.toFixed(1).replace(/\.0$/, "");
}

export interface Totals {
  in: number;
  out: number;
  net: number;
  owedToMe: number;
  iOwe: number;
  count: number;
}

const emptyTotals = (): Totals => ({ in: 0, out: 0, net: 0, owedToMe: 0, iOwe: 0, count: 0 });

/** Totals per currency. Naira and dollars are never added together. */
export function totalsByCurrency(entries: Entry[]): Partial<Record<Currency, Totals>> {
  const out: Partial<Record<Currency, Totals>> = {};
  for (const e of entries) {
    if (e.amount == null || !e.currency) continue;
    const t = (out[e.currency] ??= emptyTotals());
    const flow = KINDS[e.kind].flow;
    t.count++;
    if (flow === "in") t.in += e.amount;
    if (flow === "out") t.out += e.amount;
    if (e.kind === "owed_to_me" && !e.settled_at) t.owedToMe += e.amount;
    if (e.kind === "i_owe" && !e.settled_at) t.iOwe += e.amount;
    t.net = t.in - t.out;
  }
  return out;
}

export interface MonthStats {
  month: string; // yyyy-mm
  mode: string;
  currencies: Partial<
    Record<
      Currency,
      Totals & {
        previous: { in: number; out: number } | null;
        byKind: Partial<Record<Kind, number>>;
        topSpending: { category: string; label: string; amount: number; previous: number }[];
        budgets: { category: string; label: string; limit: number; spent: number }[];
        bestDay: { date: string; amount: number } | null;
        biggestSpendDay: { date: string; amount: number } | null;
      }
    >
  >;
  daysRecorded: number;
  daysInMonth: number;
  daysLeft: number;
  people: { owesMe: { name: string; amount: number; currency: Currency }[]; iOwe: { name: string; amount: number; currency: Currency }[] };
}

export function buildMonthStats(args: {
  month: string;
  mode: string;
  entries: Entry[];
  previousEntries: Entry[];
  budgets: Budget[];
  today: Date;
}): MonthStats {
  const { month, mode, entries, previousEntries, budgets, today } = args;
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const isCurrent = today.getFullYear() === y && today.getMonth() + 1 === m;
  const daysLeft = isCurrent ? daysInMonth - today.getDate() : 0;

  const totals = totalsByCurrency(entries);
  const prevTotals = totalsByCurrency(previousEntries);
  const currencies: MonthStats["currencies"] = {};

  for (const cur of Object.keys(totals) as Currency[]) {
    const mine = entries.filter((e) => e.currency === cur && e.amount != null);
    const prevMine = previousEntries.filter((e) => e.currency === cur && e.amount != null);

    const byKind: Partial<Record<Kind, number>> = {};
    for (const e of mine) byKind[e.kind] = (byKind[e.kind] ?? 0) + (e.amount ?? 0);

    const spendBy = (list: Entry[]) => {
      const map: Record<string, number> = {};
      for (const e of list) {
        if (KINDS[e.kind].flow !== "out") continue;
        const key = e.category ?? "other";
        map[key] = (map[key] ?? 0) + (e.amount ?? 0);
      }
      return map;
    };
    const spend = spendBy(mine);
    const prevSpend = spendBy(prevMine);

    const topSpending = Object.entries(spend)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({
        category,
        label: CATEGORY_BY_ID[category]?.label ?? "Other",
        amount,
        previous: prevSpend[category] ?? 0,
      }));

    const byDay = (flow: "in" | "out") => {
      const map: Record<string, number> = {};
      for (const e of mine) if (KINDS[e.kind].flow === flow) map[e.entry_date] = (map[e.entry_date] ?? 0) + (e.amount ?? 0);
      const top = Object.entries(map).sort((a, b) => b[1] - a[1])[0];
      return top ? { date: top[0], amount: top[1] } : null;
    };

    const prev = prevTotals[cur];
    currencies[cur] = {
      ...totals[cur]!,
      previous: prev ? { in: prev.in, out: prev.out } : null,
      byKind,
      topSpending,
      budgets: budgets
        .filter((b) => b.currency === cur)
        .map((b) => ({ category: b.category, label: CATEGORY_BY_ID[b.category]?.label ?? "Other", limit: b.amount, spent: spend[b.category] ?? 0 })),
      bestDay: byDay("in"),
      biggestSpendDay: byDay("out"),
    };
  }

  const people = { owesMe: [] as MonthStats["people"]["owesMe"], iOwe: [] as MonthStats["people"]["iOwe"] };
  for (const e of entries) {
    if (e.settled_at || e.amount == null || !e.currency) continue;
    const name = e.person ?? "Someone";
    if (e.kind === "owed_to_me") people.owesMe.push({ name, amount: e.amount, currency: e.currency });
    if (e.kind === "i_owe") people.iOwe.push({ name, amount: e.amount, currency: e.currency });
  }

  return {
    month,
    mode,
    currencies,
    daysRecorded: new Set(entries.filter((e) => e.text.trim()).map((e) => e.entry_date)).size,
    daysInMonth,
    daysLeft,
    people,
  };
}
