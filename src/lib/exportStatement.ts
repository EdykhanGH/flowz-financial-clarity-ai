// Turns a statement into rows once, then into text, a PDF or an Excel file.
// The PDF and Excel libraries are loaded only when someone downloads, so the app stays light.

import type { Currency } from "./parse";
import type { BalanceSheet, Completeness, Line, ProfitAndLoss } from "./statements";

export const TAGLINE = "Your interactive accounts notebook";

export type RowStyle = "section" | "item" | "subitem" | "total" | "grand";

export interface StatementRow {
  label: string;
  amount?: number | null; // undefined = no amount column (section headings)
  style: RowStyle;
  note?: string;
  negative?: boolean; // shown in brackets, e.g. stock left at the end
}

export interface StatementDoc {
  owner: string;
  title: string;
  period: string;
  currency: Currency;
  rows: StatementRow[];
  basis: string;
  check: Completeness;
  preparedOn: string;
  fileStem: string; // e.g. "flowz-profit-and-loss-2026-09-01-to-2026-09-30"
}

const items = (list: Line[], style: RowStyle = "item"): StatementRow[] =>
  list.length ? list.map((l) => ({ label: l.label, amount: l.amount, style, note: l.note })) : [{ label: "None written", amount: 0, style }];

export function profitAndLossRows(pl: ProfitAndLoss): StatementRow[] {
  const business = pl.mode === "business";
  const rows: StatementRow[] = [
    { label: business ? "Income" : "Money in", style: "section" },
    ...items(pl.income),
    { label: business ? "Total income" : "Total money in", amount: pl.totalIncome, style: "total" },
  ];
  if (business) {
    rows.push(
      { label: "Cost of stock sold", style: "section" },
      { label: "Stock at the start", amount: pl.stock.opening, style: "item" },
      { label: "Stock bought", amount: pl.stock.purchases, style: "item" },
      { label: "Less: stock left at the end", amount: pl.stock.closing, style: "item", negative: true },
      { label: "Cost of stock sold", amount: pl.stock.cost, style: "total" },
      { label: "Gross profit", amount: pl.grossProfit, style: "total" },
    );
  }
  rows.push(
    { label: business ? "Business expenses" : "Spending", style: "section" },
    ...items(pl.expenses),
    { label: business ? "Total expenses" : "Total spending", amount: pl.totalExpenses, style: "total" },
    { label: business ? (pl.netProfit >= 0 ? "Net profit" : "Net loss") : "What you kept", amount: pl.netProfit, style: "grand" },
  );
  if (business && pl.personal.length) {
    rows.push(
      { label: "Personal spending (not counted in profit)", style: "section" },
      ...items(pl.personal),
      { label: "Taken out for personal use", amount: pl.totalPersonal, style: "total" },
    );
  }
  if (pl.notCounted.length) rows.push({ label: "Not part of profit or loss", style: "section" }, ...items(pl.notCounted));
  return rows;
}

export function balanceSheetRows(bs: BalanceSheet): StatementRow[] {
  return [
    { label: "What you have (assets)", style: "section" },
    { label: "Cash", amount: bs.cash, style: "item", note: bs.cashEstimated ? "Estimated from your notebook" : undefined },
    { label: "Money people owe you", amount: bs.totalReceivables, style: "item" },
    ...bs.receivables.map((r) => ({ label: r.label, amount: r.amount, style: "subitem" as const })),
    { label: "Stock", amount: bs.stock, style: "item" },
    { label: "Things you own", amount: bs.otherAssets, style: "item" },
    { label: "Total assets", amount: bs.totalAssets, style: "total" },
    { label: "What you owe (liabilities)", style: "section" },
    { label: "Money you owe people", amount: bs.totalPayables, style: "item" },
    ...bs.payables.map((r) => ({ label: r.label, amount: r.amount, style: "subitem" as const })),
    { label: "Other debts", amount: bs.otherLiabilities, style: "item" },
    { label: "Total liabilities", amount: bs.totalLiabilities, style: "total" },
    { label: "What it's worth (assets minus liabilities)", amount: bs.worth, style: "grand" },
  ];
}

