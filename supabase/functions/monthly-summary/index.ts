// Writes a short, plain-English money summary for one month using Claude.
// The app sends the month's totals (already worked out on the phone); this function
// turns them into friendly sentences and saves the result.
//
// Secrets needed (Supabase dashboard → Edge Functions → Secrets):
//   ANTHROPIC_API_KEY
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided automatically.

import Anthropic from "npm:@anthropic-ai/sdk@0";
import { createClient } from "npm:@supabase/supabase-js@2";

const MODEL = "claude-opus-5-5";
const MAX_PER_MONTH = 15; // regenerations allowed per user per month
const MIN_SECONDS_BETWEEN = 30;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

const SYSTEM = `You write the monthly money summary inside Flowz, a simple money notebook used by
everyday people and small business owners, mostly in Nigeria. Many users are not business people
and have never read a financial report.

You receive one month of figures as JSON. Write a short summary that helps them understand
what happened with their money and what to do next.

Rules:
- Plain, warm, everyday English. Short sentences. No jargon (never say "net", "revenue",
  "margin", "liquidity", "cash flow"). Say "money in", "money out", "what you kept".
- Use only the numbers in the data. Never invent figures, causes or names.
- Write amounts with their symbol and thousands separators, like ₦45,000 or $120.
  Naira and dollars are separate: never add or convert between them.
- If mode is "personal", talk about income and spending. If "business", talk about sales,
  purchases and expenses.
- Mention budgets that are nearly used up or over, money people owe them, and the biggest
  change from last month, when the data has them.
- If very little was recorded, gently encourage them to write in Flowz daily.
- Be encouraging, never judgmental.

Return:
- headline: one sentence (max ~20 words) with the most important takeaway.
- points: 3 to 5 short bullet sentences.
- tip: one practical, specific suggestion for next month.`;

const SCHEMA = {
  type: "object",
  properties: {
    headline: { type: "string" },
    points: { type: "array", items: { type: "string" } },
    tip: { type: "string" },
  },
  required: ["headline", "points", "tip"],
  additionalProperties: false,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return reply(500, { error: "The smart summary isn't set up yet (missing AI key)." });

  // Who is asking?
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return reply(401, { error: "Please sign in again." });
  const userId = userData.user.id;

  // What month?
  let stats: { month?: unknown };
  try {
    const raw = await req.text();
    if (raw.length > 40_000) return reply(413, { error: "Too much data for one summary." });
    stats = JSON.parse(raw).stats;
  } catch {
    return reply(400, { error: "Bad request." });
  }
  const month = typeof stats?.month === "string" && /^\d{4}-\d{2}$/.test(stats.month) ? stats.month : null;
  if (!month) return reply(400, { error: "Bad request." });
  const monthDate = `${month}-01`;

  // Simple limits so one account can't run up the AI bill.
  const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: existing } = await admin
    .from("monthly_summaries")
    .select("generated_at, generation_count")
    .eq("user_id", userId)
    .eq("month", monthDate)
    .maybeSingle();
  if (existing) {
    const seconds = (Date.now() - new Date(existing.generated_at).getTime()) / 1000;
    if (seconds < MIN_SECONDS_BETWEEN) return reply(429, { error: "Your summary was just updated. Try again in a few seconds." });
    if (existing.generation_count >= MAX_PER_MONTH) {
      return reply(429, { error: "You've refreshed this month's summary many times. It will update again next month." });
    }
  }

  // Ask Claude.
  const client = new Anthropic({ apiKey });
  let result: { headline: string; points: string[]; tip: string };
  try {
    // deno-lint-ignore no-explicit-any
    const response: any = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 8000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      system: SYSTEM,
      messages: [{ role: "user", content: `Here is the month's data:\n\n${JSON.stringify(stats)}` }],
      // deno-lint-ignore no-explicit-any
    } as any);

    if (response.stop_reason === "refusal") throw new Error("refused");
    const text = response.content.find((b: { type: string }) => b.type === "text")?.text;
    if (!text) throw new Error("empty response");
    result = JSON.parse(text);
  } catch (err) {
    console.error("summary failed", err);
    return reply(502, { error: "We couldn't write your summary right now. Please try again in a moment." });
  }

  const row = {
    user_id: userId,
    month: monthDate,
    headline: result.headline.slice(0, 300),
    points: result.points.slice(0, 6).map((p) => String(p).slice(0, 400)),
    tip: result.tip.slice(0, 400),
    generated_at: new Date().toISOString(),
    generation_count: (existing?.generation_count ?? 0) + 1,
  };
  const { error: saveError } = await admin.from("monthly_summaries").upsert(row);
  if (saveError) console.error("save failed", saveError);

  return reply(200, { month, headline: row.headline, points: row.points, tip: row.tip, generated_at: row.generated_at });
});
