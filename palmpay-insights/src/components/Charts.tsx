import type { Facts } from "../lib/analyse";
import { monthName, naira, nairaShort } from "../lib/format";

export function CategoryBars({ facts }: { facts: Facts }) {
  const rows = facts.byCategory.filter((c) => c.category !== "Savings").slice(0, 7);
  const max = Math.max(1, ...rows.map((r) => Math.max(r.amount, r.usual)));
  return (
    <div className="card p-4">
      <div className="space-y-3">
        {rows.map((r) => {
          const over = r.usual > 0 && r.amount > r.usual * 1.4;
          return (
            <div key={r.category}>
              <div className="flex justify-between text-sm">
                <span className="font-semibold">{r.category}</span>
                <span className={over ? "font-bold text-bad" : "font-semibold"}>{naira(r.amount)}</span>
              </div>
              <div className="relative mt-1 h-2.5 rounded-full bg-pp-soft">
                <div className={`h-full rounded-full ${over ? "bg-bad" : "bg-pp"}`} style={{ width: `${(r.amount / max) * 100}%` }} />
                {r.usual > 0 && (
                  <div
                    className="absolute -top-1 h-[18px] w-0.5 rounded bg-pp-ink/60"
                    style={{ left: `${(r.usual / max) * 100}%` }}
                    title={`Usual by now: ${naira(r.usual)}`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted">Bars show this month so far. The dark tick is what you usually spend by day {facts.monthDay}.</p>
    </div>
  );
}

export function MonthlyBars({ facts }: { facts: Facts }) {
  const rows = facts.monthly.slice(-5);
  const max = Math.max(1, ...rows.map((r) => Math.max(r.income, r.spend)));
  return (
    <div className="card p-4">
      <div className="flex h-36 items-end justify-around gap-3">
        {rows.map((r) => (
          <div key={r.month} className="flex flex-1 flex-col items-center">
            <div className="flex h-28 w-full items-end justify-center gap-1">
              <div className="w-1/3 rounded-t bg-ok" style={{ height: `${(r.income / max) * 100}%` }} title={`In ${naira(r.income)}`} />
              <div className="w-1/3 rounded-t bg-pp" style={{ height: `${(r.spend / max) * 100}%` }} title={`Out ${naira(r.spend)}`} />
            </div>
            <div className="mt-1 text-xs font-semibold text-muted">{monthName(r.month).slice(0, 3)}</div>
            <div className="text-[10px] text-muted">{nairaShort(r.income - r.spend)}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-center gap-4 text-xs text-muted">
        <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-ok" />Money in</span>
        <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-pp" />Money out</span>
        <span>Number = left over</span>
      </div>
    </div>
  );
}
