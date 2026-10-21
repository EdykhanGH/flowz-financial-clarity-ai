import { client, MODEL, textOf, type Req, type Res } from "./_claude.js";

// Writes the personal "coach note" from a fact sheet that was computed in code.
export default async function handler(req: Req, res: Res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { facts, name, language } = req.body ?? {};
  if (!facts) return res.status(400).json({ error: "Missing facts" });

  try {
    const response = await client().messages.create({
      model: MODEL,
      max_tokens: 1200,
      system: `You are PalmPay's friendly money coach for Nigerian users. You receive a fact sheet computed from the user's PalmPay transactions.
Write a short personal note:
- 1 opening sentence on how this month is going (warm, direct, use their name).
- Then exactly 3 bullet points starting with "• ", each one specific, actionable step with a naira amount from the facts. Mention a PalmPay feature (CashBox savings, QR pay, bill payments, spending limits) where it genuinely fits.
Use ONLY numbers that appear in the facts. Never invent numbers or do new arithmetic. Under 110 words. Amounts as ₦12,500.
${language === "pidgin" ? "Write in friendly Nigerian Pidgin English." : "Write in simple, plain English."}`,
      messages: [{ role: "user", content: `Name: ${name ?? "there"}\nFacts:\n${JSON.stringify(facts)}` }],
    });
    return res.status(200).json({ note: textOf(response.content) });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
}
