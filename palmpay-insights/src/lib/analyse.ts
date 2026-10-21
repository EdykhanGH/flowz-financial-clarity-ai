import { monthKey, naira, nairaShort, pct } from "./format";
import type { Category, Insight, Txn } from "./types";

// All the maths lives here, in plain code, so every number shown (and every number the AI repeats) is exact.

const DAY = 86_400_000;
const SPEND_EXCLUDE = new Set<Category>(["Savings"]);

export interface Recurring {
  counterparty: string;
  category: Category;
  amount: number;
  everyDays: number;
  count: number;
  nextDate: string;
}

export interface Facts {
  asOf: string;
  balance: number;
  month: string;
  monthDay: number;
  daysInMonth: number;
  thisMonth: { income: number; spend: number; saved: number; fees: number };
  lastMonthSameDay: { income: number; spend: number };
  last30: { income: number; spend: number; betting: number; fees: number; posCount: number };
  byCategory: { category: Category; amount: number; usual: number }[];
  topRecipients: { name: string; amount: number; count: number }[];
  recurring: Recurring[];
  unusual: Txn[];
  dailyBurn: number;
  runOutDate: string | null;
  nextIncomeDate: string | null;
  savingsRate: number;
  score: number;
  scoreParts: { label: string; points: number; max: number }[];
  monthly: { month: string; income: number; spend: number }[];
}

const t = (x: Txn) => new Date(x.date).getTime();
const spendOf = (xs: Txn[]) =>
  xs.filter((x) => x.direction === "out" && !SPEND_EXCLUDE.has(x.category)).reduce((s, x) => s + x.amount + (x.fee ?? 0), 0);
const incomeOf = (xs: Txn[]) => xs.filter((x) => x.direction === "in").reduce((s, x) => s + x.amount, 0);
const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

export function findRecurring(txns: Txn[], now: number): Recurring[] {
  const groups = new Map<string, Txn[]>();
  for (const x of txns) {
    if (x.direction !== "out" || x.category === "Cash Withdrawal" || x.category === "Food & Groceries" || x.category === "Transport") continue;
    const key = x.counterparty.toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), x]);
  }
  const out: Recurring[] = [];
  for (const xs of groups.values()) {
    if (xs.length < 3) continue;
    const gaps = xs.slice(1).map((x, i) => (t(x) - t(xs[i])) / DAY);
    const gap = median(gaps);
    const amt = median(xs.map((x) => x.amount));
    const steady = xs.filter((x) => Math.abs(x.amount - amt) <= amt * 0.15).length >= xs.length * 0.7;
    const regular = gaps.filter((g) => Math.abs(g - gap) <= Math.max(3, gap * 0.2)).length >= gaps.length * 0.6;
    if (!steady || !regular || gap < 5) continue;
    const last = xs[xs.length - 1];
    if (now - t(last) > gap * 1.6 * DAY) continue; // stopped
    out.push({
      counterparty: last.counterparty,
      category: last.category,
      amount: amt,
      everyDays: Math.round(gap),
      count: xs.length,
      nextDate: new Date(t(last) + gap * DAY).toISOString().slice(0, 10),
    });
  }
  return out.sort((a, b) => (b.amount * 30) / b.everyDays - (a.amount * 30) / a.everyDays);
}

