import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, FileUp, Landmark, Link2, Plus, ShieldCheck, Sparkles, Trash2, X } from "lucide-react";
import clsx from "clsx";
import {
  addBankRule,
  deleteBankRule,
  deleteBankStatement,
  linkBankTxns,
  listBankRules,
  listBankStatements,
  listBankTxns,
  listDebts,
  listEntries,
  sampleStatement,
  saveBankStatement,
  setBankTxnStatus,
  upsertEntries,
  type BankStatement,
} from "@/lib/api";
import { buildMatchReport, cashDirection, chargesLine, counterparty, matchWindow, suggestLine, type BankRule, type BankTxn, type TxnResult } from "@/lib/bankMatch";
import { readStatementFiles, StatementError } from "@/lib/readStatementFile";
import type { ReadStatement } from "@/lib/bankStatement";
import { addDays, fromISODate, monthKey, monthRange, prettyMonth, shiftMonth, shortDay, todayISO } from "@/lib/dates";
import { KINDS, kindLabel } from "@/lib/kinds";
import { buildDebtBook, debtContext, formatMoney, type Entry } from "@/lib/money";
import { parseLine } from "@/lib/parse";
import { useAuth } from "@/hooks/useAuth";
import { EmptyState, ErrorNote, ProgressBar, Sheet, Spinner } from "@/components/ui";

const DISMISSED_KEY = "flowz:bank-dismissed";

function loadDismissed(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

function saveDismissed(ids: Set<string>) {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids].slice(-500)));
  } catch {
    // only a convenience
  }
}

const money = (t: BankTxn) => formatMoney(t.direction === "in" ? t.amount : -t.amount, t.currency, { sign: true });

