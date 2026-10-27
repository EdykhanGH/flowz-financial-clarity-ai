import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CalendarDays, Check, ChevronLeft, ChevronRight, CloudOff, HelpCircle, Lightbulb, Mic, Package, Sparkles } from "lucide-react";
import clsx from "clsx";
import { useUser } from "@/hooks/useAuth";
import { deleteEntries, listDebts, listEntries, listItems, listStockLines, readLinesWithAI, upsertEntries } from "@/lib/api";
import { addDays, greeting, prettyDay, todayISO } from "@/lib/dates";
import { CATEGORY_BY_ID, KINDS, kindLabel } from "@/lib/kinds";
import { balanceFor, buildDebtBook, debtContext, formatMoney, totalsByCurrency, type DebtBook, type Entry } from "@/lib/money";
import { needsCloserLook, parseLine, type Currency, type DebtContext } from "@/lib/parse";
import { afterCount, isLow, readWithStock, stockDirection, type InventoryItem } from "@/lib/inventory";
import { spokenLines, useDictation } from "@/lib/speech";
import KindSheet, { type LinePatch } from "@/components/KindSheet";
import TotalsCard from "@/components/TotalsCard";
import { ReminderNudge } from "@/components/Reminders";
import { ErrorNote, Spinner } from "@/components/ui";

export default function DayPage() {
  const { date } = useParams();
  const day = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayISO();
  // A fresh editor per day, so unsaved work is flushed when you turn the page.
  return <DayEditor key={day} date={day} />;
}

type Line = Entry & { confident?: boolean; ai?: boolean };

interface Draft {
  at: number;
  lines: Line[];
}
type SaveState = "idle" | "pending" | "saving" | "saved" | "offline";

const EXAMPLES = [
  "Sold 3 bags of rice 45,000",
  "Bought fuel 8,500",
  "Gave mum 10k",
  "Transport 1,200",
  "Joy bought 50k rice on credit",
  "Joy paid back 30k for rice",
  "Money enter 15k",
  "Emeka dey owe me 4k",
];

function blankLine(date: string): Line {
  return {
    id: crypto.randomUUID(),
    entry_date: date,
    position: 0,
    text: "",
    amount: null,
    currency: null,
    kind: "note",
    category: null,
    person: null,
    kind_locked: false,
    settled_at: null,
  };
}

/** Re-read a line after its text changed. Choices the user made by hand are kept. */
function withText(line: Line, text: string, defaultCurrency: Currency, ctx: DebtContext | undefined, items: InventoryItem[]): Line {
  const p = readWithStock(text, items, defaultCurrency, ctx);
  const stock = { item_id: p.item_id, item_qty: p.item_qty };
  if (line.kind_locked) {
    return {
      ...line,
      ...stock,
      text,
      amount: p.amount,
      currency: p.amount == null ? null : line.currency ?? p.currency,
      person: line.person ?? p.person,
      confident: true,
      ai: false,
    };
  }
  return { ...line, ...stock, text, amount: p.amount, currency: p.currency, kind: p.kind, category: p.category, person: p.person, confident: p.confident, ai: false };
}

function withTrailingBlank(lines: Line[], date: string) {
  const last = lines[lines.length - 1];
  return !last || last.text.trim() ? [...lines, blankLine(date)] : lines;
}

/** What we compare to decide whether a row needs saving. */
function snapshot(l: Entry, position: number) {
  return JSON.stringify([l.text, l.amount, l.currency, l.kind, l.category, l.person, l.kind_locked, l.item_id ?? null, l.item_qty ?? null, position]);
}

