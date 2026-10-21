import { BarChart3, List, MessageCircle, Sparkles, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Ask from "./components/Ask";
import { CategoryBars, MonthlyBars } from "./components/Charts";
import { InsightCard, ScoreRing, Section } from "./components/ui";
import { buildInsights, computeFacts, factSheet, perMonth } from "./lib/analyse";
import { monthName, naira, prettyDate } from "./lib/format";
import { openingBalance, PERSONAS, seedTransactions } from "./lib/seed";
import { readStatement } from "./lib/statement";
import type { Insight, Txn } from "./lib/types";

type Tab = "insights" | "ask" | "history";

export default function App() {
  const [source, setSource] = useState<string>("tunde");
  const [uploaded, setUploaded] = useState<{ name: string; txns: Txn[] } | null>(null);
  const [tab, setTab] = useState<Tab>("insights");
  const [language, setLanguage] = useState<"english" | "pidgin">("english");
  const [note, setNote] = useState<string | null>(null);
  const [noteLoading, setNoteLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const persona = PERSONAS.find((p) => p.id === source);
  const name = source === "upload" ? "there" : persona?.name ?? "there";
  const txns = useMemo(
    () => (source === "upload" && uploaded ? uploaded.txns : seedTransactions(source)),
    [source, uploaded],
  );
  const facts = useMemo(() => computeFacts(txns, source === "upload" ? 0 : openingBalance(source)), [txns, source]);
  const insights = useMemo(() => buildInsights(facts), [facts]);

  // AI coach note, written from the exact fact sheet.
  useEffect(() => {
    let cancelled = false;
    setNote(null);
    setNoteLoading(true);
    fetch("/api/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ facts: factSheet(facts, insights), name, language }),
    })
      .then((r) => r.json())
      .then((j) => !cancelled && setNote(j.note ?? null))
      .catch(() => !cancelled && setNote(null))
      .finally(() => !cancelled && setNoteLoading(false));
    return () => {
      cancelled = true;
    };
  }, [facts, insights, name, language]);

  async function onFile(f: File | undefined) {
    if (!f) return;
    setUploadError(null);
    try {
      const t = await readStatement(f);
      setUploaded({ name: f.name, txns: t });
      setSource("upload");
      setTab("insights");
    } catch (e) {
      setUploadError((e as Error).message);
    }
  }

  function onAction(i: Insight) {
    setToast(`"${i.action}": this would open in the PalmPay app.`);
    setTimeout(() => setToast(null), 2500);
  }

  const fallbackNote = insights
    .slice(0, 3)
    .map((i) => `• ${i.title}${i.action ? `. ${i.action}.` : "."}`)
    .join("\n");

  return (
    <div className="mx-auto min-h-screen max-w-md pb-28">
      {/* Header */}
      <header className="rounded-b-[28px] bg-gradient-to-br from-pp to-pp-dark px-4 pb-6 pt-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 font-black">P</div>
            <div>
              <div className="text-xs opacity-80">PalmPay</div>
              <div className="-mt-0.5 font-extrabold">Insights</div>
            </div>
          </div>
          <button
            onClick={() => setLanguage(language === "english" ? "pidgin" : "english")}
            className="chip bg-white/15 text-xs text-white"
          >
            {language === "english" ? "English" : "Pidgin"} ⇄
          </button>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSource(p.id)}
              className={`chip whitespace-nowrap ${source === p.id ? "bg-white text-pp" : "bg-white/15 text-white"}`}
            >
              {p.name} · {p.tagline.split(",")[0]}
            </button>
          ))}
          {uploaded && (
            <button
              onClick={() => setSource("upload")}
              className={`chip whitespace-nowrap ${source === "upload" ? "bg-white text-pp" : "bg-white/15 text-white"}`}
            >
              My statement
            </button>
          )}
          <button onClick={() => fileRef.current?.click()} className="chip flex items-center gap-1 whitespace-nowrap bg-white/15 text-white">
            <Upload size={14} /> Upload statement
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
        {uploadError && <div className="mt-2 rounded-lg bg-white/15 p-2 text-sm">{uploadError}</div>}

        <div className="mt-5 flex items-center justify-between">
          <div>
            <div className="text-sm opacity-80">Hi {name} 👋 Balance</div>
            <div className="text-3xl font-extrabold">{naira(facts.balance)}</div>
            <div className="mt-1 text-xs opacity-80">
              {monthName(facts.month)} so far: in {naira(facts.thisMonth.income)} · out {naira(facts.thisMonth.spend)}
            </div>
          </div>
          <div className="text-center">
            <ScoreRing score={facts.score} />
            <div className="text-[11px] font-semibold opacity-90">Money health</div>
          </div>
        </div>
      </header>

      <main className="px-4">
        {tab === "insights" && (
          <>
            <div className="card -mt-0 mt-4 border border-pp/10 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-pp">
                <Sparkles size={16} /> Your money coach
              </div>
              {noteLoading ? (
                <div className="mt-2 space-y-2">
                  <div className="h-3 w-full animate-pulse rounded bg-pp-soft" />
                  <div className="h-3 w-5/6 animate-pulse rounded bg-pp-soft" />
                  <div className="h-3 w-4/6 animate-pulse rounded bg-pp-soft" />
                </div>
              ) : (
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{note ?? fallbackNote}</p>
              )}
            </div>

            <Section title="Insights for you" right={<span className="text-xs text-muted">{insights.length} found</span>}>
              <div className="space-y-3">
                {insights.map((i) => (
                  <InsightCard key={i.id} insight={i} onAction={onAction} />
                ))}
              </div>
            </Section>

            <Section title={`Where your money went in ${monthName(facts.month)}`}>
              <CategoryBars facts={facts} />
            </Section>

            <Section title="Month by month">
              <MonthlyBars facts={facts} />
            </Section>

            {facts.recurring.length > 0 && (
              <Section title="Regular payments we found">
                <div className="card divide-y divide-pp-soft">
                  {facts.recurring.slice(0, 8).map((r) => (
                    <div key={r.counterparty} className="flex items-center justify-between p-3 text-sm">
                      <div>
                        <div className="font-semibold">{r.counterparty}</div>
                        <div className="text-xs text-muted">
                          {r.category} · every {r.everyDays >= 25 && r.everyDays <= 35 ? "month" : `${r.everyDays} days`} · next ~
                          {new Date(r.nextDate).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{naira(r.amount)}</div>
                        <div className="text-[11px] text-muted">{naira(perMonth(r))}/mo</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </>
        )}

        {tab === "ask" && (
          <div className="mt-4">
            <Ask txns={txns} name={name} language={language} />
          </div>
        )}

        {tab === "history" && (
          <Section title={`${txns.length} transactions`}>
            <div className="card divide-y divide-pp-soft">
              {[...txns]
                .reverse()
                .slice(0, 150)
                .map((x) => (
                  <div key={x.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{x.description}</div>
                      <div className="text-xs text-muted">
                        {prettyDate(x.date)} · <span className="font-semibold text-pp">{x.category}</span>
                      </div>
                    </div>
                    <div className={`shrink-0 font-bold ${x.direction === "in" ? "text-ok" : ""}`}>
                      {x.direction === "in" ? "+" : "−"}
                      {naira(x.amount)}
                    </div>
                  </div>
                ))}
            </div>
          </Section>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-20 w-[90%] max-w-sm -translate-x-1/2 rounded-xl bg-pp-ink px-4 py-3 text-center text-sm text-white shadow-card">
          {toast}
        </div>
      )}

      <nav className="fixed bottom-0 left-1/2 z-10 flex w-full max-w-md -translate-x-1/2 justify-around border-t border-pp/10 bg-white py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {(
          [
            ["insights", "Insights", BarChart3],
            ["ask", "Ask PalmPay", MessageCircle],
            ["history", "Transactions", List],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-col items-center px-4 py-1 text-xs font-semibold ${tab === id ? "text-pp" : "text-muted"}`}
          >
            <Icon size={22} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
