// Simple account statements built from notebook lines: a Profit & Loss for a period and a
// Balance Sheet at a date, each with a plain check of how complete the data is.
//
// Basis: cash. Money counts when it is written as received or paid. Selling on credit becomes
// "owed to me" (shown on the balance sheet) and counts as money in when it is paid back.

import { CATEGORY_BY_ID, type Kind, type Mode } from "./kinds";
import { buildDebtBook, type Entry } from "./money";
import type { Currency } from "./parse";

/** Spending that belongs to the owner's personal life, not the business. */
export const PERSONAL_CATEGORIES = new Set(["family", "giving", "events", "personal", "school", "health", "food", "savings"]);

export interface Line {
  label: string;
  amount: number;
  note?: string;
}

export interface ProfitAndLoss {
  currency: Currency;
  mode: Mode;
  start: string;
  end: string;
  sales: number;
  collections: number; // money paid back by people who owed you
  income: Line[]; // sales + collections (business) / income lines (personal)
  totalIncome: number;
  stock: { opening: number | null; purchases: number; closing: number | null; cost: number };
  grossProfit: number;
  expenses: Line[];
  totalExpenses: number;
  netProfit: number;
  personal: Line[]; // business mode: owner's personal spending, not counted in profit
  totalPersonal: number;
  notCounted: Line[]; // money moves that are not profit or loss
}

export interface BalanceSheet {
  currency: Currency;
  asOf: string;
  cash: number;
  cashEstimated: boolean; // true when no starting cash was entered
  receivables: Line[];
  totalReceivables: number;
  stock: number | null;
  otherAssets: number | null;
  totalAssets: number;
  payables: Line[];
  totalPayables: number;
  otherLiabilities: number | null;
  totalLiabilities: number;
  worth: number; // assets minus liabilities
}

export interface Completeness {
  level: "good" | "partial" | "low";
  headline: string;
  notes: string[];
}

const pretty = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
const sum = (xs: { amount: number }[]) => Math.round(xs.reduce((s, x) => s + x.amount, 0) * 100) / 100;
const round = (n: number) => Math.round(n * 100) / 100;

function inRange(e: Entry, start: string, end: string) {
  return e.entry_date >= start && e.entry_date <= end;
}

function money(e: Entry, currency: Currency) {
  return e.amount != null && e.currency === currency;
}

function byCategory(entries: Entry[]): Line[] {
  const map = new Map<string, number>();
  for (const e of entries) map.set(e.category ?? "other", (map.get(e.category ?? "other") ?? 0) + (e.amount ?? 0));
  return [...map.entries()]
    .map(([id, amount]) => ({ label: CATEGORY_BY_ID[id]?.label ?? "Other", amount: round(amount) }))
    .sort((a, b) => b.amount - a.amount);
}

