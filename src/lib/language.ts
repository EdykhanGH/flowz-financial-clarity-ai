// Makes the line reader understand the many ways people write the same thing:
// British and American English, Nigerian Pidgin, short forms, number words and common typos.
// Everything is rewritten into a small set of plain English words that the rules in parse.ts know.

// ---------- number words → digits ----------

const SMALL: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fourty: 40,
  fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, a: 1, an: 1, half: 0.5,
};
const SCALE: Record<string, number> = { hundred: 100, thousand: 1_000, k: 1_000, grand: 1_000, million: 1_000_000, m: 1_000_000 };
const NUMBER_WORD = `(?:${[...Object.keys(SMALL), ...Object.keys(SCALE), "and"].join("|")})`;
const RUN = new RegExp(`\\b${NUMBER_WORD}(?:[\\s-]+${NUMBER_WORD})*\\b`, "gi");
const MONEY_AFTER = /^\s*(?:naira|dollars?|bucks|usd|ngn)\b/i;

/** "two thousand five hundred naira" → "2500 naira". Only converts when it clearly is an amount. */
export function numberWordsToDigits(text: string): string {
  return text.replace(RUN, (run: string, offset: number, whole: string) => {
    const original = run.split(/[\s-]+/);
    const words = original.map((w) => w.toLowerCase());
    let start = 0;
    let end = words.length;
    // Words like "and" / "a" at the edges belong to the sentence, not the number.
    while (start < end && (words[start] === "and" || ((words[start] === "a" || words[start] === "an") && !(words[start + 1] in SCALE)))) start++;
    while (end > start && ["and", "a", "an"].includes(words[end - 1])) end--;
    const core = words.slice(start, end);
    // Needs a number word: "2 grand" is already digits, "a bag" is not money.
    if (!core.some((w) => w in SMALL) || core.every((w) => w === "a" || w === "an" || w === "and")) return run;

    let total = 0;
    let current = 0;
    let usedScale = false;
    for (const w of core) {
      if (w === "and") continue;
      if ((w === "a" || w === "an") && current > 0) continue; // "half a million"
      if (w in SCALE) {
        usedScale = true;
        const sc = SCALE[w];
        if (sc === 100) current = (current || 1) * 100;
        else {
          total += (current || 1) * sc;
          current = 0;
        }
      } else current += SMALL[w];
    }
    const value = total + current;
    if (value <= 0 || !(usedScale || MONEY_AFTER.test(whole.slice(offset + run.length)))) return run;
    return [...original.slice(0, start), String(value), ...original.slice(end)].join(" ");
  });
}

// ---------- typo fixing ----------

// Words worth correcting when misspelt. Short words are left alone so real words aren't changed.
const VOCAB = [
  "received", "receive", "collected", "bought", "purchased", "purchase", "salary", "salaries",
  "transport", "transfer", "transferred", "borrowed", "payment", "customer", "customers", "client",
  "electricity", "groceries", "foodstuff", "foodstuffs", "restocked", "petrol", "diesel", "generator",
  "airtime", "internet", "school", "hospital", "medicine", "pharmacy", "offering", "birthday",
  "wedding", "contribution", "donation", "charity", "repairs", "mechanic", "invoice",
  "supplier", "wholesale", "spent", "spend", "income", "profit", "commission", "transported",
  "tuition", "uniform", "subscription", "recharge", "allowance", "savings", "thrift", "breakfast",
  "dinner", "lunch", "sales", "selling", "credited", "carton", "cartons", "apprentice", "business",
];
const VOCAB_SET = new Set(VOCAB);
// Real words that sit one letter away from a vocabulary word and must not be "corrected".
const LEAVE_ALONE = new Set([
  "patrol", "fought", "sought", "bright", "brought", "things", "school", "lunches", "launch",
  "brunch", "bunch", "punch", "munch", "hunch", "sale", "salt", "spent", "spend", "client",
  "clients", "clean", "income", "intent", "invite", "invited", "deposits", "receipt", "receipts",
  "recipe", "series", "salad", "sails", "seller", "sellers", "custom", "costume", "dinners",
  "diner", "winner", "spending", "patron", "petals", "repair", "despite", "offerings",
]);

function distance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      rowMin = Math.min(rowMin, d[i][j]);
    }
    if (rowMin > max) return max + 1;
  }
  return d[a.length][b.length];
}

