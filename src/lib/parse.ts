// Turns a line written in plain words ("Sold 3 bags of rice 45k") into money facts.
// Runs entirely on the device, so it is instant and free.

import { CATEGORIES, type Kind } from "./kinds";
import { numberWordsToDigits, toPlainWords } from "./language";

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
  /(₦|\$|#|\bngn\b|\busd\b|\bn(?=\s?\d))?\s*(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?(?:\s*(k|m|thousand|million|grand)\b|\b)(\s*(?:naira|dollars?|usd|ngn|bucks)\b)?/gi;

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

/** What each person still owes (or is owed), so a line can be read in context. Keys are lower-case names. */
export interface DebtContext {
  owedToMe: Map<string, number>;
  iOwe: Map<string, number>;
}

/** Finds a person in the debt book, allowing "Bisi" to match "Mama Bisi" when that is the only match. */
export function lookupPerson(book: Map<string, number> | undefined, name: string | null): string | null {
  if (!book || !name) return null;
  const key = name.toLowerCase();
  if (book.has(key)) return key;
  const matches = [...book.keys()].filter((k) => k.split(/\s+/).includes(key) || key.split(/\s+/).includes(k));
  return matches.length === 1 ? matches[0] : null;
}

const TITLE = "(?:mr\\.?|mrs\\.?|miss|mama|baba|aunty|auntie|uncle|bro|sis|alhaji|alhaja|madam|oga|iya|chief|dr\\.?)";
const NAME = `((?:${TITLE}\\s+)?[a-z][a-z'-]*)`;
const NOT_NAMES = new Set([
  "i", "me", "my", "we", "you", "he", "she", "they", "the", "a", "an", "someone", "somebody",
  "customer", "customers", "sold", "bought", "paid", "still", "and", "for", "of", "to", "from",
  "him", "her", "them", "it", "today", "yesterday", "money", "back", "on", "credit", "goods",
  "rice", "transport", "fuel", "stock", "salary", "rent", "food", "bill", "school", "staff",
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

const BUYER_VERBS = "(?:bought|took|received|carried|picked|ordered|collected|got|carry|take|pick|order)";
const ON_CREDIT = /\b(?:on|for|with|as|by)\s+(?:credit|trust|tab|account|loan)\b|\bcredit\b(?!\s+alert)|\b(?:pay|paying)\s+(?:later|tomorrow|next\s+(?:week|month)|at\s+month\s+end)\b|\bunpaid\b|\bnot\s+(?:yet\s+)?paid\b|\byet\s+to\s+pay\b/;

function detectKind(t: string, category: string | null): { kind: Kind; confident: boolean; person: string | null } {
  // Paying back a debt
  if (/\bpaid back\b/.test(t)) {
    const toWhom = t.match(new RegExp(`\\bpaid back to ${NAME}`))?.[1];
    if (toWhom === "me" || /\bpaid back to me\b/.test(t)) {
      return { kind: "repaid_to_me", confident: true, person: findPerson(t, [new RegExp(`^${NAME}\\s`), new RegExp(`\\bfrom ${NAME}`)]) };
    }
    if (/^(?:i\b|paid back\b)/.test(t) || toWhom || /\bmy (?:debt|loan|balance)\b/.test(t)) {
      return {
        kind: "i_repaid",
        confident: true,
        person: findPerson(t, [new RegExp(`\\bpaid back to ${NAME}`), new RegExp(`\\bto ${NAME}`), new RegExp(`\\bpaid back ${NAME}`)]),
      };
    }
    return { kind: "repaid_to_me", confident: true, person: findPerson(t, [new RegExp(`^${NAME}\\s+paid back`), new RegExp(`\\bfrom ${NAME}`), new RegExp(`^${NAME}\\s`)]) };
  }
  // Someone took goods on credit: "Joy bought 50k rice on credit" → Joy owes me
  if (ON_CREDIT.test(t)) {
    const buyer = cleanName(t.match(new RegExp(`^${NAME}\\s+(?:still\\s+)?${BUYER_VERBS}\\b`))?.[1]);
    if (buyer) return { kind: "owed_to_me", confident: true, person: buyer };
    if ((/^(?:i|we)\b|\bbought on credit\b/.test(t) || new RegExp(`^${BUYER_VERBS}\\b`).test(t)) && !/\bsold\b/.test(t)) {
      return { kind: "i_owe", confident: true, person: findPerson(t, [new RegExp(`\\bfrom ${NAME}`), new RegExp(`\\bowe ${NAME}`)]) };
    }
  }
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
  // "Ada paid 20k": someone paying you is money in
  const payer = cleanName(t.match(new RegExp(`^${NAME}\\s+(?:paid|pay|pays|sent|transferred|settled)\\b(?!\\s+(?:for|the|my|our|school|rent|bill))`))?.[1]);
  if (payer && !/\b(?:salary|salaries|wages?|staff|workers?)\b/.test(t)) {
    return { kind: "sale", confident: true, person: payer };
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
      person: findPerson(t, [
        new RegExp(`^${NAME}\\s+(?:paid|sent|transferred|settled)\\b`),
        new RegExp(`\\bfrom ${NAME}`),
        new RegExp(`\\bsold to ${NAME}`),
      ]),
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

const titleCase = (name: string) => name.replace(/\b[a-z]/g, (c) => c.toUpperCase());

/**
 * Uses the debt book to read a line in context:
 * "Joy paid 20k" is a repayment when Joy owes you; "Paid Tunde 5k" is a repayment when you owe Tunde.
 */
function applyContext(t: string, r: { kind: Kind; person: string | null; confident: boolean }, ctx: DebtContext) {
  let { kind, person, confident } = r;
  const subject = findPerson(t, [new RegExp(`^${NAME}\\s`)]);
  const object = findPerson(t, [new RegExp(`\\bpaid ${NAME}`), new RegExp(`\\bgave ${NAME}`), new RegExp(`\\bto ${NAME}`)]);
  // "Joy paid 20k" / "collected 8k from Joy" while Joy owes you → Joy paid back
  if ((kind === "sale" || kind === "expense") && !/\bsold\b|\bsales?\b/.test(t)) {
    const who = lookupPerson(ctx.owedToMe, kind === "sale" ? person ?? subject : subject);
    if (who) {
      kind = "repaid_to_me";
      person = titleCase(who);
      confident = true;
    }
  }
  // "Paid Tunde 5k" while you owe Tunde → you paid back
  if (kind === "expense" || kind === "gift_out") {
    const who = lookupPerson(ctx.iOwe, person ?? object);
    if (who) {
      kind = "i_repaid";
      person = titleCase(who);
      confident = true;
    }
  }
  // Use the spelling already in the book, so "joy" and "Joy" are the same person.
  const book = kind === "owed_to_me" || kind === "repaid_to_me" ? ctx.owedToMe : kind === "i_owe" || kind === "i_repaid" ? ctx.iOwe : null;
  const known = book ? lookupPerson(book, person) : null;
  if (known) person = titleCase(known);
  return { kind, person, confident };
}

export function parseLine(text: string, defaultCurrency: Currency = "NGN", ctx?: DebtContext): ParsedLine {
  const normalised = numberWordsToDigits(text)
    .replace(/(\d)\s*[x×*]\s*(?=[₦$#]?\s*\d)/g, "$1 x ")
    .replace(/(\d)(naira|ngn|usd|dollars?|bucks|thousand|million|grand)\b/gi, "$1 $2");
  const raw = normalised.toLowerCase().replace(/\s+/g, " ").trim();
  const t = toPlainWords(raw);
  if (!t) return { amount: null, currency: null, kind: "note", category: null, person: null, confident: true };

  const { amount, currency } = pickAmount(normalised);
  if (amount === null || amount === 0) {
    return { amount: null, currency: null, kind: "note", category: null, person: null, confident: true };
  }

  const category = detectCategory(t);
  let read = detectKind(t, category);
  if (ctx) read = applyContext(t, read, ctx);
  const { kind, person } = read;
  // A repayment without a name can't be matched to anyone's debt, so ask the user to check it.
  const confident = read.confident && !((kind === "repaid_to_me" || kind === "i_repaid") && !person);
  const flowCategory =
    kind === "purchase" ? "stock" : kind === "expense" || kind === "gift_out" ? category ?? "other" : null;

  return {
    amount,
    currency: currency ?? textCurrency(raw) ?? defaultCurrency,
    kind,
    category: kind === "expense" && flowCategory === "stock" ? "other" : flowCategory,
    person,
    confident,
  };
}

/** Words that suggest a line depends on context, so it's worth a closer (AI) read. */
export function needsCloserLook(text: string, parsed: ParsedLine): boolean {
  if (!parsed.confident) return true;
  if (parsed.amount == null) return /\d/.test(text) && /\b(?:owe|credit|paid|pay|back|balance|borrow|lend|lent|loan)\b/i.test(text);
  const t = text.toLowerCase();
  if (/\b(?:credit|trust|back|balance|remain|remaining|owe|owes|owing|borrow|borrowed|lend|lent|loan|later|part|half|refund|return|returned|settle|settled|debt|deposit|instal+ment|still|left)\b/.test(t)) return true;
  if (t.split(/\s+/).length > 10) return true;
  return (t.match(/\d[\d,.]*\s*k?\b/g) ?? []).length >= 3;
}
