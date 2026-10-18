import { describe, expect, it } from "vitest";
import { parseLine } from "./parse";
import { numberWordsToDigits } from "./language";

type Expect = Partial<ReturnType<typeof parseLine>>;

const cases: [string, Expect][] = [
  // --- money in, every way of saying it ---
  ["got 10k", { amount: 10000, kind: "sale" }],
  ["I got 25,000 today", { amount: 25000, kind: "sale" }],
  ["collected 8k from Tunde", { amount: 8000, kind: "sale", person: "Tunde" }],
  ["recieved 5000", { amount: 5000, kind: "sale" }],
  ["recived 2k transfer", { amount: 2000, kind: "sale" }],
  ["credit alert 40k", { amount: 40000, kind: "sale" }],
  ["money enter 15k", { amount: 15000, kind: "sale" }],
  ["15k enter my account", { amount: 15000, kind: "sale" }],
  ["transfer from Ada 7,000", { amount: 7000, kind: "sale", person: "Ada" }],
  ["made 30k today", { amount: 30000, kind: "sale" }],
  ["earnt 12000", { amount: 12000, kind: "sale" }],
  ["takings 46,500", { amount: 46500, kind: "sale" }],
  ["turnover today 80k", { amount: 80000, kind: "sale" }],
  ["I sell 20k today", { amount: 20000, kind: "sale" }],
  ["sell am 6k", { amount: 6000, kind: "sale" }],
  ["customer pay 3,500", { amount: 3500, kind: "sale" }],
  ["Bayo pay me 9k", { amount: 9000, kind: "sale", person: "Bayo" }],
  ["payday 250k", { amount: 250000, kind: "sale" }],
  ["got paid 2 grand", { amount: 2000, kind: "sale" }],

  // --- buying ---
  ["buy 2 bags of rice 90k", { amount: 90000, kind: "purchase" }],
  ["I don buy goods 45k", { amount: 45000, kind: "purchase" }],
  ["purchsed stock 30000", { amount: 30000, kind: "purchase" }],
  ["bougt garri 7k", { amount: 7000, kind: "purchase" }],
  ["restocked drinks 18k", { amount: 18000, kind: "expense", category: "food" }],

  // --- spending (British / American words) ---
  ["petrol 9k", { amount: 9000, kind: "expense", category: "fuel" }],
  ["gas $40", { amount: 40, currency: "USD", kind: "expense", category: "fuel" }],
  ["groceries 60 bucks", { amount: 60, currency: "USD", kind: "expense", category: "food" }],
  ["trasport 1500", { amount: 1500, kind: "expense", category: "transport" }],
  ["t-fare 700", { amount: 700, kind: "expense", category: "transport" }],
  ["keke 400", { amount: 400, kind: "expense", category: "transport" }],
  ["chop 2k", { amount: 2000, kind: "expense", category: "food" }],
  ["spend 5k for market", { amount: 5000, kind: "expense" }],
  ["used 3k for data", { amount: 3000, kind: "expense", category: "airtime" }],
  ["NEPA bill 6,000", { amount: 6000, kind: "expense", category: "bills" }],
  ["prepaid meter token 10k", { amount: 10000, kind: "expense", category: "bills" }],
  ["data sub 1,500", { amount: 1500, kind: "expense", category: "airtime" }],
  ["settled mechanic 15k", { amount: 15000, kind: "expense", category: "repairs" }],
  ["transfer to supplier 50k", { amount: 50000, kind: "expense" }],
  ["ajo contribution 10k", { amount: 10000, kind: "expense", category: "savings" }],
  ["aso ebi 25k", { amount: 25000, kind: "expense", category: "events" }],
  ["electricty bill 4500", { amount: 4500, kind: "expense", category: "bills" }],

  // --- gifts ---
  ["give mama 5k", { amount: 5000, kind: "gift_out", category: "family" }],
  ["dash my pikin 2k", { amount: 2000, kind: "gift_out", category: "family" }],
  ["help Tolu with 3k", { amount: 3000, kind: "gift_out", person: "Tolu" }],
  ["Uncle dash me 10k", { amount: 10000, kind: "gift_in", person: "Uncle" }],
  ["my sister send me 20k", { amount: 20000, kind: "gift_in" }],
  ["Ada bless me with 5k", { amount: 5000, kind: "gift_in", person: "Ada" }],
  ["wedding gift 10k", { amount: 10000, kind: "gift_out", category: "events" }],

  // --- debts (Pidgin and English) ---
  ["Emeka dey owe me 4k", { amount: 4000, kind: "owed_to_me", person: "Emeka" }],
  ["Bisi never pay me 3,500", { amount: 3500, kind: "owed_to_me", person: "Bisi" }],
  ["Chidi hasn't paid me 6k", { amount: 6000, kind: "owed_to_me", person: "Chidi" }],
  ["Mama Ngozi go pay me 2k tomorrow", { amount: 2000, kind: "owed_to_me", person: "Mama Ngozi" }],
  ["sold 5k goods to Ada on credit", { amount: 5000, kind: "owed_to_me", person: "Ada" }],
  ["I borrow Emeka 5k", { amount: 5000, kind: "owed_to_me", person: "Emeka" }],
  ["loaned Sade 10k", { amount: 10000, kind: "owed_to_me", person: "Sade" }],
  ["Tunde borrow me 5k", { amount: 5000, kind: "i_owe", person: "Tunde" }],
  ["I dey owe Ade 3k", { amount: 3000, kind: "i_owe", person: "Ade" }],
  ["I never pay Kola 8k", { amount: 8000, kind: "i_owe", person: "Kola" }],
  ["collected loan 100k from bank", { amount: 100000, kind: "i_owe" }],
  ["took goods on credit 20k", { amount: 20000, kind: "i_owe" }],

  // --- money written in words and other formats ---
  ["sold bread two thousand five hundred naira", { amount: 2500, kind: "sale" }],
  ["got fifty thousand", { amount: 50000, kind: "sale" }],
  ["rent one million", { amount: 1000000, kind: "expense", category: "rent" }],
  ["half a million from contract", { amount: 500000 }],
  ["transport five hundred", { amount: 500, kind: "expense" }],
  ["paid twenty dollars for netflix", { amount: 20, currency: "USD", kind: "expense", category: "bills" }],
  ["sold #4,500", { amount: 4500, currency: "NGN", kind: "sale" }],
  ["fuel N 6,000", { amount: 6000, currency: "NGN", kind: "expense" }],
  ["sold 5000naira", { amount: 5000, currency: "NGN", kind: "sale" }],
  ["got 10K", { amount: 10000, kind: "sale" }],
  ["bought the red one", { amount: null, kind: "note" }],
];

describe("understands many ways of writing", () => {
  for (const [text, expected] of cases) {
    it(text, () => {
      expect(parseLine(text, "NGN")).toMatchObject(expected);
    });
  }
});

describe("numberWordsToDigits", () => {
  it("leaves ordinary sentences alone", () => {
    expect(numberWordsToDigits("bought a bag and one cup")).toBe("bought a bag and one cup");
  });
  it("converts amounts", () => {
    expect(numberWordsToDigits("two hundred and fifty thousand naira")).toBe("250000 naira");
  });
});
