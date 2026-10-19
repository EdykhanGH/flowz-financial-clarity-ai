import { describe, expect, it } from "vitest";
import { parseLine } from "./parse";
import { buildDebtBook, debtContext, type Entry } from "./money";

let n = 0;
function line(text: string, date = "2026-10-01"): Entry {
  return { id: String(n++), entry_date: date, position: n, text, kind_locked: false, settled_at: null, ...parseLine(text, "NGN") } as Entry;
}

describe("reading lines in context", () => {
  it("someone buying on credit owes me", () => {
    expect(parseLine("Joy bought 50k rice on credit")).toMatchObject({ kind: "owed_to_me", person: "Joy", amount: 50000 });
    expect(parseLine("Joy took 3 bags of rice for credit 45k")).toMatchObject({ kind: "owed_to_me", person: "Joy" });
    expect(parseLine("Mama Bisi collected goods worth 20k, she will pay later")).toMatchObject({ kind: "owed_to_me", person: "Mama Bisi" });
  });

  it("I buying on credit means I owe", () => {
    expect(parseLine("I bought goods on credit from Tunde 30k")).toMatchObject({ kind: "i_owe", person: "Tunde" });
    expect(parseLine("bought 2 cartons on credit 18k")).toMatchObject({ kind: "i_owe" });
  });

  it("paying back is understood", () => {
    expect(parseLine("Joy paid back 30k for rice")).toMatchObject({ kind: "repaid_to_me", person: "Joy", amount: 30000 });
    expect(parseLine("Joy pay me back 5k")).toMatchObject({ kind: "repaid_to_me", person: "Joy" });
    expect(parseLine("Emeka returned my money 7k")).toMatchObject({ kind: "repaid_to_me", person: "Emeka" });
    expect(parseLine("Chidi cleared his balance 6,000")).toMatchObject({ kind: "repaid_to_me", person: "Chidi" });
    expect(parseLine("I paid Tunde back 5k")).toMatchObject({ kind: "i_repaid", person: "Tunde" });
    expect(parseLine("paid back Ade 3k")).toMatchObject({ kind: "i_repaid" });
    expect(parseLine("Joy made part payment 10k")).toMatchObject({ kind: "repaid_to_me", person: "Joy" });
  });

  it("uses who owes what to read plain payments", () => {
    const book = buildDebtBook([line("Joy bought 50k rice on credit"), line("I owe Tunde 15000")]);
    const ctx = debtContext(book);
    expect(parseLine("Joy paid 20k", "NGN", ctx)).toMatchObject({ kind: "repaid_to_me", person: "Joy" });
    expect(parseLine("collected 8k from joy", "NGN", ctx)).toMatchObject({ kind: "repaid_to_me", person: "Joy" });
    expect(parseLine("paid Tunde 5k", "NGN", ctx)).toMatchObject({ kind: "i_repaid", person: "Tunde" });
    // Without a debt, the same words stay a normal sale / expense
    expect(parseLine("Ada paid 20k", "NGN", ctx)).toMatchObject({ kind: "sale" });
    expect(parseLine("sold rice to Joy 10k", "NGN", ctx)).toMatchObject({ kind: "sale" });
  });

  it("keeps a running balance per person", () => {
    const book = buildDebtBook([
      line("Joy bought 50k rice on credit", "2026-10-01"),
      line("Joy paid back 30k for rice", "2026-10-05"),
      line("Emeka owes me 4k", "2026-10-02"),
    ]);
    const joy = book.owedToMe.find((p) => p.name === "Joy")!;
    expect(joy).toMatchObject({ owed: 50000, repaid: 30000, balance: 20000 });
    expect(book.owedToMe.find((p) => p.name === "Emeka")!.balance).toBe(4000);
  });

  it("matches a short name to the full one in the book", () => {
    const ctx = debtContext(buildDebtBook([line("Mama Bisi owes me 6k")]));
    expect(parseLine("Bisi paid 2k", "NGN", ctx)).toMatchObject({ kind: "repaid_to_me", person: "Mama Bisi" });
  });
});
