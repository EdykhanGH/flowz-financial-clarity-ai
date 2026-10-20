import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { FileText, MessageCircleQuestion, SendHorizontal } from "lucide-react";
import clsx from "clsx";
import { askFlowz, type ChatMessage } from "@/lib/api";
import { todayISO } from "@/lib/dates";
import { periodOf } from "@/lib/periods";
import { Spinner } from "./ui";

type Message = ChatMessage & { link?: { to: string; label: string } };

/** "Prepare a profit and loss for September" → the statement, worked out exactly in the app. */
function statementRequest(q: string, today: string): Message | null {
  const t = q.toLowerCase();
  const bs = /balance\s*sheet|statement of financial position|net worth|what (?:is )?my business (?:is )?worth/.test(t);
  const pl = /profit\s*(?:and|&|n)\s*loss|\bp\s*&\s*l\b|\bp and l\b|\bpnl\b|income statement|income and (?:expenditure|spending)|account statement|statement of account|financial statement|accounts? for/.test(t);
  if (!bs && !pl) return null;
  const p = periodOf(q, today);
  const end = p.end > today ? today : p.end;
  const type = bs && !pl ? "bs" : "pl";
  const name = type === "bs" ? "Balance Sheet" : "Profit & Loss";
  const when = type === "bs" ? `as at ${end}` : `for ${p.label}`;
  return {
    role: "assistant",
    text: `Here is your ${name} ${when}, worked out from your notebook. It also tells you if anything is missing for it to be accurate.${bs && pl ? " Your Balance Sheet is on the next tab." : ""}`,
    link: { to: `/statements?type=${type}&start=${p.start}&end=${end}`, label: `Open ${name}` },
  };
}

const SUGGESTIONS = [
  "How much did I spend on transport this month?",
  "Who owes me money?",
  "What was my best day this month?",
  "Am I doing better than last month?",
  "What was my biggest expense?",
  "Prepare a profit and loss for last month",
];

/** Chat box under the monthly summary: ask questions about your own notebook. */
export default function AskFlowz() {
  const [messages, setMessages] = useState<Message[]>([]);
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
    const history = messages.slice(-8).map(({ role, text }) => ({ role, text }));
    setMessages((m) => [...m, { role: "user", text: q }]);
    setQuestion("");
    const statement = statementRequest(q, todayISO());
    if (statement) {
      setMessages((m) => [...m, statement]);
      return;
    }
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
              {m.link && (
                <Link to={m.link.to} className="btn-primary mt-3 flex w-full py-2 text-sm">
                  <FileText className="h-4 w-4" /> {m.link.label}
                </Link>
              )}
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