export default function BankMatch() {
  const { settings } = useAuth();
  const mode = settings!.mode;
  const [month, setMonth] = useState(monthKey(todayISO()));
  const [statements, setStatements] = useState<BankStatement[]>([]);
  const [rules, setRules] = useState<BankRule[]>([]);
  const [txns, setTxns] = useState<BankTxn[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [debts, setDebts] = useState<Entry[]>([]);
  const [dismissed, setDismissed] = useState(loadDismissed);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [reading, setReading] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ read: ReadStatement; fileName: string } | null>(null);
  const [adding, setAdding] = useState<{ txns: BankTxn[]; text: string; date: string } | null>(null);
  const [ignoring, setIgnoring] = useState<BankTxn[] | null>(null);
  const [linking, setLinking] = useState<BankTxn | null>(null);
  const firstLoad = useRef(true);

  const { start, end } = monthRange(month);
  const load = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([listBankStatements(), listBankRules()]);
      setStatements(s);
      setRules(r);
      // Open on the latest month a statement covers.
      if (firstLoad.current) {
        firstLoad.current = false;
        const latest = s[0]?.period_end;
        if (latest && monthKey(latest) !== month) {
          setMonth(monthKey(latest));
          return;
        }
      }
      const win = matchWindow(start, end);
      const [t, e, d] = await Promise.all([listBankTxns(start, end), listEntries(win.start, win.end), listDebts()]);
      setTxns(t);
      setEntries(e);
      setDebts(d);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [start, end, month]);
  useEffect(() => {
    load();
  }, [load]);

  const periods = useMemo(
    () => statements.filter((s) => s.period_start && s.period_end).map((s) => ({ start: s.period_start!, end: s.period_end! })),
    [statements],
  );
  const report = useMemo(() => buildMatchReport(txns, entries, { rules, periods, dismissed }), [txns, entries, rules, periods, dismissed]);
  const worthALook = report.worthALook.filter((e) => e.entry_date >= start && e.entry_date <= end);
  const ctx = useMemo(() => debtContext(buildDebtBook(debts)), [debts]);

  async function onFiles(files: File[]) {
    if (!files.length) return;
    setError(null);
    setNotice(null);
    setReading("Opening your statement…");
    try {
      const read = await readStatementFiles(files, todayISO(), (done, total) =>
        setReading(total > 1 ? `Reading your statement… part ${Math.min(done + 1, total)} of ${total}` : "Reading your statement…"),
      );
      if (!read.transactions.length) throw new StatementError("Flowz couldn't find any transactions in this file.");
      setPreview({ read, fileName: files.map((f) => f.name).join(", ") });
    } catch (err) {
      setError(err instanceof StatementError || err instanceof Error ? err.message : "Flowz couldn't read this file.");
    } finally {
      setReading(null);
    }
  }

  async function trySample() {
    if (!sampleStatement) return;
    setReading("Making a sample statement from your notebook…");
    try {
      setPreview({ read: await sampleStatement(), fileName: "Sample statement" });
    } finally {
      setReading(null);
    }
  }

  async function saveStatement(bankName: string) {
    if (!preview) return;
    const { read, fileName } = preview;
    const { added, skipped } = await saveBankStatement({ file_name: fileName, bank_name: bankName.trim() || null, currency: read.currency }, read.transactions);
    setPreview(null);
    setNotice(
      added === 0
        ? "These transactions were already uploaded, so nothing new was added."
        : `Added ${added} transaction${added === 1 ? "" : "s"}${skipped ? ` (${skipped} already uploaded were skipped)` : ""}.`,
    );
    const last = read.transactions.map((t) => t.txn_date).sort().pop();
    if (last && monthKey(last) !== month) setMonth(monthKey(last));
    else load();
  }

  async function addLine(text: string, date: string, ids: string[]) {
    const p = parseLine(text, adding?.txns[0]?.currency ?? settings!.default_currency, ctx);
    const existing = await listEntries(date, date);
    const id = crypto.randomUUID();
    await upsertEntries([
      {
        id,
        entry_date: date,
        position: existing.length,
        text,
        amount: p.amount,
        currency: p.currency,
        kind: p.kind,
        category: p.category,
        person: p.person,
        kind_locked: false,
        settled_at: null,
      },
    ]);
    await linkBankTxns(ids, id);
    setAdding(null);
    load();
  }

  async function ignore(ids: string[], phrase: string | null) {
    if (phrase) await addBankRule(phrase);
    else await setBankTxnStatus(ids, "not_business");
    setIgnoring(null);
    load();
  }

  function dismiss(id: string) {
    const next = new Set(dismissed).add(id);
    setDismissed(next);
    saveDismissed(next);
  }

  const startAdd = (t: BankTxn) => setAdding({ txns: [t], text: suggestLine(t, ctx).text, date: t.txn_date > todayISO() ? todayISO() : t.txn_date });
  const startAddCharges = () => {
    const list = report.charges.map((r) => r.txn);
    const last = list.map((t) => t.txn_date).sort().pop()!;
    setAdding({ txns: list, text: chargesLine(list, month).text, date: last > todayISO() ? todayISO() : last });
  };

  const picker = (
    <FilePicker onFiles={onFiles} disabled={Boolean(reading)}>
      {statements.length ? "Upload another statement" : "Upload bank statement"}
    </FilePicker>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pt-1">
        <Link to="/month" className="rounded-full p-2 hover:bg-line/50" aria-label="Back to summary">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-extrabold">Bank Match</h1>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      {notice && (
        <p className="flex items-start justify-between gap-3 rounded-2xl bg-brand-soft px-4 py-3 text-sm font-semibold text-brand-dark">
          {notice}
          <button onClick={() => setNotice(null)} aria-label="Close"><X className="h-4 w-4" /></button>
        </p>
      )}
      {reading && (
        <div className="card flex items-center gap-3 p-4 font-bold text-brand-dark">
          <Spinner /> {reading}
        </div>
      )}

      {loading ? (
        <div className="grid h-40 place-items-center text-brand"><Spinner className="h-8 w-8" /></div>
      ) : statements.length === 0 ? (
        <section className="card space-y-4 p-6">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-sky-soft text-sky"><Landmark className="h-7 w-7" /></div>
          <h2 className="text-xl font-extrabold">Check your notebook against your bank</h2>
          <p className="text-muted">
            Upload your bank statement. Flowz finds money in your bank that isn't in your notebook, so nothing slips through.
            Cash you wrote down is fine — it won't be in the bank.
          </p>
          <ol className="space-y-1.5 text-sm font-semibold text-muted">
            <li>1. In your bank app, download your statement as <b className="text-ink">PDF</b> or <b className="text-ink">Excel</b>. Screenshots work too.</li>
            <li>2. Upload it here. Flowz reads it and matches it with your notebook.</li>
            <li>3. Add what's missing with one tap.</li>
          </ol>
          {picker}
          {sampleStatement && (
            <button className="btn-soft w-full" onClick={trySample} disabled={Boolean(reading)}>
              <Sparkles className="h-4 w-4" /> Try a sample statement
            </button>
          )}
          <Privacy />
        </section>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <button className="rounded-full p-2 hover:bg-line/50" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center">
              <div className="text-xs font-bold uppercase tracking-wide text-muted">Bank Match for</div>
              <div className="text-xl font-extrabold">{prettyMonth(month)}</div>
            </div>
            <button
              className="rounded-full p-2 hover:bg-line/50 disabled:opacity-30"
              onClick={() => setMonth(shiftMonth(month, 1))}
              disabled={month >= monthKey(todayISO())}
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {report.total === 0 ? (
            <EmptyState emoji="🏦" title={`No bank transactions for ${prettyMonth(month)}`}>
              Upload a statement that covers this month to check it against your notebook.
            </EmptyState>
          ) : (
            <section className="card p-5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-4xl font-extrabold">{report.score}%</span>
                <span className="text-right text-sm font-bold text-muted">
                  {report.accounted} of {report.total} bank transactions are in your notebook or explained
                </span>
              </div>
              <div className="mt-3"><ProgressBar value={report.accounted} max={report.total} /></div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold">
                <span className="text-brand-dark">✅ {report.done.length} matched</span>
                {report.missing.length > 0 && <span className="text-coral">⚠️ {report.missing.length} to check</span>}
                {report.charges.length > 0 && <span className="text-amber-700">🏦 {report.charges.length} bank charges</span>}
                {report.ignored.length > 0 && <span className="text-muted">🙈 {report.ignored.length} not business</span>}
              </div>
              {report.missing.length === 0 && report.charges.length === 0 && (
                <p className="mt-3 font-bold text-brand-dark">Everything in your bank is in your notebook. Well done!</p>
              )}
            </section>
          )}

          {report.missing.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-lg font-extrabold">In your bank, not in your notebook</h2>
              <p className="text-sm text-muted">Did you forget to write these? Add them, or say why they're not business.</p>
              <ul className="space-y-2">
                {report.missing.map(({ txn: t }) => (
                  <li key={t.id} className="card p-4">
                    <TxnRow t={t} />
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <button className="btn-soft px-2 py-2 text-sm" onClick={() => startAdd(t)}><Plus className="h-4 w-4" /> Add</button>
                      <button className="btn-ghost px-2 py-2 text-sm" onClick={() => setLinking(t)}><Link2 className="h-4 w-4" /> Written</button>
                      <button className="btn-ghost px-2 py-2 text-sm" onClick={() => setIgnoring([t])}>Not business</button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {report.charges.length > 0 && (
            <section className="card p-5">
              <div className="flex items-center justify-between gap-3">
                <span>
                  <span className="block font-extrabold">🏦 Bank charges</span>
                  <span className="text-sm text-muted">{report.charges.length} fees, SMS alerts and levies</span>
                </span>
                <span className="text-lg font-extrabold text-coral">
                  {formatMoney(-report.charges.reduce((s, r) => s + r.txn.amount, 0), report.charges[0].txn.currency)}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className="btn-soft py-2 text-sm" onClick={startAddCharges}><Plus className="h-4 w-4" /> Add as one line</button>
                <button className="btn-ghost py-2 text-sm" onClick={() => setIgnoring(report.charges.map((r) => r.txn))}>Not business</button>
              </div>
            </section>
          )}

          {worthALook.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-lg font-extrabold">Worth a look</h2>
              <p className="text-sm text-muted">You wrote these as bank payments, but Flowz didn't find them in your statement.</p>
              <ul className="space-y-2">
                {worthALook.map((e) => (
                  <li key={e.id} className="card flex items-center gap-3 p-4">
                    <Link to={`/day/${e.entry_date}`} className="min-w-0 flex-1">
                      <span className="block truncate font-hand text-xl">{e.text}</span>
                      <span className="text-xs font-bold text-muted">{shortDay(e.entry_date)}</span>
                    </Link>
                    <button className="btn-ghost shrink-0 px-3 py-2 text-sm" onClick={() => dismiss(e.id)}>It was cash</button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Collapsible title={`Matched (${report.done.length})`}>
            {report.done.map((r) => (
              <MatchedRow key={r.txn.id} r={r} onUnlink={r.state === "linked" ? () => linkBankTxns([r.txn.id], null).then(load) : undefined} />
            ))}
          </Collapsible>

          <Collapsible title={`Not business (${report.ignored.length})`}>
            {report.ignored.map(({ txn: t, rule }) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1"><TxnRow t={t} /></div>
                {rule ? (
                  <button className="shrink-0 text-xs font-bold text-muted underline" onClick={() => deleteBankRule(rule.id).then(load)}>
                    Stop ignoring “{rule.phrase}”
                  </button>
                ) : (
                  <button className="shrink-0 text-xs font-bold text-muted underline" onClick={() => setBankTxnStatus([t.id], "open").then(load)}>Undo</button>
                )}
              </li>
            ))}
          </Collapsible>

          <section className="space-y-3">
            {picker}
            {sampleStatement && (
              <button className="btn-soft w-full" onClick={trySample} disabled={Boolean(reading)}>
                <Sparkles className="h-4 w-4" /> Try a sample statement
              </button>
            )}
            <Collapsible title={`Uploaded statements (${statements.length})`}>
              {statements.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{s.bank_name ?? s.file_name}</span>
                    <span className="text-xs font-bold text-muted">
                      {s.period_start && s.period_end ? `${shortDay(s.period_start)} – ${shortDay(s.period_end)}` : s.file_name}
                    </span>
                  </span>
                  <button
                    className="rounded-full p-2 text-muted hover:bg-coral-soft hover:text-coral"
                    aria-label="Delete statement"
                    onClick={() => {
                      if (confirm("Delete this statement and its transactions from Flowz? Your notebook isn't changed.")) deleteBankStatement(s.id).then(load);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </Collapsible>
            <Privacy />
          </section>
        </>
      )}

      <PreviewSheet preview={preview} onClose={() => setPreview(null)} onSave={saveStatement} />
      <AddSheet adding={adding} mode={mode} ctx={ctx} onClose={() => setAdding(null)} onSave={addLine} />
      <IgnoreSheet txns={ignoring} onClose={() => setIgnoring(null)} onSave={ignore} />
      <LinkSheet txn={linking} entries={entries} onClose={() => setLinking(null)} onPick={(id) => linkBankTxns([linking!.id], id).then(() => { setLinking(null); load(); })} />
    </div>
  );
}

function Privacy() {
  return (
    <p className="flex items-start gap-2 text-xs font-semibold text-muted">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
      Flowz only reads the statement you upload. It can't see your bank account or move money. You can delete a statement any time.
    </p>
  );
}

function FilePicker({ onFiles, disabled, children }: { onFiles: (f: File[]) => void; disabled?: boolean; children: ReactNode }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <button className="btn-primary w-full" onClick={() => input.current?.click()} disabled={disabled}>
        <FileUp className="h-5 w-5" /> {children}
      </button>
      <input
        ref={input}
        type="file"
        multiple
        accept=".pdf,.csv,.xlsx,.xls,application/pdf,text/csv,image/*"
        className="hidden"
        onChange={(e) => {
          onFiles([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />
    </>
  );
}

function TxnRow({ t }: { t: BankTxn }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="min-w-0">
        <span className="block break-words text-sm font-bold">{t.description || "No description"}</span>
        <span className="text-xs font-bold text-muted">{shortDay(t.txn_date)}</span>
      </span>
      <span className={clsx("shrink-0 font-extrabold", t.direction === "in" ? "text-brand-dark" : "text-coral")}>{money(t)}</span>
    </div>
  );
}

function MatchedRow({ r, onUnlink }: { r: TxnResult; onUnlink?: () => void }) {
  const how = r.state === "linked" ? "Linked by you" : r.state === "covered" ? "Part of" : "Matched";
  return (
    <li className="px-4 py-3">
      <TxnRow t={r.txn} />
      {r.entry && (
        <div className="mt-1 flex items-center gap-2 text-sm">
          <span className="shrink-0 text-xs font-bold text-brand-dark">{how}</span>
          <Link to={`/day/${r.entry.entry_date}`} className="min-w-0 flex-1 truncate font-hand text-lg">“{r.entry.text}”</Link>
          {onUnlink && <button className="shrink-0 text-xs font-bold text-muted underline" onClick={onUnlink}>Unlink</button>}
        </div>
      )}
    </li>
  );
}

function Collapsible({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const empty = Array.isArray(children) && children.length === 0;
  if (empty) return null;
  return (
    <div>
      <button className="flex items-center gap-1 text-sm font-bold text-muted hover:text-ink" onClick={() => setOpen((o) => !o)}>
        <ChevronDown className={clsx("h-4 w-4 transition", open && "rotate-180")} /> {title}
      </button>
      {open && <ul className="card mt-2 divide-y divide-line overflow-hidden">{children}</ul>}
    </div>
  );
}

function PreviewSheet({ preview, onClose, onSave }: { preview: { read: ReadStatement; fileName: string } | null; onClose: () => void; onSave: (bank: string) => Promise<void> }) {
  const [bank, setBank] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setBank(preview?.read.bank_name ?? "");
    setError(null);
  }, [preview]);
  if (!preview) return null;
  const { read } = preview;
  const dates = read.transactions.map((t) => t.txn_date).sort();
  const total = (dir: "in" | "out") => read.transactions.filter((t) => t.direction === dir).reduce((s, t) => s + t.amount, 0);
  return (
    <Sheet open onClose={onClose} title="Check your statement">
      <div className="space-y-4">
        <p className="font-bold">
          Flowz found {read.transactions.length} transaction{read.transactions.length === 1 ? "" : "s"} from {shortDay(dates[0])} to {shortDay(dates[dates.length - 1])}.
        </p>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-2xl bg-brand-soft p-3">
            <div className="text-xs font-bold text-muted">Money in</div>
            <div className="font-extrabold text-brand-dark">{formatMoney(total("in"), read.currency)}</div>
          </div>
          <div className="rounded-2xl bg-coral-soft p-3">
            <div className="text-xs font-bold text-muted">Money out</div>
            <div className="font-extrabold text-coral">{formatMoney(total("out"), read.currency)}</div>
          </div>
        </div>
        <ul className="max-h-48 divide-y divide-line overflow-y-auto rounded-2xl border-2 border-line">
          {read.transactions.slice(0, 30).map((t, i) => (
            <li key={i} className="flex justify-between gap-3 px-3 py-2 text-sm">
              <span className="min-w-0 truncate"><span className="font-bold text-muted">{shortDay(t.txn_date)}</span> {t.description}</span>
              <span className={clsx("shrink-0 font-bold", t.direction === "in" ? "text-brand-dark" : "text-coral")}>
                {formatMoney(t.direction === "in" ? t.amount : -t.amount, read.currency, { sign: true })}
              </span>
            </li>
          ))}
          {read.transactions.length > 30 && <li className="px-3 py-2 text-center text-xs font-bold text-muted">and {read.transactions.length - 30} more</li>}
        </ul>
        <div>
          <label className="label" htmlFor="bank">Bank</label>
          <input id="bank" className="field" value={bank} onChange={(e) => setBank(e.target.value)} placeholder="e.g. GTBank, OPay" />
        </div>
        <p className="text-xs font-semibold text-muted">Does this look right? If the amounts look wrong, cancel and try the PDF or Excel version instead.</p>
        {error && <ErrorNote>{error}</ErrorNote>}
        <button
          className="btn-primary w-full"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onSave(bank);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? <Spinner /> : "Save and match"}
        </button>
      </div>
    </Sheet>
  );
}

function AddSheet({
  adding,
  mode,
  ctx,
  onClose,
  onSave,
}: {
  adding: { txns: BankTxn[]; text: string; date: string } | null;
  mode: "personal" | "business";
  ctx: ReturnType<typeof debtContext>;
  onClose: () => void;
  onSave: (text: string, date: string, ids: string[]) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setText(adding?.text ?? "");
    setDate(adding?.date ?? "");
    setError(null);
  }, [adding]);
  if (!adding) return null;
  const currency = adding.txns[0].currency;
  const parsed = parseLine(text, currency, ctx);
  const bankTotal = Math.round(adding.txns.reduce((s, t) => s + t.amount, 0) * 100) / 100;
  const differs = parsed.amount != null && Math.abs(parsed.amount - bankTotal) > 0.005;
  return (
    <Sheet open onClose={onClose} title="Add to notebook">
      <div className="space-y-4">
        {adding.txns.length === 1 ? (
          <div className="rounded-2xl bg-line/30 p-3"><TxnRow t={adding.txns[0]} /></div>
        ) : (
          <p className="text-sm font-bold text-muted">{adding.txns.length} bank charges, {formatMoney(bankTotal, currency)} in total</p>
        )}
        <div>
          <label className="label" htmlFor="line">Write it as you would in your notebook</label>
          <input id="line" className="field font-hand text-2xl" value={text} onChange={(e) => setText(e.target.value)} autoFocus />
          <p className="mt-2 flex items-center gap-2 text-sm font-bold">
            <span className={clsx("rounded-full px-3 py-1", KINDS[parsed.kind].chip)}>
              {KINDS[parsed.kind].emoji} {kindLabel(parsed.kind, mode)}
              {parsed.amount != null && ` · ${formatMoney(parsed.amount, parsed.currency ?? currency)}`}
            </span>
          </p>
          <p className="mt-1 text-xs text-muted">Change the words if Flowz guessed wrong, e.g. “Chidi paid back 12,000” or “Sold 2 bags of rice 12,000”.</p>
          {differs && <p className="mt-1 text-xs font-bold text-coral">The bank shows {formatMoney(bankTotal, currency)}.</p>}
        </div>
        <div>
          <label className="label" htmlFor="date">Page</label>
          <input id="date" type="date" className="field" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
        </div>
        {error && <ErrorNote>{error}</ErrorNote>}
        <button
          className="btn-primary w-full"
          disabled={busy || !text.trim() || !date}
          onClick={async () => {
            setBusy(true);
            try {
              await onSave(text.trim(), date, adding.txns.map((t) => t.id));
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? <Spinner /> : `Add to ${shortDay(date || todayISO())}`}
        </button>
      </div>
    </Sheet>
  );
}

function IgnoreSheet({ txns, onClose, onSave }: { txns: BankTxn[] | null; onClose: () => void; onSave: (ids: string[], phrase: string | null) => Promise<void> }) {
  const [always, setAlways] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setAlways(false);
    setPhrase(txns?.length === 1 ? (counterparty(txns[0].description) ?? "").toUpperCase() : "");
  }, [txns]);
  if (!txns) return null;
  const single = txns.length === 1;
  return (
    <Sheet open onClose={onClose} title="Not business money">
      <div className="space-y-4">
        <p className="text-muted">
          {single
            ? "For example a transfer to your own savings account, money for family, or a personal payment. It won't count as missing."
            : `These ${txns.length} transactions won't count as missing.`}
        </p>
        {single && <div className="rounded-2xl bg-line/30 p-3"><TxnRow t={txns[0]} /></div>}
        {single && (
          <div className="space-y-2">
            <label className="flex items-center gap-3 font-bold">
              <input type="checkbox" className="h-5 w-5 accent-brand" checked={always} onChange={(e) => setAlways(e.target.checked)} />
              Always ignore transfers with these words
            </label>
            {always && <input className="field" value={phrase} onChange={(e) => setPhrase(e.target.value)} placeholder="e.g. MUM or ADA SAVINGS" />}
          </div>
        )}
        <button
          className="btn-primary w-full"
          disabled={busy || (always && phrase.trim().length < 2)}
          onClick={async () => {
            setBusy(true);
            try {
              await onSave(txns.map((t) => t.id), always ? phrase.trim() : null);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? <Spinner /> : "Not business"}
        </button>
      </div>
    </Sheet>
  );
}

function LinkSheet({ txn, entries, onClose, onPick }: { txn: BankTxn | null; entries: Entry[]; onClose: () => void; onPick: (entryId: string) => void }) {
  const options = useMemo(() => {
    if (!txn) return [];
    const near = (e: Entry) => Math.abs(fromISODate(e.entry_date).getTime() - fromISODate(txn.txn_date).getTime()) / 86_400_000;
    return entries
      .filter((e) => e.amount != null && e.currency === txn.currency && cashDirection(e) === txn.direction && e.entry_date >= addDays(txn.txn_date, -7) && e.entry_date <= addDays(txn.txn_date, 7))
      .sort((a, b) => near(a) - near(b) || Math.abs((a.amount ?? 0) - txn.amount) - Math.abs((b.amount ?? 0) - txn.amount));
  }, [txn, entries]);
  if (!txn) return null;
  return (
    <Sheet open onClose={onClose} title="Which line is it?">
      <div className="space-y-3">
        <div className="rounded-2xl bg-line/30 p-3"><TxnRow t={txn} /></div>
        {options.length === 0 ? (
          <p className="text-muted">No {txn.direction === "in" ? "money-in" : "money-out"} lines within a week of this date. Use “Add” to write it instead.</p>
        ) : (
          <ul className="max-h-[50dvh] divide-y divide-line overflow-y-auto rounded-2xl border-2 border-line">
            {options.map((e) => (
              <li key={e.id}>
                <button className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-line/20" onClick={() => onPick(e.id)}>
                  <span aria-hidden>{KINDS[e.kind].emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-hand text-xl">{e.text}</span>
                    <span className="text-xs font-bold text-muted">{shortDay(e.entry_date)}</span>
                  </span>
                  <span className="shrink-0 font-bold">{formatMoney(e.amount ?? 0, e.currency ?? txn.currency, { compact: true })}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Sheet>
  );
}
