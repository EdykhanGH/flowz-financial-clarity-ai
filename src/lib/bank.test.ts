import { describe, expect, it } from "vitest";
import { parseCsv, parseMoneyCell, parseStatementDate, readStatementRows, withFingerprints } from "./bankStatement";
import { buildMatchReport, counterparty, suggestLine, type BankTxn } from "./bankMatch";
import type { Entry } from "./money";
import { parseLine } from "./parse";

describe("reading statement cells", () => {
  it("reads the date formats banks use", () => {
    expect(parseStatementDate("03/10/2026")).toBe("2026-10-03");
    expect(parseStatementDate("03/10/2026", "mdy")).toBe("2026-03-10");
    expect(parseStatementDate("2026-10-03 14:22:01")).toBe("2026-10-03");
    expect(parseStatementDate("03-Oct-2026")).toBe("2026-10-03");
    expect(parseStatementDate("3 October 2026")).toBe("2026-10-03");
    expect(parseStatementDate("Oct 3, 2026")).toBe("2026-10-03");
    expect(parseStatementDate("03-Oct-26")).toBe("2026-10-03");
    expect(parseStatementDate(46298)).toBe("2026-10-03"); // Excel serial
    expect(parseStatementDate("Opening Balance")).toBeNull();
  });

  it("reads money cells", () => {
    expect(parseMoneyCell("45,000.00")).toBe(45000);
    expect(parseMoneyCell("₦1,250.50")).toBe(1250.5);
    expect(parseMoneyCell("(2,000.00)")).toBe(-2000);
    expect(parseMoneyCell("-500")).toBe(-500);
    expect(parseMoneyCell("12,000.00 DR")).toBe(-12000);
    expect(parseMoneyCell("12,000.00 CR")).toBe(12000);
    expect(parseMoneyCell("")).toBeNull();
    expect(parseMoneyCell("-")).toBeNull();
  });
});

describe("reading a statement spreadsheet", () => {
  it("reads a debit/credit layout with a title above the header and wrapped narrations", () => {
    const csv = [
      "GUARANTY TRUST BANK PLC,,,,,",
      "Account Name: ADA PROVISIONS,,,,,",
      ",,,,,",
      "Trans. Date,Value Date,Narration,Debit,Credit,Balance",
      "01-Oct-2026,01-Oct-2026,Opening Balance,,,\"100,000.00\"",
      "02-Oct-2026,02-Oct-2026,TRF FROM TOLU ADEBAYO,,\"5,000.00\",\"105,000.00\"",
      ",,REF 99887766,,,",
      "03-Oct-2026,03-Oct-2026,POS PURCHASE SHOPRITE,\"18,000.00\",,\"87,000.00\"",
      "03-Oct-2026,03-Oct-2026,SMS ALERT CHARGES,4.00,,\"86,996.00\"",
    ].join("\n");
    const read = readStatementRows(parseCsv(csv))!;
    expect(read.bank_name).toBe("GTBank");
    expect(read.currency).toBe("NGN");
    expect(read.transactions).toEqual([
      { txn_date: "2026-10-02", amount: 5000, direction: "in", description: "TRF FROM TOLU ADEBAYO REF 99887766", balance: 105000 },
      { txn_date: "2026-10-03", amount: 18000, direction: "out", description: "POS PURCHASE SHOPRITE", balance: 87000 },
      { txn_date: "2026-10-03", amount: 4, direction: "out", description: "SMS ALERT CHARGES", balance: 86996 },
    ]);
  });

  it("reads a single signed amount column", () => {
    const rows = [
      ["Date", "Description", "Amount", "Balance"],
      ["2026-10-02", "Transfer from Chidi", "12000", "50000"],
      ["2026-10-02", "Airtime", "-500", "49500"],
    ];
    const read = readStatementRows(rows)!;
    expect(read.transactions.map((t) => [t.direction, t.amount])).toEqual([["in", 12000], ["out", 500]]);
  });

  it("uses a Dr/Cr column", () => {
    const rows = [
      ["Posted Date", "Remarks", "Amount", "Dr/Cr"],
      ["02/10/2026", "NIP FRM EMEKA", "4,000.00", "CR"],
      ["02/10/2026", "Rent", "30,000.00", "DR"],
    ];
    expect(readStatementRows(rows)!.transactions.map((t) => t.direction)).toEqual(["in", "out"]);
  });

  it("gives up on files it doesn't recognise", () => {
    expect(readStatementRows([["Name", "Phone"], ["Ada", "0803"]])).toBeNull();
  });

  it("tells identical transactions apart so re-uploads don't double count", () => {
    const t = { txn_date: "2026-10-02", amount: 500, direction: "out" as const, description: "Airtime", balance: null };
    const [a, b] = withFingerprints([t, t]);
    expect(a.fingerprint).not.toBe(b.fingerprint);
    expect(withFingerprints([t])[0].fingerprint).toBe(a.fingerprint);
  });
});

let n = 0;
function entry(date: string, text: string): Entry {
  const p = parseLine(text, "NGN");
  return { id: `e${++n}`, entry_date: date, position: n, text, amount: p.amount, currency: p.currency, kind: p.kind, category: p.category, person: p.person, kind_locked: false, settled_at: null };
}
function txn(date: string, direction: "in" | "out", amount: number, description: string, extra: Partial<BankTxn> = {}): BankTxn {
  return { id: `t${++n}`, statement_id: "s1", txn_date: date, amount, direction, currency: "NGN", description, balance: null, entry_id: null, status: "open", ...extra };
}

