import { supabase } from "./supabase";
import { DEBT_KINDS, type Kind, type Mode } from "./kinds";
import type { Budget, Entry, MonthStats } from "./money";
import type { Currency } from "./parse";
import type { BankRule, BankTxn } from "./bankMatch";
import { statementPeriod, withFingerprints, type ReadStatement, type StatementTxn } from "./bankStatement";

export interface Settings {
  user_id: string;
  display_name: string;
  business_name: string | null;
  mode: Mode;
  default_currency: Currency;
  reminder_enabled: boolean;
  reminder_time: string; // "20:00:00"
  time_zone: string;
}

export interface Summary {
  month: string;
  headline: string;
  points: string[];
  tip: string;
  generated_at: string;
}

const ENTRY_COLUMNS =
  "id, entry_date, position, text, amount, currency, kind, category, person, kind_locked, settled_at, created_at, updated_at";

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

// ---------- settings ----------

export async function getSettings(): Promise<Settings | null> {
  return check(await supabase.from("user_settings").select("*").maybeSingle()) as Settings | null;
}

export async function saveSettings(userId: string, values: Partial<Omit<Settings, "user_id">>) {
  return check(
    await supabase
      .from("user_settings")
      .upsert({ user_id: userId, ...values })
      .select()
      .single(),
  ) as Settings;
}

// ---------- daily reminder ----------

export async function savePushSubscription(
  userId: string,
  sub: { endpoint: string; p256dh: string; auth: string; user_agent: string },
) {
  check(await supabase.from("push_subscriptions").upsert({ ...sub, user_id: userId }, { onConflict: "endpoint" }));
}

export async function deletePushSubscription(endpoint: string) {
  check(await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint));
}

