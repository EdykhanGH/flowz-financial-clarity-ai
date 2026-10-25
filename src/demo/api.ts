// Demo version of src/lib/api.ts with the same functions, backed by the browser-only store.

import type { BankStatement, Settings, Summary } from "../lib/api";
import { cashDirection, type BankRule, type BankTxn } from "../lib/bankMatch";
import { statementPeriod, withFingerprints, type ReadStatement, type StatementTxn } from "../lib/bankStatement";
import { addDays, todayISO } from "../lib/dates";
import { formatMoney, type Budget, type Entry, type MonthStats } from "../lib/money";
import type { Currency } from "../lib/parse";
import { load, save, seedBudgets, seedEntries, seedItems } from "./store";
import type { InventoryItem } from "../lib/inventory";
import { demoAnswer } from "./ask";
import { DEBT_KINDS } from "../lib/kinds";

export type { BankStatement, Settings, Summary };
export type { ChatMessage, AiReading, AiStatementPart } from "../lib/api";

const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms));
const byDateThenPosition = (a: Entry, b: Entry) => a.entry_date.localeCompare(b.entry_date) || a.position - b.position;

export async function getSettings(): Promise<Settings | null> {
  await wait();
  return load().settings;
}

export async function saveSettings(userId: string, values: Partial<Omit<Settings, "user_id">>) {
  await wait();
  const data = load();
  const firstTime = !data.settings;
  const settings = {
    display_name: "",
    business_name: null,
    mode: "personal",
    default_currency: "NGN",
    reminder_enabled: true,
    reminder_time: "20:00:00",
    time_zone: "Africa/Lagos",
    ...data.settings,
    ...values,
    user_id: userId,
  } as Settings;
  save({
    ...data,
    settings,
    entries: firstTime ? seedEntries(userId, settings.default_currency) : data.entries,
    budgets: firstTime ? seedBudgets(settings.default_currency) : data.budgets,
    items: firstTime ? seedItems(settings.default_currency) : data.items,
  });
  return settings;
}

export async function savePushSubscription(_userId: string, _sub: unknown) {}

export async function deletePushSubscription(_endpoint: string) {}

export async function hasEntriesOn(date: string): Promise<boolean> {
  await wait(50);
  return load().entries.some((e) => e.entry_date === date && e.text.trim());
}

export async function listEntries(start: string, end: string): Promise<Entry[]> {
  await wait();
  return load().entries.filter((e) => e.entry_date >= start && e.entry_date <= end).sort(byDateThenPosition);
}

export async function listAllEntries(end: string): Promise<Entry[]> {
  await wait();
  return load().entries.filter((e) => e.entry_date <= end).sort(byDateThenPosition);
}

export async function upsertEntries(rows: Entry[]) {
  await wait();
  const data = load();
  const now = new Date().toISOString();
  const byId = new Map(data.entries.map((e) => [e.id, e]));
  for (const r of rows) byId.set(r.id, { ...byId.get(r.id), ...r, updated_at: now, created_at: byId.get(r.id)?.created_at ?? now });
  save({ ...data, entries: [...byId.values()] });
}

export async function deleteEntries(ids: string[]) {
  await wait();
  const data = load();
  save({ ...data, entries: data.entries.filter((e) => !ids.includes(e.id)) });
}

export async function searchEntries(q: string): Promise<Entry[]> {
  await wait();
  const term = q.trim().toLowerCase();
  if (!term) return [];
  return load()
    .entries.filter((e) => e.text.toLowerCase().includes(term))
    .sort((a, b) => b.entry_date.localeCompare(a.entry_date))
    .slice(0, 100);
}

export async function listDebts(): Promise<Entry[]> {
  await wait();
  return load()
    .entries.filter((e) => DEBT_KINDS.includes(e.kind) && e.amount != null)
    .sort((a, b) => b.entry_date.localeCompare(a.entry_date));
}

export async function setSettled(id: string, settled: boolean) {
  await wait();
  const data = load();
  save({
    ...data,
    entries: data.entries.map((e) => (e.id === id ? { ...e, settled_at: settled ? new Date().toISOString() : null } : e)),
  });
}

export async function listBudgets(): Promise<Budget[]> {
  await wait();
  return load().budgets;
}

export async function saveBudget(_userId: string, b: Omit<Budget, "id"> & { id?: string }) {
  await wait();
  const data = load();
  const others = data.budgets.filter((x) => x.id !== b.id && !(x.category === b.category && x.currency === b.currency));
  save({ ...data, budgets: [...others, { ...b, id: b.id ?? crypto.randomUUID() }] });
}

export async function deleteBudget(id: string) {
  await wait();
  const data = load();
  save({ ...data, budgets: data.budgets.filter((b) => b.id !== id) });
}

export async function getSummary(month: string): Promise<Summary | null> {
  await wait();
  return load().summaries[month] ?? null;
}

/**
 * The real app asks Claude to write this. The demo writes a similar summary on the device
 * from the same numbers, so the screen can be tried without an AI key.
 */
