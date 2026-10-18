import { useEffect, useRef, useState, type FormEvent } from "react";
import { MessageCircleQuestion, SendHorizontal } from "lucide-react";
import clsx from "clsx";
import { askFlowz, type ChatMessage } from "@/lib/api";
import { todayISO } from "@/lib/dates";
import { Spinner } from "./ui";

const SUGGESTIONS = [
  "How much did I spend on transport this month?",
  "Who owes me money?",
  "What was my best day this month?",
  "Am I doing better than last month?",
  "What was my biggest expense?",
];

/** Chat box under the monthly summary: ask questions about your own notebook. */
export default function AskFlowz() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length) endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, busy]);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const history = messages.slice(-8);
    setMessages((m) => [...m, { role: "user", text: q }]);
    setQuestion("");
    setBusy(true);
    setError(null);
    try {
      const answer = await askFlowz(q, history, todayISO());
      setMessages((m) => [...m, { role: "assistant", text: answer }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    ask(question);
  }

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line px-5 py-3 font-extrabold">
        <MessageCircleQuestion className="h-5 w-5 text-brand" /> Ask Flowz
      </div>

      <div className="space-y-3 p-4">
        {messages.length === 0 && (
          <>
            <p className="text-sm text-muted">Ask anything about your money, in English or Pidgin. Answers come from what you wrote in your notebook.</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => ask(s)} className="rounded-full border-2 border-line bg-white px-3 py-1.5 text-left text-sm font-bold hover:border-brand">
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        {messages.map((m, i) => (
          <div key={i} className={clsx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={clsx(
                "max-w-[85%] whitespace-pre-line rounded-3xl px-4 py-2.5 text-[15px] leading-snug",
                m.role === "user" ? "rounded-br-lg bg-brand text-white" : "rounded-bl-lg bg-brand-soft text-ink",
              )}
            >
              {m.text}
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-3xl rounded-bl-lg bg-brand-soft px-4 py-2.5 text-sm text-muted">
              <Spinner className="h-4 w-4 text-brand" /> Checking your notebook…
            </div>
          </div>
        )}
        {error && <p className="rounded-2xl bg-coral-soft px-4 py-2.5 text-sm font-semibold text-coral">{error}</p>}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="flex gap-2 border-t border-line p-3">
        <input
          id="ask-flowz"
          className="field py-2.5"
          placeholder="e.g. How much did I sell last week?"
          value={question}
          maxLength={500}
          onChange={(e) => setQuestion(e.target.value)}
          aria-label="Ask a question about your money"
        />
        <button className="btn-primary shrink-0 px-4" disabled={busy || !question.trim()} aria-label="Ask">
          <SendHorizontal className="h-5 w-5" />
        </button>
      </form>
      {import.meta.env.MODE === "demo" && (
        <p className="px-5 pb-3 text-xs font-bold text-muted">Demo: answers simple questions with rules. The live app uses AI and understands almost any question.</p>
      )}
    </section>
  );
}
