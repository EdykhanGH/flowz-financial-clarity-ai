import { describe, expect, it } from "vitest";
import { parseLine } from "./parse";

const cases: [string, Partial<ReturnType<typeof parseLine>>][] = [
  ["Sold 3 bags of rice 45,000", { amount: 45000, kind: "sale", currency: "NGN" }],
  ["Bought fuel 8,500", { amount: 8500, kind: "expense", category: "fuel" }],
  ["Gave mum 10k", { amount: 10000, kind: "gift_out", category: "family", person: "Mum" }],
  ["Transport 1,200", { amount: 1200, kind: "expense", category: "transport" }],
  ["Chioma owes me 5,000", { amount: 5000, kind: "owed_to_me", person: "Chioma" }],
  ["Mama Bisi still owes me 2k", { amount: 2000, kind: "owed_to_me", person: "Mama Bisi" }],
  ["I owe Tunde 15000", { amount: 15000, kind: "i_owe", person: "Tunde" }],
  ["Bought 2 cartons of indomie 18000", { amount: 18000, kind: "purchase", category: "stock" }],
  ["Sold 3 shirts at 5000 each", { amount: 15000, kind: "sale" }],
  ["sold 4 x 2500", { amount: 10000, kind: "sale" }],
  ["Client paid $250", { amount: 250, currency: "USD", kind: "sale" }],
  ["Netflix 15 dollars", { amount: 15, currency: "USD", kind: "expense", category: "bills" }],
  ["Got salary 350k", { amount: 350000, kind: "sale" }],
  ["Paid staff salary 60,000", { amount: 60000, kind: "expense", category: "wages" }],
  ["Uncle gave me 20k", { amount: 20000, kind: "gift_in", person: "Uncle" }],
  ["Tithe 5000", { amount: 5000, kind: "gift_out", category: "giving" }],
  ["MTN data 1.5k", { amount: 1500, kind: "expense", category: "airtime" }],
  ["Shop rent ₦1.2m", { amount: 1200000, kind: "expense", category: "rent" }],
  ["Call Ada tomorrow", { amount: null, kind: "note" }],
  ["Bought 3 bags", { amount: null, kind: "note" }],
  ["Lent Emeka 7,500", { amount: 7500, kind: "owed_to_me", person: "Emeka" }],
  ["N4500 lunch", { amount: 4500, kind: "expense", category: "food" }],
  ["Sent 10k to dad", { amount: 10000, kind: "gift_out", category: "family" }],
];

describe("parseLine", () => {
  for (const [text, expected] of cases) {
    it(text, () => {
      expect(parseLine(text, "NGN")).toMatchObject(expected);
    });
  }

  it("guesses unknown lines but flags them", () => {
    expect(parseLine("Something 3000")).toMatchObject({ amount: 3000, kind: "expense", confident: false });
  });

  it("uses the default currency when none is written", () => {
    expect(parseLine("Sold bread 2000", "USD").currency).toBe("USD");
  });
});