function DayEditor({ date }: { date: string }) {
  const { userId, settings } = useUser();
  const navigate = useNavigate();
  const draftKey = `flowz:draft:${userId}:${date}`;
  const mode = settings.mode;
  const cur = settings.default_currency;

  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [editing, setEditing] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const linesRef = useRef<Line[]>([]);
  const saved = useRef(new Map<string, string>()); // id → snapshot of what the server has
  const loaded = useRef(false);
  const saving = useRef(false);
  const again = useRef(false);
  const timer = useRef<number>();
  const inputs = useRef(new Map<string, HTMLInputElement>());
  const pendingFocus = useRef<{ id: string; caret: number } | null>(null);
  const [otherDebts, setOtherDebts] = useState<Entry[]>([]); // debt lines from other days
  const otherDebtsRef = useRef<Entry[]>([]);
  const touched = useRef(new Set<string>()); // lines edited in this visit
  const aiAsked = useRef(new Map<string, string>()); // line id → text already sent to the AI
  const [items, setItems] = useState<InventoryItem[]>([]);
  const itemsRef = useRef<InventoryItem[]>([]);
  itemsRef.current = items;
  const [stockLines, setStockLines] = useState<Entry[]>([]); // lines on other days that moved stock

  linesRef.current = lines;
  otherDebtsRef.current = otherDebts;

  /** The debt book as it stands without one line, so that line can be read in context. */
  const contextWithout = useCallback((id: string, list: Line[]) => {
    return debtContext(buildDebtBook([...otherDebtsRef.current, ...list.filter((l) => l.id !== id && l.text.trim())]));
  }, []);

  const read = useCallback(
    (l: Line, text: string) => {
      touched.current.add(l.id);
      return withText(l, text, cur, contextWithout(l.id, linesRef.current), itemsRef.current);
    },
    [cur, contextWithout],
  );

  // ---------- load ----------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [rows, debts] = await Promise.all([
          listEntries(date, date) as Promise<Line[]>,
          listDebts().catch(() => [] as Entry[]),
        ]);
        if (cancelled) return;
        rows.forEach((r, i) => saved.current.set(r.id, snapshot(r, i)));
        setOtherDebts(debts.filter((d) => d.entry_date !== date));

        let start = rows;
        let fromDraft = false;
        try {
          const raw = localStorage.getItem(draftKey);
          if (raw) {
            const parsed = JSON.parse(raw) as Draft | Line[];
            const draft: Draft = Array.isArray(parsed) ? { at: 0, lines: parsed } : parsed;
            // Lines added elsewhere after the draft (e.g. "Record payment") are kept.
            const inDraft = new Set(draft.lines.map((l) => l.id));
            const newer = rows.filter((r) => !inDraft.has(r.id) && r.updated_at && Date.parse(r.updated_at) > draft.at);
            start = [...draft.lines, ...newer];
            fromDraft = true;
          }
        } catch {
          // no draft
        }
        loaded.current = true;
        setLines(withTrailingBlank(start, date));
        setSaveState(fromDraft ? "pending" : rows.length ? "saved" : "idle");
      } catch (e) {
        if (!cancelled) setLoadError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date, draftKey]);

  // Inventory: items to recognise in lines, and what moved their stock on other days.
  useEffect(() => {
    let cancelled = false;
    listItems()
      .then(async (list) => {
        if (cancelled || !list.length) return;
        setItems(list);
        const since = list.reduce((min, i) => (i.counted_at.slice(0, 10) < min ? i.counted_at.slice(0, 10) : min), "9999-12-31");
        const moved = await listStockLines(since);
        if (!cancelled) setStockLines(moved.filter((e) => e.entry_date !== date));
      })
      .catch(() => {
        // inventory is optional
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  // ---------- save ----------
  const persist = useCallback(async () => {
    if (!loaded.current) return;
    if (saving.current) {
      again.current = true;
      return;
    }
    saving.current = true;
    const startedWith = linesRef.current;
    const rows = startedWith.filter((l) => l.text.trim()).map((l, i) => ({ ...l, position: i }));
    const changed = rows.filter((r) => saved.current.get(r.id) !== snapshot(r, r.position));
    const keep = new Set(rows.map((r) => r.id));
    const removed = [...saved.current.keys()].filter((id) => !keep.has(id));

    if (changed.length === 0 && removed.length === 0) {
      saving.current = false;
      setSaveState(rows.length ? "saved" : "idle");
      try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
      return;
    }

    setSaveState("saving");
    try {
      await upsertEntries(changed.map(({ confident: _c, ai: _a, ...r }) => r));
      await deleteEntries(removed);
      changed.forEach((r) => saved.current.set(r.id, snapshot(r, r.position)));
      removed.forEach((id) => saved.current.delete(id));
      if (linesRef.current === startedWith) {
        try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
      }
      setSaveState("saved");
    } catch (e) {
      console.error(e);
      setSaveState("offline");
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(persist, 10_000);
    } finally {
      saving.current = false;
      if (again.current) {
        again.current = false;
        persist();
      }
    }
  }, [draftKey]);

  const scheduleSave = useCallback(
    (next: Line[]) => {
      try {
        const draft: Draft = { at: Date.now(), lines: next.filter((l) => l.text.trim()) };
        localStorage.setItem(draftKey, JSON.stringify(draft));
      } catch {
        // storage full or blocked; the server save still runs
      }
      setSaveState((s) => (s === "offline" ? s : "pending"));
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(persist, 700);
    },
    [draftKey, persist],
  );

  // Save straight away when leaving the page or coming back online.
  useEffect(() => {
    const flush = () => persist();
    window.addEventListener("online", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("online", flush);
      window.removeEventListener("pagehide", flush);
      window.clearTimeout(timer.current);
      persist();
    };
  }, [persist]);

  const update = useCallback(
    (fn: (prev: Line[]) => Line[]) => {
      const next = withTrailingBlank(fn(linesRef.current), date);
      linesRef.current = next;
      setLines(next);
      scheduleSave(next);
    },
    [date, scheduleSave],
  );

  // ---------- editing ----------
  useLayoutEffect(() => {
    const f = pendingFocus.current;
    if (!f) return;
    const el = inputs.current.get(f.id);
    if (el) {
      el.focus();
      el.setSelectionRange(f.caret, f.caret);
    }
    pendingFocus.current = null;
  });

  function setText(id: string, text: string) {
    update((prev) => prev.map((l) => (l.id === id ? read(l, text) : l)));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>, index: number) {
    const el = e.currentTarget;
    const line = lines[index];
    const caret = el.selectionStart ?? el.value.length;

    if (e.key === "Enter") {
      e.preventDefault();
      const next = lines[index + 1];
      // At the end of a line with an empty line below: just move down.
      if (next && !next.text && caret === el.value.length) {
        pendingFocus.current = { id: next.id, caret: 0 };
        setLines([...lines]);
        return;
      }
      const before = el.value.slice(0, caret);
      const after = el.value.slice(el.selectionEnd ?? caret);
      const fresh = read(blankLine(date), after);
      pendingFocus.current = { id: fresh.id, caret: 0 };
      update((prev) => {
        const next = [...prev];
        next[index] = read(line, before);
        next.splice(index + 1, 0, fresh);
        return next;
      });
    } else if (e.key === "Backspace" && caret === 0 && el.selectionEnd === 0 && index > 0) {
      e.preventDefault();
      const prevLine = lines[index - 1];
      pendingFocus.current = { id: prevLine.id, caret: prevLine.text.length };
      update((prev) => {
        const next = [...prev];
        next[index - 1] = read(prevLine, prevLine.text + line.text);
        next.splice(index, 1);
        return next;
      });
    } else if (e.key === "ArrowUp" && index > 0) {
      e.preventDefault();
      pendingFocus.current = { id: lines[index - 1].id, caret: Math.min(caret, lines[index - 1].text.length) };
      setLines([...lines]);
    } else if (e.key === "ArrowDown" && index < lines.length - 1) {
      e.preventDefault();
      pendingFocus.current = { id: lines[index + 1].id, caret: Math.min(caret, lines[index + 1].text.length) };
      setLines([...lines]);
    }
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>, index: number) {
    const pasted = e.clipboardData.getData("text");
    if (!pasted.includes("\n")) return;
    e.preventDefault();
    const el = e.currentTarget;
    const caret = el.selectionStart ?? el.value.length;
    const before = el.value.slice(0, caret);
    const after = el.value.slice(el.selectionEnd ?? caret);
    const parts = pasted.replace(/\r/g, "").split("\n");
    parts[0] = before + parts[0];
    parts[parts.length - 1] += after;
    const line = lines[index];
    const created = parts.slice(1).map((t) => read(blankLine(date), t));
    const last = created[created.length - 1];
    if (last) pendingFocus.current = { id: last.id, caret: last.text.length - after.length };
    update((prev) => {
      const next = [...prev];
      next[index] = read(line, parts[0]);
      next.splice(index + 1, 0, ...created);
      return next;
    });
  }

  // Speaking: each pause (or "next line") becomes a line, read just like a typed one.
  const addSpoken = useCallback(
    (said: string) => {
      const parts = spokenLines(said);
      if (!parts.length) return;
      update((prev) => {
        const next = [...prev];
        for (const text of parts) {
          const last = next[next.length - 1];
          if (last && !last.text.trim()) next[next.length - 1] = read(last, text);
          else next.push(read(blankLine(date), text));
        }
        return next;
      });
    },
    [update, read, date],
  );
  const voice = useDictation(addSpoken);

  function patchLine(id: string, patch: LinePatch) {
    update((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch, confident: true } : l)));
  }

  function resetLine(id: string) {
    update((prev) => prev.map((l) => (l.id === id ? read({ ...l, kind_locked: false }, l.text) : l)));
  }

  const totals = useMemo(() => totalsByCurrency(lines), [lines]);
  // For each repayment line: what is still owed right after that line.
  const leftAfter = useMemo(() => {
    const before = otherDebts.filter((d) => d.entry_date < date);
    const out = new Map<string, number>();
    lines.forEach((l, i) => {
      if ((l.kind !== "repaid_to_me" && l.kind !== "i_repaid") || !l.person || !l.currency) return;
      const book = buildDebtBook([...before, ...lines.slice(0, i + 1).filter((x) => x.text.trim())]);
      const left = balanceFor(book, l.kind === "repaid_to_me" ? "owedToMe" : "iOwe", l.person, l.currency);
      if (left != null) out.set(l.id, left);
    });
    return out;
  }, [otherDebts, lines, date]);

  // For each line that moved stock: how many are left right after it.
  const stockAfter = useMemo(() => {
    const out = new Map<string, { left: number; low: boolean; unit: string }>();
    if (!items.length) return out;
    const byId = new Map(items.map((i) => [i.id, i]));
    const level = new Map(items.map((i) => [i.id, i.stock_units]));
    const move = (e: Entry) => {
      const item = e.item_id ? byId.get(e.item_id) : undefined;
      if (!item || !e.item_qty || !afterCount(e, item)) return null;
      level.set(item.id, (level.get(item.id) ?? 0) + stockDirection(e.kind) * e.item_qty);
      return item;
    };
    stockLines.filter((e) => e.entry_date < date).forEach(move);
    lines.forEach((l) => {
      const item = l.text.trim() ? move(l) : null;
      if (item) {
        const left = Math.round((level.get(item.id) ?? 0) * 100) / 100;
        out.set(l.id, { left, low: isLow(item, left), unit: item.unit_name });
      }
    });
    return out;
  }, [items, stockLines, lines, date]);

  // ---------- AI reading of unclear lines ----------
  useEffect(() => {
    if (!loaded.current) return;
    const t = window.setTimeout(async () => {
      const candidates = linesRef.current.filter(
        (l) =>
          l.text.trim() &&
          touched.current.has(l.id) &&
          !l.kind_locked &&
          !l.ai &&
          !l.item_id &&
          aiAsked.current.get(l.id) !== l.text &&
          needsCloserLook(l.text, { amount: l.amount, currency: l.currency, kind: l.kind, category: l.category, person: l.person, confident: l.confident ?? true }),
      );
      if (candidates.length === 0) return;
      const asked = new Map(candidates.slice(0, 10).map((l) => [l.id, l.text]));
      asked.forEach((text, id) => aiAsked.current.set(id, text));
      const results = await readLinesWithAI(
        [...asked].map(([id, text]) => ({ id, text })),
        compactBook(buildDebtBook([...otherDebtsRef.current, ...linesRef.current.filter((l) => l.text.trim() && !asked.has(l.id))])),
        todayISO(),
      );
      if (!results?.length) return;
      const byId = new Map(results.map((r) => [r.id, r]));
      const current = linesRef.current;
      const next = current.map((l) => {
        const r = byId.get(l.id);
        if (!r || l.kind_locked || l.text !== asked.get(l.id)) return l; // changed since we asked
        const noMoney = r.kind === "note" || r.amount == null;
        return {
          ...l,
          kind: r.kind,
          amount: noMoney ? null : r.amount,
          currency: noMoney ? null : r.currency ?? l.currency ?? cur,
          category: r.category,
          person: r.person,
          confident: r.confident,
          ai: true,
        };
      });
      if (next.some((l, i) => l !== current[i])) update(() => next);
    }, 1500);
    return () => window.clearTimeout(t);
  }, [lines, cur, update]);
  const editingLine = lines.find((l) => l.id === editing) ?? null;
  const isToday = date === todayISO();
  const filled = lines.filter((l) => l.text.trim()).length;

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between pt-1">
        <button className="rounded-full p-2 hover:bg-line/50" onClick={() => navigate(`/day/${addDays(date, -1)}`)} aria-label="Previous day">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <label className="relative flex cursor-pointer flex-col items-center">
          <span className="font-hand text-4xl font-bold leading-none">{prettyDay(date)}</span>
          <span className="mt-1 flex items-center gap-1 text-sm font-semibold text-muted">
            <CalendarDays className="h-4 w-4" />
            {isToday ? `${greeting()}, ${settings.display_name}` : "Pick another day"}
          </span>
          <input
            type="date"
            className="absolute inset-0 cursor-pointer opacity-0"
            value={date}
            onChange={(e) => e.target.value && navigate(`/day/${e.target.value}`)}
            aria-label="Choose a day"
          />
        </label>
        <button className="rounded-full p-2 hover:bg-line/50" onClick={() => navigate(`/day/${addDays(date, 1)}`)} aria-label="Next day">
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      <div className="sticky top-[60px] z-20">
        <TotalsCard
          totals={totals}
          fallbackCurrency={cur}
          labels={{ in: "Money in", out: "Money out", net: isToday ? "Left today" : "Left" }}
        />
      </div>

      {loadError && <ErrorNote>We couldn't open this page: {loadError}</ErrorNote>}

      {/* The notebook page */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-2 text-xs font-bold text-muted">
          <span>{filled ? `${filled} line${filled === 1 ? "" : "s"}` : "Write anything — one thing per line"}</span>
          <span className="flex items-center gap-3">
            <SaveBadge state={saveState} />
            <Link to="/inventory" className="flex items-center gap-1 rounded-full bg-sky-soft px-2.5 py-1 text-sky hover:brightness-95">
              <Package className="h-3.5 w-3.5" /> Inventory
            </Link>
          </span>
        </div>

        {loading ? (
          <div className="grid h-48 place-items-center text-brand"><Spinner /></div>
        ) : (
          <ul className="ruled min-h-[288px] pl-3 pr-2">
            {lines.map((line, i) => (
              <li key={line.id} className="flex h-12 items-center gap-2">
                <span className="w-5 shrink-0 text-right text-xs font-bold text-line">{i + 1}</span>
                <input
                  ref={(el) => {
                    if (el) inputs.current.set(line.id, el);
                    else inputs.current.delete(line.id);
                  }}
                  value={line.text}
                  onChange={(e) => setText(line.id, e.target.value)}
                  onKeyDown={(e) => onKeyDown(e, i)}
                  onPaste={(e) => onPaste(e, i)}
                  placeholder={i === lines.length - 1 ? (filled ? "Next line…" : `Try: ${EXAMPLES[0]}`) : ""}
                  className="min-w-0 flex-1 bg-transparent font-hand text-[22px] leading-none outline-none placeholder:text-muted/50"
                  enterKeyHint="next"
                  autoCapitalize="sentences"
                  aria-label={`Line ${i + 1}`}
                />
                {i === lines.length - 1 && !line.text ? (
                  <button
                    onClick={voice.listening ? voice.stop : voice.start}
                    className={clsx(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full transition",
                      voice.listening ? "animate-pulse bg-coral text-white" : "bg-brand-soft text-brand-dark hover:brightness-95",
                    )}
                    aria-label={voice.listening ? "Stop speaking" : "Speak instead of typing"}
                    title={voice.listening ? "Stop" : "Speak instead of typing"}
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                ) : (
                  <LineChip line={line} mode={mode} left={leftAfter.get(line.id) ?? null} stock={stockAfter.get(line.id) ?? null} onClick={() => setEditing(line.id)} />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {voice.error && (
        <button className="w-full text-left" onClick={voice.clearError}>
          <ErrorNote>{voice.error}</ErrorNote>
        </button>
      )}

      {/* Listening: what's being heard, above the menu */}
      {voice.listening && (
        <div className="fixed inset-x-0 bottom-[84px] z-30 mx-auto max-w-2xl px-4" role="status" aria-live="polite">
          <div className="card flex items-center gap-3 p-4 ring-2 ring-coral/40">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-coral opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-coral" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold">Listening… say one thing, then pause</span>
              <span className="block truncate font-hand text-xl text-muted">{voice.interim || "e.g. “Sold three bags of rice forty five thousand”"}</span>
            </span>
            <button className="btn-primary shrink-0 px-4 py-2" onClick={voice.stop}>Done</button>
          </div>
        </div>
      )}

      {/* Help */}
      <button onClick={() => setShowHelp((s) => !s)} className="flex w-full items-center gap-2 text-sm font-bold text-muted hover:text-ink">
        <HelpCircle className="h-4 w-4" /> How do I write in Flowz?
      </button>
      {showHelp && (
        <div className="card space-y-3 p-4 text-sm">
          <p>Write one thing per line, the way you would on paper, in everyday English or Pidgin. Put the amount anywhere in the line.</p>
          <p className="flex gap-2"><Mic className="h-4 w-4 shrink-0 text-brand" /> Or tap the microphone on the empty line and speak. Each pause starts a new line, or say “next line”.</p>
          <ul className="space-y-1.5">
            {EXAMPLES.map((ex) => {
              const p = parseLine(ex, cur);
              return (
                <li key={ex} className="flex items-center justify-between gap-2">
                  <span className="font-hand text-xl">{ex}</span>
                  <span className={clsx("rounded-full px-2 py-0.5 text-xs font-bold", KINDS[p.kind].chip)}>
                    {KINDS[p.kind].emoji} {kindLabel(p.kind, mode)}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="flex gap-2 text-muted">
            <Lightbulb className="h-4 w-4 shrink-0 text-sun" />
            “10k”, “ten thousand” and “#10,000” all mean ₦10,000. Add $ or “dollars” for dollars. When someone pays back, Flowz takes it off what they owe. Tap a coloured tag to change it.
          </p>
        </div>
      )}

      {isToday && filled > 0 && <ReminderNudge />}

      {!isToday && (
        <Link to="/today" className="btn-soft w-full">Go to today's page</Link>
      )}

      <KindSheet
        line={editingLine}
        mode={mode}
        onClose={() => setEditing(null)}
        onChange={(patch) => editingLine && patchLine(editingLine.id, patch)}
        onReset={() => editingLine && resetLine(editingLine.id)}
      />
    </div>
  );
}

/** The debt book in a small shape for the AI: who owes what. */
function compactBook(book: DebtBook) {
  const pick = (list: DebtBook["owedToMe"]) =>
    list.filter((p) => p.balance > 0).slice(0, 40).map((p) => ({ name: p.name, still_owes: p.balance, currency: p.currency }));
  return { people_who_owe_me: pick(book.owedToMe), people_i_owe: pick(book.iOwe) };
}

function LineChip({
  line,
  mode,
  left,
  stock,
  onClick,
}: {
  line: Line;
  mode: "personal" | "business";
  left: number | null;
  stock: { left: number; low: boolean; unit: string } | null;
  onClick: () => void;
}) {
  const stockNote = stock && (
    <span className={clsx("font-bold", stock.low ? "text-coral" : "opacity-75")}>
      · <Package className="inline h-3 w-3" aria-label="stock" /> {stock.left} left{stock.low ? " ⚠️" : ""}
    </span>
  );
  if (line.amount == null || !line.currency) {
    // An item with no price set: the stock still moves.
    if (!stock) return null;
    return (
      <button onClick={onClick} className={clsx("flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold", KINDS[line.kind].chip)}>
        {stockDirection(line.kind) < 0 ? "−" : "+"}
        {line.item_qty} {stockNote}
      </button>
    );
  }
  const info = KINDS[line.kind];
  const sign = info.flow === "in" ? "+" : info.flow === "out" ? "−" : "";
  const emoji = info.flow === "out" && line.kind !== "i_repaid" ? CATEGORY_BY_ID[line.category ?? "other"]?.emoji ?? info.emoji : info.emoji;
  const who = line.person ? `${line.person}: ` : "";
  return (
    <button
      onClick={onClick}
      title={`${kindLabel(line.kind, mode)}${left != null ? ` — ${who}${left > 0 ? `${formatMoney(left, line.currency)} still owed` : "paid off"}` : ""} — tap to change`}
      className={clsx(
        "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold transition hover:brightness-95",
        info.chip,
        line.confident === false && "outline-dashed outline-2 outline-offset-1 outline-sun",
      )}
    >
      <span aria-hidden>{emoji}</span>
      {sign}
      {formatMoney(line.amount, line.currency, { compact: true })}
      {(line.kind === "repaid_to_me" || line.kind === "i_repaid") && left != null && (
        <span className="font-bold opacity-75">· {left > 0 ? `${formatMoney(left, line.currency, { compact: true })} left` : "paid off ✓"}</span>
      )}
      {stockNote}
      {line.ai && <Sparkles className="h-3 w-3 opacity-60" aria-label="read by AI" />}
      {line.confident === false && <span aria-label="please check">?</span>}
    </button>
  );
}

function SaveBadge({ state }: { state: SaveState }) {
  if (state === "idle") return null;
  if (state === "offline")
    return (
      <span className="flex items-center gap-1 text-coral">
        <CloudOff className="h-3.5 w-3.5" /> Saved on this phone — will sync
      </span>
    );
  if (state === "saved")
    return (
      <span className="flex items-center gap-1 text-brand">
        <Check className="h-3.5 w-3.5" /> Saved
      </span>
    );
  return <span>Saving…</span>;
}
