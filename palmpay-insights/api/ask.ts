import { runTool, TOOLS } from "../src/lib/tools.js";
import type { Txn } from "../src/lib/types.js";
import { client, MODEL, textOf, type Req, type Res } from "./_claude.js";

const MAX_ROUNDS = 5;

// "Ask PalmPay": Claude answers questions about the user's transactions by calling tools that do exact maths.
export default async function handler(req: Req, res: Res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { question, history = [], txns = [], name, language } = req.body ?? {};
  if (!question) return res.status(400).json({ error: "Missing question" });
  const rows = txns as Txn[];
  const today = rows[rows.length - 1]?.date.slice(0, 10) ?? new Date().toISOString().slice(0, 10);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: any[] = [
    ...(history as { role: "user" | "assistant"; text: string }[]).slice(-8).map((m) => ({ role: m.role, content: m.text })),
    { role: "user", content: question },
  ];
  while (messages.length && messages[0].role !== "user") messages.shift();

  try {
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const response = await client().messages.create({
        model: MODEL,
        max_tokens: 2000,
        system: `You are "Ask PalmPay", a money assistant inside the PalmPay app in Nigeria, talking to ${name ?? "the user"}.
Today is ${today}. Their history runs from ${rows[0]?.date.slice(0, 10) ?? "?"} to ${today}.
Always use the tools to get numbers; never guess or do arithmetic yourself beyond what the tools return.
"Spending" means direction "out". Answer in 1-4 short sentences, amounts like ₦12,500. Add one practical tip when it helps.
${language === "pidgin" ? "Reply in friendly Nigerian Pidgin English." : "Reply in simple, plain English."}`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: TOOLS as any,
        messages,
      });
      messages.push({ role: "assistant", content: response.content });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const calls = response.content.filter((b: any) => b.type === "tool_use") as any[];
      if (response.stop_reason !== "tool_use" || !calls.length) return res.status(200).json({ answer: textOf(response.content) });
      messages.push({
        role: "user",
        content: calls.map((c) => ({
          type: "tool_result",
          tool_use_id: c.id,
          content: JSON.stringify(runTool(c.name, c.input ?? {}, rows)),
        })),
      });
    }
    return res.status(200).json({ answer: "Sorry, that one took too long. Try asking it a simpler way." });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
}
