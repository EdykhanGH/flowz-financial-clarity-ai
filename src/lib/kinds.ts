// What a line in the notebook means. Kept deliberately small so anyone can understand it.

export type Kind =
  | "sale" // money coming in from selling or earning
  | "gift_in" // money someone gave you
  | "purchase" // goods or stock you bought
  | "expense" // everyday spending and bills
  | "gift_out" // money you gave someone
  | "owed_to_me" // someone owes you
  | "i_owe" // you owe someone
  | "note"; // just a note, no money

export type Mode = "personal" | "business";

export type Flow = "in" | "out" | "debt" | "none";

interface KindInfo {
  label: Record<Mode, string>;
  emoji: string;
  flow: Flow;
  chip: string; // tailwind classes for the tag
}

export const KINDS: Record<Kind, KindInfo> = {
  sale: {
    label: { business: "Sale", personal: "Income" },
    emoji: "💰",
    flow: "in",
    chip: "bg-brand-soft text-brand-dark",
  },
  gift_in: {
    label: { business: "Gift received", personal: "Gift received" },
    emoji: "🎁",
    flow: "in",
    chip: "bg-brand-soft text-brand-dark",
  },
  purchase: {
    label: { business: "Purchase", personal: "Purchase" },
    emoji: "🛒",
    flow: "out",
    chip: "bg-sky-soft text-sky",
  },
  expense: {
    label: { business: "Expense", personal: "Expense" },
    emoji: "💸",
    flow: "out",
    chip: "bg-coral-soft text-coral",
  },
  gift_out: {
    label: { business: "Gift given", personal: "Gift given" },
    emoji: "🤝",
    flow: "out",
    chip: "bg-plum-soft text-plum",
  },
  owed_to_me: {
    label: { business: "Owes me", personal: "Owes me" },
    emoji: "📥",
    flow: "debt",
    chip: "bg-sun-soft text-amber-700",
  },
  i_owe: {
    label: { business: "I owe", personal: "I owe" },
    emoji: "📤",
    flow: "debt",
    chip: "bg-sun-soft text-amber-700",
  },
  note: {
    label: { business: "Note", personal: "Note" },
    emoji: "📝",
    flow: "none",
    chip: "bg-line/60 text-muted",
  },
};

export const KIND_ORDER: Kind[] = [
  "sale",
  "purchase",
  "expense",
  "gift_in",
  "gift_out",
  "owed_to_me",
  "i_owe",
  "note",
];

export function kindLabel(kind: Kind, mode: Mode) {
  return KINDS[kind].label[mode];
}

// Spending categories. Used to group spending and for budgets.
export interface Category {
  id: string;
  label: string;
  emoji: string;
  words: string[];
}

export const CATEGORIES: Category[] = [
  { id: "stock", label: "Stock & goods", emoji: "📦", words: ["stock", "goods", "restock", "supplier", "wholesale", "carton", "cartons", "bag", "bags", "crate", "crates", "bale", "bales", "materials"] },
  { id: "food", label: "Food", emoji: "🍲", words: ["food", "foodstuff", "foodstuffs", "lunch", "breakfast", "dinner", "chop", "snack", "snacks", "groceries", "grocery", "eat", "ate", "meal", "suya", "drinks"] },
  { id: "transport", label: "Transport", emoji: "🚌", words: ["transport", "bus", "taxi", "okada", "keke", "uber", "bolt", "fare", "ride", "danfo", "flight", "ticket"] },
  { id: "fuel", label: "Fuel & gas", emoji: "⛽", words: ["fuel", "petrol", "diesel", "gas", "kerosene", "generator", "gen"] },
  { id: "rent", label: "Rent", emoji: "🏠", words: ["rent", "shop rent", "house rent", "lease"] },
  { id: "bills", label: "Bills", emoji: "💡", words: ["light", "nepa", "phcn", "electricity", "water bill", "dstv", "gotv", "bill", "bills", "subscription", "netflix", "levy", "tax", "union"] },
  { id: "airtime", label: "Airtime & data", emoji: "📱", words: ["airtime", "recharge", "data", "card", "mtn", "glo", "airtel", "9mobile", "wifi", "internet"] },
  { id: "wages", label: "Staff & wages", emoji: "👷", words: ["salary", "salaries", "wage", "wages", "staff", "worker", "workers", "apprentice", "labour", "labor", "boy", "girl"] },
  { id: "health", label: "Health", emoji: "💊", words: ["drug", "drugs", "medicine", "hospital", "clinic", "pharmacy", "doctor", "health"] },
  { id: "school", label: "School", emoji: "🎒", words: ["school", "fees", "fee", "books", "uniform", "lesson", "tuition"] },
  { id: "family", label: "Family", emoji: "👨‍👩‍👧", words: ["mum", "mom", "mother", "dad", "father", "wife", "husband", "kids", "children", "son", "daughter", "brother", "sister", "aunty", "uncle", "family", "baby"] },
  { id: "giving", label: "Church & giving", emoji: "🙏", words: ["church", "mosque", "tithe", "offering", "donation", "charity", "zakat", "seed"] },
  { id: "repairs", label: "Repairs", emoji: "🔧", words: ["repair", "repairs", "fix", "fixed", "mechanic", "service", "servicing", "maintenance", "vulcanizer"] },
  { id: "personal", label: "Personal care", emoji: "💇", words: ["hair", "barber", "salon", "clothes", "shoe", "shoes", "cloth", "tailor", "makeup", "soap"] },
  { id: "other", label: "Other", emoji: "🧾", words: [] },
];

export const CATEGORY_BY_ID: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
);

export function categoryLabel(id: string | null | undefined) {
  return CATEGORY_BY_ID[id ?? "other"]?.label ?? "Other";
}
