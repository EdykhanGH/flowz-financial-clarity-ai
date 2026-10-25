// Inventory: the goods a business sells, their prices, and how much is left.
// When a notebook line names an item ("Sold 3 indomie", "Bought 2 cartons of indomie"),
// Flowz works out the money from the item's prices (unless the line gives an amount)
// and moves the stock up or down.

import type { Kind } from "./kinds";
import type { Entry } from "./money";
import { parseLine, type Currency, type DebtContext, type ParsedLine } from "./parse";

export interface InventoryItem {
  id: string;
  name: string; // "Indomie"
  other_names: string | null; // "noodles, indomie noodles" — other words people use for it
  unit_name: string; // what one is called when sold singly: "pack", "piece", "bottle"
  pack_name: string | null; // what it comes in: "carton"
  units_per_pack: number | null; // 40 packs in a carton
  cost_unit: number | null; // buying price for one
  cost_pack: number | null; // buying price for a carton
  sell_unit: number | null; // selling price for one
  sell_pack: number | null; // selling price for a carton (wholesale), if different
  currency: Currency;
  stock_units: number; // how many were counted…
  counted_at: string; // …at this moment (ISO timestamp); lines after it move the stock
  low_stock_units: number | null; // warn when stock falls to this
}

// ---------- prices ----------

const round2 = (n: number) => Math.round(n * 100) / 100;

export function unitPrice(item: InventoryItem, side: "cost" | "sell"): number | null {
  const unit = side === "cost" ? item.cost_unit : item.sell_unit;
  const pack = side === "cost" ? item.cost_pack : item.sell_pack;
  if (unit != null) return unit;
  if (pack != null && item.units_per_pack) return round2(pack / item.units_per_pack);
  return null;
}

export function packPrice(item: InventoryItem, side: "cost" | "sell"): number | null {
  const unit = side === "cost" ? item.cost_unit : item.sell_unit;
  const pack = side === "cost" ? item.cost_pack : item.sell_pack;
  if (pack != null) return pack;
  if (unit != null && item.units_per_pack) return round2(unit * item.units_per_pack);
  return null;
}

// ---------- words ----------

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function plural(word: string) {
  const w = word.toLowerCase();
  if (/(s|x|ch|sh)$/.test(w)) return [w, `${w}es`];
  if (/[^aeiou]y$/.test(w)) return [w, `${w.slice(0, -1)}ies`];
  return [w, `${w}s`];
}

function namesOf(item: InventoryItem) {
  return [item.name, ...(item.other_names ?? "").split(",")]
    .map((n) => n.trim().toLowerCase())
    .filter((n) => n.length >= 2);
}

const QTY_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40, fifty: 50, hundred: 100, half: 0.5, dozen: 12,
};
const QTY = `(\\d+(?:\\.\\d+)?|${Object.keys(QTY_WORDS).join("|")})`;
const GENERIC_UNIT = ["piece", "pieces", "pcs", "pc", "unit", "units", "item", "items"];
const GENERIC_PACK = ["carton", "cartons", "ctn", "ctns"];

function qtyValue(word: string) {
  return QTY_WORDS[word] ?? Number(word);
}

export interface StockReading {
  item: InventoryItem;
  units: number; // how many single units moved
  count: number; // the number as written ("2" in "2 cartons")
  byPack: boolean; // written in cartons/packs
}

/** Finds an inventory item and how many, in a line like "Sold 2 cartons of indomie" or "indomie x3". */
export function findStock(text: string, items: InventoryItem[]): (StockReading & { phrase: string }) | null {
  const t = ` ${text.toLowerCase().replace(/\s+/g, " ")} `;
  const named = items
    .flatMap((item) => namesOf(item).map((name) => ({ item, name })))
    .sort((a, b) => b.name.length - a.name.length);

  for (const { item, name } of named) {
    const nameRe = `(?:${plural(name).map(esc).join("|")})`;
    if (!new RegExp(`\\b${nameRe}\\b`).test(t)) continue;

    const packWords = item.pack_name && item.units_per_pack ? [...plural(item.pack_name), ...GENERIC_PACK] : [];
    const unitWords = [...plural(item.unit_name), ...GENERIC_UNIT].filter((w) => !packWords.includes(w));
    const unitRe = `(${[...packWords, ...unitWords].map(esc).join("|")})`;
    const toUnits = (count: number, unit: string | undefined) => {
      const byPack = Boolean(unit && packWords.includes(unit));
      return { count, byPack, units: byPack ? round2(count * item.units_per_pack!) : count };
    };

    const patterns = [
      // "3 indomie", "2 cartons of indomie", "a carton of the indomie", "half carton indomie"
      new RegExp(`(?<![₦$#\\d,.])\\b${QTY}\\s*(?:${unitRe}\\s+)?(?:of\\s+)?(?:the\\s+)?(?:a\\s+)?${nameRe}\\b`),
      // "indomie 2 cartons", "indomie x 3", "indomie 3 pcs"
      new RegExp(`\\b${nameRe}\\s*(?:x|×)\\s*${QTY}\\b()`),
      new RegExp(`\\b${nameRe}\\s+${QTY}\\s*${unitRe}\\b`),
    ];
    for (const re of patterns) {
      const m = t.match(re);
      if (!m) continue;
      const count = qtyValue(m[1]);
      if (!Number.isFinite(count) || count <= 0) continue;
      // A bare number with a comma or many digits is money, not a count ("indomie 3,000").
      if (!m[2] && /^\d{4,}$/.test(m[1])) continue;
      return { item, ...toUnits(count, m[2] || undefined), phrase: m[0].trim() };
    }
    // The item is named without a count ("Sold indomie 3,000"): read the line as usual.
    return null;
  }
  return null;
}

