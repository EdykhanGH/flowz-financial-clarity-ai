// Dates are stored as plain "yyyy-mm-dd" in the user's local time, like a page in a notebook.

export function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISODate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export const todayISO = () => toISODate(new Date());

export function addDays(s: string, days: number) {
  const d = fromISODate(s);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function monthKey(s: string) {
  return s.slice(0, 7);
}

export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  return { start: `${month}-01`, end: toISODate(new Date(y, m, 0)) };
}

export function shiftMonth(month: string, by: number) {
  const [y, m] = month.split("-").map(Number);
  return toISODate(new Date(y, m - 1 + by, 1)).slice(0, 7);
}

export function prettyDay(s: string) {
  const today = todayISO();
  if (s === today) return "Today";
  if (s === addDays(today, -1)) return "Yesterday";
  if (s === addDays(today, 1)) return "Tomorrow";
  return fromISODate(s).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

export function prettyMonth(month: string) {
  return fromISODate(`${month}-01`).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function shortDay(s: string) {
  return fromISODate(s).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
