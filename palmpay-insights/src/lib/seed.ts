import { categorise, counterpartyOf } from "./categorise";
import type { Txn, Direction } from "./types";

// Realistic demo histories for three personas. Deterministic (seeded) so the demo is repeatable.

export interface Persona {
  id: string;
  name: string;
  tagline: string;
  openingBalance: number;
}

export const PERSONAS: Persona[] = [
  { id: "tunde", name: "Tunde", tagline: "Salary earner, Lagos", openingBalance: 20_000 },
  { id: "aisha", name: "Aisha", tagline: "Market trader, Kano", openingBalance: 60_000 },
  { id: "kemi", name: "Kemi", tagline: "University student, Ibadan", openingBalance: 4_000 },
];

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAYS = 120;

export function seedTransactions(personaId: string, today = new Date()): Txn[] {
  const r = rng(personaId.split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 7919);
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)];
  const between = (lo: number, hi: number, step = 50) => Math.round((lo + r() * (hi - lo)) / step) * step;
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 0, 0);
  const start = new Date(end.getTime() - DAYS * 86_400_000);
  const raw: { date: Date; description: string; amount: number; direction: Direction; fee?: number }[] = [];

  const add = (d: Date, hour: number, description: string, amount: number, direction: Direction, fee?: number) => {
    const date = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, Math.floor(r() * 60));
    if (date > new Date(today.getTime())) return;
    raw.push({ date, description, amount, direction, fee });
  };
  const daysAgo = (d: Date) => Math.floor((end.getTime() - d.getTime()) / 86_400_000);

  for (let i = 0; i <= DAYS; i++) {
    const day = new Date(start.getTime() + i * 86_400_000);
    const dom = day.getDate();
    const dow = day.getDay();
    const recent = daysAgo(day) < today.getDate(); // in the current month

    if (personaId === "tunde") {
      if (dom === 25) add(day, 9, "Salary - BRIGHTPATH TECHNOLOGIES LTD", 420_000, "in");
      if (dom === 1) add(day, 10, "Transfer to ADEBAYO LANDLORD rent", 75_000, "out");
      if (dom === 26) add(day, 8, "Transfer to MUM - FOLAKE OGUNDIPE", 25_000, "out");
      if (dom === 5) add(day, 20, "DSTV Compact subscription", 15_700, "out");
      if (dom === 12) add(day, 21, "Netflix subscription", 4_400, "out");
      if (dom === 18) add(day, 22, "Showmax subscription", 3_500, "out");
      if (dom === 27) add(day, 9, "CashBox auto-save", 20_000, "out");
      if (dom % 9 === 3) add(day, 19, "IKEDC prepaid electricity token", between(8_000, 12_000, 500), "out");
      // data: normally weekly, much heavier this month
      if (dow === 1 || (recent && dow === 4)) add(day, 13, "MTN Data bundle", recent ? 5_000 : 3_500, "out");
      if (r() < 0.25) add(day, 15, "MTN Airtime top-up", pick([500, 1000, 1500]), "out");
      if (dow >= 1 && dow <= 5 && r() < 0.7) add(day, 8, "Bolt ride", between(1_800, 4_500), "out");
      if (r() < 0.45) add(day, 13, pick(["Chicken Republic", "Chowdeck order", "Mama Put Yaba", "KFC Ikeja"]), between(2_500, 7_500), "out");
      if (dow === 6) add(day, 11, "Shoprite Lekki groceries", between(18_000, 38_000), "out");
      // betting creeping up over time
      const betChance = recent ? 0.45 : 0.15;
      if (r() < betChance) add(day, 22, pick(["SportyBet wallet funding", "Bet9ja deposit"]), between(2_000, recent ? 12_000 : 6_000, 500), "out");
      if (r() < 0.12) add(day, 18, "POS withdrawal - OPAY AGENT", between(5_000, 20_000, 1000), "out", 100);
      if (r() < 0.1) add(day, 16, pick(["Transfer to CHIDI EZE", "Transfer to BROTHER - SEUN OGUNDIPE", "Transfer to TOLA ADEYEMI"]), between(5_000, 15_000, 1000), "out");
      if (r() < 0.07) add(day, 14, pick(["Transfer from TOLA ADEYEMI", "Transfer from CHIDI EZE"]), between(3_000, 10_000, 1000), "in");
      if (daysAgo(day) === 3) add(day, 2, "Transfer to OKONKWO GLOBAL VENTURES", 80_000, "out");
      if (dom === 15 && r() < 0.6) add(day, 12, "Jumia order", between(12_000, 30_000, 500), "out");
    }

    if (personaId === "aisha") {
      // customers pay in all day
      const sales = dow === 0 ? 1 : 3 + Math.floor(r() * 5);
      for (let s = 0; s < sales; s++)
        add(day, 8 + Math.floor(r() * 10), `Transfer from ${pick(["MUSA IBRAHIM", "HALIMA BELLO", "SANI USMAN", "FATIMA ALIYU", "YUSUF ABUBAKAR", "ZAINAB GARBA", "UMAR SULE"])}`, between(2_500, 25_000, 500), "in");
      if (dow === 1 || dow === 4) add(day, 7, "Transfer to DANGOTE WHOLESALE stock", between(60_000, 140_000, 5_000), "out");
      if (dow === 3) add(day, 7, "Transfer to ALHAJI BELLO TRADING goods", between(30_000, 70_000, 5_000), "out");
      if (r() < 0.3) add(day, 17, "POS withdrawal - MONIEPOINT AGENT", between(10_000, 40_000, 1000), "out", recent ? 200 : 100);
      if (r() < (recent ? 0.6 : 0.3)) add(day, 17, "POS withdrawal - MONIEPOINT AGENT", between(5_000, 15_000, 1000), "out", recent ? 200 : 100);
      if (dom === 2) add(day, 10, "Transfer to SHOP RENT - KANTIN KWARI", 50_000, "out");
      if (dom === 8) add(day, 10, "FairMoney loan repayment", 45_000, "out");
      if (dom === 10) add(day, 19, "GOtv Max subscription", 8_500, "out");
      if (dom % 10 === 4) add(day, 19, "KAEDCO prepaid electricity", between(6_000, 9_000, 500), "out");
      if (dow === 5) add(day, 12, "Transfer to MAMA - HAUWA ALIYU", 15_000, "out");
      if (r() < 0.5) add(day, 13, pick(["Kantin Kwari foods", "Suya spot", "Sweet Sensation"]), between(1_000, 4_000), "out");
      if (r() < 0.3) add(day, 9, "Airtel Airtime", pick([500, 1000]), "out");
      if (dow === 2) add(day, 9, "Airtel Data bundle", 2_000, "out");
      if (r() < 0.5) add(day, 7, "Keke ride", between(500, 1_500), "out");
      if (dom === 28) add(day, 20, "CashBox savings", recent ? 0 : 30_000, "out");
    }

    if (personaId === "kemi") {
      if (dom === 1) add(day, 9, "Transfer from DADDY - OLUSEGUN ADEWALE allowance", 80_000, "in");
      if (dom === 15 && r() < 0.6) add(day, 11, "Transfer from MUMMY - BOLA ADEWALE", between(10_000, 20_000, 1000), "in");
      if (dow === 1 || dow === 4) add(day, 12, "Glo Data bundle", recent ? 3_000 : 1_500, "out");
      if (dom === 3) add(day, 20, "Spotify Student", 900, "out");
      if (dom === 7) add(day, 20, "Netflix Mobile", 2_200, "out");
      if (dom === 9) add(day, 20, "Apple iCloud storage", 1_500, "out");
      if (r() < 0.6) add(day, 13, pick(["Bukka Hut UI", "Chowdeck order", "Item 7 Go", "Mama Put Agbowo"]), between(1_200, 4_500), "out");
      if (r() < 0.35) add(day, 8, pick(["Keke ride", "Bolt ride"]), between(400, 2_500), "out");
      if (r() < 0.12) add(day, 15, pick(["Jumia order", "Temu order", "Slot phone accessories"]), between(3_000, 15_000, 500), "out");
      if (r() < 0.08) add(day, 17, "POS withdrawal - CAMPUS AGENT", between(2_000, 5_000, 500), "out", 100);
      if (r() < 0.08) add(day, 18, pick(["Transfer to TOBI ADENIYI", "Transfer to AMAKA OBI"]), between(1_000, 5_000, 500), "out");
      if (dom === 2) add(day, 12, "CashBox savings", 5_000, "out");
    }
  }

  raw.sort((a, b) => a.date.getTime() - b.date.getTime());
  // Lift the opening balance just enough that the account never goes negative.
  const persona = PERSONAS.find((p) => p.id === personaId)!;
  const kept = raw.filter((x) => x.amount > 0);
  let run = 0;
  let low = 0;
  for (const x of kept) {
    run += x.direction === "out" ? -(x.amount + (x.fee ?? 0)) : x.amount;
    low = Math.min(low, run);
  }
  let balance = persona.openingBalance - low;
  const txns: Txn[] = kept.map((t, i) => {
    const out = t.direction === "out";
    balance += out ? -(t.amount + (t.fee ?? 0)) : t.amount;
    const local = new Date(t.date.getTime() - t.date.getTimezoneOffset() * 60_000).toISOString().slice(0, 19);
    return {
      id: `${personaId}-${i}`,
      date: local,
      description: t.description,
      amount: t.amount,
      direction: t.direction,
      category: categorise(t.description, t.direction),
      counterparty: counterpartyOf(t.description),
      fee: t.fee,
      balance,
    };
  });
  return txns;
}

export function openingBalance(personaId: string) {
  return PERSONAS.find((p) => p.id === personaId)?.openingBalance ?? 0;
}