const fixCache = new Map<string, string>();

function fixWord(word: string): string {
  if (word.length < 5 || VOCAB_SET.has(word) || LEAVE_ALONE.has(word) || /\d/.test(word)) return word;
  const cached = fixCache.get(word);
  if (cached) return cached;
  let best = word;
  let bestDist = Infinity;
  for (const v of VOCAB) {
    if (v.length < 5) continue;
    const max = v.length >= 9 ? 2 : 1;
    const dist = distance(word, v, max);
    if (dist <= max && dist < bestDist) {
      best = v;
      bestDist = dist;
    }
  }
  fixCache.set(word, best);
  return best;
}

/** Corrects common misspellings of money words ("recieved" → "received", "trasport" → "transport"). */
export function fixSpelling(lower: string): string {
  return lower.replace(/[a-z]+/g, fixWord);
}

// ---------- phrases → plain words ----------

// Order matters: more specific phrases first. Names written around these phrases are kept.
const PHRASES: [RegExp, string | ((...args: string[]) => string)][] = [
  // --- money people owe you (Pidgin and English) ---
  [/\b(?:still\s+)?(?:dey|de|is|are)\s+owe?(?:ing)?\s+me\b/g, "owes me"],
  [/\b(?:never|neva|nevar|no|don't|didn't|did not|has not|hasn't|have not|haven't|yet to)\s+(?:pay|paid|settle|settled|return|returned|refund|refunded)\s+(?:me|my)\b/g, "owes me"],
  [/\b(?:go|will|wan|want to|promised to|promise to)\s+pay\s+me\b/g, "owes me"],
  [/\bowe\s+me\b/g, "owes me"],
  [/\bowes\s+me\b/g, "owes me"],
  [/\b(?:sold|sell|sales?|gave|give|supplied|supply)\b(.*?)\b(?:on|for|with)\s+(?:credit|trust|account|tab|loan)\b/g, "sold on credit $1"],
  [/\bcredit sales?\b/g, "sold on credit"],
  // "Tunde borrow me 5k" (Pidgin: Tunde lent me) → I owe Tunde
  [/^([a-z][a-z'-]*(?:\s+[a-z][a-z'-]*)?)\s+(?:borrow|borrowed|lend|lent|loan|loaned)\s+me\b/g, "i borrowed from $1"],
  [/\bi\s+(?:dey|de|still dey|am|m|'m)\s+owe?(?:ing)?\b/g, "i owe"],
  [/\bi\s+(?:never|neva|haven't|have not|didn't|did not|am yet to|'m yet to|m yet to)\s+(?:pay|paid|settle|settled|return|returned)\b/g, "i owe"],
  [/\bi\s+(?:go|will|wan|need to|must)\s+pay\b/g, "i owe"],
  [/\b(?:i\s+)?(?:collect|collected|took|take|took out|got|get|obtained|secured)\s+(?:a\s+)?loan\b/g, "loan from"],
  [/\bi\s+(?:borrow|borrowed)\s+(?:money\s+)?from\b/g, "i borrowed from"],
  [/\b(?:buy|bought|took|take|collect|collected|carry|carried)\s+(?:goods\s+|market\s+)?(?:on|for|with)\s+(?:credit|trust|loan)\b/g, "bought on credit"],
  // "I borrow Emeka 5k" (Pidgin: I lent Emeka)
  [/\bi\s+(?:borrow|borrowed)\s+(?!from\b|money from\b)/g, "i lent "],
  [/\b(?:lend|lended|loaned|loan(?=\s+(?!from\b)[a-z]+\s+\d))\b/g, "lent"],

  // --- paying back a debt ---
  // "Joy paid me back", "Joy return my money", "Joy cleared her balance", "part payment"
  [/\b(?:pay|pays|paid|payed|pd|return|returns|returned|refund|refunds|refunded|settle|settles|settled|clear|clears|cleared|complete|completed|balance|balanced|repay|repays|repaid)\s+(?:me\s+)?(?:back|my money|the money|his debt|her debt|their debt|the debt|debt|his balance|her balance|their balance|the balance|balance|remaining|the remaining|what (?:she|he|they) owe[sd]?)\b/g, "paid back"],
  [/\b(?:repay|repays|repaid|repayment|payback|pay-back)\b/g, "paid back"],
  [/\b(?:made|make|paid|pay)?\s*(?:a\s+)?(?:part|half|small)[\s-]*payment\b|\binstal+ments?\b/g, " paid back"],
  // "I paid Tunde back 5k" → "i paid back to tunde 5k"
  [/\b(?:paid|pay|payed|return(?:ed)?|refund(?:ed)?|gave|give)\s+([a-z][a-z'-]*(?:\s+[a-z][a-z'-]*)?)\s+back\b/g, "paid back to $1"],

  // --- gifts you received ---
  [/\b(give|gave|giv|dash|dashed|send|sent|bless|blessed|gift|gifted|transfer|transferred|surprise|surprised)\s+me\b/g, (_m: string, v: string) => `${giftInVerb(v)} me`],
  [/\b(?:gift|present)\s+(?:from|by)\b/g, "gift from"],

  // --- money coming in ---
  [/\b(?:customers?|clients?|buyers?)\s+(?:pay|paid|payed|send|sent|transfer(?:red)?)\b/g, "customer paid"],
  [/\b(?:he|she|e|dem|they|him|her|them)\s+pay\s+me\b/g, "paid me"],
  [/\bpay\s+me\b/g, "paid me"],
  [/\bpayed\s+me\b/g, "paid me"],
  [/\b(?:credit\s+alert|alert\s+(?:of|for)|money\s+(?:enter|entered|came in|come in)|(?:enter|entered)\s+(?:my\s+)?(?:account|acct|acc)|came in|come in|paid in|cash in|inflow)\b/g, "received"],
  [/\b(?:got|gotten|gat|collect|collected|collet|recieve|recieved|recived|receieved|receive|recv|rcvd|credited)\b/g, "received"],
  [/\b(?:transfer(?:red)?|trf|tf)\s+from\b/g, "received from"],
  [/\b(?:made|make)\s+(?:a\s+)?payment\b/g, "paid"],
  [/\b(?:i\s+)?(?:made|make|earn|earned|earnt|gained|gain)\b(?!\s+(?:a\s+)?(?:loss|mistake))/g, "earned"],
  [/\b(?:takings|turnover|proceeds|patronage|market\s+sales|day'?s?\s+sales)\b/g, "sales"],
  [/\b(?:sell|sells|selling|sellin|seld|don sell|done sell|sell am|sold am)\b/g, "sold"],
  [/\b(?:pay\s*day|payday|my pay|wages? (?:came|received)|stipend|pension)\b/g, "salary"],

  // --- buying ---
  [/\b(?:buy|buys|buying|buyed|boughted|bougth|bot|purchase|purchsed|purchse|purchased|restock|restocked|stock up|stocked up|stocked|don buy|buy am)\b/g, "bought"],

  // --- spending ---
  [/\b(?:transfer(?:red)?|trf|sent|send)\s+(?:money\s+)?to\s+(?:the\s+|my\s+)?(supplier|vendor|wholesaler|landlord|agent|mechanic|tailor|plumber|electrician|carpenter)\b/g, "paid $1"],
  [/\b(?:transfer(?:red)?|trf)\s+to\b/g, "paid to"],
  [/\b(?:payed|pd|settle|settled|clear|cleared)\b/g, "paid"],
  [/\b(?:spend|spends|spending|spended|spent|use|used|waste|wasted|blew|blow)\b/g, "spent"],

  // --- giving ---
  [/\b(?:give|giv|gived|giving|dash|dashed|bless|blessed|assist|assisted|help|helped|drop|dropped)\b/g, "gave"],
  [/\b(?:donate|donated|contributed to|contribute to)\b/g, "donated"],
];

function giftInVerb(v: string) {
  if (/^(?:send|sent|transfer)/.test(v)) return "sent";
  if (/^(?:bless)/.test(v)) return "blessed";
  if (/^(?:dash)/.test(v)) return "dashed";
  if (/^(?:surprise)/.test(v)) return "surprised";
  return "gave";
}

/** Rewrites a lower-cased line into plain English words the rules understand. */
export function toPlainWords(lower: string): string {
  let t = fixSpelling(lower).replace(/\s+/g, " ").trim();
  for (const [re, rep] of PHRASES) {
    t = typeof rep === "string" ? t.replace(re, rep) : t.replace(re, rep);
  }
  return t.replace(/\s+/g, " ").trim();
}
