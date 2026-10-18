import clsx from "clsx";
import { formatMoney, type Totals } from "@/lib/money";
import type { Currency } from "@/lib/parse";

export default function TotalsCard({
  totals,
  fallbackCurrency,
  labels = { in: "Money in", out: "Money out", net: "Left" },
  className,
}: {
  totals: Partial<Record<Currency, Totals>>;
  fallbackCurrency: Currency;
  labels?: { in: string; out: string; net: string };
  className?: string;
}) {
  const currencies = (Object.keys(totals) as Currency[]).sort((a) => (a === fallbackCurrency ? -1 : 1));
  const rows = currencies.length ? currencies : [fallbackCurrency];

  return (
    <div className={clsx("card divide-y divide-line overflow-hidden", className)}>
      {rows.map((cur) => {
        const t = totals[cur] ?? { in: 0, out: 0, net: 0 };
        return (
          <div key={cur} className="grid grid-cols-3 px-4 py-3 text-center">
            <div>
              <div className="text-xs font-bold text-muted">{labels.in}</div>
              <div className="font-extrabold text-brand-dark">{formatMoney(t.in, cur, { compact: true })}</div>
            </div>
            <div className="border-x border-line">
              <div className="text-xs font-bold text-muted">{labels.out}</div>
              <div className="font-extrabold text-coral">{formatMoney(t.out, cur, { compact: true })}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-muted">{labels.net}</div>
              <div className={clsx("font-extrabold", t.net < 0 ? "text-coral" : "text-ink")}>
                {formatMoney(t.net, cur, { compact: true })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