export function computeFacts(txns: Txn[], openingBalance = 0): Facts {
  const sorted = [...txns].sort((a, b) => t(a) - t(b));
  const last = sorted[sorted.length - 1];
  const now = last ? t(last) : Date.now();
  const asOfD = new Date(now);
  const month = monthKey(last?.date ?? new Date().toISOString());
  const monthDay = asOfD.getDate();
  const daysInMonth = new Date(asOfD.getFullYear(), asOfD.getMonth() + 1, 0).getDate();

  const balance =
    last?.balance ?? openingBalance + incomeOf(sorted) - sorted.filter((x) => x.direction === "out").reduce((s, x) => s + x.amount + (x.fee ?? 0), 0);

  const thisM = sorted.filter((x) => monthKey(x.date) === month);
  const prevDate = new Date(asOfD.getFullYear(), asOfD.getMonth() - 1, 1);
  const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const prevSame = sorted.filter((x) => monthKey(x.date) === prevKey && new Date(x.date).getDate() <= monthDay);

  const last30 = sorted.filter((x) => now - t(x) <= 30 * DAY);
  const last30Income = incomeOf(last30);

  // Category spend this month vs the usual for the same part of the month in earlier months.
  const earlierMonths = [...new Set(sorted.map((x) => monthKey(x.date)))].filter((m) => m < month);
  const fullEarlier = earlierMonths.filter((m) => sorted.some((x) => monthKey(x.date) === m && new Date(x.date).getDate() <= 3));
  const cats = new Map<Category, { amount: number; usual: number }>();
  for (const x of thisM)
    if (x.direction === "out") {
      const c = cats.get(x.category) ?? { amount: 0, usual: 0 };
      c.amount += x.amount + (x.fee && x.category !== "Cash Withdrawal" ? x.fee : 0);
      cats.set(x.category, c);
    }
  if (fullEarlier.length)
    for (const m of fullEarlier)
      for (const x of sorted)
        if (x.direction === "out" && monthKey(x.date) === m && new Date(x.date).getDate() <= monthDay) {
          const c = cats.get(x.category) ?? { amount: 0, usual: 0 };
          c.usual += x.amount / fullEarlier.length;
          cats.set(x.category, c);
        }
  const byCategory = [...cats.entries()]
    .map(([category, v]) => ({ category, amount: Math.round(v.amount), usual: Math.round(v.usual) }))
    .sort((a, b) => b.amount - a.amount);

  const recip = new Map<string, { amount: number; count: number }>();
  for (const x of last30)
    if (x.direction === "out" && /transfer/i.test(x.description)) {
      const r = recip.get(x.counterparty) ?? { amount: 0, count: 0 };
      r.amount += x.amount;
      r.count++;
      recip.set(x.counterparty, r);
    }
  const topRecipients = [...recip.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.amount - a.amount).slice(0, 5);

  // Unusual: big payment to someone never paid before, or a big one at night.
  const outs = sorted.filter((x) => x.direction === "out");
  const med = median(outs.map((x) => x.amount));
  const unusual: Txn[] = [];
  const seen = new Set<string>();
  for (const x of outs) {
    const key = x.counterparty.toLowerCase();
    const hour = new Date(x.date).getHours();
    const recent = now - t(x) <= 14 * DAY;
    if (recent && x.amount >= Math.max(30_000, med * 5) && (!seen.has(key) || hour < 5)) unusual.push(x);
    seen.add(key);
  }

  const recurring = findRecurring(sorted, now);

  // Burn rate & run-out forecast, using the last 30 days of spending.
  const dailyBurn = spendOf(last30) / 30;
  const incomeTx = sorted.filter((x) => x.category === "Income");
  let nextIncomeDate: string | null = null;
  if (incomeTx.length >= 2) {
    const gaps = incomeTx.slice(1).map((x, i) => (t(x) - t(incomeTx[i])) / DAY);
    const nxt = t(incomeTx[incomeTx.length - 1]) + median(gaps) * DAY;
    if (nxt > now) nextIncomeDate = new Date(nxt).toISOString().slice(0, 10);
  }
  const runOutDate = dailyBurn > 0 ? new Date(now + (balance / dailyBurn) * DAY).toISOString().slice(0, 10) : null;

  const thisIncome = incomeOf(thisM);
  const thisSaved = thisM.filter((x) => x.category === "Savings" && x.direction === "out").reduce((s, x) => s + x.amount, 0);
  const savingsRate = last30Income > 0 ? last30.filter((x) => x.category === "Savings").reduce((s, x) => s + x.amount, 0) / last30Income : 0;
  const betting = last30.filter((x) => x.category === "Betting").reduce((s, x) => s + x.amount, 0);
  const fees30 = last30.reduce((s, x) => s + (x.fee ?? 0), 0) + last30.filter((x) => x.category === "Fees & Charges").reduce((s, x) => s + x.amount, 0);
  const posCount = last30.filter((x) => x.category === "Cash Withdrawal").length;
  const spend30 = spendOf(last30);

  // Money health score out of 100.
  const scoreParts = [
    { label: "Spending below income", max: 35, points: last30Income ? Math.round(35 * Math.max(0, Math.min(1, (last30Income - spend30) / (last30Income * 0.3) + 0.5))) : 10 },
    { label: "Saving regularly", max: 25, points: Math.round(25 * Math.min(1, savingsRate / 0.1)) },
    { label: "Low betting", max: 20, points: last30Income ? Math.round(20 * Math.max(0, 1 - betting / last30Income / 0.1)) : 20 },
    { label: "Low fees", max: 10, points: Math.round(10 * Math.max(0, 1 - fees30 / 5000)) },
    { label: "Cash cushion", max: 10, points: Math.round(10 * Math.min(1, dailyBurn ? balance / dailyBurn / 14 : 1)) },
  ];
  const score = scoreParts.reduce((s, p) => s + p.points, 0);

  const monthsAll = [...new Set(sorted.map((x) => monthKey(x.date)))];
  const monthly = monthsAll.map((m) => {
    const xs = sorted.filter((x) => monthKey(x.date) === m);
    return { month: m, income: incomeOf(xs), spend: spendOf(xs) };
  });

  return {
    asOf: last?.date ?? new Date().toISOString(),
    balance,
    month,
    monthDay,
    daysInMonth,
    thisMonth: { income: thisIncome, spend: spendOf(thisM), saved: thisSaved, fees: thisM.reduce((s, x) => s + (x.fee ?? 0), 0) },
    lastMonthSameDay: { income: incomeOf(prevSame), spend: spendOf(prevSame) },
    last30: { income: last30Income, spend: spend30, betting, fees: fees30, posCount },
    byCategory,
    topRecipients,
    recurring,
    unusual,
    dailyBurn,
    runOutDate,
    nextIncomeDate,
    savingsRate,
    score,
    scoreParts,
    monthly,
  };
}