/** Stock goes down when goods leave (sold, on credit, given) and up when they come in (bought). */
export function stockDirection(kind: Kind): -1 | 0 | 1 {
  if (kind === "sale" || kind === "owed_to_me" || kind === "gift_out") return -1;
  if (kind === "purchase" || kind === "i_owe") return 1;
  return 0;
}

export interface StockLine extends ParsedLine {
  item_id: string | null;
  item_qty: number | null;
  stock?: StockReading;
}

/**
 * Reads a line with the inventory in mind. When it names an item with a count, the money comes
 * from the item's prices (unless an amount is written) and the line records how many moved.
 */
export function readWithStock(text: string, items: InventoryItem[], defaultCurrency: Currency, ctx?: DebtContext): StockLine {
  const plain = parseLine(text, defaultCurrency, ctx);
  const none = { ...plain, item_id: null, item_qty: null };
  if (!items.length) return none;
  const found = findStock(text, items);
  if (!found) return none;

  // Read the rest of the line without the count, so "3" in "Sold 3 indomie" isn't taken as ₦3.
  const rest = text.replace(new RegExp(esc(found.phrase), "i"), " ").replace(/\s+/g, " ").trim();
  const written = parseLine(rest, defaultCurrency, ctx);
  // The kind comes from the words ("sold", "bought", "on credit"); a stand-in amount lets the reader see it.
  const words = /[a-z]{2,}/i.test(rest) ? parseLine(`${rest} ₦1`, defaultCurrency, ctx) : null;
  const kind: Kind = written.amount != null ? written.kind : words?.kind ?? "sale";
  const direction = stockDirection(kind);
  if (direction === 0) return none;

  let amount = written.amount;
  if (amount != null && /\beach\b|\bper\b/i.test(rest)) amount = round2(amount * found.count);
  if (amount == null) {
    const side = direction < 0 ? "sell" : "cost";
    const pack = found.byPack ? packPrice(found.item, side) : null;
    const unit = unitPrice(found.item, side);
    amount = pack != null ? round2(pack * found.count) : unit != null ? round2(unit * found.units) : null;
  }
  const source = written.amount != null ? written : words ?? written;
  return {
    // With no price set, the stock still moves; the line just has no money.
    amount,
    currency: amount == null ? null : written.amount != null ? written.currency : found.item.currency,
    kind,
    category: kind === "purchase" ? "stock" : source.category,
    person: source.person,
    // A line with only an item and a count ("3 indomie") is most likely a sale, but worth a check.
    confident: words != null && source.confident,
    item_id: found.item.id,
    item_qty: found.units,
    stock: found,
  };
}

// ---------- stock levels ----------

/** True when a line was written after the item was counted, so it moves the stock. */
export function afterCount(e: Pick<Entry, "entry_date" | "created_at">, item: InventoryItem) {
  const countedDay = item.counted_at.slice(0, 10);
  if (e.entry_date !== countedDay) return e.entry_date > countedDay;
  return !e.created_at || e.created_at >= item.counted_at;
}

/** How many of each item are left: the last count plus what was bought minus what went out since. */
export function stockLevels(items: InventoryItem[], entries: Entry[]): Map<string, number> {
  const out = new Map(items.map((i) => [i.id, i.stock_units]));
  const byId = new Map(items.map((i) => [i.id, i]));
  for (const e of entries) {
    const item = e.item_id ? byId.get(e.item_id) : undefined;
    if (!item || !e.item_qty || !afterCount(e, item)) continue;
    out.set(item.id, round2((out.get(item.id) ?? 0) + stockDirection(e.kind) * e.item_qty));
  }
  return out;
}

/** "2 cartons + 5 packs", "45 bottles", "1 carton". */
export function describeStock(item: InventoryItem, units: number) {
  const name = (n: number, word: string) => `${n} ${Math.abs(n) === 1 ? word : plural(word)[1]}`;
  if (!item.pack_name || !item.units_per_pack || Math.abs(units) < item.units_per_pack) return name(round2(units), item.unit_name);
  const sign = units < 0 ? -1 : 1;
  const packs = Math.floor(Math.abs(units) / item.units_per_pack);
  const rest = round2(Math.abs(units) - packs * item.units_per_pack);
  const left = name(sign * packs, item.pack_name);
  return rest ? `${left} + ${name(rest, item.unit_name)}` : left;
}

export const isLow = (item: InventoryItem, units: number) => item.low_stock_units != null && units <= item.low_stock_units;
