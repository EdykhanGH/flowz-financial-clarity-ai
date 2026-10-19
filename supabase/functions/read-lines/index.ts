// Reads notebook lines that the phone's own rules found hard ("Joy took 3 bags on credit,
// she will pay 20k at month end"), using the user's debt book for context.
// The phone reads every line instantly by itself; only unclear lines come here.
//
// Secrets needed: ANTHROPIC_API_KEY (same as the other AI functions).

import Anthropic from "npm:@anthropic-ai/sdk@0";
import { createClient } from "npm:@supabase/supabase-js@2";

const MODEL = "claude-opus-5-5";
const MAX_LINES_PER_DAY = 300;
const MAX_LINES_PER_CALL = 10;

const KINDS = ["sale", "gift_in", "purchase", "expense", "gift_out", "owed_to_me", "repaid_to_me", "i_owe", "i_repaid", "note"];
const CATEGORIES = ["stock", "food", "transport", "fuel", "rent", "bills", "airtime", "wages", "health", "school", "family", "giving", "events", "savings", "repairs", "personal", "other"];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

const SYSTEM = `You read lines from Flowz, a money notebook used mostly by traders and everyday people in Nigeria.
People write the way they talk: English (British or American), Nigerian Pidgin, short forms and typos.
For each line, decide what it means for the writer's money. Read the whole sentence in context,
not single words, and use the debt book you are given to tell repayments from new sales.

Types:
- sale: money came in from selling or earning (salary, payment for goods or work).
- gift_in: someone gave the writer money as a gift.
- purchase: the writer bought stock or goods (for a trader, usually goods to sell).
- expense: everyday spending and bills.
- gift_out: the writer gave money away as a gift or support.
- owed_to_me: someone now owes the writer, e.g. took goods on credit, borrowed, "will pay later".
  The amount is what they owe.
- repaid_to_me: someone paid back part or all of what they owed the writer. Money came in.
- i_owe: the writer now owes someone (bought on credit, borrowed, took a loan).
- i_repaid: the writer paid back part or all of a debt. Money went out.
- note: no money, or the money is only mentioned (a price, a plan, a reminder).

Rules:
- If a person in the debt book pays the writer and the line doesn't say it's a new sale, it's repaid_to_me.
- If the writer pays someone they owe in the debt book, it's i_repaid.
- When a line has several numbers, pick the money that actually changed hands or became owed,
  not prices, quantities or totals mentioned in passing.
- If someone took goods partly on credit in one line ("Joy took rice worth 50k, paid 20k"),
  record what they still owe (owed_to_me, 30000) and set confident to false so the writer can check.
- "10k" = 10000, "1.5m" = 1500000. Amounts are positive. Use null if there is no money.
- currency: "USD" when the line says $, dollars or bucks; otherwise the writer's main currency.
- category only for purchase, expense and gift_out; otherwise null.
- person: the other person's name as written (e.g. "Joy", "Mama Bisi"), matching the spelling in the
  debt book when it is the same person; null when no person is involved.
- confident: false when the line is genuinely ambiguous.`;

const SCHEMA = {
  type: "object",
  properties: {
    lines: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          kind: { type: "string", enum: KINDS },
          amount: { anyOf: [{ type: "number" }, { type: "null" }] },
          currency: { anyOf: [{ type: "string", enum: ["NGN", "USD"] }, { type: "null" }] },
          category: { anyOf: [{ type: "string", enum: CATEGORIES }, { type: "null" }] },
          person: { anyOf: [{ type: "string" }, { type: "null" }] },
          confident: { type: "boolean" },
        },
        required: ["id", "kind", "amount", "currency", "category", "person", "confident"],
        additionalProperties: false,
      },
    },
  },
  required: ["lines"],
  additionalProperties: false,
};

interface InLine {
  id: string;
  text: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return reply(500, { error: "AI reading isn't set up yet." });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: userData } = await userClient.auth.getUser();
  if (!userData?.user) return reply(401, { error: "Please sign in again." });
  const userId = userData.user.id;

  let lines: InLine[] = [];
  let today = new Date().toISOString().slice(0, 10);
  let book: unknown = {};
  try {
    const body = JSON.parse(await req.text());
    lines = (Array.isArray(body.lines) ? body.lines : [])
      .filter((l: InLine) => typeof l?.id === "string" && typeof l?.text === "string" && l.text.trim())
      .slice(0, MAX_LINES_PER_CALL)
      .map((l: InLine) => ({ id: l.id.slice(0, 64), text: l.text.slice(0, 300) }));
    if (typeof body.today === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.today)) today = body.today;
    // The debt book is only used as context for reading; it's kept small.
    book = JSON.parse(JSON.stringify(body.book ?? {}).slice(0, 6000));
  } catch {
    return reply(400, { error: "Bad request." });
  }
  if (lines.length === 0) return reply(200, { lines: [] });

  // Daily limit so one account can't run up the AI bill.
  const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: usage } = await admin.from("ai_usage").select("questions, lines").eq("user_id", userId).eq("day", today).maybeSingle();
  const used = usage?.lines ?? 0;
  if (used + lines.length > MAX_LINES_PER_DAY) return reply(429, { error: "Daily AI reading limit reached." });
  await admin.from("ai_usage").upsert({ user_id: userId, day: today, questions: usage?.questions ?? 0, lines: used + lines.length });

  const { data: settings } = await userClient.from("user_settings").select("mode, default_currency").maybeSingle();

  try {
    const client = new Anthropic({ apiKey });
    // deno-lint-ignore no-explicit-any
    const response: any = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 8000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            writer: { uses_flowz_for: settings?.mode ?? "personal", main_currency: settings?.default_currency ?? "NGN" },
            debt_book: book,
            lines,
          }),
        },
      ],
      // deno-lint-ignore no-explicit-any
    } as any);
    if (response.stop_reason === "refusal") return reply(200, { lines: [] });
    const text = response.content.find((b: { type: string }) => b.type === "text")?.text;
    const parsed = JSON.parse(text ?? "{}");
    const ids = new Set(lines.map((l) => l.id));
    // deno-lint-ignore no-explicit-any
    const out = (parsed.lines ?? []).filter((l: any) => ids.has(l.id) && KINDS.includes(l.kind));
    return reply(200, { lines: out });
  } catch (err) {
    console.error("read-lines failed", err);
    return reply(502, { error: "AI reading failed." });
  }
});