/** True when anything has been written on that day. */
export async function hasEntriesOn(date: string): Promise<boolean> {
  const { count, error } = await supabase
    .from("entries")
    .select("id", { count: "exact", head: true })
    .eq("entry_date", date);
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

// ---------- entries ----------

export async function listEntries(start: string, end: string): Promise<Entry[]> {
  return check(
    await supabase
      .from("entries")
      .select(ENTRY_COLUMNS)
      .gte("entry_date", start)
      .lte("entry_date", end)
      .order("entry_date", { ascending: true })
      .order("position", { ascending: true }),
  ) as Entry[];
}

/** Every line up to a date (for statements), fetched in pages so long histories aren't cut off. */
export async function listAllEntries(end: string): Promise<Entry[]> {
  const out: Entry[] = [];
  for (let page = 0; page < 50; page++) {
    const rows = check(
      await supabase
        .from("entries")
        .select(ENTRY_COLUMNS)
        .lte("entry_date", end)
        .order("entry_date", { ascending: true })
        .order("position", { ascending: true })
        .range(page * 1000, page * 1000 + 999),
    ) as Entry[];
    out.push(...rows.map((r) => ({ ...r, amount: r.amount == null ? null : Number(r.amount) })));
    if (rows.length < 1000) break;
  }
  return out;
}

export async function upsertEntries(rows: Entry[]) {
  if (rows.length === 0) return;
  const clean = rows.map(({ created_at: _c, updated_at: _u, ...rest }) => rest);
  check(await supabase.from("entries").upsert(clean));
}

export async function deleteEntries(ids: string[]) {
  if (ids.length === 0) return;
  check(await supabase.from("entries").delete().in("id", ids));
}

export async function searchEntries(q: string): Promise<Entry[]> {
  const term = q.replace(/[%_,()]/g, " ").trim();
  if (!term) return [];
  return check(
    await supabase
      .from("entries")
      .select(ENTRY_COLUMNS)
      .ilike("text", `%${term}%`)
      .order("entry_date", { ascending: false })
      .limit(100),
  ) as Entry[];
}

export async function listDebts(): Promise<Entry[]> {
  return check(
    await supabase
      .from("entries")
      .select(ENTRY_COLUMNS)
      .in("kind", DEBT_KINDS)
      .not("amount", "is", null)
      .order("entry_date", { ascending: false }),
  ) as Entry[];
}

export async function setSettled(id: string, settled: boolean) {
  check(
    await supabase
      .from("entries")
      .update({ settled_at: settled ? new Date().toISOString() : null })
      .eq("id", id),
  );
}

// ---------- budgets ----------

export async function listBudgets(): Promise<Budget[]> {
  return check(await supabase.from("budget_limits").select("id, category, amount, currency").order("created_at")) as Budget[];
}

export async function saveBudget(userId: string, b: Omit<Budget, "id"> & { id?: string }) {
  check(await supabase.from("budget_limits").upsert({ ...b, user_id: userId }, { onConflict: "user_id,category,currency" }));
}

export async function deleteBudget(id: string) {
  check(await supabase.from("budget_limits").delete().eq("id", id));
}

// ---------- monthly summary ----------

export async function getSummary(month: string): Promise<Summary | null> {
  const row = check(
    await supabase.from("monthly_summaries").select("month, headline, points, tip, generated_at").eq("month", `${month}-01`).maybeSingle(),
  ) as Summary | null;
  return row ? { ...row, month } : null;
}

export async function generateSummary(stats: MonthStats): Promise<Summary> {
  const { data, error } = await supabase.functions.invoke("monthly-summary", { body: { stats } });
  if (error) {
    let message = "We couldn't write your summary right now. Please try again in a moment.";
    try {
      const body = await (error as { context?: Response }).context?.json();
      if (body?.error) message = body.error;
    } catch {
      // keep the friendly default
    }
    throw new Error(message);
  }
  return data as Summary;
}

// ---------- Ask Flowz ----------

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export async function askFlowz(question: string, history: ChatMessage[], today: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("ask-flowz", { body: { question, history, today } });
  if (error) {
    let message = "Ask Flowz couldn't answer right now. Please try again in a moment.";
    try {
      const body = await (error as { context?: Response }).context?.json();
      if (body?.error) message = body.error;
    } catch {
      // keep the friendly default
    }
    throw new Error(message);
  }
  return (data as { answer: string }).answer;
}

// ---------- AI reading of hard lines ----------

export interface AiReading {
  id: string;
  kind: Kind;
  amount: number | null;
  currency: Currency | null;
  category: string | null;
  person: string | null;
  confident: boolean;
}

/** Asks the AI to read lines the phone found unclear. Returns null when offline or unavailable. */
export async function readLinesWithAI(
  lines: { id: string; text: string }[],
  book: unknown,
  today: string,
): Promise<AiReading[] | null> {
  if (lines.length === 0 || (typeof navigator !== "undefined" && !navigator.onLine)) return null;
  try {
    const { data, error } = await supabase.functions.invoke("read-lines", { body: { lines, book, today } });
    if (error) return null;
    return (data as { lines: AiReading[] }).lines ?? null;
  } catch {
    return null;
  }
}

// ---------- Bank Match ----------

export interface BankStatement {
  id: string;
  file_name: string;
  bank_name: string | null;
  currency: Currency;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
}

const TXN_COLUMNS = "id, statement_id, txn_date, amount, direction, currency, description, balance, entry_id, status";

export async function listBankStatements(): Promise<BankStatement[]> {
  return check(
    await supabase.from("bank_statements").select("id, file_name, bank_name, currency, period_start, period_end, created_at").order("period_end", { ascending: false }),
  ) as BankStatement[];
}

/** Saves a statement and its transactions. Transactions already uploaded before are skipped. */
export async function saveBankStatement(
  meta: { file_name: string; bank_name: string | null; currency: Currency },
  txns: StatementTxn[],
): Promise<{ added: number; skipped: number }> {
  const period = statementPeriod(txns);
  const statement = check(
    await supabase
      .from("bank_statements")
      .insert({ ...meta, period_start: period.start, period_end: period.end })
      .select("id")
      .single(),
  ) as { id: string };
  let added = 0;
  const rows = withFingerprints(txns).map((t) => ({ ...t, statement_id: statement.id, currency: meta.currency }));
  for (let i = 0; i < rows.length; i += 500) {
    const inserted = check(
      await supabase.from("bank_transactions").upsert(rows.slice(i, i + 500), { onConflict: "user_id,fingerprint", ignoreDuplicates: true }).select("id"),
    ) as { id: string }[];
    added += inserted.length;
  }
  if (added === 0) await supabase.from("bank_statements").delete().eq("id", statement.id);
  return { added, skipped: rows.length - added };
}

export async function listBankTxns(start: string, end: string): Promise<BankTxn[]> {
  const out: BankTxn[] = [];
  for (let page = 0; page < 20; page++) {
    const rows = check(
      await supabase
        .from("bank_transactions")
        .select(TXN_COLUMNS)
        .gte("txn_date", start)
        .lte("txn_date", end)
        .order("txn_date", { ascending: true })
        .order("created_at", { ascending: true })
        .range(page * 1000, page * 1000 + 999),
    ) as BankTxn[];
    out.push(...rows.map((r) => ({ ...r, amount: Number(r.amount), balance: r.balance == null ? null : Number(r.balance) })));
    if (rows.length < 1000) break;
  }
  return out;
}

/** Links transactions to a notebook line (or unlinks with null). */
export async function linkBankTxns(ids: string[], entryId: string | null) {
  if (ids.length) check(await supabase.from("bank_transactions").update({ entry_id: entryId }).in("id", ids));
}

export async function setBankTxnStatus(ids: string[], status: BankTxn["status"]) {
  if (ids.length) check(await supabase.from("bank_transactions").update({ status }).in("id", ids));
}

export async function deleteBankStatement(id: string) {
  check(await supabase.from("bank_statements").delete().eq("id", id));
}

export async function listBankRules(): Promise<BankRule[]> {
  return check(await supabase.from("bank_rules").select("id, phrase").order("created_at")) as BankRule[];
}

export async function addBankRule(phrase: string) {
  check(await supabase.from("bank_rules").upsert({ phrase }, { onConflict: "user_id,phrase", ignoreDuplicates: true }));
}

export async function deleteBankRule(id: string) {
  check(await supabase.from("bank_rules").delete().eq("id", id));
}

export interface AiStatementPart {
  readable: boolean;
  problem: string | null;
  bank_name: string | null;
  currency: Currency;
  transactions: { date: string; description: string; amount: number; direction: "in" | "out"; balance: number | null }[];
}

/** Asks the AI to read part of a PDF statement (a few pages) or a photo of one. */
export async function readStatementPart(data: string, mediaType: string, pages: number, today: string): Promise<AiStatementPart> {
  const { data: result, error } = await supabase.functions.invoke("read-statement", { body: { data, media_type: mediaType, pages, today } });
  if (error) {
    let message = "Flowz couldn't read this statement right now. Please try again.";
    try {
      const body = await (error as { context?: Response }).context?.json();
      if (body?.error) message = body.error;
    } catch {
      // keep the friendly default
    }
    throw new Error(message);
  }
  return result as AiStatementPart;
}

/** Only the demo has a sample statement; the real app reads the user's own. */
export const sampleStatement: (() => Promise<ReadStatement>) | null = null;