export function buildProfitAndLoss(
  all: Entry[],
  opts: { start: string; end: string; currency: Currency; mode: Mode; openingStock?: number | null; closingStock?: number | null },
): ProfitAndLoss {
  const { start, end, currency, mode } = opts;
  const rows = all.filter((e) => inRange(e, start, end) && money(e, currency));
  const of = (...kinds: Kind[]) => rows.filter((e) => kinds.includes(e.kind));
  const total = (...kinds: Kind[]) => round(of(...kinds).reduce((s, e) => s + (e.amount ?? 0), 0));

  const sales = total("sale");
  const collections = total("repaid_to_me");
  const purchases = total("purchase");
  const openingStock = opts.openingStock ?? null;
  const closingStock = opts.closingStock ?? null;
  const stockCost = round((openingStock ?? 0) + purchases - (closingStock ?? 0));

  const spending = of("expense");
  const business = mode === "business";
  const bizSpending = business ? spending.filter((e) => !PERSONAL_CATEGORIES.has(e.category ?? "other")) : spending;
  const personalSpending = business ? spending.filter((e) => PERSONAL_CATEGORIES.has(e.category ?? "other")) : [];

  const income: Line[] = business
    ? [
        { label: "Sales", amount: sales },
        ...(collections ? [{ label: "Money collected from people who owed you", amount: collections, note: "Sales made on credit, now paid" }] : []),
      ]
    : [
        { label: "Income (salary, sales, earnings)", amount: sales },
        ...(collections ? [{ label: "Money paid back to you", amount: collections }] : []),
        ...(total("gift_in") ? [{ label: "Gifts received", amount: total("gift_in") }] : []),
      ];
  const totalIncome = sum(income);

  const expenses = business ? byCategory(bizSpending) : byCategory([...spending, ...of("gift_out")]);
  if (!business && total("purchase")) expenses.push({ label: "Things you bought", amount: purchases });
  if (!business && total("i_repaid")) expenses.push({ label: "Debts you paid back", amount: total("i_repaid") });
  expenses.sort((a, b) => b.amount - a.amount);
  const totalExpenses = sum(expenses);

  const grossProfit = business ? round(totalIncome - stockCost) : totalIncome;
  const netProfit = round(grossProfit - totalExpenses);

  const personal: Line[] = business
    ? [...byCategory(personalSpending), ...(total("gift_out") ? [{ label: "Gifts given", amount: total("gift_out") }] : [])]
    : [];

  const notCounted: Line[] = [];
  const add = (label: string, amount: number) => amount && notCounted.push({ label, amount });
  if (business) {
    add("Gifts received (not business income)", total("gift_in"));
    add("Debts you paid back", total("i_repaid"));
  }
  add("New credit given / money lent (shown on the balance sheet)", total("owed_to_me"));
  add("New money you owe (shown on the balance sheet)", total("i_owe"));

  return {
    currency,
    mode,
    start,
    end,
    sales,
    collections,
    income,
    totalIncome,
    stock: { opening: openingStock, purchases, closing: closingStock, cost: stockCost },
    grossProfit,
    expenses,
    totalExpenses,
    netProfit,
    personal,
    totalPersonal: sum(personal),
    notCounted,
  };
}

export function buildBalanceSheet(
  all: Entry[],
  opts: { asOf: string; currency: Currency; openingCash?: number | null; stock?: number | null; otherAssets?: number | null; otherLiabilities?: number | null },
): BalanceSheet {
  const { asOf, currency } = opts;
  const upTo = all.filter((e) => e.entry_date <= asOf && money(e, currency));
  let flow = 0;
  for (const e of upTo) {
    if (["sale", "gift_in", "repaid_to_me"].includes(e.kind)) flow += e.amount!;
    if (["purchase", "expense", "gift_out", "i_repaid"].includes(e.kind)) flow -= e.amount!;
    // Money lent out leaves your hand; money borrowed comes into it.
    if (e.kind === "i_owe" && /\b(borrow|loan|lent me|borrowed)\b/i.test(e.text)) flow += e.amount!;
    if (e.kind === "owed_to_me" && /\b(lent|lend|borrow|loan)\b/i.test(e.text)) flow -= e.amount!;
  }
  const cash = round((opts.openingCash ?? 0) + flow);

  const book = buildDebtBook(upTo);
  const receivables = book.owedToMe.filter((p) => p.balance > 0).map((p) => ({ label: p.name, amount: p.balance }));
  const payables = book.iOwe.filter((p) => p.balance > 0).map((p) => ({ label: p.name, amount: p.balance }));
  const totalReceivables = sum(receivables);
  const totalPayables = sum(payables);
  const stock = opts.stock ?? null;
  const otherAssets = opts.otherAssets ?? null;
  const otherLiabilities = opts.otherLiabilities ?? null;
  const totalAssets = round(cash + totalReceivables + (stock ?? 0) + (otherAssets ?? 0));
  const totalLiabilities = round(totalPayables + (otherLiabilities ?? 0));

  return {
    currency,
    asOf,
    cash,
    cashEstimated: opts.openingCash == null,
    receivables,
    totalReceivables,
    stock,
    otherAssets,
    totalAssets,
    payables,
    totalPayables,
    otherLiabilities,
    totalLiabilities,
    worth: round(totalAssets - totalLiabilities),
  };
}