/** Monthly cost of a recurring payment (monthly bills count once). */
export const perMonth = (r: Recurring) => (r.everyDays >= 25 && r.everyDays <= 35 ? r.amount : (r.amount * 30) / r.everyDays);

const fmtDay = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("en-NG", { day: "numeric", month: "short" });

/** Turns facts into ranked insight cards (rule-based, instant, works offline). */
export function buildInsights(f: Facts): Insight[] {
  const out: Insight[] = [];

  for (const u of f.unusual.slice(0, 2)) {
    const h = new Date(u.date);
    out.push({
      id: "unusual-" + u.id,
      severity: "alert",
      icon: "shield",
      title: `Unusual: ${naira(u.amount)} to ${u.counterparty}`,
      body: `Sent ${h.toLocaleDateString("en-NG", { day: "numeric", month: "short" })} at ${h.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}. ${
        h.getHours() < 5 ? "It happened in the middle of the night and " : ""
      }you've never paid this account before.`,
      action: "Wasn't you? Freeze your account and report it",
    });
  }

  if (f.runOutDate && f.nextIncomeDate && f.runOutDate < f.nextIncomeDate) {
    const gap = Math.round((new Date(f.nextIncomeDate).getTime() - new Date(f.runOutDate).getTime()) / DAY);
    out.push({
      id: "runout",
      severity: "alert",
      icon: "hourglass",
      title: `At this pace you'll run out around ${fmtDay(f.runOutDate)}`,
      body: `You're spending about ${naira(f.dailyBurn)} a day and have ${naira(f.balance)} left. That's ${gap} day${gap === 1 ? "" : "s"} before your next income (around ${fmtDay(f.nextIncomeDate)}).`,
      action: `Keep daily spending under ${naira(f.balance / Math.max(1, (new Date(f.nextIncomeDate).getTime() - new Date(f.asOf).getTime()) / DAY))}`,
    });
  }

  const spikes = f.byCategory
    .filter((c) => c.usual > 0 && c.amount >= c.usual * 1.4 && c.amount - c.usual >= 4000 && c.category !== "Savings")
    .sort((a, b) => b.amount - b.usual - (a.amount - a.usual));
  for (const s of spikes.slice(0, 2))
    out.push({
      id: "spike-" + s.category,
      severity: "warn",
      icon: "trending",
      title: `${s.category} is up ${(s.amount / s.usual).toFixed(1)}× this month`,
      body: `${naira(s.amount)} so far in ${new Date(f.month + "-01").toLocaleString("en-NG", { month: "long" })}, against your usual ${naira(s.usual)} by day ${f.monthDay}. That's ${naira(s.amount - s.usual)} extra.`,
      action: s.category === "Airtime & Data" ? "Switch to a monthly data plan, it's usually cheaper than weekly bundles" : `Set a ${nairaShort(s.usual)} limit for ${s.category}`,
    });

  if (f.last30.betting > 0) {
    const share = f.last30.income ? f.last30.betting / f.last30.income : 0;
    out.push({
      id: "betting",
      severity: share >= 0.08 ? "alert" : "warn",
      icon: "dice",
      title: `${naira(f.last30.betting)} on betting in 30 days`,
      body: f.last30.income ? `That's ${pct(share)} of the money that came in. Over a year that's about ${nairaShort(f.last30.betting * 12)}.` : `Over a year that's about ${nairaShort(f.last30.betting * 12)}.`,
      action: "Set a weekly betting limit",
    });
  }

  const subs = f.recurring.filter((r) => r.category === "Subscriptions");
  if (subs.length) {
    const monthly = subs.reduce((s, r) => s + perMonth(r), 0);
    out.push({
      id: "subs",
      severity: "tip",
      icon: "repeat",
      title: `${subs.length} subscription${subs.length > 1 ? "s" : ""} cost you ${naira(monthly)} a month`,
      body: subs.map((s) => `${s.counterparty} ${naira(s.amount)}`).join(" · ") + `. That's ${nairaShort(monthly * 12)} a year. Still using all of them?`,
      action: "Review subscriptions",
    });
  }

  if (f.last30.fees >= 1000) {
    const saved = Math.max(0, f.last30.fees - 200);
    out.push({
      id: "fees",
      severity: "tip",
      icon: "receipt",
      title: `${naira(f.last30.fees)} lost to fees in 30 days`,
      body: `${f.last30.posCount} POS cash withdrawals. Paying with PalmPay transfer or QR instead of cash, or withdrawing once a week, would save around ${naira(saved)}.`,
      action: "Pay with PalmPay QR",
    });
  }

  if (f.topRecipients.length >= 2) {
    const total = f.topRecipients.reduce((s, r) => s + r.amount, 0);
    const top = f.topRecipients.slice(0, 3);
    out.push({
      id: "people",
      severity: "tip",
      icon: "users",
      title: `Where your transfers went`,
      body: top.map((r) => `${r.name}: ${naira(r.amount)}`).join(" · ") + ` (${pct(top.reduce((s, r) => s + r.amount, 0) / total)} of ${naira(total)} sent in 30 days).`,
    });
  }

  if (f.savingsRate < 0.1 && f.last30.income > 0) {
    const target = Math.round((f.last30.income * 0.1) / 1000) * 1000;
    out.push({
      id: "save",
      severity: "tip",
      icon: "piggy",
      title: f.savingsRate === 0 ? "You saved nothing in the last 30 days" : `You saved ${pct(f.savingsRate)} of your income`,
      body: `Moving ${naira(target)} (10% of what came in) into CashBox would earn daily interest and still be there when you need it.`,
      action: `Auto-save ${nairaShort(target)} to CashBox`,
    });
  } else if (f.savingsRate >= 0.1) {
    out.push({
      id: "save-good",
      severity: "good",
      icon: "piggy",
      title: `Nice one! You saved ${pct(f.savingsRate)} of your income`,
      body: `Keep the auto-save going. At this rate you'll add about ${nairaShort(f.last30.income * f.savingsRate * 12)} to savings this year.`,
    });
  }

  if (f.lastMonthSameDay.spend > 0) {
    const diff = f.thisMonth.spend - f.lastMonthSameDay.spend;
    if (diff < -3000)
      out.push({
        id: "less",
        severity: "good",
        icon: "check",
        title: `You've spent ${naira(-diff)} less than last month`,
        body: `${naira(f.thisMonth.spend)} by day ${f.monthDay}, against ${naira(f.lastMonthSameDay.spend)} at this point last month.`,
      });
  }

  const rank = { alert: 0, warn: 1, tip: 2, good: 3 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

/** A compact fact sheet for the AI. Numbers are already exact; the AI only words them. */
export function factSheet(f: Facts, insights: Insight[]) {
  return {
    as_of: f.asOf.slice(0, 10),
    balance: Math.round(f.balance),
    this_month: { ...f.thisMonth, day: f.monthDay, days_in_month: f.daysInMonth },
    last_month_same_point: f.lastMonthSameDay,
    last_30_days: f.last30,
    spending_by_category_this_month: f.byCategory.slice(0, 8),
    top_transfer_recipients_30d: f.topRecipients,
    recurring_payments: f.recurring.map((r) => ({ name: r.counterparty, amount: r.amount, every_days: r.everyDays })),
    daily_burn: Math.round(f.dailyBurn),
    projected_run_out: f.runOutDate,
    next_income_expected: f.nextIncomeDate,
    money_health_score: f.score,
    detected_insights: insights.map((i) => `${i.title}. ${i.body}`),
  };
}
