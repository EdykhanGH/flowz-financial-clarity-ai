import { describe, expect, it } from "vitest";
import { parseLine } from "./parse";
import { buildMonthStats, type Entry } from "./money";
import { buildBalanceSheet, buildProfitAndLoss } from "./statements";

const read = (line: string) => parseLine(line, "NGN");

describe("borrowing and lending", () => {
  it("knows who owes whom", () => {
    expect(read("Borrowed 10k from my brother")).toMatchObject({ kind: "i_owe", amount: 10_000, person: "Brother" });
    expect(read("I borrowed 50k from Chidi")).toMatchObject({ kind: "i_owe", person: "Chidi" });
    expect(read("Emeka borrowed 5k")).toMatchObject({ kind: "owed_to_me", person: "Emeka" });
    expect(read("Emeka borrowed 5k from me")).toMatchObject({ kind: "owed_to_me", person: "Emeka" });
    expect(read("Gave Tunde 20k loan")).toMatchObject({ kind: "owed_to_me", amount: 20_000, person: "Tunde" });
    expect(read("Lent Ada 15k")).toMatchObject({ kind: "owed_to_me", person: "Ada" });
    expect(read("I collected loan of 200k from LAPO")).toMatchObject({ kind: "i_owe", amount: 200_000, person: "Lapo" });
    expect(read("Owe supplier 120k")).toMatchObject({ kind: "i_owe", amount: 120_000, person: "Supplier" });
    expect(read("I owe Tunde 12,000")).toMatchObject({ kind: "i_owe", person: "Tunde" });
  });

  it("knows when I am paying back", () => {
    expect(read("Paid supplier 60k part payment")).toMatchObject({ kind: "i_repaid", amount: 60_000, person: "Supplier" });
    expect(read("Paid Tunde balance 5k")).toMatchObject({ kind: "i_repaid", person: "Tunde" });
    expect(read("Joy paid back 30k")).toMatchObject({ kind: "repaid_to_me", person: "Joy" });
  });

  it("uses the debt book for LAPO repayments", () => {
    const ctx = { owedToMe: new Map(), iOwe: new Map([["lapo", 200_000]]) };
    expect(parseLine("Paid LAPO 25k", "NGN", ctx)).toMatchObject({ kind: "i_repaid", person: "Lapo" });
  });
});

describe("refunds", () => {
  it("is money going back out", () => {
    expect(read("Refund to customer 5,000")).toMatchObject({ kind: "refund", amount: 5_000 });
    expect(read("Refunded Chika 3k")).toMatchObject({ kind: "refund", person: "Chika" });
    expect(read("Customer returned 2 shirts 10k")).toMatchObject({ kind: "refund", amount: 10_000 });
  });
  it("leaves debt repayments alone", () => {
    expect(read("Joy returned my money 5k")).toMatchObject({ kind: "repaid_to_me" });
  });
});

describe("owner's own money", () => {
  it("money put in is not income", () => {
    expect(read("Put 100k of my own money into the business")).toMatchObject({ kind: "owner_in", amount: 100_000 });
    expect(read("Added 50k capital to the shop")).toMatchObject({ kind: "owner_in" });
    expect(read("Capital 500k")).toMatchObject({ kind: "owner_in" });
  });
  it("money taken out is not a business cost", () => {
    expect(read("Took 10k from the shop for house")).toMatchObject({ kind: "owner_out", amount: 10_000 });
    expect(read("Removed 5k from sales for myself")).toMatchObject({ kind: "owner_out" });
    expect(read("Drawings 20k")).toMatchObject({ kind: "owner_out" });
  });
});

describe("ajo, esusu and savings", () => {
  it("putting money in is saving, not spending", () => {
    expect(read("Ajo contribution 5k")).toMatchObject({ kind: "saving", amount: 5_000 });
    expect(read("Paid esusu 2,000")).toMatchObject({ kind: "saving" });
    expect(read("Saved 20k in piggyvest")).toMatchObject({ kind: "saving" });
    expect(read("Thrift 3k")).toMatchObject({ kind: "saving" });
  });
  it("collecting it back is not income", () => {
    expect(read("Collected my ajo 50k")).toMatchObject({ kind: "savings_back", amount: 50_000 });
    expect(read("My esusu turn 60k")).toMatchObject({ kind: "savings_back" });
    expect(read("Withdrew 30k from piggyvest")).toMatchObject({ kind: "savings_back" });
  });
});

