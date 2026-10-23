// Bank Match: checks the notebook against the bank statement.
// Anything in the bank but not in the notebook is shown so it can be added or explained.
// Anything in the notebook but not in the bank is fine — it may have been cash.

import { addDays, fromISODate } from "./dates";
import type { Kind } from "./kinds";
import type { Entry } from "./money";
import { parseLine, type Currency, type DebtContext, type ParsedLine } from "./parse";

export interface BankTxn {
  id: string;
  statement_id: string;
  txn_date: string; // yyyy-mm-dd
  amount: number;
  direction: "in" | "out";
  currency: Currency;
  description: string;
  balance: number | null;
  entry_id: string | null; // linked to a notebook line by the user (or added from here)
  status: "open" | "not_business";
}

export interface BankRule {
  id: string;
  phrase: string; // e.g. "MUM" or "ADA OKAFOR SAVINGS" — transfers with these words aren't business
}

export type MatchState =
  | "linked" // the user linked it to a line, or added it to the notebook from here
  | "matched" // Flowz found the line: same amount, money moving the same way, within a few days
  | "covered" // part of a bigger line, e.g. several transfers inside "Sales today 52,000"
  | "not_business" // the user said it isn't business money
  | "rule" // not business, by a rule the user saved
  | "charge" // bank charges and fees not yet in the notebook
  | "missing"; // in the bank, not in the notebook

export interface TxnResult {
  txn: BankTxn;
  state: MatchState;
  entry?: Entry; // the notebook line it matched, was linked to, or is part of
  rule?: BankRule;
}

export interface MatchReport {
  results: TxnResult[];
  missing: TxnResult[];
  charges: TxnResult[];
  done: TxnResult[]; // matched, linked or covered
  ignored: TxnResult[]; // not business
  /** Notebook lines that say the money went through the bank, but no transfer was found. */
  worthALook: Entry[];
  total: number;
  accounted: number;
  /** Share of bank transactions that are in the notebook or explained, 0–100. Null with no transactions. */
  score: number | null;
}

/** Which way cash moved for a notebook line, or null when no cash moved (a note, a credit sale). */
export function cashDirection(e: Pick<Entry, "kind" | "text">): "in" | "out" | null {
  const k: Kind = e.kind;
  if (k === "sale" || k === "gift_in" || k === "repaid_to_me") return "in";
  if (k === "purchase" || k === "expense" || k === "gift_out" || k === "i_repaid") return "out";
  // Lending or borrowing moves cash; selling or buying on credit doesn't.
  if (LOAN_WORDS.test(e.text)) {
    if (k === "owed_to_me") return "out";
    if (k === "i_owe") return "in";
  }
  return null;
}

const LOAN_WORDS = /\b(borrow|borrowed|lend|lent|loan|loaned|sent|transfer|transferred)\b/i;
export const CHARGE_WORDS =
  /\b(charges?|fees?|commission|stamp duty|vat|sms alert|sms charge|maintenance|levy|cot|card maint|emtl|electronic money transfer levy)\b/i;
const BANK_WORDS =
  /\b(transfer|transferred|trf|tfr|sent|send|pos|bank|alert|credit alert|debit alert|ussd|online|app|opay|palmpay|moniepoint|kuda)\b/i;

const CASH_WORDS = /\b(cash|by hand|in hand|physical(ly)?)\b/i;

const WINDOW_DAYS = 3;

function daysBetween(a: string, b: string) {
  return Math.round(Math.abs(fromISODate(a).getTime() - fromISODate(b).getTime()) / 86_400_000);
}

const FILLER = new Set([
  "the", "and", "for", "from", "paid", "pay", "sold", "bought", "today", "sales", "sale", "money", "transfer",
  "naira", "with", "owes", "owe", "back", "gave", "give", "dey", "don", "collect", "goods", "credit", "rice",
]);

function words(s: string) {
  return new Set(s.toLowerCase().split(/[^a-z]+/).filter((w) => w.length >= 3 && !FILLER.has(w)));
}

/** True when a name in the line (or its person) appears in the bank narration. */
function namesMatch(e: Entry, txn: BankTxn) {
  const desc = words(txn.description);
  const names = words(`${e.person ?? ""} ${e.text}`);
  for (const w of names) if (desc.has(w)) return true;
  return false;
}