export async function generateSummary(stats: MonthStats): Promise<Summary> {
  await wait(900);
  const summary = ruleSummary(stats);
  const data = load();
  save({ ...data, summaries: { ...data.summaries, [stats.month]: summary } });
  return summary;
}

function ruleSummary(stats: MonthStats): Summary {
  const curs = Object.keys(stats.currencies) as Currency[];
  const main = curs.sort((a, b) => (stats.currencies[b]!.count ?? 0) - (stats.currencies[a]!.count ?? 0))[0];
  const c = stats.currencies[main]!;
  const m = (n: number) => formatMoney(n, main);
  const business = stats.mode === "business";
  const points: string[] = [];

  const headline =
    c.net >= 0
      ? `You kept ${m(c.net)} this month after spending ${m(c.out)}.`
      : `You spent ${m(-c.net)} more than came in this month.`;

  if (c.previous && c.previous.in > 0) {
    const change = Math.round(((c.in - c.previous.in) / c.previous.in) * 100);
    points.push(
      `${business ? "Sales" : "Money in"} came to ${m(c.in)}, ${change === 0 ? "the same as" : `${Math.abs(change)}% ${change > 0 ? "more than" : "less than"}`} last month.`,
    );
  } else {
    points.push(`${business ? "Sales" : "Money in"} came to ${m(c.in)}.`);
  }

  const top = c.topSpending[0];
  if (top) points.push(`Your biggest cost was ${top.label.toLowerCase()} at ${m(top.amount)}.`);

  const tight = c.budgets
    .filter((b) => b.spent >= b.limit * 0.8)
    .sort((a, b) => b.spent / b.limit - a.spent / a.limit)[0];
  if (tight) {
    points.push(
      tight.spent > tight.limit
        ? `You went ${m(tight.spent - tight.limit)} over your ${tight.label.toLowerCase()} budget.`
        : `You've used ${Math.round((tight.spent / tight.limit) * 100)}% of your ${tight.label.toLowerCase()} budget${stats.daysLeft ? ` with ${stats.daysLeft} days left` : ""}.`,
    );
  }

  const owes = stats.people.owesMe.filter((p) => p.currency === main);
  if (owes.length) {
    const total = owes.reduce((s, p) => s + p.amount, 0);
    const names = [...new Set(owes.map((p) => p.name))];
    const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
    points.push(`${list} still owe${names.length === 1 ? "s" : ""} you ${m(total)}.`);
  }

  points.push(`You wrote in Flowz on ${stats.daysRecorded} of ${stats.daysInMonth} days.`);

  const tip = owes.length
    ? `Collect the ${m(owes.reduce((s, p) => s + p.amount, 0))} people owe you before buying new stock.`
    : top
      ? `Try to cut ${top.label.toLowerCase()} by a tenth next month. That would save about ${m(Math.round(top.amount / 10))}.`
      : "Write in Flowz every evening so your summary stays accurate.";

  return { month: stats.month, headline, points: points.slice(0, 5), tip, generated_at: new Date().toISOString() };
}

export async function askFlowz(question: string, _history: unknown[], today: string): Promise<string> {
  await wait(700);
  return demoAnswer(question, load().entries, today);
}

/** The demo has no AI; lines are read by the phone's rules only. */
export async function readLinesWithAI(): Promise<null> {
  return null;
}

// ---------- Bank Match ----------

export async function listBankStatements(): Promise<BankStatement[]> {
  await wait();
  return [...(load().bankStatements ?? [])].sort((a, b) => (b.period_end ?? "").localeCompare(a.period_end ?? ""));
}

export async function saveBankStatement(meta: { file_name: string; bank_name: string | null; currency: Currency }, txns: StatementTxn[]) {
  await wait(300);
  const data = load();
  const period = statementPeriod(txns);
  const statement: BankStatement = { id: crypto.randomUUID(), ...meta, period_start: period.start, period_end: period.end, created_at: new Date().toISOString() };
  const existing = data.bankTxns ?? [];
  const seen = new Set(existing.map((t) => t.fingerprint));
  const fresh = withFingerprints(txns)
    .filter((t) => !seen.has(t.fingerprint))
    .map((t) => ({ ...t, id: crypto.randomUUID(), statement_id: statement.id, currency: meta.currency, entry_id: null, status: "open" as const }));
  save({
    ...data,
    bankStatements: fresh.length ? [...(data.bankStatements ?? []), statement] : data.bankStatements ?? [],
    bankTxns: [...existing, ...fresh],
  });
  return { added: fresh.length, skipped: txns.length - fresh.length };
}

export async function listBankTxns(start: string, end: string): Promise<BankTxn[]> {
  await wait();
  return (load().bankTxns ?? []).filter((t) => t.txn_date >= start && t.txn_date <= end).sort((a, b) => a.txn_date.localeCompare(b.txn_date));
}

function updateTxns(ids: string[], change: Partial<BankTxn>) {
  const data = load();
  save({ ...data, bankTxns: (data.bankTxns ?? []).map((t) => (ids.includes(t.id) ? { ...t, ...change } : t)) });
}

export async function linkBankTxns(ids: string[], entryId: string | null) {
  await wait();
  updateTxns(ids, { entry_id: entryId });
}

