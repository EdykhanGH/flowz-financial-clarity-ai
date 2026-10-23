// Reads a bank statement exported as Excel or CSV into plain transactions, on the phone.
// Banks lay statements out differently, so the header row and columns are found by their names
// ("Narration", "Debit", "Credit", "Value Date", ...). PDFs and photos are read by AI instead.

import { toISODate } from "./dates";
import type { Currency } from "./parse";

export interface StatementTxn {
  txn_date: string; // yyyy-mm-dd
  amount: number; // always positive
  direction: "in" | "out";
  description: string;
  balance: number | null;
}

export interface ReadStatement {
  bank_name: string | null;
  currency: Currency;
  transactions: StatementTxn[];
}

const BANKS: [RegExp, string][] = [
  [/\bgt ?bank\b|guaranty trust/i, "GTBank"],
  [/\baccess bank\b/i, "Access Bank"],
  [/\bzenith\b/i, "Zenith Bank"],
  [/\bfirst ?bank\b|first bank of nigeria/i, "First Bank"],
  [/\buba\b|united bank for africa/i, "UBA"],
  [/\bfidelity\b/i, "Fidelity Bank"],
  [/\bunion bank\b/i, "Union Bank"],
  [/\bsterling\b/i, "Sterling Bank"],
  [/\bstanbic\b/i, "Stanbic IBTC"],
  [/\becobank\b/i, "Ecobank"],
  [/\bwema\b|\balat\b/i, "Wema Bank"],
  [/\bfcmb\b|first city monument/i, "FCMB"],
  [/\bpolaris\b/i, "Polaris Bank"],
  [/\bkeystone\b/i, "Keystone Bank"],
  [/\bprovidus\b/i, "Providus Bank"],
  [/\bkuda\b/i, "Kuda"],
  [/\bopay\b/i, "OPay"],
  [/\bpalm ?pay\b/i, "PalmPay"],
  [/\bmoniepoint\b/i, "Moniepoint"],
  [/\bfairmoney\b/i, "FairMoney"],
  [/\bstandard chartered\b/i, "Standard Chartered"],
];

export function detectBank(text: string): string | null {
  for (const [re, name] of BANKS) if (re.test(text)) return name;
  return null;
}

// ---------- CSV ----------

/** Splits CSV text into rows, handling quoted cells with commas and line breaks. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const delimiter = (text.split("\n")[0].match(/;/g)?.length ?? 0) > (text.split("\n")[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

// ---------- cells ----------

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

const pad = (n: number) => String(n).padStart(2, "0");

function fullYear(y: number) {
  return y < 100 ? 2000 + y : y;
}

function validDate(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1990 || y > 2100) return null;
  const date = new Date(y, m - 1, d);
  if (date.getMonth() !== m - 1) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

/**
 * A date cell as yyyy-mm-dd. `order` says how to read 03/04/2026: "dmy" (Nigeria, UK) or "mdy" (US).
 * Handles Excel dates, Excel serial numbers, 2026-10-03, 03/10/2026, 03-Oct-2026, 3 October 2026 and Oct 3, 2026.
 */