function normalise(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function ruleFor(txn: BankTxn, rules: BankRule[]) {
  const desc = ` ${normalise(txn.description)} `;
  return rules.find((r) => normalise(r.phrase) && desc.includes(` ${normalise(r.phrase)} `));
}

export function buildMatchReport(
  txns: BankTxn[],
  entries: Entry[],
  opts: { rules?: BankRule[]; periods?: { start: string; end: string }[]; dismissed?: Set<string> } = {},
): MatchReport {
  const rules = opts.rules ?? [];
  const byId = new Map(entries.map((e) => [e.id, e]));
  const results = new Map<string, TxnResult>();
  // What's left of each line after linked or matched transactions take their share.
  const left = new Map<string, number>();
  for (const e of entries) if (e.amount != null && e.amount > 0) left.set(e.id, e.amount);
  const used = new Set<string>(); // lines that matched or cover at least one transaction

  // 1. The user's own decisions come first.
  for (const t of txns) {
    const linked = t.entry_id ? byId.get(t.entry_id) : undefined;
    if (linked) {
      results.set(t.id, { txn: t, state: "linked", entry: linked });
      left.set(linked.id, (left.get(linked.id) ?? 0) - t.amount);
      used.add(linked.id);
    } else if (t.status === "not_business") results.set(t.id, { txn: t, state: "not_business" });
    else {
      const rule = ruleFor(t, rules);
      if (rule) results.set(t.id, { txn: t, state: "rule", rule });
    }
  }

  // 2. One transaction to one line: same amount, same way, within a few days. Closest first.
  // A line that says it was cash can't be a bank transaction.
  const candidates = entries.filter((e) => e.amount != null && e.currency && cashDirection(e) && !CASH_WORDS.test(e.text));
  const pairs: { t: BankTxn; e: Entry; score: number }[] = [];
  for (const t of txns) {
    if (results.has(t.id)) continue;
    for (const e of candidates) {
      if (e.currency !== t.currency || cashDirection(e) !== t.direction) continue;
      if (Math.abs((e.amount ?? 0) - t.amount) > 0.005) continue;
      const gap = daysBetween(e.entry_date, t.txn_date);
      if (gap > WINDOW_DAYS) continue;
      let score = gap * 10;
      if (namesMatch(e, t)) score -= 25;
      if (e.kind === "owed_to_me" || e.kind === "i_owe") score += 15;
      pairs.push({ t, e, score });
    }
  }
  pairs.sort((a, b) => a.score - b.score || a.t.txn_date.localeCompare(b.t.txn_date));
  for (const { t, e } of pairs) {
    if (results.has(t.id) || (left.get(e.id) ?? 0) < t.amount - 0.005 || used.has(e.id)) continue;
    results.set(t.id, { txn: t, state: "matched", entry: e });
    left.set(e.id, (left.get(e.id) ?? 0) - t.amount);
    used.add(e.id);
  }

  // 3. Bank charges are their own group, so they can be added in one go.
  for (const t of txns) {
    if (!results.has(t.id) && t.direction === "out" && CHARGE_WORDS.test(t.description)) results.set(t.id, { txn: t, state: "charge" });
  }

  // 4. Several transactions inside one bigger line, e.g. transfers that are part of "Sales today 52,000".
  const totals = candidates
    .filter((e) => ["sale", "purchase", "expense", "repaid_to_me"].includes(e.kind) && (left.get(e.id) ?? 0) > 0.005)
    .sort((a, b) => a.entry_date.localeCompare(b.entry_date) || a.position - b.position);
  for (const e of totals) {
    const dir = cashDirection(e);
    const near = txns
      .filter((t) => !results.has(t.id) && t.direction === dir && t.currency === e.currency && daysBetween(e.entry_date, t.txn_date) <= 1)
      .sort((a, b) => daysBetween(e.entry_date, a.txn_date) - daysBetween(e.entry_date, b.txn_date) || b.amount - a.amount);
    for (const t of near) {
      const room = left.get(e.id) ?? 0;
      if (t.amount > room + 0.005) continue;
      results.set(t.id, { txn: t, state: "covered", entry: e });
      left.set(e.id, room - t.amount);
      used.add(e.id);
    }
  }

  for (const t of txns) if (!results.has(t.id)) results.set(t.id, { txn: t, state: "missing" });

  // Lines that say "transfer" or "POS" inside a statement's dates, with no bank transaction found.
  const periods = opts.periods ?? [];
  const inStatement = (d: string) => periods.some((p) => d >= p.start && d <= p.end);
  const worthALook = candidates.filter(
    (e) => !used.has(e.id) && BANK_WORDS.test(e.text) && inStatement(e.entry_date) && !opts.dismissed?.has(e.id),
  );

  const all = txns.map((t) => results.get(t.id)!);
  const of = (...states: MatchState[]) => all.filter((r) => states.includes(r.state));
  const accounted = of("linked", "matched", "covered", "not_business", "rule").length;
  return {
    results: all,
    missing: of("missing"),
    charges: of("charge"),
    done: of("linked", "matched", "covered"),
    ignored: of("not_business", "rule"),
    worthALook,
    total: all.length,
    accounted,
    score: all.length ? Math.floor((accounted / all.length) * 100) : null,
  };
}

// ---------- turning a bank transaction into a notebook line ----------

const NOISE =
  /\b(nip|nibss|trf|tfr|transfer|trans|txn|from|frm|to|fbn|mob|mobile|ussd|web|pos|purchase|via|ref|rvsl|reversal|inward|outward|credit|debit|cr|dr|payment|pymt|pmt|fip|gtb|gtbank|uba|opay|palmpay|kuda|moniepoint|access|zenith|firstbank|wema|alat|fcmb|bank|ltd|limited|ng|lagos|naira|ngn|by|for|on|at|app|mbanking|intra|inter|instant|nibbs)\b/gi;

/** A best guess at the other person's name in a bank narration, e.g. "TRF FROM CHIDI OKAFOR/012345" → "Chidi Okafor". */
export function counterparty(description: string): string | null {
  const cleaned = description
    .replace(/[/\\|:;_*#()[\],.-]+/g, " ")
    .split(/\s+/)
    .filter((w) => w && !/\d/.test(w))
    .join(" ")
    .replace(NOISE, " ")
    .replace(/\s+/g, " ")
    .trim();
  const parts = cleaned.split(" ").filter((w) => /^[a-z]{2,}$/i.test(w)).slice(0, 2);
  if (!parts.length) return null;
  // Short words with no vowels are brands or initials (MTN, DSTV), so they stay in capitals.
  return parts.map((w) => (w.length <= 4 && !/[aeiou]/i.test(w) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1).toLowerCase())).join(" ");
}

function plainAmount(n: number) {
  return n.toLocaleString("en-NG", { maximumFractionDigits: 2 });
}

/** The line Flowz suggests writing for a bank transaction, and how it reads. */
export function suggestLine(txn: BankTxn, ctx?: DebtContext): { text: string; parsed: ParsedLine } {
  // First name only: that's how people write names in the notebook ("Chidi paid 12,000").
  const name = counterparty(txn.description)?.split(" ")[0] ?? null;
  const amount = plainAmount(txn.amount);
  let text: string;
  if (CHARGE_WORDS.test(txn.description) && txn.direction === "out") text = `Bank charges ${amount}`;
  else if (txn.direction === "in") text = name ? `${name} paid ${amount}` : `Transfer received ${amount}`;
  else text = name ? `Transfer to ${name} ${amount}` : `Transfer out ${amount}`;
  const prefix = txn.currency === "USD" ? "$" : "";
  const parsed = parseLine(prefix ? text.replace(amount, `${prefix}${amount}`) : text, txn.currency, ctx);
  return { text: prefix ? text.replace(amount, `${prefix}${amount}`) : text, parsed };
}

/** One line for many bank charges, e.g. "Bank charges (Oct) 1,350". */
export function chargesLine(charges: BankTxn[], month: string) {
  const total = Math.round(charges.reduce((s, t) => s + t.amount, 0) * 100) / 100;
  const label = fromISODate(`${month}-01`).toLocaleDateString("en-GB", { month: "short" });
  const currency = charges[0]?.currency ?? "NGN";
  return { text: `Bank charges (${label}) ${currency === "USD" ? "$" : ""}${plainAmount(total)}`, total };
}

/** Dates a report should look at: the month, plus a few days either side for matching. */
export function matchWindow(start: string, end: string) {
  return { start: addDays(start, -WINDOW_DAYS), end: addDays(end, WINDOW_DAYS) };
}