describe("Bank Match", () => {
  it("matches, covers, flags and ignores", () => {
    const entries = [
      entry("2026-10-02", "Tolu pay 5k"),
      entry("2026-10-03", "Sales today 52,000"),
      entry("2026-10-03", "Bought indomie 18,000"),
      entry("2026-10-04", "Sold 2 bags of rice cash 40,000"),
      entry("2026-10-04", "Tolu collect 20k goods on credit"),
    ];
    const txns = [
      txn("2026-10-02", "in", 5000, "TRF FROM TOLU ADEBAYO"),
      txn("2026-10-03", "in", 10000, "TRF FROM AMAKA"),
      txn("2026-10-03", "in", 15000, "NIP FRM BAYO"),
      txn("2026-10-04", "out", 18000, "POS PURCHASE ALABA"),
      txn("2026-10-05", "in", 12000, "TRF FROM CHIDI OKAFOR"),
      txn("2026-10-05", "out", 50, "SMS ALERT CHARGES"),
      txn("2026-10-06", "out", 20000, "TRF TO MUM"),
      txn("2026-10-06", "out", 3000, "TRF TO SAVINGS", { status: "not_business" }),
    ];
    const r = buildMatchReport(txns, entries, { rules: [{ id: "r1", phrase: "mum" }] });
    const state = (desc: string) => r.results.find((x) => x.txn.description === desc)!;

    expect(state("TRF FROM TOLU ADEBAYO").state).toBe("matched");
    expect(state("TRF FROM AMAKA").state).toBe("covered");
    expect(state("NIP FRM BAYO").state).toBe("covered");
    expect(state("NIP FRM BAYO").entry?.text).toBe("Sales today 52,000");
    expect(state("POS PURCHASE ALABA").state).toBe("matched");
    expect(state("TRF FROM CHIDI OKAFOR").state).toBe("missing");
    expect(state("SMS ALERT CHARGES").state).toBe("charge");
    expect(state("TRF TO MUM").state).toBe("rule");
    expect(state("TRF TO SAVINGS").state).toBe("not_business");
    // A credit sale moves no cash, so it never matches a transfer.
    expect(r.results.some((x) => x.entry?.text.includes("on credit"))).toBe(false);
    expect(r.total).toBe(8);
    expect(r.accounted).toBe(6);
    expect(r.score).toBe(75);
  });

  it("never flags cash lines, but asks about lines that say transfer", () => {
    const entries = [entry("2026-10-02", "Sold rice cash 40,000"), entry("2026-10-03", "Emeka transfer 7k")];
    const r = buildMatchReport([], entries, { periods: [{ start: "2026-10-01", end: "2026-10-31" }] });
    expect(r.worthALook.map((e) => e.text)).toEqual(["Emeka transfer 7k"]);
    const dismissed = buildMatchReport([], entries, { periods: [{ start: "2026-10-01", end: "2026-10-31" }], dismissed: new Set([entries[1].id]) });
    expect(dismissed.worthALook).toEqual([]);
    // Outside the statement's dates there's nothing to compare with.
    expect(buildMatchReport([], entries, { periods: [{ start: "2026-11-01", end: "2026-11-30" }] }).worthALook).toEqual([]);
  });

  it("prefers the line with the same name when amounts tie", () => {
    const entries = [entry("2026-10-02", "Sold oil 5,000"), entry("2026-10-02", "Joy paid 5,000")];
    const r = buildMatchReport([txn("2026-10-02", "in", 5000, "TRF FROM JOY OKEKE")], entries);
    expect(r.results[0].entry?.text).toBe("Joy paid 5,000");
  });

  it("keeps the user's links", () => {
    const e = entry("2026-10-20", "Sold generator 150,000");
    const r = buildMatchReport([txn("2026-10-01", "in", 70000, "TRF FROM KUNLE", { entry_id: e.id })], [e]);
    expect(r.results[0].state).toBe("linked");
    expect(r.score).toBe(100);
  });
});

describe("turning a transaction into a line", () => {
  it("finds the other person's name", () => {
    expect(counterparty("TRF FROM CHIDI OKAFOR/0123456789")).toBe("Chidi Okafor");
    expect(counterparty("NIP FRM TOLU ADEBAYO-GTB TRANSFER REF 99887")).toBe("Tolu Adebayo");
    expect(counterparty("0123456789/1234")).toBeNull();
    expect(counterparty("TRF TO MTN DATA PURCHASE")).toBe("MTN Data");
  });

  it("suggests a line that reads the right way", () => {
    expect(suggestLine(txn("2026-10-05", "in", 12000, "TRF FROM CHIDI OKAFOR")).text).toBe("Chidi paid 12,000");
    expect(suggestLine(txn("2026-10-05", "in", 12000, "TRF FROM CHIDI OKAFOR")).parsed.kind).toBe("sale");
    const ctx = { owedToMe: new Map([["chidi", 20000]]), iOwe: new Map() };
    expect(suggestLine(txn("2026-10-05", "in", 12000, "TRF FROM CHIDI OKAFOR"), ctx).parsed.kind).toBe("repaid_to_me");
    const charge = suggestLine(txn("2026-10-05", "out", 50, "SMS ALERT CHARGES"));
    expect(charge.text).toBe("Bank charges 50");
    expect(charge.parsed.kind).toBe("expense");
    expect(suggestLine(txn("2026-10-05", "out", 8000, "TRF TO EMEKA OBI")).parsed.amount).toBe(8000);
  });
});
