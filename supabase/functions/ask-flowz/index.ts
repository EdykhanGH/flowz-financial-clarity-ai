// "Ask Flowz": answers questions about the user's own notebook.
// Claude never adds numbers up itself. It calls the tools below, which do the maths in code
// on the user's own rows, and then explains the result in plain words.
//
// Secrets needed: ANTHROPIC_API_KEY (same as monthly-summary).
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided automatically.

import Anthropic from "npm:@anthropic-ai/sdk@0";
import { createClient } from "npm:@supabase/supabase-js@2";

const MODEL = "claude-opus-5-5";
const MAX_QUESTIONS_PER_DAY = 40;
const MAX_TOOL_ROUNDS = 6;
const HISTORY_DAYS = 400;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

// ---------- the user's data and the maths ----------

export interface Row {
  entry_date: string;
  text: string;
  amount: number | null;
  currency: string | null;
  kind: string;
  category: string | null;
  person: string | null;
  settled_at: string | null;
}

const FLOW: Record<string, "in" | "out" | "debt" | "none"> = {
  sale: "in",
  gift_in: "in",
  purchase: "out",
  expense: "out",
  gift_out: "out",
  owed_to_me: "debt",
  i_owe: "debt",
  note: "none",
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;

interface Filters {
  start_date?: string;
  end_date?: string;
  kind?: string;
  flow?: "in" | "out";
  category?: string;
  person?: string;
  contains?: string;
}

function applyFilters(rows: Row[], f: Filters, today: string): Row[] {
  const start = f.start_date && DATE.test(f.start_date) ? f.start_date : `${today.slice(0, 7)}-01`;
  const end = f.end_date && DATE.test(f.end_date) ? f.end_date : today;
  const person = f.person?.toLowerCase().trim();
  const words = f.contains?.toLowerCase().split(/\s+/).filter(Boolean) ?? [];
  return rows.filter(
    (r) =>
      r.entry_date >= start &&
      r.entry_date <= end &&
      (!f.kind || r.kind === f.kind) &&
      (!f.flow || FLOW[r.kind] === f.flow) &&
      (!f.category || (r.category ?? "other") === f.category) &&
      (!person || (r.person ?? "").toLowerCase().includes(person)) &&
      words.every((w) => r.text.toLowerCase().includes(w)),
  );
}

const round = (n: number) => Math.round(n * 100) / 100;

function weekOf(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); // Monday
  return d.toISOString().slice(0, 10);
}

