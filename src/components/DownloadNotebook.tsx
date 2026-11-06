import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import clsx from "clsx";
import { useUser } from "@/hooks/useAuth";
import { listEntries } from "@/lib/api";
import { monthKey, monthRange, prettyMonth, shiftMonth, todayISO } from "@/lib/dates";
import { downloadNotebookExcel, downloadNotebookPdf, periodText } from "@/lib/exportNotebook";
import { ErrorNote, Sheet, Spinner } from "./ui";

const DEMO = import.meta.env.MODE === "demo";

type Choice = "day" | "month" | "last_month" | "year" | "last_year" | "custom";

const longDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/**
 * A small "Download" button that opens a sheet to download what was written,
 * for one day, a month, a year or any dates, as PDF or Excel. Free: it all happens on the phone.
 */
export default function DownloadNotebook({ day, month, className }: { day?: string; month?: string; className?: string }) {
  const { settings } = useUser();
  const today = todayISO();
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<Choice>(day ? "day" : "month");
  const [from, setFrom] = useState(day ?? `${monthKey(today)}-01`);
  const [to, setTo] = useState(day ?? today);
  const [busy, setBusy] = useState<null | "pdf" | "excel">(null);
  const [error, setError] = useState<string | null>(null);

  const thisMonth = month ?? monthKey(day ?? today);
  const year = (day ?? today).slice(0, 4);
  const cap = (d: string) => (d > today ? today : d);
  const ranges: Record<Choice, { label: string; start: string; end: string }> = {
    day: { label: day ? longDate(day) : "", start: day ?? today, end: day ?? today },
    month: { label: prettyMonth(thisMonth), start: monthRange(thisMonth).start, end: cap(monthRange(thisMonth).end) },
    last_month: { label: prettyMonth(shiftMonth(thisMonth, -1)), ...monthRange(shiftMonth(thisMonth, -1)) },
    year: { label: `${year}`, start: `${year}-01-01`, end: cap(`${year}-12-31`) },
    last_year: { label: `${Number(year) - 1}`, start: `${Number(year) - 1}-01-01`, end: `${Number(year) - 1}-12-31` },
    custom: { label: "Choose dates", start: from, end: to },
  };
  const choices: Choice[] = [...(day ? (["day"] as Choice[]) : []), "month", "last_month", "year", "last_year", "custom"];
  const range = ranges[choice];
  const valid = range.start <= range.end;

  async function download(format: "pdf" | "excel") {
    if (!valid || DEMO) return;
    setBusy(format);
    setError(null);
    try {
      const entries = await listEntries(range.start, range.end);
      const doc = {
        owner: settings.business_name || settings.display_name,
        mode: settings.mode,
        start: range.start,
        end: range.end,
        entries,
        preparedOn: longDate(today),
      };
      if (format === "pdf") await downloadNotebookPdf(doc);
      else await downloadNotebookExcel(doc);
    } catch (e) {
      setError(`We couldn't make the file: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={clsx("flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-brand-dark hover:brightness-95", className)}
      >
        <Download className="h-3.5 w-3.5" /> Download
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Download your notebook">
        <p className="text-sm text-muted">Pick what to download. You get every line you wrote, with totals at the top.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {choices.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChoice(c)}
              className={clsx(
                "rounded-2xl border-2 px-3 py-2 text-left text-sm font-bold",
                choice === c ? "border-brand bg-brand-soft" : "border-line bg-white",
                c === "custom" && "col-span-2",
              )}
            >
              <span className="block text-xs font-semibold text-muted">
                {{ day: "This day", month: "This month", last_month: "Last month", year: "This year", last_year: "Last year", custom: "Any dates" }[c]}
              </span>
              {ranges[c].label}
            </button>
          ))}
        </div>
        {choice === "custom" && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-sm font-bold">
              From
              <input type="date" className="field mt-1" value={from} max={today} onChange={(e) => e.target.value && setFrom(e.target.value)} />
            </label>
            <label className="text-sm font-bold">
              To
              <input type="date" className="field mt-1" value={to} max={today} min={from} onChange={(e) => e.target.value && setTo(e.target.value)} />
            </label>
          </div>
        )}
        <p className="mt-3 text-sm font-bold">{valid ? periodText(range.start, range.end) : "The start date must be before the end date."}</p>
        {error && <div className="mt-3"><ErrorNote>{error}</ErrorNote></div>}
        {DEMO ? (
          <p className="mt-4 rounded-2xl bg-sun-soft px-4 py-3 text-sm font-semibold text-amber-800">
            Demo: in the live app, this downloads your notebook as a PDF or Excel file.
          </p>
        ) : (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" className="btn-primary" disabled={!valid || busy !== null} onClick={() => download("pdf")}>
            {busy === "pdf" ? <Spinner /> : <><FileText className="h-5 w-5" /> PDF</>}
          </button>
          <button type="button" className="btn-soft" disabled={!valid || busy !== null} onClick={() => download("excel")}>
            {busy === "excel" ? <Spinner /> : <><FileSpreadsheet className="h-5 w-5" /> Excel</>}
          </button>
        </div>
        )}
      </Sheet>
    </>
  );
}

