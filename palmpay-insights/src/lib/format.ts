export const naira = (n: number) =>
  "₦" + Math.round(n).toLocaleString("en-NG");

export const nairaShort = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1_000_000) return "₦" + (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "m";
  if (a >= 10_000) return "₦" + Math.round(n / 1000) + "k";
  return naira(n);
};

export const pct = (n: number) => Math.round(n * 100) + "%";

export const dayKey = (iso: string) => iso.slice(0, 10);
export const monthKey = (iso: string) => iso.slice(0, 7);

export const monthName = (key: string) =>
  new Date(key + "-01T00:00:00").toLocaleString("en-NG", { month: "long" });

export const prettyDate = (iso: string) =>
  new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