export function getTotals(rows: Row[], input: Filters & { group_by?: string }, today: string) {
  const picked = applyFilters(rows, input, today).filter((r) => r.amount != null && r.currency);
  const byCurrency: Record<string, { money_in: number; money_out: number; kept: number; lines: number }> = {};
  const groups: Record<string, Record<string, { money_in: number; money_out: number; debts: number; lines: number }>> = {};
  const keyOf = (r: Row) => {
    switch (input.group_by) {
      case "kind": return r.kind;
      case "category": return r.category ?? (FLOW[r.kind] === "in" ? "money in" : "other");
      case "day": return r.entry_date;
      case "week": return `week of ${weekOf(r.entry_date)}`;
      case "month": return r.entry_date.slice(0, 7);
      case "weekday": return new Date(`${r.entry_date}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" });
      case "person": return r.person ?? "(no name)";
      default: return null;
    }
  };
  for (const r of picked) {
    const cur = r.currency!;
    const t = (byCurrency[cur] ??= { money_in: 0, money_out: 0, kept: 0, lines: 0 });
    const flow = FLOW[r.kind];
    t.lines++;
    if (flow === "in") t.money_in += r.amount!;
    if (flow === "out") t.money_out += r.amount!;
    t.kept = t.money_in - t.money_out;
    const key = keyOf(r);
    if (key) {
      const g = ((groups[cur] ??= {})[key] ??= { money_in: 0, money_out: 0, debts: 0, lines: 0 });
      g.lines++;
      if (flow === "in") g.money_in += r.amount!;
      if (flow === "out") g.money_out += r.amount!;
      if (flow === "debt") g.debts += r.amount!;
    }
  }
  const result: Record<string, unknown> = {
    period: { start: input.start_date ?? `${today.slice(0, 7)}-01`, end: input.end_date ?? today },
    totals: Object.fromEntries(Object.entries(byCurrency).map(([c, t]) => [c, { money_in: round(t.money_in), money_out: round(t.money_out), kept: round(t.kept), lines: t.lines }])),
  };
  if (input.group_by && input.group_by !== "none") {
    result.groups = Object.fromEntries(
      Object.entries(groups).map(([c, g]) => [
        c,
        Object.entries(g)
          .map(([key, v]) => ({ key, money_in: round(v.money_in), money_out: round(v.money_out), debts: round(v.debts), lines: v.lines }))
          .sort((a, b) => b.money_in + b.money_out + b.debts - (a.money_in + a.money_out + a.debts))
          .slice(0, 40),
      ]),
    );
  }
  if (picked.length === 0) result.note = "No lines with money match these filters.";
  return result;
}

export function findLines(rows: Row[], input: Filters & { sort?: string; limit?: number }, today: string) {
  const picked = applyFilters(rows, input, today);
  const sorted = [...picked].sort((a, b) =>
    input.sort === "largest" ? (b.amount ?? 0) - (a.amount ?? 0) : input.sort === "oldest" ? a.entry_date.localeCompare(b.entry_date) : b.entry_date.localeCompare(a.entry_date),
  );
  const limit = Math.min(Math.max(Number(input.limit) || 20, 1), 50);
  return {
    matching_lines: picked.length,
    lines: sorted.slice(0, limit).map((r) => ({
      date: r.entry_date,
      text: r.text,
      kind: r.kind,
      category: r.category,
      amount: r.amount,
      currency: r.currency,
      person: r.person,
      paid: r.settled_at ? true : undefined,
    })),
  };
}

export function getDebts(rows: Row[]) {
  const out: Record<string, Record<string, { total: number; currency: string; since: string; lines: number }>> = { owed_to_me: {}, i_owe: {} };
  for (const r of rows) {
    if ((r.kind !== "owed_to_me" && r.kind !== "i_owe") || r.settled_at || r.amount == null || !r.currency) continue;
    const key = `${r.person ?? "(no name)"} (${r.currency})`;
    const d = (out[r.kind][key] ??= { total: 0, currency: r.currency, since: r.entry_date, lines: 0 });
    d.total = round(d.total + r.amount);
    d.lines++;
    if (r.entry_date < d.since) d.since = r.entry_date;
  }
  return { people_who_owe_me: out.owed_to_me, people_i_owe: out.i_owe };
}

const FILTER_PROPS = {
  start_date: { type: "string", description: "First day to include, YYYY-MM-DD. Defaults to the 1st of this month." },
  end_date: { type: "string", description: "Last day to include, YYYY-MM-DD. Defaults to today." },
  kind: { type: "string", enum: ["sale", "gift_in", "purchase", "expense", "gift_out", "owed_to_me", "i_owe", "note"] },
  flow: { type: "string", enum: ["in", "out"], description: "in = sales/income + gifts received; out = purchases + expenses + gifts given." },
  category: {
    type: "string",
    enum: ["stock", "food", "transport", "fuel", "rent", "bills", "airtime", "wages", "health", "school", "family", "giving", "events", "savings", "repairs", "personal", "other"],
    description: "Spending category (only set on money going out).",
  },
  person: { type: "string", description: "Part of a person's name." },
  contains: { type: "string", description: "Words that must appear in the line, e.g. 'rice'." },
} as const;

const TOOLS = [
  {
    name: "get_totals",
    description:
      "Adds up money in, money out and what was kept for a period, separately for each currency. Optionally groups the result (by kind, category, day, week, month, weekday or person). Always use this for any number you report.",
    input_schema: {
      type: "object",
      properties: {
        ...FILTER_PROPS,
        group_by: { type: "string", enum: ["none", "kind", "category", "day", "week", "month", "weekday", "person"] },
      },
    },
  },
  {
    name: "find_lines",
    description: "Lists the actual lines the user wrote that match the filters, newest first by default. Use it to quote examples or find specific items.",
    input_schema: {
      type: "object",
      properties: {
        ...FILTER_PROPS,
        sort: { type: "string", enum: ["newest", "oldest", "largest"] },
        limit: { type: "integer", description: "1 to 50, default 20." },
      },
    },
  },
  {
    name: "get_debts",
    description: "Lists money people still owe the user and money the user still owes others (not yet marked as paid), grouped by person.",
    input_schema: { type: "object", properties: {} },
  },
];

function systemPrompt(s: { name: string; mode: string; currency: string; today: string; earliest: string | null }) {
  return `You are Flowz, a friendly helper inside a simple money notebook used by everyday people and small
business owners, mostly in Nigeria. The user writes lines like "Sold 3 bags of rice 45,000" and Flowz
tags each one. Answer the user's questions about their own notebook.

About this user: name ${s.name || "unknown"}; uses Flowz for ${s.mode === "business" ? "their business" : "personal and home money"};
main currency ${s.currency}. Today is ${s.today}. Their notebook data starts ${s.earliest ?? "today (nothing written yet)"}.

Line types: sale (money in from selling/earning), gift_in (gift received), purchase (stock/goods bought),
expense (everyday spending), gift_out (gift given), owed_to_me / i_owe (debts, not counted as money in or out),
note (no money).

How to answer:
- Get every number from the tools. Never add, subtract or estimate figures yourself; if you need a
  comparison, call get_totals for each period and use the numbers it returns.
- Work out dates from today's date: "this month", "last week", "in March", "yesterday" and so on.
- Naira (NGN, ₦) and dollars (USD, $) are separate. Never add or convert between them.
- Write amounts with symbol and thousands separators, like ₦45,000 or $120.
- Plain, warm, everyday English. Short: 1 to 4 sentences, or a short list using "- " bullets.
  No jargon. No markdown headings, tables or bold.
- If the user writes in Pidgin, you may answer in simple Pidgin.
- If the data can't answer the question, say so simply and suggest what they could write in Flowz.
- Only talk about their money and Flowz. Politely decline anything else.`;
}

// ---------- the request ----------

if (typeof Deno !== "undefined" && typeof Deno.serve === "function") Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return reply(500, { error: "Ask Flowz isn't set up yet (missing AI key)." });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: userData } = await userClient.auth.getUser();
  if (!userData?.user) return reply(401, { error: "Please sign in again." });
  const userId = userData.user.id;

  let question = "";
  let today = new Date().toISOString().slice(0, 10);
  let history: { role: "user" | "assistant"; text: string }[] = [];
  try {
    const body = JSON.parse(await req.text());
    question = String(body.question ?? "").trim().slice(0, 500);
    if (typeof body.today === "string" && DATE.test(body.today)) today = body.today;
    if (Array.isArray(body.history)) {
      history = body.history
        .filter((m: { role?: string; text?: unknown }) => (m.role === "user" || m.role === "assistant") && typeof m.text === "string")
        .slice(-8)
        .map((m: { role: "user" | "assistant"; text: string }) => ({ role: m.role, text: m.text.slice(0, 1500) }));
    }
  } catch {
    return reply(400, { error: "Bad request." });
  }
  if (!question) return reply(400, { error: "Please type a question." });

  // Daily limit so one account can't run up the AI bill.
  const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: usage } = await admin.from("ai_usage").select("questions").eq("user_id", userId).eq("day", today).maybeSingle();
  if ((usage?.questions ?? 0) >= MAX_QUESTIONS_PER_DAY) {
    return reply(429, { error: "You've asked a lot of questions today. Ask Flowz will be ready again tomorrow." });
  }
  await admin.from("ai_usage").upsert({ user_id: userId, day: today, questions: (usage?.questions ?? 0) + 1 });

  // The user's own rows (row-level security applies through their login).
  const since = new Date(Date.now() - HISTORY_DAYS * 86_400_000).toISOString().slice(0, 10);
  const rows: Row[] = [];
  for (let page = 0; page < 20; page++) {
    const { data, error } = await userClient
      .from("entries")
      .select("entry_date, text, amount, currency, kind, category, person, settled_at")
      .gte("entry_date", since)
      .order("entry_date", { ascending: true })
      .range(page * 1000, page * 1000 + 999);
    if (error) return reply(500, { error: "Couldn't read your notebook. Please try again." });
    rows.push(...((data ?? []) as Row[]).map((r) => ({ ...r, amount: r.amount == null ? null : Number(r.amount) })));
    if (!data || data.length < 1000) break;
  }
  const { data: settings } = await userClient.from("user_settings").select("display_name, mode, default_currency").maybeSingle();

  const client = new Anthropic({ apiKey });
  // deno-lint-ignore no-explicit-any
  const messages: any[] = [
    ...history.map((m) => ({ role: m.role, content: m.text })),
    { role: "user", content: question },
  ];
  // The conversation must start with the user.
  while (messages.length && messages[0].role !== "user") messages.shift();

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      // deno-lint-ignore no-explicit-any
      const response: any = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 8000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "low" },
        system: systemPrompt({
          name: settings?.display_name ?? "",
          mode: settings?.mode ?? "personal",
          currency: settings?.default_currency ?? "NGN",
          today,
          earliest: rows[0]?.entry_date ?? null,
        }),
        tools: TOOLS,
        messages,
        // deno-lint-ignore no-explicit-any
      } as any);

      if (response.stop_reason === "refusal") break;
      messages.push({ role: "assistant", content: response.content });

      // deno-lint-ignore no-explicit-any
      const calls = response.content.filter((b: any) => b.type === "tool_use");
      if (response.stop_reason !== "tool_use" || calls.length === 0) {
        // deno-lint-ignore no-explicit-any
        const answer = response.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n").trim();
        if (answer) return reply(200, { answer });
        break;
      }

      messages.push({
        role: "user",
        // deno-lint-ignore no-explicit-any
        content: calls.map((c: any) => {
          let result: unknown;
          try {
            if (c.name === "get_totals") result = getTotals(rows, c.input ?? {}, today);
            else if (c.name === "find_lines") result = findLines(rows, c.input ?? {}, today);
            else if (c.name === "get_debts") result = getDebts(rows);
            else result = { error: `Unknown tool ${c.name}` };
          } catch (err) {
            return { type: "tool_result", tool_use_id: c.id, content: `Error: ${(err as Error).message}`, is_error: true };
          }
          return { type: "tool_result", tool_use_id: c.id, content: JSON.stringify(result) };
        }),
      });
    }
  } catch (err) {
    console.error("ask failed", err);
    return reply(502, { error: "Ask Flowz couldn't answer right now. Please try again in a moment." });
  }
  return reply(200, { answer: "Sorry, I couldn't work that out. Try asking in a different way, like “How much did I spend on transport this month?”" });
});
