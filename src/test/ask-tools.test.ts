import { describe, expect, it } from "vitest";
import { findLines, getDebts, getTotals, type Row } from "../../supabase/functions/ask-flowz/index";

const r = (entry_date: string, text: string, kind: string, amount: number | null, extra: Partial<Row> = {}): Row => ({
  entry_date, text, kind, amount, currency: amount == null ? null : "NGN", category: null, person: null, settled_at: null, ...extra,
});

const rows: Row[] = [
  r("2026-09-28", "Sales 30,000", "sale", 30000),
  r("2026-10-01", "Sold rice 45,000", "sale", 45000),
  r("2026-10-01", "Transport 1,200", "expense", 1200, { category: "transport" }),
  r("2026-10-02", "Okada 800", "expense", 800, { category: "transport" }),
  r("2026-10-02", "Bought rice 20,000", "purchase", 20000, { category: "stock" }),
  r("2026-10-03", "Client paid $100", "sale", 100, { currency: "USD" }),
  r("2026-10-03", "Chioma owes me 5,000", "owed_to_me", 5000, { person: "Chioma" }),
  r("2026-10-04", "Chioma owes me 2,000", "owed_to_me", 2000, { person: "Chioma" }),
  r("2026-10-04", "Emeka owes me 1,000", "owed_to_me", 1000, { person: "Emeka", settled_at: "2026-10-05" }),
  r("2026-10-05", "Call Ada", "note", null),
];
const today = "2026-10-18";

describe("Ask Flowz tools", () => {
  it("totals this month by default, per currency", () => {
    const t = getTotals(rows, {}, today) as { totals: Record<string, { money_in: number; money_out: number; kept: number }> };
    expect(t.totals.NGN).toMatchObject({ money_in: 45000, money_out: 22000, kept: 23000 });
    expect(t.totals.USD).toMatchObject({ money_in: 100, money_out: 0 });
  });

  it("filters by category and groups", () => {
    const t = getTotals(rows, { category: "transport", group_by: "day" }, today) as {
      totals: Record<string, { money_out: number }>;
      groups: Record<string, { key: string; money_out: number }[]>;
    };
    expect(t.totals.NGN.money_out).toBe(2000);
    expect(t.groups.NGN.map((g) => g.key)).toEqual(["2026-10-01", "2026-10-02"]);
  });

  it("respects date ranges", () => {
    const t = getTotals(rows, { start_date: "2026-09-01", end_date: "2026-09-30" }, today) as { totals: Record<string, { money_in: number }> };
    expect(t.totals.NGN.money_in).toBe(30000);
  });

  it("finds lines by word, largest first", () => {
    const f = findLines(rows, { contains: "rice", sort: "largest" }, today);
    expect(f.lines.map((l) => l.amount)).toEqual([45000, 20000]);
  });

  it("works out balances after repayments and skips paid ones", () => {
    const d = getDebts([...rows, r("2026-10-06", "Chioma paid back 3k", "repaid_to_me", 3000, { person: "Chioma" })]);
    expect(d.people_who_owe_me).toEqual({
      "Chioma (NGN)": { owed: 7000, paid_back: 3000, still_owed: 4000, currency: "NGN", since: "2026-10-03", last_payment: "2026-10-06" },
    });
    expect(d.fully_paid_back.to_me).toEqual(["Emeka (NGN)"]);
  });
});
