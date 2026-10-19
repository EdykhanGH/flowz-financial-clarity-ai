// What a line in the notebook means. Kept deliberately small so anyone can understand it.

export type Kind =
  | "sale" // money coming in from selling or earning
  | "gift_in" // money someone gave you
  | "purchase" // goods or stock you bought
  | "expense" // everyday spending and bills
  | "gift_out" // money you gave someone
  | "owed_to_me" // someone owes you
  | "i_owe" // you owe someone
  | "repaid_to_me" // someone paid back money they owed you (money in, lowers their balance)
  | "i_repaid" // you paid back money you owed (money out, lowers your balance)
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
  repaid_to_me: {
    label: { business: "Paid back", personal: "Paid back" },
    emoji: "💵",
    flow: "in",
    chip: "bg-brand-soft text-brand-dark",
  },
  i_repaid: {
    label: { business: "I paid back", personal: "I paid back" },
    emoji: "↩️",
    flow: "out",
    chip: "bg-sky-soft text-sky",
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
  "repaid_to_me",
  "i_owe",
  "i_repaid",
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
  { id: "stock", label: "Stock & goods", emoji: "📦", words: ["stock", "goods", "restock", "supplier", "wholesale", "wholesaler", "carton", "cartons", "bag", "bags", "crate", "crates", "bale", "bales", "materials", "inventory", "merchandise", "market goods", "raw materials", "packaging", "nylon", "nylons"] },
  { id: "food", label: "Food", emoji: "🍲", words: ["food", "foodstuff", "foodstuffs", "lunch", "breakfast", "dinner", "supper", "chop", "chow", "snack", "snacks", "groceries", "grocery", "eat", "ate", "eating", "meal", "meals", "suya", "drinks", "drink", "takeaway", "takeout", "restaurant", "canteen", "buka", "mama put", "amala", "shawarma", "pizza", "chicken", "kfc", "chicken republic", "coffee", "tea", "water sachet", "pure water"] },
  { id: "transport", label: "Transport", emoji: "🚌", words: ["transport", "transportation", "t-fare", "tfare", "transport fare", "bus", "taxi", "cab", "okada", "keke", "napep", "uber", "bolt", "taxify", "indrive", "fare", "fares", "ride", "danfo", "molue", "brt", "train", "flight", "ticket", "toll", "parking", "bike", "subway", "metro", "tube"] },
  { id: "fuel", label: "Fuel & gas", emoji: "⛽", words: ["fuel", "petrol", "pms", "diesel", "gas", "gasoline", "cooking gas", "kerosene", "kero", "generator", "gen", "filling station", "fuel station", "gas station"] },
  { id: "rent", label: "Rent", emoji: "🏠", words: ["rent", "shop rent", "house rent", "lease", "agent fee", "agency fee", "caution fee", "landlord", "mortgage", "accommodation", "hostel"] },
  { id: "bills", label: "Bills", emoji: "💡", words: ["light", "nepa", "phcn", "electricity", "prepaid", "meter", "token", "water bill", "waste", "lawma", "dstv", "gotv", "startimes", "showmax", "netflix", "spotify", "youtube", "subscription", "bill", "bills", "levy", "tax", "taxes", "union", "dues", "bank charges", "sms charges", "insurance", "utility", "utilities", "power"] },
  { id: "airtime", label: "Airtime & data", emoji: "📱", words: ["airtime", "recharge", "recharge card", "card", "data", "data sub", "sub", "mtn", "glo", "airtel", "9mobile", "etisalat", "wifi", "internet", "bundle", "mifi", "router", "phone credit", "top up", "topup", "call credit"] },
  { id: "wages", label: "Staff & wages", emoji: "👷", words: ["salary", "salaries", "wage", "wages", "staff", "worker", "workers", "apprentice", "labour", "labor", "labourer", "laborer", "boy", "girl", "cleaner", "driver", "gateman", "nanny", "security", "payroll", "employee", "employees", "sales girl", "sales boy"] },
  { id: "health", label: "Health", emoji: "💊", words: ["drug", "drugs", "medicine", "medication", "hospital", "clinic", "pharmacy", "chemist", "doctor", "health", "malaria", "test", "lab", "scan", "dentist", "nhis", "hmo", "prescription"] },
  { id: "school", label: "School", emoji: "🎒", words: ["school", "fees", "fee", "books", "textbook", "uniform", "lesson", "lessons", "tuition", "exam", "jamb", "waec", "neco", "course", "class", "training"] },
  { id: "family", label: "Family", emoji: "👨‍👩‍👧", words: ["mum", "mom", "mummy", "mommy", "mother", "mama", "dad", "daddy", "father", "papa", "wife", "husband", "kids", "children", "child", "pikin", "pikins", "son", "daughter", "brother", "sister", "bro", "sis", "aunty", "auntie", "aunt", "uncle", "family", "baby", "in-law", "inlaw", "in-laws", "cousin", "nephew", "niece", "grandma", "grandpa", "village", "hometown", "my people"] },
  { id: "giving", label: "Church & giving", emoji: "🙏", words: ["church", "mosque", "tithe", "offering", "donation", "charity", "zakat", "sadaqah", "seed", "thanksgiving", "harvest", "building fund", "welfare", "alms"] },
  { id: "events", label: "Parties & events", emoji: "🎉", words: ["wedding", "burial", "funeral", "naming", "naming ceremony", "birthday", "party", "owambe", "aso ebi", "asoebi", "aso-ebi", "ceremony", "christening", "dedication", "send forth", "send-off", "anniversary", "outing", "hangout", "club", "cinema", "movie"] },
  { id: "savings", label: "Savings & ajo", emoji: "🐷", words: ["ajo", "esusu", "adashe", "thrift", "contribution", "savings", "saving", "saved", "save", "piggyvest", "cowrywise", "investment", "invest", "invested", "fixed deposit", "susu"] },
  { id: "repairs", label: "Repairs", emoji: "🔧", words: ["repair", "repairs", "fix", "fixed", "fixing", "mechanic", "service", "servicing", "maintenance", "vulcanizer", "vulcaniser", "plumber", "electrician", "carpenter", "welder", "panel beater", "spare parts", "spare part", "tyre", "tire", "battery"] },
  { id: "personal", label: "Personal care", emoji: "💇", words: ["hair", "barber", "barbing", "salon", "braids", "wig", "nails", "clothes", "cloth", "clothing", "dress", "shoe", "shoes", "sneakers", "handbag", "tailor", "makeup", "make-up", "cream", "lotion", "perfume", "soap", "laundry", "dry cleaning", "dry cleaner", "gym", "toiletries"] },
  { id: "other", label: "Other", emoji: "🧾", words: [] },
];

export const CATEGORY_BY_ID: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
);

export function categoryLabel(id: string | null | undefined) {
  return CATEGORY_BY_ID[id ?? "other"]?.label ?? "Other";
}

/** Kinds that belong to the debt book. */
export const DEBT_KINDS: Kind[] = ["owed_to_me", "repaid_to_me", "i_owe", "i_repaid"];