export async function setBankTxnStatus(ids: string[], status: BankTxn["status"]) {
  await wait();
  updateTxns(ids, { status });
}

export async function deleteBankStatement(id: string) {
  await wait();
  const data = load();
  save({
    ...data,
    bankStatements: (data.bankStatements ?? []).filter((s) => s.id !== id),
    bankTxns: (data.bankTxns ?? []).filter((t) => t.statement_id !== id),
  });
}

export async function listBankRules(): Promise<BankRule[]> {
  await wait();
  return load().bankRules ?? [];
}

export async function addBankRule(phrase: string) {
  await wait();
  const data = load();
  const rules = data.bankRules ?? [];
  if (!rules.some((r) => r.phrase.toLowerCase() === phrase.toLowerCase())) save({ ...data, bankRules: [...rules, { id: crypto.randomUUID(), phrase }] });
}

export async function deleteBankRule(id: string) {
  await wait();
  const data = load();
  save({ ...data, bankRules: (data.bankRules ?? []).filter((r) => r.id !== id) });
}

/** The demo has no AI, so PDFs and photos can't be read; spreadsheets and the sample statement work. */
export async function readStatementPart(): Promise<never> {
  await wait(400);
  throw new Error("The demo reads Excel and CSV statements, or tap \"Try a sample statement\". In the real app, Flowz also reads PDFs and screenshots.");
}

/** A bank statement made from the demo notebook: most transfers match, a few are missing, plus bank charges. */
export async function sampleStatement(): Promise<ReadStatement> {
  await wait(1200);
  const today = todayISO();
  const start = addDays(today, -30);
  const entries = load().entries.filter((e) => e.entry_date >= start && e.entry_date < today && e.amount != null && e.currency === "NGN");
  const txns: StatementTxn[] = [];
  const ref = (i: number) => String(100_000_000 + i * 7919).slice(0, 9);
  entries.forEach((e, i) => {
    const dir = cashDirection(e);
    if (!dir || i % 3 === 2) return; // about a third were cash
    const name = (e.person ?? ["AMAKA OBI", "BAYO ADE", "IFEOMA NWOSU"][i % 3]).toUpperCase();
    if (e.kind === "sale" && e.amount! >= 30_000) {
      // A day's sales usually arrive as several transfers.
      const first = Math.round(e.amount! * 0.4 / 100) * 100;
      txns.push({ txn_date: e.entry_date, amount: first, direction: "in", description: `TRF FROM ${name}/${ref(i)}`, balance: null });
      txns.push({ txn_date: e.entry_date, amount: Math.round(e.amount! * 0.35 / 100) * 100, direction: "in", description: `NIP FRM CUSTOMER ${ref(i + 1)}`, balance: null });
      return;
    }
    const description =
      dir === "in" ? `TRF FROM ${name}/${ref(i)}` : e.kind === "purchase" ? `TRF TO WHOLESALE DEPOT/${ref(i)}` : `POS PURCHASE ${ref(i)} LAGOS`;
    txns.push({ txn_date: e.entry_date, amount: e.amount!, direction: dir, description, balance: null });
  });
  const extra: [number, "in" | "out", number, string][] = [
    [-3, "in", 12_000, "TRF FROM CHIDI OKAFOR/0123456789"],
    [-9, "in", 7_500, "NIP FRM KEMI ADEYEMI-GTB TRANSFER"],
    [-15, "in", 25_000, "TRF FROM EMEKA STORES/0099887766"],
    [-6, "out", 20_000, "TRF TO MUM/2233445566"],
    [-12, "out", 4_500, "TRF TO MTN DATA PURCHASE"],
    [-2, "out", 4, "SMS ALERT CHARGES"],
    [-10, "out", 4, "SMS ALERT CHARGES"],
    [-5, "out", 10.75, "TRANSFER CHARGE"],
    [-20, "out", 50, "ELECTRONIC MONEY TRANSFER LEVY"],
  ];
  for (const [back, direction, amount, description] of extra) txns.push({ txn_date: addDays(today, back), amount, direction, description, balance: null });
  txns.sort((a, b) => a.txn_date.localeCompare(b.txn_date));
  return { bank_name: "GTBank", currency: "NGN", transactions: txns };
}

// ---------- inventory ----------

export async function listItems(): Promise<InventoryItem[]> {
  await wait();
  return [...(load().items ?? [])].sort((a, b) => a.name.localeCompare(b.name));
}

export async function saveItem(item: InventoryItem) {
  await wait();
  const data = load();
  save({ ...data, items: [...(data.items ?? []).filter((i) => i.id !== item.id), item] });
}

export async function deleteItem(id: string) {
  await wait();
  const data = load();
  save({
    ...data,
    items: (data.items ?? []).filter((i) => i.id !== id),
    entries: data.entries.map((e) => (e.item_id === id ? { ...e, item_id: null } : e)),
  });
}

export async function listStockLines(since: string): Promise<Entry[]> {
  await wait();
  return load().entries.filter((e) => e.item_id && e.entry_date >= since).sort(byDateThenPosition);
}
