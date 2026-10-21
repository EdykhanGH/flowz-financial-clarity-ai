export type Direction = "in" | "out";

export type Category =
  | "Income"
  | "Transfers received"
  | "Food & Groceries"
  | "Transport"
  | "Airtime & Data"
  | "Bills & Utilities"
  | "Subscriptions"
  | "Betting"
  | "Family & Friends"
  | "Business & Suppliers"
  | "Shopping"
  | "Cash Withdrawal"
  | "Savings"
  | "Loan Repayment"
  | "Rent"
  | "Fees & Charges"
  | "Other";

export interface Txn {
  id: string;
  /** ISO date-time, e.g. 2026-10-21T14:05:00 */
  date: string;
  description: string;
  amount: number; // always positive
  direction: Direction;
  category: Category;
  /** Person or merchant on the other side, normalised. */
  counterparty: string;
  fee?: number;
  balance?: number;
}

export type Severity = "alert" | "warn" | "tip" | "good";

export interface Insight {
  id: string;
  severity: Severity;
  icon: string; // lucide icon name key used by the UI
  title: string;
  body: string;
  action?: string;
}
