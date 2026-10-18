import { supabase } from "./supabase";
import type { Mode } from "./kinds";
import type { Budget, Entry, MonthStats } from "./money";
import type { Currency } from "./parse";

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
      .in("kind", ["owed_to_me", "i_owe"])
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
