// Demo-only answers for "Ask Flowz". The live app sends questions to an AI; the demo answers
// common questions with simple rules over the same data, so the screen can be tried offline.

import { CATEGORY_BY_ID, KINDS } from "../lib/kinds";
import { buildDebtBook, formatMoney, type Entry } from "../lib/money";
import { monthKey, shortDay } from "../lib/dates";
import { periodOf } from "../lib/periods";
import { detectCategory, type Currency } from "../lib/parse";

function sumBy(entries: Entry[], test: (e: Entry) => boolean) {
  const out: Partial<Record<Currency, number>> = {};
  for (const e of entries) if (e.amount != null && e.currency && test(e)) out[e.currency] = (out[e.currency] ?? 0) + e.amount;
  return out;
}

function money(sums: Partial<Record<Currency, number>>) {
  const parts = (Object.entries(sums) as [Currency, number][]).map(([c, v]) => formatMoney(v, c));
  return parts.length ? parts.join(" and ") : formatMoney(0, "NGN");
}

export function demoAnswer(question: string, all: Entry[], today: string): string {
  const q = question.toLowerCase();
  const p = periodOf(q, today);
  p.label = /^\d|^[A-Z]|^Q/.test(p.label) ? `in ${p.label}` : p.label;
  const inPeriod = all.filter((e) => e.entry_date >= p.start && e.entry_date <= p.end);
  const flow = (e: Entry) => KINDS[e.kind].flow;

  // Debts
  if (/\bowe|owing|debt|borrow|credit|paid back|balance\b/.test(q)) {
    const mine = /\bi owe\b|do i owe|am i owing|i dey owe|my debts?/.test(q);
    const book = buildDebtBook(all);
    const open = (mine ? book.iOwe : book.owedToMe).filter((p) => p.balance > 0);
    if (!open.length) return mine ? "You don't owe anyone right now. 🎉" : "Nobody owes you money right now.";
    const lines = open.map((p) => `- ${p.name}: ${formatMoney(p.balance, p.currency)}${p.repaid > 0 ? ` (paid back ${formatMoney(p.repaid, p.currency)} of ${formatMoney(p.owed, p.currency)})` : ""}`);
    const total: Partial<Record<Currency, number>> = {};
    for (const p of open) total[p.currency] = (total[p.currency] ?? 0) + p.balance;
    return `${mine ? "You still owe:" : "These people still owe you:"}\n${lines.join("\n")}\nTotal: ${money(total)}.`;
  }

  // Compare with last month
  if (/better|worse|compare|than last|vs\.?|versus/.test(q)) {
    const lm = periodOf("last month", today);
    const prev = all.filter((e) => e.entry_date >= lm.start && e.entry_date <= lm.end);
    const now = all.filter((e) => e.entry_date >= `${monthKey(today)}-01` && e.entry_date <= today);
    const a = sumBy(now, (e) => flow(e) === "in").NGN ?? 0;
    const b = sumBy(prev, (e) => flow(e) === "in").NGN ?? 0;
    const so = sumBy(now, (e) => flow(e) === "out").NGN ?? 0;
    const sp = sumBy(prev, (e) => flow(e) === "out").NGN ?? 0;
    return `This month so far: ${formatMoney(a, "NGN")} came in and ${formatMoney(so, "NGN")} went out.\nAll of last month: ${formatMoney(b, "NGN")} in and ${formatMoney(sp, "NGN")} out.`;
  }

  // Best day
  if (/best day|busiest|highest sales|most sales|best sales/.test(q)) {
    const days = new Map<string, number>();
    for (const e of inPeriod) if (flow(e) === "in" && e.currency === "NGN") days.set(e.entry_date, (days.get(e.entry_date) ?? 0) + (e.amount ?? 0));
    const top = [...days.entries()].sort((x, y) => y[1] - x[1])[0];
    return top ? `Your best day ${p.label} was ${shortDay(top[0])}, with ${formatMoney(top[1], "NGN")} coming in.` : `Nothing came in ${p.label} yet.`;
  }

  // Biggest expense
  if (/biggest|largest|most expensive|highest (cost|expense|spend)/.test(q)) {
    const top = inPeriod.filter((e) => flow(e) === "out").sort((x, y) => (y.amount ?? 0) - (x.amount ?? 0))[0];
    return top ? `Your biggest cost ${p.label} was “${top.text}” on ${shortDay(top.entry_date)}.` : `You haven't written any spending ${p.label}.`;
  }

  // Spending on one thing
  const category = detectCategory(q);
  if (category && category !== "stock") {
    const s = sumBy(inPeriod, (e) => flow(e) === "out" && e.category === category);
    const label = CATEGORY_BY_ID[category]?.label.toLowerCase() ?? category;
    return `You spent ${money(s)} on ${label} ${p.label}.`;
  }

  if (/\bsales?|sold|sell|selling|income|made|earn|money in|came in|enter\b/.test(q)) {
    return `${p.label[0].toUpperCase()}${p.label.slice(1)}, ${money(sumBy(inPeriod, (e) => flow(e) === "in"))} came in.`;
  }

  if (/profit|kept|left|save|gain/.test(q)) {
    const i = sumBy(inPeriod, (e) => flow(e) === "in");
    const o = sumBy(inPeriod, (e) => flow(e) === "out");
    const curs = [...new Set([...Object.keys(i), ...Object.keys(o)])] as Currency[];
    const kept = Object.fromEntries(curs.map((c) => [c, (i[c] ?? 0) - (o[c] ?? 0)])) as Partial<Record<Currency, number>>;
    return `${p.label[0].toUpperCase()}${p.label.slice(1)}, you kept ${money(kept)} (money in minus money out).`;
  }

  if (/spen|expense|money out|cost|buy|bought/.test(q)) {
    const s = sumBy(inPeriod, (e) => flow(e) === "out");
    const byCat = new Map<string, number>();
    for (const e of inPeriod) if (flow(e) === "out" && e.currency === "NGN") byCat.set(e.category ?? "other", (byCat.get(e.category ?? "other") ?? 0) + (e.amount ?? 0));
    const top = [...byCat.entries()].sort((x, y) => y[1] - x[1])[0];
    return `You spent ${money(s)} ${p.label}.${top ? ` The most went on ${CATEGORY_BY_ID[top[0]]?.label.toLowerCase() ?? "other things"} (${formatMoney(top[1], "NGN")}).` : ""}`;
  }

  return "In this demo I can answer simple questions, like “How much did I spend on transport this month?”, “Who owes me money?” or “What was my best day?”. In the real app, the AI understands almost any question about your notebook.";
}
