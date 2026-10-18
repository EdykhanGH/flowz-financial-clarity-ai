import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CalendarDays, Check, ChevronLeft, ChevronRight, CloudOff, HelpCircle, Lightbulb } from "lucide-react";
import clsx from "clsx";
import { useUser } from "@/hooks/useAuth";
import { deleteEntries, listEntries, upsertEntries } from "@/lib/api";
import { addDays, greeting, prettyDay, todayISO } from "@/lib/dates";
import { CATEGORY_BY_ID, KINDS, kindLabel } from "@/lib/kinds";
import { formatMoney, totalsByCurrency, type Entry } from "@/lib/money";
import { parseLine, type Currency } from "@/lib/parse";
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

type Line = Entry & { confident?: boolean };
type SaveState = "idle" | "pending" | "saving" | "saved" | "offline";

const EXAMPLES = ["Sold 3 bags of rice 45,000", "Bought fuel 8,500", "Gave mum 10k", "Transport 1,200", "Chioma owes me 5,000", "Money enter 15k", "Emeka dey owe me 4k"];

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
function withText(line: Line, text: string, defaultCurrency: Currency): Line {
  const p = parseLine(text, defaultCurrency);
  if (line.kind_locked) {
    return {
      ...line,
      text,
      amount: p.amount,
      currency: p.amount == null ? null : line.currency ?? p.currency,
      person: p.person ?? line.person,
      confident: true,
    };
  }
  return { ...line, text, amount: p.amount, currency: p.currency, kind: p.kind, category: p.category, person: p.person, confident: p.confident };
}

function withTrailingBlank(lines: Line[], date: string) {
  const last = lines[lines.length - 1];
  return !last || last.text.trim() ? [...lines, blankLine(date)] : lines;
}

/** What we compare to decide whether a row needs saving. */
function snapshot(l: Entry, position: number) {
  return JSON.stringify([l.text, l.amount, l.currency, l.kind, l.category, l.person, l.kind_locked, position]);
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

  linesRef.current = lines;

  // ---------- load ----------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = (await listEntries(date, date)) as Line[];
        if (cancelled) return;
        rows.forEach((r, i) => saved.current.set(r.id, snapshot(r, i)));

        let start = rows;
        let fromDraft = false;
        try {
          const draft = localStorage.getItem(draftKey);
          if (draft) {
            start = JSON.parse(draft) as Line[];
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
      await upsertEntries(changed.map(({ confident: _c, ...r }) => r));
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
        localStorage.setItem(draftKey, JSON.stringify(next.filter((l) => l.text.trim())));
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
    update((prev) => prev.map((l) => (l.id === id ? withText(l, text, cur) : l)));
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
      const fresh = withText(blankLine(date), after, cur);
      pendingFocus.current = { id: fresh.id, caret: 0 };
      update((prev) => {
        const next = [...prev];
        next[index] = withText(line, before, cur);
        next.splice(index + 1, 0, fresh);
        return next;
      });
    } else if (e.key === "Backspace" && caret === 0 && el.selectionEnd === 0 && index > 0) {
      e.preventDefault();
      const prevLine = lines[index - 1];
      pendingFocus.current = { id: prevLine.id, caret: prevLine.text.length };
      update((prev) => {
        const next = [...prev];
        next[index - 1] = withText(prevLine, prevLine.text + line.text, cur);
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
    const created = parts.slice(1).map((t) => withText(blankLine(date), t, cur));
    const last = created[created.length - 1];
    if (last) pendingFocus.current = { id: last.id, caret: last.text.length - after.length };
    update((prev) => {
      const next = [...prev];
      next[index] = withText(line, parts[0], cur);
      next.splice(index + 1, 0, ...created);
      return next;
    });
  }

  function patchLine(id: string, patch: LinePatch) {
    update((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch, confident: true } : l)));
  }

  function resetLine(id: string) {
    update((prev) => prev.map((l) => (l.id === id ? withText({ ...l, kind_locked: false }, l.text, cur) : l)));
  }

  const totals = useMemo(() => totalsByCurrency(lines), [lines]);
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
          <SaveBadge state={saveState} />
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
                <LineChip line={line} mode={mode} onClick={() => setEditing(line.id)} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Help */}
      <button onClick={() => setShowHelp((s) => !s)} className="flex w-full items-center gap-2 text-sm font-bold text-muted hover:text-ink">
        <HelpCircle className="h-4 w-4" /> How do I write in Flowz?
      </button>
      {showHelp && (
        <div className="card space-y-3 p-4 text-sm">
          <p>Write one thing per line, the way you would on paper, in everyday English or Pidgin. Put the amount anywhere in the line.</p>
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
            “10k”, “ten thousand” and “#10,000” all mean ₦10,000. Add $ or “dollars” for dollars. Tap a coloured tag to change it.
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

function LineChip({ line, mode, onClick }: { line: Line; mode: "personal" | "business"; onClick: () => void }) {
  if (line.amount == null || !line.currency) return null;
  const info = KINDS[line.kind];
  const sign = info.flow === "in" ? "+" : info.flow === "out" ? "−" : "";
  return (
    <button
      onClick={onClick}
      title={`${kindLabel(line.kind, mode)} — tap to change`}
      className={clsx(
        "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold transition hover:brightness-95",
        info.chip,
        line.confident === false && "outline-dashed outline-2 outline-offset-1 outline-sun",
      )}
    >
      <span aria-hidden>{info.flow === "out" ? CATEGORY_BY_ID[line.category ?? "other"]?.emoji ?? info.emoji : info.emoji}</span>
      {sign}
      {formatMoney(line.amount, line.currency, { compact: true })}
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
