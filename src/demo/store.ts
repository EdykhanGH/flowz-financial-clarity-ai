// Demo data kept in this browser only. Falls back to memory when storage is blocked.

import type { Settings, Summary } from "../lib/api";
import type { Budget, Entry } from "../lib/money";
import { addDays, todayISO } from "../lib/dates";
import { parseLine } from "../lib/parse";

export interface DemoUser {
  id: string;
  email: string;
}

export interface DemoData {
  user: DemoUser | null;
  settings: Settings | null;
  entries: Entry[];
  budgets: Budget[];
  summaries: Record<string, Summary>;
}

const KEY = "flowz-demo-v1";
let memory: DemoData | null = null;

const empty = (): DemoData => ({ user: null, settings: null, entries: [], budgets: [], summaries: {} });

export function load(): DemoData {
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(KEY);
    memory = raw ? (JSON.parse(raw) as DemoData) : empty();
  } catch {
    memory = empty();
  }
  return memory;
}

export function save(data: DemoData) {
  memory = data;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // keep going in memory
  }
}

export function reset() {
  memory = empty();
  try {
    localStorage.removeItem(KEY);
    for (const k of Object.keys(localStorage)) if (k.startsWith("flowz:draft:")) localStorage.removeItem(k);
  } catch {
    // nothing stored
  }
}

// Example pages for the days before today, so every screen has something to show.
const DAYS: string[][] = [
  ["Sold rice and beans 38,500", "Bought 2 cartons of indomie 18,000", "Transport to market 1,500", "Lunch 2,000"],
  ["Sales today 52,000", "Fuel for gen 6,000", "Mama Bisi owes me 4,500", "Joy bought 50k rice on credit"],
  ["Sold 3 bags of garri 27,000", "MTN data 3k", "Gave mum 10k", "Call supplier about sugar price"],
  ["Sales 41,200", "Bought sugar and milk 22,500", "Okada 800", "Lunch 1,800"],
  ["Shop rent 30,000", "Sold 5 crates of eggs at 4,800 each", "Uncle gave me 20k"],
  ["Sales today 47,600", "Paid apprentice 15,000", "Fuel 5,500", "Client paid $120"],
  ["Sold provisions 33,900", "Light bill 7,000", "I owe Tunde 12,000", "Suya 1,500"],
  ["Sales 58,300", "Bought 3 bags of rice 135,000", "Transport 2,000"],
  ["Sold oil and tomatoes 29,400", "Tithe 5,000", "Lunch 2,500", "Chioma owes me 6,000", "Joy paid back 30k for rice"],
  ["Sales today 44,100", "Bought detergent stock 16,800", "Keke 600", "Netflix 15 dollars"],
];

export function seedEntries(userId: string, currency: Settings["default_currency"]): Entry[] {
  const today = todayISO();
  const out: Entry[] = [];
  // About five weeks of history, so this month can be compared with last month.
  for (let back = 1; back <= 36; back++) {
    if (back % 6 === 0) continue; // a few days off, like real life
    const date = addDays(today, -back);
    const lines = DAYS[back % DAYS.length];
    lines.forEach((text, position) => {
      const p = parseLine(text, currency);
      out.push({
        id: crypto.randomUUID(),
        user_id: userId,
        entry_date: date,
        position,
        text,
        amount: p.amount,
        currency: p.currency,
        kind: p.kind,
        category: p.category,
        person: p.person,
        kind_locked: false,
        settled_at: null,
        created_at: `${date}T18:00:00.000Z`,
        updated_at: `${date}T18:00:00.000Z`,
      });
    });
  }
  return out;
}

export function seedBudgets(currency: Settings["default_currency"]): Budget[] {
  const scale = currency === "USD" ? 0.01 : 1;
  return [
    { id: crypto.randomUUID(), category: "food", amount: 20_000 * scale, currency },
    { id: crypto.randomUUID(), category: "transport", amount: 12_000 * scale, currency },
    { id: crypto.randomUUID(), category: "fuel", amount: 25_000 * scale, currency },
  ];
}
