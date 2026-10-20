// Turns words like "last month", "September" or "Q3" into a date range.

import { addDays, fromISODate, monthKey, prettyMonth, shiftMonth, toISODate } from "./dates";

export interface Period {
  start: string; // yyyy-mm-dd
  end: string; // yyyy-mm-dd
  label: string; // "this month", "September 2026"
}

const MONTHS = [
  ["january", "jan"], ["february", "feb"], ["march", "mar"], ["april", "apr"], ["may"], ["june", "jun"],
  ["july", "jul"], ["august", "aug"], ["september", "sept", "sep"], ["october", "oct"], ["november", "nov"], ["december", "dec"],
];

const lastDay = (y: number, m: number) => toISODate(new Date(y, m, 0)); // m is 1-12

function monthPeriod(y: number, m: number): Period {
  const key = `${y}-${String(m).padStart(2, "0")}`;
  return { start: `${key}-01`, end: lastDay(y, m), label: prettyMonth(key) };
}

function quarterPeriod(y: number, q: number): Period {
  const first = (q - 1) * 3 + 1;
  return { start: `${y}-${String(first).padStart(2, "0")}-01`, end: lastDay(y, first + 2), label: `Q${q} ${y}` };
}

/** The period a sentence talks about. Falls back to this month. */
export function periodOf(text: string, today: string): Period {
  const q = text.toLowerCase();
  const year = +today.slice(0, 4);
  const month = +today.slice(5, 7);
  const yearMatch = q.match(/\b(20\d{2})\b/);
  const namedYear = yearMatch ? +yearMatch[1] : null;

  if (/\btoday\b/.test(q)) return { start: today, end: today, label: "today" };
  if (/\byesterday\b/.test(q)) {
    const y = addDays(today, -1);
    return { start: y, end: y, label: "yesterday" };
  }
  const monday = addDays(today, -((fromISODate(today).getDay() + 6) % 7));
  if (/\blast week\b/.test(q)) return { start: addDays(monday, -7), end: addDays(monday, -1), label: "last week" };
  if (/\bthis week\b/.test(q)) return { start: monday, end: today, label: "this week" };

  if (/\blast month\b/.test(q)) {
    const m = shiftMonth(monthKey(today), -1);
    return { ...monthPeriod(+m.slice(0, 4), +m.slice(5)), label: "last month" };
  }
  if (/\bthis month\b/.test(q)) return { start: `${monthKey(today)}-01`, end: today, label: "this month" };

  const currentQ = Math.ceil(month / 3);
  if (/\bthis quarter\b/.test(q)) return { ...quarterPeriod(year, currentQ), end: today, label: "this quarter" };
  if (/\blast quarter\b/.test(q)) {
    const lq = currentQ === 1 ? 4 : currentQ - 1;
    return { ...quarterPeriod(currentQ === 1 ? year - 1 : year, lq), label: "last quarter" };
  }
  const qMatch = q.match(/\bq([1-4])\b|\b(first|second|third|fourth) quarter\b/);
  if (qMatch) {
    const n = qMatch[1] ? +qMatch[1] : ["first", "second", "third", "fourth"].indexOf(qMatch[2]) + 1;
    const y = namedYear ?? (n > currentQ ? year - 1 : year);
    return quarterPeriod(y, n);
  }

  if (/\blast year\b/.test(q)) return { start: `${year - 1}-01-01`, end: `${year - 1}-12-31`, label: String(year - 1) };
  if (/\bthis year\b|\byear to date\b|\bytd\b/.test(q)) return { start: `${year}-01-01`, end: today, label: "this year" };

  const named = MONTHS.findIndex((names) => names.some((n) => new RegExp(`\\b${n}\\b`).test(q)));
  if (named >= 0) {
    const y = namedYear ?? (named + 1 > month ? year - 1 : year);
    return monthPeriod(y, named + 1);
  }
  if (namedYear) return { start: `${namedYear}-01-01`, end: namedYear === year ? today : `${namedYear}-12-31`, label: String(namedYear) };

  return { start: `${monthKey(today)}-01`, end: today, label: "this month" };
}