/** "NGN 45,000" — plain letters, so it prints in every PDF font and spreadsheet. */
function plainMoney(n: number, currency: Currency) {
  const abs = Math.abs(n).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${n < 0 ? "-" : ""}${currency} ${abs}`;
}

function amountText(r: StatementRow, currency: Currency) {
  if (r.amount === undefined) return "";
  if (r.amount === null) return "not entered";
  const m = plainMoney(r.amount, currency);
  return r.negative && r.amount ? `(${m})` : m;
}

export function statementText(doc: StatementDoc) {
  const out = [doc.owner, doc.title, `${doc.period} · ${doc.currency}`, ""];
  for (const r of doc.rows) {
    if (r.style === "section") out.push("", r.label.toUpperCase());
    else {
      const pad = r.style === "subitem" ? "    " : r.style === "item" ? "  " : "";
      out.push(`${pad}${r.label}: ${amountText(r, doc.currency)}`);
    }
  }
  out.push("", doc.basis, `Prepared with Flowz · ${TAGLINE} · ${doc.preparedOn}`);
  return out.join("\n");
}

const completenessLabel = { good: "Complete", partial: "A good guide, some things missing", low: "Not enough data for an accurate statement" };

export async function downloadPdf(doc: StatementDoc) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const left = 48;
  const width = pdf.internal.pageSize.getWidth();

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(122, 117, 133);
  pdf.text(doc.owner, left, 56);
  pdf.setFontSize(18);
  pdf.setTextColor(43, 42, 51);
  pdf.text(doc.title, left, 80);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(122, 117, 133);
  pdf.text(`${doc.period} · Amounts in ${doc.currency === "NGN" ? "Naira (NGN)" : "US dollars (USD)"}`, left, 98);
  pdf.setDrawColor(43, 42, 51);
  pdf.setLineWidth(1.2);
  pdf.line(left, 108, width - left, 108);

  autoTable(pdf, {
    startY: 118,
    margin: { left, right: left },
    theme: "plain",
    styles: { font: "helvetica", fontSize: 10, cellPadding: { top: 4, bottom: 4, left: 2, right: 2 }, textColor: [43, 42, 51] },
    columnStyles: { 1: { halign: "right", cellWidth: 150 } },
    body: doc.rows.map((r) => [
      r.style === "subitem" ? `      ${r.label}` : r.style === "item" ? `   ${r.label}${r.note ? `  (${r.note})` : ""}` : r.label,
      amountText(r, doc.currency),
    ]),
    didParseCell: (data) => {
      const r = doc.rows[data.row.index];
      if (!r) return;
      if (r.style === "section") {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fontSize = 9;
        data.cell.styles.textColor = [122, 117, 133];
        data.cell.styles.cellPadding = { top: 12, bottom: 3, left: 2, right: 2 };
      }
      if (r.style === "total" || r.style === "grand") {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.lineWidth = { top: r.style === "grand" ? 1.2 : 0.4 };
        data.cell.styles.lineColor = r.style === "grand" ? [43, 42, 51] : [233, 223, 201];
      }
      if (r.style === "grand") data.cell.styles.fontSize = 12;
      if (r.amount === null && data.column.index === 1) data.cell.styles.textColor = [122, 117, 133];
    },
  });

  let y = ((pdf as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 400) + 24;
  const page = pdf.internal.pageSize.getHeight();
  const write = (text: string, opts: { bold?: boolean; size?: number; color?: [number, number, number] } = {}) => {
    pdf.setFont("helvetica", opts.bold ? "bold" : "normal");
    pdf.setFontSize(opts.size ?? 9);
    pdf.setTextColor(...(opts.color ?? [122, 117, 133]));
    for (const lineText of pdf.splitTextToSize(text, width - left * 2) as string[]) {
      if (y > page - 48) {
        pdf.addPage();
        y = 56;
      }
      pdf.text(lineText, left, y);
      y += (opts.size ?? 9) * 1.4;
    }
  };
  write(`How complete is this? ${completenessLabel[doc.check.level]}`, { bold: true, size: 10, color: [43, 42, 51] });
  for (const n of doc.check.notes) write(`• ${n}`);
  y += 8;
  write(doc.basis);
  write(`Prepared with Flowz · ${TAGLINE} · ${doc.preparedOn}`);

  pdf.save(`${doc.fileStem}.pdf`);
}

export async function downloadExcel(doc: StatementDoc) {
  const { default: writeXlsxFile } = await import("write-excel-file");
  const money = "#,##0.00;(#,##0.00)";
  type Cell = { value?: string | number; type?: StringConstructor | NumberConstructor; fontWeight?: "bold"; fontSize?: number; format?: string; color?: string; indent?: number; topBorderStyle?: "thin" | "medium"; wrap?: boolean; span?: number } | null;
  const text = (value: string, extra: Partial<NonNullable<Cell>> = {}): Cell => ({ value, type: String, ...extra });
  const data: Cell[][] = [
    [text(doc.owner, { fontWeight: "bold", color: "#7A7585" }), null],
    [text(doc.title, { fontWeight: "bold", fontSize: 16 }), null],
    [text(`${doc.period} · Amounts in ${doc.currency}`, { color: "#7A7585" }), null],
    [null, null],
    [text("Item", { fontWeight: "bold" }), text(`Amount (${doc.currency})`, { fontWeight: "bold" })],
  ];
  for (const r of doc.rows) {
    if (r.style === "section") {
      data.push([null, null], [text(r.label.toUpperCase(), { fontWeight: "bold", color: "#7A7585" }), null]);
      continue;
    }
    const bold = r.style === "total" || r.style === "grand" ? ("bold" as const) : undefined;
    const border = r.style === "grand" ? ("medium" as const) : r.style === "total" ? ("thin" as const) : undefined;
    const label = text(`${r.label}${r.note ? ` (${r.note})` : ""}`, { fontWeight: bold, indent: r.style === "subitem" ? 2 : r.style === "item" ? 1 : 0, topBorderStyle: border });
    const value: Cell =
      r.amount == null
        ? text("not entered", { color: "#7A7585", topBorderStyle: border })
        : { value: r.negative ? -r.amount : r.amount, type: Number, format: money, fontWeight: bold, topBorderStyle: border };
    data.push([label, value]);
  }
  data.push(
    [null, null],
    [text(`How complete is this? ${completenessLabel[doc.check.level]}`, { fontWeight: "bold" }), null],
    ...doc.check.notes.map((n) => [text(`• ${n}`, { wrap: true, color: "#7A7585" }), null] as Cell[]),
    [null, null],
    [text(doc.basis, { color: "#7A7585", wrap: true }), null],
    [text(`Prepared with Flowz · ${TAGLINE} · ${doc.preparedOn}`, { color: "#7A7585" }), null],
  );
  await writeXlsxFile(data as never, {
    columns: [{ width: 62 }, { width: 22 }],
    fileName: `${doc.fileStem}.xlsx`,
    sheet: doc.title.slice(0, 31),
    fontFamily: "Calibri",
    fontSize: 11,
  });
}
