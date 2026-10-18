// Turns a line written in plain words ("Sold 3 bags of rice 45k") into money facts.
// Runs entirely on the device, so it is instant and free.

import { CATEGORIES, type Kind } from "./kinds";

export type Currency = "NGN" | "USD";

export interface ParsedLine {
  amount: number | null;
  currency: Currency | null;
  kind: Kind;
  category: string | null;
  person: string | null;
  /** false when we had to guess the kind, so the app can ask the user to check it */
  confident: boolean;
}

const QUANTITY_WORDS = new Set([
  "bag", "bags", "piece", "pieces", "pcs", "pc", "crate", "crates", "carton", "cartons",
  "kg", "kilo", "kilos", "litre", "litres", "liter", "liters", "unit", "units", "pack", "packs",
  "bottle", "bottles", "sachet", "sachets", "tin", "tins", "plate", "plates", "dozen", "bale",
  "bales", "paint", "paints", "mudu", "derica", "tuber", "tubers", "loaf", "loaves", "shirt",
  "shirts", "pair", "pairs", "people", "persons", "days", "day", "hours", "hrs", "times",
  "weeks", "months", "years", "items", "item", "rolls", "roll", "yards", "yard", "cups", "cup",
]);

const NUMBER_RE =
  /(₦|\$|\bngn\b|\busd\b|\bn(?=\d))?\s*(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?(?:\s*(k|m|thousand|million|grand)\b|\b)(\s*(?:naira|dollars?|usd|ngn|bucks)\b)?/gi;

interface Candidate {
  value: number;
  currency: Currency | null;
  score: number;
  marked: boolean; // had a currency sign or k/m suffix
  index: number;
}

function currencyFrom(token: string | undefined): Currency | null {
  if (!token) return null;
  const t = token.trim().toLowerCase();
  if (t === "$" || t === "usd" || t.startsWith("dollar") || t === "bucks") return "USD";
  return "NGN";
}

function findCandidates(text: string): Candidate[] {
  const out: Candidate[] = [];
  for (const m of text.matchAll(NUMBER_RE)) {
    const [, prefix, whole, decimals, suffix, word] = m;
    let value = Number(whole.replace(/,/g, "") + (decimals ? `.${decimals}` : ""));
    if (!Number.isFinite(value)) continue;
    // Phone numbers and account numbers are not money.
    if (!whole.includes(",") && whole.length >= 10) continue;

    const s = suffix?.toLowerCase();
    if (s === "k" || s === "thousand" || s === "grand") value *= 1_000;
    if (s === "m" || s === "million") value *= 1_000_000;

    const currency = currencyFrom(prefix) ?? currencyFrom(word);
    const after = text.slice((m.index ?? 0) + m[0].length).trim().toLowerCase();
    const nextWord = after.split(/[^a-z]+/)[0] ?? "";

    let score = 0;
    if (currency) score += 100;
    if (s) score += 50;
    if (whole.includes(",")) score += 30;
    if (value >= 100) score += 10;
    if (!currency && !s && QUANTITY_WORDS.has(nextWord)) score -= 60;
    if (!currency && !s && value < 100) score -= 15;

    out.push({ value, currency, score, marked: Boolean(currency || s), index: m.index ?? 0 });
  }
  return out;
}

function pickAmount(text: string): { amount: number | null; currency: Currency | null } {
  const candidates = findCandidates(text);
  const usable = candidates.filter((c) => c.score > -40);
  if (usable.length === 0) return { amount: null, currency: null };

  const best = [...usable].sort((a, b) => b.score - a.score || b.value - a.value)[0];
  let amount = best.value;

  // "3 shirts at 5,000 each" or "3 x 5000" → 15,000
  const multiply = /\beach\b|\bper (?:one|piece|unit|item|bag|carton|crate)\b|\d\s*x\s*[₦$]?\s*\d/i.test(text);
  if (multiply) {
    const qty = candidates.find(
      (c) => c !== best && !c.marked && Number.isInteger(c.value) && c.value > 0 && c.value < 10_000 && c.index < best.index,
    );
    if (qty) amount = qty.value * best.value;
  }

  return { amount: Math.round(amount * 100) / 100, currency: best.currency };
}

function textCurrency(t: string): Currency | null {
  if (/\$|\bdollars?\b|\busd\b|\bbucks\b/.test(t)) return "USD";
  if (/₦|\bnaira\b|\bngn\b/.test(t)) return "NGN";
  return null;
}

function hasWord(t: string, word: string) {
  if (word.includes(" ")) return t.includes(word);
  return new RegExp(`\\b${word}\\b`).test(t);
}

export function detectCategory(t: string): string | null {
  // Stock words like "bags" are weak signals, so check everything else first.
  for (const c of CATEGORIES) {
    if (c.id === "stock" || c.id === "other") continue;
    if (c.words.some((w) => hasWord(t, w))) return c.id;
  }
  const stock = CATEGORIES.find((c) => c.id === "stock")!;
  if (stock.words.some((w) => hasWord(t, w))) return "stock";
  return null;
}

const TITLE = "(?:mr\\.?|mrs\\.?|miss|mama|baba|aunty|auntie|uncle|bro|sis|alhaji|alhaja|madam|oga|iya|chief|dr\\.?)";
const NAME = `((?:${TITLE}\\s+)?[a-z][a-z'-]*)`;
const NOT_NAMES = new Set([
  "i", "me", "my", "we", "you", "he", "she", "they", "the", "a", "an", "someone", "somebody",
  "customer", "customers", "sold", "bought", "paid", "still", "and", "for", "of", "to", "from",
  "him", "her", "them", "it", "today", "yesterday", "money",
]);

function cleanName(raw: string | undefined): string | null {
  if (!raw) return null;
  const words = raw.trim().split(/\s+/);
  if (words.some((w) => NOT_NAMES.has(w))) return null;
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function findPerson(t: string, patterns: RegExp[]): string | null {
  for (const p of patterns) {
    const name = cleanName(t.match(p)?.[1]);
    if (name) return name;
  }
  return null;
}

function detectKind(t: string, category: string | null): { kind: Kind; confident: boolean; person: string | null } {
  // Money you owe someone
  if (/\bi owe\b|\bi'?m owing\b|\bi am owing\b|\bi borrowed\b|\bloan from\b|\bbought on credit\b|\bcredit from\b|\bowe\b.*\bbalance\b/.test(t)) {
    return {
      kind: "i_owe",
      confident: true,
      person: findPerson(t, [new RegExp(`\\bi owe ${NAME}`), new RegExp(`\\bfrom ${NAME}`), new RegExp(`\\bowing ${NAME}`)]),
    };
  }
  // Money someone owes you
  if (/\bowes? me\b|\bowing me\b|\bi lent\b|\blent\b|\bsold on credit\b|\bon credit to\b|\bborrowed\b|\bstill owes\b/.test(t)) {
    return {
      kind: "owed_to_me",
      confident: true,
      person: findPerson(t, [
        new RegExp(`^${NAME}\\s+(?:still\\s+)?(?:owes|owing|borrowed)`),
        new RegExp(`\\blent ${NAME}`),
        new RegExp(`\\bcredit to ${NAME}`),
        new RegExp(`\\bto ${NAME}`),
      ]),
    };
  }
  // Gifts you received
  if (/\b(?:gave|sent|dashed|gifted|blessed|surprised) me\b|\bgift from\b|\breceived (?:a )?gift\b|\bgot (?:a )?gift\b|\bgift received\b/.test(t)) {
    return {
      kind: "gift_in",
      confident: true,
      person: findPerson(t, [new RegExp(`^${NAME}\\s+(?:gave|sent|dashed|gifted|blessed|surprised) me`), new RegExp(`\\bfrom ${NAME}`)]),
    };
  }
  // Gifts and giving
  if (/\bgave\b|\bsent\b.*\bto\b|\bgift(?:ed)?\b|\bdonat|\bdash(?:ed)?\b|\btithe\b|\boffering\b|\bzakat\b|\bcharity\b|\bsupport(?:ed)?\b/.test(t)) {
    return {
      kind: "gift_out",
      confident: true,
      person: findPerson(t, [new RegExp(`\\bgave ${NAME}`), new RegExp(`\\bto ${NAME}`), new RegExp(`\\bdashed ${NAME}`)]),
    };
  }
  // Paying staff is spending, even though it mentions salary
  if (/\b(?:paid|pay)\b.*\b(?:salary|salaries|wages?|staff|workers?|apprentice)\b/.test(t)) {
    return { kind: "expense", confident: true, person: null };
  }
  // Money coming in
  if (/\bsold\b|\bsell\b|\bsales?\b|\bcustomers?\b|\bclients?\b|\bpaid me\b|\breceived\b|\bincome\b|\bsalary\b|\bearned\b|\bprofit\b|\bcollected\b|\bpayment from\b|\brevenue\b|\btransfer from\b|\bcame in\b|\bgot paid\b|\bcommission\b|\balert\b/.test(t)) {
    return {
      kind: "sale",
      confident: true,
      person: findPerson(t, [new RegExp(`^${NAME}\\s+paid me`), new RegExp(`\\bfrom ${NAME}`), new RegExp(`\\bsold to ${NAME}`)]),
    };
  }
  // Buying: stock is a purchase, everyday things are spending
  if (/\bbought\b|\bbuy\b|\bpurchased?\b|\brestock(?:ed)?\b/.test(t)) {
    const isStock = category === null || category === "stock";
    return { kind: isStock ? "purchase" : "expense", confident: true, person: null };
  }
  if (/\bpaid\b|\bpay\b|\bspent\b|\bspend\b|\bcost\b|\bfees?\b|\bbills?\b|\bcharges?\b|\bwasted\b/.test(t) || category) {
    return { kind: "expense", confident: true, person: null };
  }
  return { kind: "expense", confident: false, person: null };
}

export function parseLine(text: string, defaultCurrency: Currency = "NGN"): ParsedLine {
  const normalised = text.replace(/(\d)\s*[x×*]\s*(?=[₦$]?\s*\d)/g, "$1 x ");
  const t = normalised.toLowerCase().replace(/\s+/g, " ").trim();
  if (!t) return { amount: null, currency: null, kind: "note", category: null, person: null, confident: true };

  const { amount, currency } = pickAmount(normalised);
  if (amount === null || amount === 0) {
    return { amount: null, currency: null, kind: "note", category: null, person: null, confident: true };
  }

  const category = detectCategory(t);
  const { kind, confident, person } = detectKind(t, category);
  const flowCategory =
    kind === "purchase" ? "stock" : kind === "expense" || kind === "gift_out" ? category ?? "other" : null;

  return {
    amount,
    currency: currency ?? textCurrency(t) ?? defaultCurrency,
    kind,
    category: kind === "expense" && flowCategory === "stock" ? "other" : flowCategory,
    person,
    confident,
  };
}
