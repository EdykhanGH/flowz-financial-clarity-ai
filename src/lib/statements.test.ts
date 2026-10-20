import { describe, expect, it } from "vitest";
import { parseLine } from "./parse";
import type { Entry } from "./money";
import { buildBalanceSheet, buildProfitAndLoss, checkCompleteness } from "./statements";
import { periodOf } from "./periods";

let n = 0;
const line = (date: string, text: string): Entry =>
  ({ id: String(n++), entry_date: date, position: n, text, kind_locked: false, settled_at: null, ...parseLine(text, "NGN") }) as Entry;

const book: Entry[] = [
  line("2026-09-01", "Sold rice 100,000"),
  line("2026-09-02", "Bought 3 bags of rice 60,000"),
  line("2026-09-03", "Shop rent 20,000"),
  line("2026-09-04", "Transport 5,000"),
  line("2026-09-05", "Lunch 3,000"),
  line("2026-09-06", "Gave mum 10k"),
  line("2026-09-07", "Joy bought 50k rice on credit"),
  line("2026-09-20", "Joy paid back 30k for rice"),
  line("2026-09-21", "I owe Tunde 15000"),
  line("2026-09-22", "Client paid $100"),
];

describe("Profit & Loss", () => {
  const pl = buildProfitAndLoss(book, { start: "2026-09-01", end: "2026-09-30", currency: "NGN", mode: "business", closingStock: 10_000 });
  it("adds up income, cost of stock and expenses", () => {
    expect(pl.totalIncome).toBe(130_000); // 100k sales + 30k collected
    expect(pl.stock.cost).toBe(50_000); // 60k bought − 10k left
    expect(pl.grossProfit).toBe(80_000);
    expect(pl.totalExpenses).toBe(25_000); // rent + transport (lunch is personal)
    expect(pl.netProfit).toBe(55_000);
  });
  it("keeps personal spending out of business profit", () => {
    expect(pl.totalPersonal).toBe(13_000); // lunch + gift to mum
  });
  it("keeps other currencies separate", () => {
    const usd = buildProfitAndLoss(book, { start: "2026-09-01", end: "2026-09-30", currency: "USD", mode: "business" });
    expect(usd.totalIncome).toBe(100);
  });
});

describe("Balance sheet", () => {
  it("shows cash, what people owe and what you owe", () => {
    const bs = buildBalanceSheet(book, { asOf: "2026-09-30", currency: "NGN", openingCash: 20_000, stock: 10_000 });
    // cash: 20k + 100k + 30k − 60k − 20k − 5k − 3k − 10k = 52k
    expect(bs.cash).toBe(52_000);
    expect(bs.totalReceivables).toBe(20_000);
    expect(bs.totalPayables).toBe(15_000);
    expect(bs.totalAssets).toBe(82_000);
    expect(bs.worth).toBe(67_000);
    expect(bs.cashEstimated).toBe(false);
  });
});

describe("completeness", () => {
  it("says when there is not enough data", () => {
    const c = checkCompleteness(book, { kind: "pl", start: "2026-09-01", end: "2026-09-30", currency: "NGN", mode: "business", today: "2026-10-20" });
    expect(c.level).toBe("low"); // 10 of 30 days written
    expect(c.notes.join(" ")).toMatch(/10 of 30 days/);
    expect(c.notes.join(" ")).toMatch(/closing stock/i);
  });
  it("flags missing starting cash on a balance sheet", () => {
    const c = checkCompleteness(book, { kind: "bs", start: "2026-09-01", end: "2026-09-30", currency: "NGN", mode: "business", today: "2026-10-20" });
    expect(c.notes.join(" ")).toMatch(/cash you had/i);
  });
  it("handles an empty notebook", () => {
    expect(checkCompleteness([], { kind: "pl", start: "2026-09-01", end: "2026-09-30", currency: "NGN", mode: "business", today: "2026-10-20" }).level).toBe("low");
  });
});

describe("periods", () => {
  const today = "2026-10-20";
  it.each([
    ["profit and loss for September", "2026-09-01", "2026-09-30"],
    ["balance sheet last month", "2026-09-01", "2026-09-30"],
    ["P&L for Q3", "2026-07-01", "2026-09-30"],
    ["statement for last year", "2025-01-01", "2025-12-31"],
    ["profit this year", "2026-01-01", "2026-10-20"],
    ["income statement for december", "2025-12-01", "2025-12-31"],
    ["sept 2025", "2025-09-01", "2025-09-30"],
  ])("%s", (text, start, end) => {
    expect(periodOf(text, today)).toMatchObject({ start, end });
  });
});
