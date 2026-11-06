// Downloads what was written in the notebook for a day, month, year or any dates, as PDF or Excel.
// The PDF and Excel libraries are loaded only when someone downloads, so the app stays light.

import { fromISODate } from "./dates";
import { KINDS, kindLabel, CATEGORY_BY_ID, type Mode } from "./kinds";
import { totalsByCurrency, type Entry } from "./money";
import type { Currency } from "./parse";
import { TAGLINE } from "./exportStatement";

export interface NotebookDoc {
  owner: string;
  mode: Mode;
  start: string;
  end: string;
  entries: Entry[];
  preparedOn: string;
}

const longDate = (d: string) => fromISODate(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
const shortDate = (d: string) => fromISODate(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function periodText(start: string, end: string) {
  return start === end ? longDate(start) : `${longDate(start)} to ${longDate(end)}`;
}

export function fileStem(start: string, end: string) {
  return start === end ? `flowz-notebook-${start}` : `flowz-notebook-${start}-to-${end}`;
}

/** Plain money ("NGN 45,000.00") that prints in every PDF font and spreadsheet. */
function plainMoney(n: number, currency: Currency) {
  return `${n < 0 ? "-" : ""}${currency} ${Math.abs(n).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export interface NotebookRow {
  date: string;
  text: string;
  type: string;
  amount: number | null;
  currency: Currency | null;
  sign: "+" | "-" | "";
  person: string;
}

export function notebookRows(doc: NotebookDoc): NotebookRow[] {
  return doc.entries
    .filter((e) => e.text.trim())
    .map((e) => {
      const info = KINDS[e.kind];
      const category = e.category && (e.kind === "expense" || e.kind === "gift_out") ? CATEGORY_BY_ID[e.category]?.label : null;
      return {
        date: e.entry_date,
        text: e.text.trim(),
        type: e.amount == null ? "Note" : `${kindLabel(e.kind, doc.mode)}${category ? ` · ${category}` : ""}`,
        amount: e.amount,
        currency: e.currency,
        sign: e.amount == null ? "" : info.flow === "in" ? "+" : info.flow === "out" ? "-" : "",
        person: e.person ?? "",
      };
    });
}

export function notebookTotals(doc: NotebookDoc) {
  const totals = totalsByCurrency(doc.entries);
  return (Object.keys(totals) as Currency[]).map((c) => ({ currency: c, ...totals[c]! }));
}

export async function downloadNotebookPdf(doc: NotebookDoc) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const left = 40;
  const width = pdf.internal.pageSize.getWidth();
  const rows = notebookRows(doc);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(122, 117, 133);
  pdf.text(doc.owner, left, 52);
  pdf.setFontSize(18);
  pdf.setTextColor(43, 42, 51);
  pdf.text("My Flowz notebook", left, 76);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(122, 117, 133);
  pdf.text(`${periodText(doc.start, doc.end)} · ${rows.length} line${rows.length === 1 ? "" : "s"}`, left, 94);

  // Totals first, so the answer is at the top.
  const totals = notebookTotals(doc);
  autoTable(pdf, {
    startY: 108,
    margin: { left, right: left },
    theme: "plain",
    styles: { font: "helvetica", fontSize: 10, cellPadding: 3, textColor: [43, 42, 51] },
    head: [["", "Money in", "Money out", "Kept", "People owe you", "You owe"]],
    didParseCell: (data) => {
      if (data.section === "head" && data.column.index > 0) data.cell.styles.halign = "right";
    },
    headStyles: { fontStyle: "bold", textColor: [122, 117, 133], fontSize: 9 },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right", fontStyle: "bold" }, 4: { halign: "right" }, 5: { halign: "right" } },
    body: totals.length
      ? totals.map((t) => [t.currency, plainMoney(t.in, t.currency), plainMoney(t.out, t.currency), plainMoney(t.net, t.currency), plainMoney(t.owedToMe, t.currency), plainMoney(t.iOwe, t.currency)])
      : [["No money written in this period", "", "", "", "", ""]],
  });

  const afterTotals = ((pdf as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 140) + 16;
  autoTable(pdf, {
    startY: afterTotals,
    margin: { left, right: left },
    theme: "striped",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 4, textColor: [43, 42, 51], overflow: "linebreak" },
    headStyles: { fillColor: [43, 42, 51], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 246, 238] },
    columnStyles: { 0: { cellWidth: 68 }, 1: { cellWidth: "auto" }, 2: { cellWidth: 92 }, 3: { cellWidth: 96, halign: "right" } },
    head: [["Date", "What you wrote", "Type", "Amount"]],
    didParseCell: (data) => {
      if (data.section === "head" && data.column.index === 3) data.cell.styles.halign = "right";
    },
    body: rows.length
      ? rows.map((r) => [
          shortDate(r.date),
          r.person && !r.text.toLowerCase().includes(r.person.toLowerCase()) ? `${r.text} (${r.person})` : r.text,
          r.type,
          r.amount == null || !r.currency ? "" : `${r.sign}${plainMoney(r.amount, r.currency)}`,
        ])
      : [["", "Nothing was written in this period.", "", ""]],
  });

  const pages = pdf.getNumberOfPages();
  const height = pdf.internal.pageSize.getHeight();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(122, 117, 133);
    pdf.text(`Prepared with Flowz · ${TAGLINE} · ${doc.preparedOn}`, left, height - 24);
    pdf.text(`Page ${i} of ${pages}`, width - left, height - 24, { align: "right" });
  }
  pdf.save(`${fileStem(doc.start, doc.end)}.pdf`);
}

export async function downloadNotebookExcel(doc: NotebookDoc) {
  const { default: writeXlsxFile } = await import("write-excel-file");
  const money = "#,##0.00";
  const rows = notebookRows(doc);
  type Cell = { value?: string | number; type?: StringConstructor | NumberConstructor; fontWeight?: "bold"; fontSize?: number; format?: string; color?: string; wrap?: boolean } | null;
  const text = (value: string, extra: Partial<NonNullable<Cell>> = {}): Cell => ({ value, type: String, ...extra });
  const num = (value: number, extra: Partial<NonNullable<Cell>> = {}): Cell => ({ value, type: Number, format: money, ...extra });
  const blank = (n: number): Cell[] => Array.from({ length: n }, () => null);
  const COLS = 7;

  const data: Cell[][] = [
    [text(doc.owner, { fontWeight: "bold", color: "#7A7585" }), ...blank(COLS - 1)],
    [text("My Flowz notebook", { fontWeight: "bold", fontSize: 16 }), ...blank(COLS - 1)],
    [text(`${periodText(doc.start, doc.end)} · ${rows.length} lines`, { color: "#7A7585" }), ...blank(COLS - 1)],
    blank(COLS),
    ["Currency", "Money in", "Money out", "Kept", "People owe you", "You owe", ""].map((h) => text(h, { fontWeight: "bold" })),
    ...notebookTotals(doc).map((t) => [text(t.currency), num(t.in), num(t.out), num(t.net, { fontWeight: "bold" }), num(t.owedToMe), num(t.iOwe), null]),
    blank(COLS),
    ["Date", "What you wrote", "Type", "Money in", "Money out", "Debt", "Currency"].map((h) => text(h, { fontWeight: "bold" })),
    ...rows.map((r) => [
      text(r.date),
      text(r.person && !r.text.toLowerCase().includes(r.person.toLowerCase()) ? `${r.text} (${r.person})` : r.text, { wrap: true }),
      text(r.type),
      r.sign === "+" && r.amount != null ? num(r.amount) : null,
      r.sign === "-" && r.amount != null ? num(r.amount) : null,
      r.sign === "" && r.amount != null ? num(r.amount) : null,
      r.currency ? text(r.currency) : null,
    ]),
    blank(COLS),
    [text(`Prepared with Flowz · ${TAGLINE} · ${doc.preparedOn}`, { color: "#7A7585" }), ...blank(COLS - 1)],
  ];

  await writeXlsxFile(data as never, {
    columns: [{ width: 13 }, { width: 50 }, { width: 22 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 10 }],
    fileName: `${fileStem(doc.start, doc.end)}.xlsx`,
    sheet: "Notebook",
    fontFamily: "Calibri",
    fontSize: 11,
  });
}
