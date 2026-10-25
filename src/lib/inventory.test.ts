import { describe, expect, it } from "vitest";
import { describeStock, findStock, packPrice, readWithStock, stockLevels, unitPrice, type InventoryItem } from "./inventory";
import type { Entry } from "./money";

const item = (over: Partial<InventoryItem>): InventoryItem => ({
  id: over.name!.toLowerCase(),
  name: "",
  other_names: null,
  unit_name: "piece",
  pack_name: null,
  units_per_pack: null,
  cost_unit: null,
  cost_pack: null,
  sell_unit: null,
  sell_pack: null,
  currency: "NGN",
  stock_units: 0,
  counted_at: "2026-10-20T08:00:00.000Z",
  low_stock_units: null,
  ...over,
});

const indomie = item({ name: "Indomie", other_names: "noodles", unit_name: "pack", pack_name: "carton", units_per_pack: 40, cost_pack: 13_600, sell_unit: 400, sell_pack: 15_000, stock_units: 200 });
const rice = item({ name: "Rice", unit_name: "bag", cost_unit: 12_500, sell_unit: 15_000, stock_units: 20 });
const coke = item({ name: "Coke", unit_name: "bottle", pack_name: "crate", units_per_pack: 12, cost_pack: 3_000, sell_unit: 300 });
const items = [indomie, rice, coke];

describe("prices", () => {
  it("works out the missing price from the other", () => {
    expect(unitPrice(indomie, "cost")).toBe(340);
    expect(packPrice(indomie, "sell")).toBe(15_000);
    expect(packPrice(coke, "sell")).toBe(3_600);
    expect(unitPrice(rice, "sell")).toBe(15_000);
  });
});

describe("finding items in a line", () => {
  it("reads counts, cartons and other names", () => {
    expect(findStock("Sold 3 indomie", items)).toMatchObject({ units: 3, count: 3, byPack: false });
    expect(findStock("Bought 2 cartons of indomie", items)).toMatchObject({ units: 80, count: 2, byPack: true });
    expect(findStock("sold a carton of noodles", items)).toMatchObject({ units: 40, byPack: true });
    expect(findStock("Sold 5 packs indomie", items)).toMatchObject({ units: 5, byPack: false });
    expect(findStock("indomie x 4", items)).toMatchObject({ units: 4 });
    expect(findStock("Indomie 2 cartons", items)).toMatchObject({ units: 80 });
    expect(findStock("Sold three bottles of coke", items)).toMatchObject({ units: 3, item: coke });
    expect(findStock("Sold 2 crates of coke", items)).toMatchObject({ units: 24 });
  });

  it("doesn't take money for a count", () => {
    expect(findStock("Sold indomie 3,000", items)).toBeNull();
    expect(findStock("Sold indomie 3000", items)).toBeNull();
    expect(findStock("Transport 1500", items)).toBeNull();
  });
});

describe("reading lines with stock", () => {
  it("prices a sale from the selling price", () => {
    const r = readWithStock("Sold 3 indomie", items, "NGN");
    expect(r).toMatchObject({ kind: "sale", amount: 1_200, currency: "NGN", item_id: "indomie", item_qty: 3 });
  });

  it("uses the carton price for cartons", () => {
    expect(readWithStock("Sold 2 cartons of indomie", items, "NGN")).toMatchObject({ kind: "sale", amount: 30_000, item_qty: 80 });
    expect(readWithStock("Bought 5 cartons of indomie", items, "NGN")).toMatchObject({ kind: "purchase", amount: 68_000, item_qty: 200, category: "stock" });
  });

  it("keeps an amount the user wrote", () => {
    expect(readWithStock("Sold 3 bags of rice 45,000", items, "NGN")).toMatchObject({ kind: "sale", amount: 45_000, item_qty: 3 });
    expect(readWithStock("Sold 2 cartons of indomie at 14,500 each", items, "NGN")).toMatchObject({ amount: 29_000, item_qty: 80 });
  });

  it("handles credit and Pidgin", () => {
    expect(readWithStock("Joy took 2 bags of rice on credit", items, "NGN")).toMatchObject({ kind: "owed_to_me", amount: 30_000, person: "Joy", item_qty: 2 });
    expect(readWithStock("I buy 1 carton indomie", items, "NGN")).toMatchObject({ kind: "purchase", amount: 13_600, item_qty: 40 });
  });

  it("treats a bare count as a sale that's worth checking", () => {
    expect(readWithStock("4 indomie", items, "NGN")).toMatchObject({ kind: "sale", amount: 1_600, confident: false });
  });

  it("leaves other lines alone", () => {
    expect(readWithStock("Transport 1,500", items, "NGN")).toMatchObject({ kind: "expense", amount: 1_500, item_id: null });
    expect(readWithStock("Sold 3 indomie", [], "NGN").item_id).toBeNull();
  });
});

describe("stock levels", () => {
  const line = (date: string, kind: Entry["kind"], qty: number, created = `${date}T12:00:00.000Z`): Entry => ({
    id: Math.random().toString(), entry_date: date, position: 0, text: "", amount: 1, currency: "NGN", kind, category: null, person: null,
    kind_locked: false, settled_at: null, item_id: "indomie", item_qty: qty, created_at: created,
  });

  it("counts from the last stock count", () => {
    const levels = stockLevels(items, [
      line("2026-10-19", "sale", 10), // before the count: already in it
      line("2026-10-20", "sale", 5, "2026-10-20T07:00:00.000Z"), // same day, before the count
      line("2026-10-20", "sale", 3),
      line("2026-10-21", "purchase", 80),
      line("2026-10-22", "owed_to_me", 40),
      line("2026-10-22", "note", 7),
    ]);
    expect(levels.get("indomie")).toBe(237);
    expect(levels.get("rice")).toBe(20);
  });

  it("describes stock in cartons and packs", () => {
    expect(describeStock(indomie, 237)).toBe("5 cartons + 37 packs");
    expect(describeStock(indomie, 40)).toBe("1 carton");
    expect(describeStock(indomie, 7)).toBe("7 packs");
    expect(describeStock(rice, 1)).toBe("1 bag");
  });
});
