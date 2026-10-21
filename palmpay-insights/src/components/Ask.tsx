import { Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { naira } from "../lib/format";
import { runTool } from "../lib/tools";
import type { Txn } from "../lib/types";

interface Msg {
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS = [
  "How much did I spend on betting since August?",
  "Who do I send the most money to?",
  "What day of the week do I spend the most?",
  "How much have I spent on data this month?",
  "Can I afford to save ₦20,000 this month?",
];

// Used only when the AI can't be reached, so the demo never dead-ends.
function offlineAnswer(q: string, txns: Txn[]): string {
  const s = q.toLowerCase();
  const map: [RegExp, string][] = [
    [/bet/, "Betting"], [/data|airtime/, "Airtime & Data"], [/food|eat|grocer/, "Food & Groceries"], [/transport|bolt|uber|ride/, "Transport"],
    [/subscri|netflix|dstv/, "Subscriptions"], [/fee|charge/, "Fees & Charges"], [/pos|cash/, "Cash Withdrawal"], [/rent/, "Rent"],
  ];
  const hit = map.find(([re]) => re.test(s));
  if (hit) {
    const r = runTool("sum_transactions", { category: hit[1], direction: "out" }, txns) as { total: number; count: number };
    return `You've spent ${naira(r.total)} on ${hit[1]} across ${r.count} payments in your history.`;
  }
  const b = runTool("breakdown", { by: "counterparty", direction: "out" }, txns) as { key: string; total: number }[];
  return `I couldn't reach the AI just now. Your biggest payee is ${b[0]?.key} (${naira(b[0]?.total ?? 0)}).`;
}

export default function Ask({ txns, name, language }: { txns: Txn[]; name: string; language: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => setMsgs([]), [txns]);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs, busy]);

  async function ask(q: string) {
    if (!q.trim() || busy) return;
    const history = msgs;
    setMsgs([...history, { role: "user", text: q }]);
    setInput("");
    setBusy(true);
    let answer: string;
    try {
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, history, txns, name, language }),
      });
      const j = await r.json();
      answer = j.answer ?? offlineAnswer(q, txns);
    } catch {
      answer = offlineAnswer(q, txns);
    }
    setMsgs((m) => [...m, { role: "assistant", text: answer }]);
    setBusy(false);
  }

  return (
    <div className="flex min-h-[60vh] flex-col">
      <div className="flex-1 space-y-3">
        {msgs.length === 0 && (
          <div className="card p-4">
            <div className="flex items-center gap-2 font-bold text-pp">
              <Sparkles size={18} /> Ask anything about your money
            </div>
            <p className="mt-1 text-sm text-muted">Answers come from your real PalmPay transactions, worked out exactly.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => ask(s)} className="chip bg-pp-soft text-left text-pp hover:bg-pp hover:text-white">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user" ? "rounded-br-sm bg-pp text-white" : "rounded-bl-sm bg-white shadow-card"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {busy && <div className="w-24 animate-pulse rounded-2xl bg-white px-4 py-2.5 text-sm text-muted shadow-card">Thinking…</div>}
        <div ref={end} />
      </div>
      <form
        className="sticky bottom-20 mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. How much did I send to Mum?"
          className="flex-1 rounded-full border border-pp/20 bg-white px-4 py-3 text-sm outline-none focus:border-pp"
        />
        <button disabled={busy} className="flex h-12 w-12 items-center justify-center rounded-full bg-pp text-white disabled:opacity-50" aria-label="Send">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
