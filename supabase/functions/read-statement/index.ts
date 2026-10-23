// Bank Match: reads a bank statement (PDF pages or a photo/screenshot) into transactions.
// Excel and CSV statements are read on the phone; only PDFs and pictures come here.
// The phone splits long PDFs into a few pages per call, so each call stays quick.
// Nothing is saved here: the transactions go back to the phone, which shows them before saving.
//
// Secrets needed: ANTHROPIC_API_KEY (same as the other AI functions).

import Anthropic from "npm:@anthropic-ai/sdk@0";
import { createClient } from "npm:@supabase/supabase-js@2";

const MODEL = "claude-opus-5-5";
const MAX_PAGES_PER_DAY = 120;
const MAX_PAGES_PER_CALL = 5;
const MAX_BASE64 = 14_000_000; // about 10 MB
const MEDIA_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

const SYSTEM = `You read bank statements for Flowz, a money notebook used mostly by traders and everyday people in Nigeria.
You are given part of a statement: one or more PDF pages, a screenshot of a bank app's transaction history,
or a photo of a printed statement or a credit/debit alert. Copy out every transaction on it.

Rules:
- One item per transaction row. Skip opening balance, closing balance, "balance brought/carried forward",
  page totals and summary boxes.
- date: the transaction date as YYYY-MM-DD. Nigerian banks write dates day-first (03/10/2026 is 3 October 2026).
  If there are two date columns, use the transaction (posting) date, not the value date.
- description: the narration exactly as printed (names, references), on one line. Join narrations that wrap
  onto a second line.
- amount: a positive number with no commas or currency signs.
- direction: "in" for credits/deposits/money received, "out" for debits/withdrawals/money sent or spent.
  Use the column the amount is in, or the Dr/Cr marker, or how the balance moved.
- balance: the running balance after the transaction, or null if there isn't one.
- currency: "USD" only when the statement is in US dollars; otherwise "NGN".
- bank_name: the bank or app (e.g. GTBank, Access Bank, OPay, Moniepoint), or null if not shown.
- Never invent or guess transactions. If a row can't be read clearly, leave it out.
- If this isn't a bank statement, transaction history or alert, or can't be read at all, set readable to false,
  give a short plain reason in problem, and return no transactions.`;

const SCHEMA = {
  type: "object",
  properties: {
    readable: { type: "boolean" },
    problem: { anyOf: [{ type: "string" }, { type: "null" }] },
    bank_name: { anyOf: [{ type: "string" }, { type: "null" }] },
    currency: { type: "string", enum: ["NGN", "USD"] },
    transactions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          date: { type: "string" },
          description: { type: "string" },
          amount: { type: "number" },
          direction: { type: "string", enum: ["in", "out"] },
          balance: { anyOf: [{ type: "number" }, { type: "null" }] },
        },
        required: ["date", "description", "amount", "direction", "balance"],
        additionalProperties: false,
      },
    },
  },
  required: ["readable", "problem", "bank_name", "currency", "transactions"],
  additionalProperties: false,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return reply(500, { error: "Statement reading isn't set up yet." });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: userData } = await userClient.auth.getUser();
  if (!userData?.user) return reply(401, { error: "Please sign in again." });
  const userId = userData.user.id;

  let data = "";
  let mediaType = "";
  let pages = 1;
  let today = new Date().toISOString().slice(0, 10);
  try {
    const body = JSON.parse(await req.text());
    data = typeof body.data === "string" ? body.data : "";
    mediaType = typeof body.media_type === "string" ? body.media_type : "";
    pages = Math.max(1, Math.min(MAX_PAGES_PER_CALL, Number(body.pages) || 1));
    if (typeof body.today === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.today)) today = body.today;
  } catch {
    return reply(400, { error: "Bad request." });
  }
  if (!MEDIA_TYPES.includes(mediaType)) return reply(400, { error: "Upload a PDF, a photo, or an Excel or CSV file." });
  if (!data || data.length > MAX_BASE64) return reply(413, { error: "This file is too big. Try a statement for one month." });

  // Daily limit so one account can't run up the AI bill.
  const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: usage } = await admin.from("ai_usage").select("questions, lines, statement_pages").eq("user_id", userId).eq("day", today).maybeSingle();
  const used = usage?.statement_pages ?? 0;
  if (used + pages > MAX_PAGES_PER_DAY) return reply(429, { error: "You've uploaded a lot of statement pages today. Please try again tomorrow." });
  await admin.from("ai_usage").upsert({
    user_id: userId,
    day: today,
    questions: usage?.questions ?? 0,
    lines: usage?.lines ?? 0,
    statement_pages: used + pages,
  });

  const source = { type: "base64", media_type: mediaType, data };
  const block = mediaType === "application/pdf" ? { type: "document", source } : { type: "image", source };

  try {
    const client = new Anthropic({ apiKey });
    // Streaming, so a long page of transactions doesn't hit a request timeout.
    const response = await client.beta.messages
      .stream({
        model: MODEL,
        max_tokens: 64000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
        system: SYSTEM,
        messages: [{ role: "user", content: [block, { type: "text", text: "Copy out the transactions." }] }],
        // deno-lint-ignore no-explicit-any
      } as any)
      .finalMessage();
    if (response.stop_reason === "refusal") return reply(422, { error: "Flowz couldn't read this file." });
    if (response.stop_reason === "max_tokens") return reply(422, { error: "This part of the statement is too long to read at once." });
    // deno-lint-ignore no-explicit-any
    const text = (response.content as any[]).find((b) => b.type === "text")?.text;
    const parsed = JSON.parse(text ?? "{}");
    const transactions = (parsed.transactions ?? []).filter(
      // deno-lint-ignore no-explicit-any
      (t: any) => /^\d{4}-\d{2}-\d{2}$/.test(t.date) && Number.isFinite(t.amount) && t.amount > 0 && (t.direction === "in" || t.direction === "out"),
    );
    return reply(200, { ...parsed, transactions });
  } catch (err) {
    console.error("read-statement failed", err);
    return reply(502, { error: "Flowz couldn't read this statement right now. Please try again." });
  }
});
