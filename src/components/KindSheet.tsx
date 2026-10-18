import clsx from "clsx";
import { RotateCcw } from "lucide-react";
import { CATEGORIES, KINDS, KIND_ORDER, kindLabel, type Kind, type Mode } from "@/lib/kinds";
import { CURRENCIES, CURRENCY_SYMBOL, formatMoney, type Entry } from "@/lib/money";
import type { Currency } from "@/lib/parse";
import { Sheet } from "./ui";

export type LinePatch = Partial<Pick<Entry, "kind" | "category" | "currency" | "kind_locked">>;

export default function KindSheet({
  line,
  mode,
  onClose,
  onChange,
  onReset,
}: {
  line: Entry | null;
  mode: Mode;
  onClose: () => void;
  onChange: (patch: LinePatch) => void;
  onReset: () => void;
}) {
  const open = Boolean(line);
  const kind = line?.kind ?? "note";
  const showCategory = KINDS[kind].flow === "out";

  return (
    <Sheet open={open} onClose={onClose} title="What is this line?">
      {line && (
        <div className="space-y-5">
          <div className="rounded-2xl bg-white p-4 shadow-card">
            <div className="font-hand text-2xl">{line.text}</div>
            {line.amount != null && line.currency && (
              <div className="mt-1 font-extrabold">{formatMoney(line.amount, line.currency)}</div>
            )}
          </div>

          <div>
            <div className="label">Type</div>
            <div className="grid grid-cols-2 gap-2">
              {KIND_ORDER.filter((k) => k !== "note").map((k: Kind) => (
                <button
                  key={k}
                  onClick={() =>
                    onChange({
                      kind: k,
                      kind_locked: true,
                      category: KINDS[k].flow === "out" ? (k === "purchase" ? "stock" : line.category ?? "other") : null,
                    })
                  }
                  className={clsx(
                    "flex items-center gap-2 rounded-2xl border-2 px-3 py-2.5 text-left font-bold transition",
                    kind === k ? "border-brand bg-brand-soft" : "border-line bg-white",
                  )}
                >
                  <span className="text-xl">{KINDS[k].emoji}</span>
                  {kindLabel(k, mode)}
                </button>
              ))}
            </div>
          </div>

          {showCategory && (
            <div>
              <div className="label">Spent on</div>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onChange({ category: c.id, kind_locked: true })}
                    className={clsx(
                      "rounded-full border-2 px-3 py-1.5 text-sm font-bold transition",
                      (line.category ?? "other") === c.id ? "border-brand bg-brand-soft" : "border-line bg-white",
                    )}
                  >
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {line.amount != null && (
            <div>
              <div className="label">Money</div>
              <div className="grid grid-cols-2 gap-2">
                {CURRENCIES.map((c: Currency) => (
                  <button
                    key={c}
                    onClick={() => onChange({ currency: c, kind_locked: true })}
                    className={clsx(
                      "rounded-2xl border-2 px-3 py-2.5 font-bold transition",
                      line.currency === c ? "border-brand bg-brand-soft" : "border-line bg-white",
                    )}
                  >
                    {CURRENCY_SYMBOL[c]} {c === "NGN" ? "Naira" : "Dollars"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {line.kind_locked && (
              <button className="btn-ghost flex-1" onClick={onReset}>
                <RotateCcw className="h-4 w-4" /> Let Flowz decide
              </button>
            )}
            <button className="btn-primary flex-1" onClick={onClose}>Done</button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
