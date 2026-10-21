import * as XLSX from "xlsx";
import { categorise, counterpartyOf } from "./categorise";
import type { Txn } from "./types";

// Reads an exported statement (Excel or CSV) into transactions. Column names are matched loosely
// so PalmPay and most Nigerian bank exports work: date, description/narration, money in/out (or credit/debit,
// or a single amount with a type/sign), balance.

const norm = (s: unknown) => String(s ?? "").toLowerCase().replace(/[^a-z]/g, "");

const COLS = {
  date: ["transactiondate", "date", "transdate", "valuedate", "postingdate", "datetime", "time", "transactiontime"],
  desc: ["description", "transactiondetail", "transactiondetails", "details", "narration", "remarks", "remark", "particulars", "transaction", "type"],
  credit: ["moneyin", "credit", "creditamount", "inflow", "deposit", "deposits", "cr", "amountin"],
  debit: ["moneyout", "debit", "debitamount", "outflow", "withdrawal", "withdrawals", "dr", "amountout"],
  amount: ["amount", "transactionamount", "amountngn"],
  dir: ["creditdebit", "drcr", "direction", "transactiontype", "type"],
  balance: ["balance", "balanceafter", "closingbalance", "availablebalance", "runningbalance"],
  fee: ["fee", "fees", "charge", "charges"],
};

function num(v: unknown): number {
  if (typeof v === "number") return v;
  const s = String(v ?? "").replace(/[₦N,\s]/g, "").replace(/^\((.*)\)$/, "-$1");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function toIso(v: unknown): string | null {
  if (v instanceof Date && !isNaN(v.getTime())) return new Date(v.getTime() - v.getTimezoneOffset() * 60_000).toISOString().slice(0, 19);
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}T${String(d.H).padStart(2, "0")}:${String(d.M).padStart(2, "0")}:00`;
  }
  const s = String(v ?? "").trim();
  if (!s) return null;
  // dd/mm/yyyy or dd-mm-yyyy (Nigerian format), optional time
  const m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})(?:[ ,T]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?/i);
  if (m) {
    let [, d, mo, y, h = "12", mi = "00", , ap] = m;
    if (y.length === 2) y = "20" + y;
    let hh = Number(h);
    if (ap?.toLowerCase() === "pm" && hh < 12) hh += 12;
    if (ap?.toLowerCase() === "am" && hh === 12) hh = 0;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}T${String(hh).padStart(2, "0")}:${mi}:00`;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 19);
  return null;
}

export async function readStatement(file: File): Promise<Txn[]> {
  // CSV cells stay as text so dd/mm/yyyy dates aren't misread as US mm/dd.
  const wb = /\.csv$/i.test(file.name)
    ? XLSX.read(await file.text(), { type: "string", raw: true })
    : XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "" });

  // The header row is the first row that has a date-like column and a description-like column.
  const headerIdx = grid.findIndex(
    (row) => row.some((c) => COLS.date.includes(norm(c))) && row.some((c) => [...COLS.desc, ...COLS.amount, ...COLS.credit].includes(norm(c))),
  );
  if (headerIdx < 0) throw new Error("Couldn't find the column headings (date, description, amount) in this file.");
  const header = grid[headerIdx].map(norm);
  const col = (names: string[], exclude: number[] = []) => header.findIndex((h, i) => !exclude.includes(i) && names.includes(h));

  const iDate = col(COLS.date);
  const iDesc = col(COLS.desc.filter((n) => n !== "type"));
  const iDescFallback = col(["type", "transactiontype"]);
  const iCredit = col(COLS.credit);
  const iDebit = col(COLS.debit);
  const iAmount = col(COLS.amount);
  const iDir = col(COLS.dir, [iDesc]);
  const iBal = col(COLS.balance);
  const iFee = col(COLS.fee);

  const txns: Txn[] = [];
  grid.slice(headerIdx + 1).forEach((row, i) => {
    const date = toIso(row[iDate]);
    if (!date) return;
    const description = String(row[iDesc >= 0 ? iDesc : iDescFallback] ?? "").trim() || "Transaction";
    let amount = 0;
    let direction: "in" | "out" = "out";
    const cr = iCredit >= 0 ? num(row[iCredit]) : 0;
    const dr = iDebit >= 0 ? num(row[iDebit]) : 0;
    if (cr || dr) {
      direction = cr ? "in" : "out";
      amount = Math.abs(cr || dr);
    } else if (iAmount >= 0) {
      const a = num(row[iAmount]);
      const d = iDir >= 0 ? norm(row[iDir]) : "";
      direction = a < 0 || /debit|^dr$|out|sent|withdraw|purchase|payment/.test(d) ? "out" : /credit|^cr$|in|receiv/.test(d) ? "in" : a < 0 ? "out" : "in";
      amount = Math.abs(a);
      if (!d && /^(transfer to|payment|pos|airtime|data|bill)/i.test(description)) direction = "out";
      if (!d && /^(transfer from|received)/i.test(description)) direction = "in";
    }
    if (!amount) return;
    txns.push({
      id: `up-${i}`,
      date,
      description,
      amount,
      direction,
      category: categorise(description, direction),
      counterparty: counterpartyOf(description),
      fee: iFee >= 0 ? num(row[iFee]) || undefined : undefined,
      balance: iBal >= 0 && String(row[iBal]).trim() !== "" ? num(row[iBal]) : undefined,
    });
  });
  if (!txns.length) throw new Error("No transactions found in this file.");
  return txns.sort((a, b) => a.date.localeCompare(b.date));
}