/** How far the statement can be trusted, in plain words. */
export function checkCompleteness(
  all: Entry[],
  opts: {
    kind: "pl" | "bs";
    start: string;
    end: string;
    currency: Currency;
    mode: Mode;
    today: string;
    openingStock?: number | null;
    closingStock?: number | null;
    openingCash?: number | null;
  },
): Completeness {
  const notes: string[] = [];
  let score = 0; // higher = more problems
  const written = all.filter((e) => e.text.trim());
  const first = written.reduce<string | null>((min, e) => (!min || e.entry_date < min ? e.entry_date : min), null);
  const end = opts.end > opts.today ? opts.today : opts.end;

  if (!first) {
    return { level: "low", headline: "There's nothing in your notebook yet.", notes: ["Write what you sell, buy and spend each day, and your statements will fill in."] };
  }

  if (opts.kind === "pl") {
    const start = opts.start < first ? first : opts.start;
    if (opts.start < first) {
      notes.push(`Your notebook starts on ${pretty(first)}, so nothing before that day is included.`);
      score += 1;
    }
    const days = Math.max(1, Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000) + 1);
    const recorded = new Set(written.filter((e) => e.entry_date >= start && e.entry_date <= end).map((e) => e.entry_date)).size;
    const share = recorded / days;
    if (recorded === 0) {
      return { level: "low", headline: "Nothing was written in this period.", notes: ["Pick a period when you used Flowz, or write your sales and spending for those days."] };
    }
    if (share < 0.6) {
      notes.push(`You wrote in Flowz on ${recorded} of ${days} days. Days with nothing written may be missing sales or spending.`);
      score += share < 0.25 ? 4 : share < 0.4 ? 3 : 2;
    } else if (share < 0.9) {
      notes.push(`You wrote in Flowz on ${recorded} of ${days} days.`);
      score += 1;
    }

    const period = all.filter((e) => inRange(e, start, end));
    const priced = period.filter((e) => money(e, opts.currency));
    if (opts.mode === "business" && !priced.some((e) => e.kind === "sale" || e.kind === "repaid_to_me")) {
      notes.push("No sales were written in this period.");
      score += 2;
    }
    if (opts.mode === "business" && priced.some((e) => e.kind === "purchase") && opts.closingStock == null) {
      notes.push("Stock left at the end isn't entered, so profit assumes everything you bought was sold. Enter your closing stock value for a truer profit.");
      score += 1;
    }
    if (opts.mode === "business" && opts.openingStock == null && opts.start <= first) {
      // first period: opening stock is usually not zero
      notes.push("Stock you already had at the start isn't entered.");
    }
  } else {
    if (opts.openingCash == null) {
      notes.push(`Cash is worked out from what you wrote since ${pretty(first)}. Enter the cash you had that day for a true cash figure.`);
      score += 2;
    }
    notes.push("Stock and things you own (equipment, a shop, a motorbike) only appear if you enter their value.");
  }

  const unclear = all.filter((e) => inRange(e, opts.kind === "pl" ? opts.start : "0000-01-01", end) && e.kind === "note" && /\d/.test(e.text)).length;
  if (unclear) {
    notes.push(`${unclear} line${unclear === 1 ? " has" : "s have"} numbers but wasn't counted as money. Check ${unclear === 1 ? "it" : "them"} on your pages.`);
    score += unclear > 3 ? 2 : 1;
  }
  const nameless = all.filter((e) => e.entry_date <= end && ["owed_to_me", "i_owe", "repaid_to_me", "i_repaid"].includes(e.kind) && !e.person).length;
  if (nameless) {
    notes.push(`${nameless} debt line${nameless === 1 ? " has" : "s have"} no name, so ${nameless === 1 ? "it" : "they"} can't be matched to a person's balance.`);
    score += 1;
  }
  const other = all.some((e) => e.entry_date <= end && e.amount != null && e.currency && e.currency !== opts.currency);
  if (other) notes.push(`You also have ${opts.currency === "NGN" ? "dollar" : "naira"} lines. They are in a separate statement; switch currency above.`);

  const level = score >= 4 ? "low" : score >= 1 ? "partial" : "good";
  const headline =
    level === "good"
      ? "Your notebook looks complete for this statement."
      : level === "partial"
        ? "This statement is a good guide, but some things are missing."
        : "There isn't enough in your notebook for an accurate statement yet.";
  return { level, headline, notes };
}