export function parseStatementDate(value: unknown, order: "dmy" | "mdy" = "dmy"): string | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : toISODate(value);
  if (typeof value === "number") {
    if (value > 20000 && value < 80000) {
      const d = new Date(Date.UTC(1899, 11, 30) + Math.round(value) * 86_400_000);
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
    }
    return null;
  }
  if (typeof value !== "string") return null;
  const s = value.trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return validDate(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/);
  if (m) return order === "dmy" ? validDate(fullYear(+m[3]), +m[2], +m[1]) : validDate(fullYear(+m[3]), +m[1], +m[2]);
  m = s.match(/^(\d{1,2})(?:st|nd|rd|th)?[\s\-/.]+([A-Za-z]{3,9})[\s\-/.,]+(\d{2,4})\b/);
  if (m && MONTHS[m[2].slice(0, 4).toLowerCase()] !== undefined) return validDate(fullYear(+m[3]), MONTHS[m[2].slice(0, 4).toLowerCase()], +m[1]);
  if (m && MONTHS[m[2].slice(0, 3).toLowerCase()]) return validDate(fullYear(+m[3]), MONTHS[m[2].slice(0, 3).toLowerCase()], +m[1]);
  m = s.match(/^([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/);
  if (m && MONTHS[m[1].slice(0, 3).toLowerCase()]) return validDate(+m[3], MONTHS[m[1].slice(0, 3).toLowerCase()], +m[2]);
  return null;
}

/** "1,234.50", "₦1,234.50", "(1,234.50)", "-1234.5", "1,234.50 CR". Sign is kept; "DR" makes it negative. */
export function parseMoneyCell(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  let s = value.trim();
  if (!s || s === "-" || s === "--") return null;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (/\bdr\.?$/i.test(s)) negative = true;
  s = s.replace(/\b(cr|dr)\.?$/i, "").replace(/ngn|usd|₦|\$|naira/gi, "").replace(/[,\s]/g, "");
  if (s.startsWith("-")) {
    negative = !negative;
    s = s.slice(1);
  }
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return negative ? -n : n;
}

// ---------- columns ----------

type Col = "date" | "valueDate" | "description" | "debit" | "credit" | "amount" | "type" | "balance";

const HEADERS: [Col, RegExp][] = [
  ["valueDate", /^value ?date$/],
  ["date", /^(trans(action)?|txn|tran|posting|posted|post|booking|entry)? ?date( posted)?$|^date ?time$|^date$/],
  ["description", /^(narration|narrative|description|details|transaction details|remarks?|particulars|memo|transaction description|desc)$/],
  ["debit", /^(debits?|withdrawals?|dr|money out|paid out|debit amount|amount out|outflow|withdrawal amount)$/],
  ["credit", /^(credits?|deposits?|lodgements?|cr|money in|paid in|credit amount|amount in|inflow|deposit amount)$/],
  ["amount", /^(amount|transaction amount|amt)$/],
  ["type", /^(type|dr ?\/ ?cr|cr ?\/ ?dr|debit ?\/ ?credit|transaction type|d ?\/ ?c)$/],
  ["balance", /^(balance|running balance|closing balance|available balance|ledger balance|bal)$/],
];

function headerName(cell: unknown) {
  return String(cell ?? "")
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[₦$:.]|ngn|usd/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findColumns(row: unknown[]): Partial<Record<Col, number>> | null {
  const cols: Partial<Record<Col, number>> = {};
  row.forEach((cell, i) => {
    const name = headerName(cell);
    for (const [col, re] of HEADERS) {
      if (re.test(name) && cols[col] === undefined) {
        cols[col] = i;
        break;
      }
    }
  });
  if (cols.date === undefined) cols.date = cols.valueDate;
  const hasMoney = (cols.debit !== undefined && cols.credit !== undefined) || cols.amount !== undefined;
  return cols.date !== undefined && hasMoney ? cols : null;
}

const SKIP_ROW = /opening balance|closing balance|balance (b\/f|c\/f|brought|carried)|brought forward|carried forward|^total/i;

/** Reads the rows of a spreadsheet statement. Returns null when the layout isn't recognised. */
export function readStatementRows(rows: unknown[][]): ReadStatement | null {
  const headerIndex = rows.slice(0, 40).findIndex((r) => findColumns(r));
  if (headerIndex < 0) return null;
  const cols = findColumns(rows[headerIndex])!;
  const body = rows.slice(headerIndex + 1);
  const top = rows.slice(0, headerIndex + 1).flat().map((c) => String(c ?? "")).join(" ");

  // 03/04/2026 is read day-first unless the file shows otherwise.
  let order: "dmy" | "mdy" = "dmy";
  const numeric = body.map((r) => String(r[cols.date!] ?? "").match(/^(\d{1,2})[-/.](\d{1,2})[-/.]\d{2,4}/)).filter(Boolean) as RegExpMatchArray[];
  if (!numeric.some((m) => +m[1] > 12) && numeric.some((m) => +m[2] > 12)) order = "mdy";

  const out: (Omit<StatementTxn, "direction"> & { direction: "in" | "out" | null })[] = [];
  for (const r of body) {
    const date = parseStatementDate(r[cols.date!], order);
    const description = cols.description !== undefined ? String(r[cols.description] ?? "").replace(/\s+/g, " ").trim() : "";
    if (!date) {
      // A narration that runs onto the next row.
      const blank = [cols.debit, cols.credit, cols.amount].every((c) => c === undefined || parseMoneyCell(r[c]) == null);
      if (description && blank && out.length) out[out.length - 1].description = `${out[out.length - 1].description} ${description}`.trim();
      continue;
    }
    if (SKIP_ROW.test(description)) continue;

    let amount: number | null = null;
    let direction: "in" | "out" | null = null;
    if (cols.debit !== undefined && cols.credit !== undefined) {
      const debit = parseMoneyCell(r[cols.debit]);
      const credit = parseMoneyCell(r[cols.credit]);
      if (debit) [amount, direction] = [Math.abs(debit), "out"];
      else if (credit) [amount, direction] = [Math.abs(credit), "in"];
    } else if (cols.amount !== undefined) {
      const raw = parseMoneyCell(r[cols.amount]);
      if (raw) {
        amount = Math.abs(raw);
        const type = cols.type !== undefined ? String(r[cols.type] ?? "").trim().toLowerCase() : "";
        if (/^(d|dr|debit|withdrawal)/.test(type)) direction = "out";
        else if (/^(c|cr|credit|deposit)/.test(type)) direction = "in";
        else if (raw < 0) direction = "out";
        else if (/\bdr\.?$/i.test(String(r[cols.amount]))) direction = "out";
        else if (/\bcr\.?$/i.test(String(r[cols.amount]))) direction = "in";
      }
    }
    if (!amount) continue;
    const balance = cols.balance !== undefined ? parseMoneyCell(r[cols.balance]) : null;
    out.push({ txn_date: date, amount: Math.round(amount * 100) / 100, direction, description, balance });
  }

  // A single amount column: when some amounts are negative, the others are money in.
  // Otherwise tell money in from money out by how the balance moved.
  const signed = out.some((t) => t.direction === "out") && cols.type === undefined;
  for (let i = 0; i < out.length; i++) {
    const t = out[i];
    if (t.direction) continue;
    const prev = out[i - 1]?.balance;
    if (signed) t.direction = "in";
    else if (t.balance != null && prev != null) t.direction = t.balance >= prev ? "in" : "out";
    else return null;
  }
  if (out.length === 0) return null;

  const currency: Currency = /\busd\b|\$|dollar/i.test(top) && !/ngn|naira|₦/i.test(top) ? "USD" : "NGN";
  return { bank_name: detectBank(top), currency, transactions: out as StatementTxn[] };
}

/**
 * A stable key so uploading the same statement twice doesn't add the same transactions twice.
 * `n` tells apart identical transactions on the same day (two ₦500 airtime top-ups).
 */
export function fingerprint(t: StatementTxn, n: number) {
  const desc = t.description.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
  return [t.txn_date, t.direction, t.amount.toFixed(2), t.balance == null ? "" : t.balance.toFixed(2), desc, n].join("|");
}

export function withFingerprints<T extends StatementTxn>(txns: T[]): (T & { fingerprint: string })[] {
  const seen = new Map<string, number>();
  return txns.map((t) => {
    const base = fingerprint(t, 0);
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return { ...t, fingerprint: n === 0 ? base : fingerprint(t, n) };
  });
}

export function statementPeriod(txns: StatementTxn[]) {
  const dates = txns.map((t) => t.txn_date).sort();
  return { start: dates[0] ?? null, end: dates[dates.length - 1] ?? null };
}
