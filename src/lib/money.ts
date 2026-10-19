import { CATEGORY_BY_ID, KINDS, type Kind } from "./kinds";
import type { Currency, DebtContext } from "./parse";

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
    if (e.kind === "repaid_to_me") t.owedToMe = Math.max(0, t.owedToMe - e.amount);
    if (e.kind === "i_owe" && !e.settled_at) t.iOwe += e.amount;
    if (e.kind === "i_repaid") t.iOwe = Math.max(0, t.iOwe - e.amount);
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
  /** All debt lines ever written, so balances aren't limited to this month. */
  debts?: Entry[];
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

  const book = buildDebtBook(args.debts ?? entries);
  const people = {
    owesMe: book.owedToMe.filter((p) => p.balance > 0).map((p) => ({ name: p.name, amount: p.balance, currency: p.currency })),
    iOwe: book.iOwe.filter((p) => p.balance > 0).map((p) => ({ name: p.name, amount: p.balance, currency: p.currency })),
  };

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

// ---------- debt book ----------

export interface PersonBalance {
  key: string; // lower-case name, used to match lines to the same person
  name: string;
  currency: Currency;
  owed: number; // everything written as owed
  repaid: number; // paid back so far (repayment lines, plus lines ticked as paid)
  balance: number; // still to pay
  lines: Entry[]; // debt and repayment lines, newest first
}

export interface DebtBook {
  owedToMe: PersonBalance[];
  iOwe: PersonBalance[];
}

/** Each person's running balance: what was owed minus what was paid back. */
export function buildDebtBook(entries: Entry[]): DebtBook {
  const groups = { owedToMe: new Map<string, PersonBalance>(), iOwe: new Map<string, PersonBalance>() };
  const sorted = [...entries].sort((a, b) => b.entry_date.localeCompare(a.entry_date) || b.position - a.position);
  for (const e of sorted) {
    if (e.amount == null || !e.currency) continue;
    const side = e.kind === "owed_to_me" || e.kind === "repaid_to_me" ? "owedToMe" : e.kind === "i_owe" || e.kind === "i_repaid" ? "iOwe" : null;
    if (!side) continue;
    const name = e.person?.trim() || "Someone";
    const key = `${name.toLowerCase()}|${e.currency}`;
    const p = groups[side].get(key) ?? { key: name.toLowerCase(), name, currency: e.currency, owed: 0, repaid: 0, balance: 0, lines: [] };
    if (e.kind === "owed_to_me" || e.kind === "i_owe") {
      p.owed += e.amount;
      if (e.settled_at) p.repaid += e.amount;
    } else p.repaid += e.amount;
    p.balance = Math.max(0, Math.round((p.owed - p.repaid) * 100) / 100);
    p.lines.push(e);
    groups[side].set(key, p);
  }
  const order = (a: PersonBalance, b: PersonBalance) => b.balance - a.balance || a.name.localeCompare(b.name);
  return { owedToMe: [...groups.owedToMe.values()].sort(order), iOwe: [...groups.iOwe.values()].sort(order) };
}

/** The shape the line reader needs: who still owes what, by lower-case name. */
export function debtContext(book: DebtBook): DebtContext {
  const toMap = (list: PersonBalance[]) => {
    const m = new Map<string, number>();
    for (const p of list) if (p.balance > 0 && p.name !== "Someone") m.set(p.key, (m.get(p.key) ?? 0) + p.balance);
    return m;
  };
  return { owedToMe: toMap(book.owedToMe), iOwe: toMap(book.iOwe) };
}

/** Balance for one person after all the given lines, e.g. to show "Joy owes ₦20k now". */
export function balanceFor(book: DebtBook, side: "owedToMe" | "iOwe", person: string | null, currency: Currency | null) {
  if (!person || !currency) return null;
  const p = book[side].find((x) => x.key === person.toLowerCase() && x.currency === currency);
  return p ? p.balance : null;
}