describe("several amounts on one line", () => {
  it("adds items joined with 'and'", () => {
    expect(read("Sold 2 phones 450k and 1 charger 5k")).toMatchObject({ kind: "sale", amount: 455_000 });
    expect(read("Paid 5k for transport and 2k for food")).toMatchObject({ amount: 7_000 });
  });
  it("doesn't add a balance or a price", () => {
    expect(read("Customer paid half 25k and balance 25k tomorrow").amount).toBe(25_000);
    expect(read("Sold 5 crates of eggs at 4,800 each").amount).toBe(24_000);
  });
});

describe("everyday lines still read the same", () => {
  it.each([
    ["Sold 3 bags of rice 45k", "sale", 45_000],
    ["Bought stock from Onitsha 350k", "purchase", 350_000],
    ["Shop rent 150k", "expense", 150_000],
    ["Church offering 2k", "gift_out", 2_000],
    ["Gave mum 10k", "gift_out", 10_000],
    ["Joy took 50k rice on credit", "owed_to_me", 50_000],
    ["Transfer from customer 12,500", "sale", 12_500],
    ["School fees 80k", "expense", 80_000],
    ["Collected 8k from customer", "sale", 8_000],
  ])("%s", (line, kind, amount) => {
    expect(read(line)).toMatchObject({ kind, amount });
  });
});

describe("statements with refunds, savings and owner's money", () => {
  let n = 0;
  const line = (date: string, text: string): Entry =>
    ({ id: String(n++), entry_date: date, position: n, text, kind_locked: false, settled_at: null, ...parseLine(text, "NGN") }) as Entry;
  const book: Entry[] = [
    line("2026-10-01", "Put 100k of my own money into the business"),
    line("2026-10-02", "Sold rice 80,000"),
    line("2026-10-03", "Refund to customer 5,000"),
    line("2026-10-04", "Ajo contribution 10k"),
    line("2026-10-05", "Took 20k from the shop for house"),
    line("2026-10-06", "Transport 2,000"),
  ];

  it("keeps them out of profit", () => {
    const pl = buildProfitAndLoss(book, { start: "2026-10-01", end: "2026-10-31", currency: "NGN", mode: "business" });
    expect(pl.totalIncome).toBe(75_000); // 80k sales − 5k refund
    expect(pl.totalExpenses).toBe(2_000);
    expect(pl.netProfit).toBe(73_000);
    expect(pl.notCounted.map((l) => l.label)).toEqual(
      expect.arrayContaining(["Your own money put into the business", "Money you took out for yourself", "Saved (ajo, esusu, savings)"]),
    );
  });

  it("counts the cash and the savings on the balance sheet", () => {
    const bs = buildBalanceSheet(book, { asOf: "2026-10-31", currency: "NGN" });
    expect(bs.cash).toBe(143_000); // 100 + 80 − 5 − 10 − 20 − 2
    expect(bs.savings).toBe(10_000);
    expect(bs.totalAssets).toBe(153_000);
  });

  it("leaves them out of top spending", () => {
    const stats = buildMonthStats({ month: "2026-10", mode: "business", entries: book, previousEntries: [], budgets: [], today: new Date(2026, 9, 31) });
    expect(stats.currencies.NGN!.topSpending.map((s) => s.amount)).toEqual([2_000]);
  });
});

describe("notebook download", () => {
  it("lists every written line with its type and totals per currency", async () => {
    const { notebookRows, notebookTotals } = await import("./exportNotebook");
    let n = 0;
    const entries = ["Sold rice 45,000", "Transport 2,000", "Client paid $100", "Call Tunde", ""].map(
      (text) => ({ id: String(n++), entry_date: "2026-11-03", position: n, text, kind_locked: false, settled_at: null, ...parseLine(text, "NGN") }) as Entry,
    );
    const doc = { owner: "Chi", mode: "business" as const, start: "2026-11-01", end: "2026-11-06", entries, preparedOn: "today" };
    const rows = notebookRows(doc);
    expect(rows).toHaveLength(4);
    expect(rows.map((r) => r.sign)).toEqual(["+", "-", "+", ""]);
    expect(rows[3].type).toBe("Note");
    expect(notebookTotals(doc).map((t) => [t.currency, t.in, t.out])).toEqual([["NGN", 45_000, 2_000], ["USD", 100, 0]]);
  });
});
