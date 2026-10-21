import type { Txn } from "./types";

// Tools Claude calls while answering "Ask PalmPay" questions. All maths happens here, on the user's own rows.

export const CATEGORIES = [
  "Income", "Transfers received", "Food & Groceries", "Transport", "Airtime & Data", "Bills & Utilities", "Subscriptions",
  "Betting", "Family & Friends", "Business & Suppliers", "Shopping", "Cash Withdrawal", "Savings", "Loan Repayment", "Rent",
  "Fees & Charges", "Other",
];

const filterProps = {
  from: { type: "string", description: "Start date YYYY-MM-DD (inclusive)" },
  to: { type: "string", description: "End date YYYY-MM-DD (inclusive)" },
  direction: { type: "string", enum: ["in", "out"], description: "in = money received, out = money spent/sent" },
  category: { type: "string", enum: CATEGORIES },
  search: { type: "string", description: "Case-insensitive text to match in the description or person/merchant name" },
};

export const TOOLS = [
  {
    name: "sum_transactions",
    description: "Total amount and count of transactions matching filters. Use for 'how much did I spend on X', 'how much did I send to Y'.",
    input_schema: { type: "object", properties: filterProps },
  },
  {
    name: "list_transactions",
    description: "List matching transactions (newest first). Use to show examples or find specific payments.",
    input_schema: { type: "object", properties: { ...filterProps, limit: { type: "integer", description: "Max rows, default 15" } } },
  },
  {
    name: "breakdown",
    description: "Totals grouped by category, counterparty (person/merchant), month or weekday for matching transactions.",
    input_schema: {
      type: "object",
      properties: { ...filterProps, by: { type: "string", enum: ["category", "counterparty", "month", "weekday"] } },
      required: ["by"],
    },
  },
];

export interface Filters {
  from?: string;
  to?: string;
  direction?: "in" | "out";
  category?: string;
  search?: string;
}

export function applyFilters(txns: Txn[], f: Filters) {
  const q = f.search?.toLowerCase();
  return txns.filter(
    (x) =>
      (!f.from || x.date.slice(0, 10) >= f.from) &&
      (!f.to || x.date.slice(0, 10) <= f.to) &&
      (!f.direction || x.direction === f.direction) &&
      (!f.category || x.category === f.category) &&
      (!q || x.description.toLowerCase().includes(q) || x.counterparty.toLowerCase().includes(q)),
  );
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function runTool(name: string, input: Record<string, unknown>, txns: Txn[]): unknown {
  const rows = applyFilters(txns, input as Filters);
  if (name === "sum_transactions") {
    const total = rows.reduce((s, x) => s + x.amount, 0);
    const fees = rows.reduce((s, x) => s + (x.fee ?? 0), 0);
    return { total, fees, count: rows.length, first: rows[0]?.date.slice(0, 10) ?? null, last: rows[rows.length - 1]?.date.slice(0, 10) ?? null };
  }
  if (name === "list_transactions") {
    const limit = Math.min(Number(input.limit ?? 15), 50);
    return rows
      .slice(-limit)
      .reverse()
      .map((x) => ({ date: x.date.slice(0, 16), description: x.description, amount: x.amount, direction: x.direction, category: x.category }));
  }
  if (name === "breakdown") {
    const by = String(input.by);
    const m = new Map<string, { total: number; count: number }>();
    for (const x of rows) {
      const k =
        by === "category" ? x.category : by === "month" ? x.date.slice(0, 7) : by === "weekday" ? WEEKDAYS[new Date(x.date).getDay()] : x.counterparty;
      const v = m.get(k) ?? { total: 0, count: 0 };
      v.total += x.amount;
      v.count++;
      m.set(k, v);
    }
    return [...m.entries()].map(([key, v]) => ({ key, ...v })).sort((a, b) => b.total - a.total).slice(0, 20);
  }
  return { error: `Unknown tool ${name}` };
}
