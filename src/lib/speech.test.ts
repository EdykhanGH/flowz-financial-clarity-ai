import { describe, expect, it } from "vitest";
import { spokenLines } from "./speech";
import { parseLine } from "./parse";

describe("spoken lines", () => {
  it("tidies what was said into a line", () => {
    expect(spokenLines("sold three bags of rice 45,000.")).toEqual(["Sold three bags of rice 45,000"]);
    expect(spokenLines("  transport 1500 ")).toEqual(["Transport 1500"]);
  });

  it("splits on next line and new line", () => {
    expect(spokenLines("sold rice 45,000 next line transport 1500 new line gave mum 10k")).toEqual([
      "Sold rice 45,000",
      "Transport 1500",
      "Gave mum 10k",
    ]);
    expect(spokenLines("next line")).toEqual([]);
  });

  it("reads spoken numbers like typed ones", () => {
    const [line] = spokenLines("sold three bags of rice forty five thousand naira");
    expect(parseLine(line, "NGN")).toMatchObject({ kind: "sale", amount: 45_000 });
    expect(parseLine(spokenLines("Emeka dey owe me four thousand")[0], "NGN")).toMatchObject({ kind: "owed_to_me", amount: 4_000 });
  });
});
