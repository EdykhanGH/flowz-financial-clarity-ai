import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import { useUser } from "@/hooks/useAuth";
import { deleteBudget, listBudgets, listEntries, saveBudget } from "@/lib/api";
import { monthKey, monthRange, prettyMonth, todayISO } from "@/lib/dates";
import { CATEGORIES, CATEGORY_BY_ID, KINDS } from "@/lib/kinds";
import { CURRENCIES, CURRENCY_SYMBOL, formatMoney, type Budget, type Entry } from "@/lib/money";
import { parseLine, type Currency } from "@/lib/parse";
import { EmptyState, ErrorNote, ProgressBar, Sheet, Spinner } from "@/components/ui";

export default function Budgets() {
  const { userId, settings } = useUser();
  const month = monthKey(todayISO());
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<Budget> | null>(null);

  const load = useCallback(async () => {
    try {
      const { start, end } = monthRange(month);
      const [b, e] = await Promise.all([listBudgets(), listEntries(start, end)]);
      setBudgets(b);
      setEntries(e);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const spent = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of entries) {
      if (e.amount == null || !e.currency || KINDS[e.kind].flow !== "out") continue;
      const key = `${e.category ?? "other"}:${e.currency}`;
      map[key] = (map[key] ?? 0) + e.amount;
    }
    return map;
  }, [entries]);

  const now = new Date();
  const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between pt-1">
        <div>
          <h1 className="text-2xl font-extrabold">Budgets</h1>
          <p className="text-sm font-bold text-muted">{prettyMonth(month)} · {daysLeft} day{daysLeft === 1 ? "" : "s"} left</p>
        </div>
        <button className="btn-primary px-4 py-2.5" onClick={() => setEditing({ currency: settings.default_currency })}>
          <Plus className="h-5 w-5" /> Add
        </button>
      </div>

      <p className="text-muted">Set how much you want to spend on something each month. Flowz fills the bar as you write.</p>

      {error && <ErrorNote>{error}</ErrorNote>}

      {loading ? (
        <div className="grid h-40 place-items-center text-brand"><Spinner /></div>
      ) : budgets.length === 0 ? (
        <EmptyState emoji="🎯" title="No budgets yet">
          For example: Food ₦50,000 a month, or Transport ₦20,000.
          <div>
            <button className="btn-primary mt-4" onClick={() => setEditing({ currency: settings.default_currency, category: "food" })}>
              Set my first budget
            </button>
          </div>
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {budgets.map((b) => {
            const used = spent[`${b.category}:${b.currency}`] ?? 0;
            const left = b.amount - used;
            const cat = CATEGORY_BY_ID[b.category];
            return (
              <li key={b.id}>
                <button className="card block w-full p-5 text-left" onClick={() => setEditing(b)}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-lg font-extrabold">
                      <span className="text-2xl">{cat?.emoji}</span> {cat?.label ?? "Other"}
                    </span>
                    <span className="font-bold text-muted">{formatMoney(b.amount, b.currency)}</span>
                  </div>
                  <div className="mt-3"><ProgressBar value={used} max={b.amount} /></div>
                  <div className="mt-2 flex justify-between text-sm font-bold">
                    <span className="text-muted">Spent {formatMoney(used, b.currency)}</span>
                    <span className={clsx(left < 0 ? "text-coral" : "text-brand-dark")}>
                      {left < 0 ? `${formatMoney(-left, b.currency)} over` : `${formatMoney(left, b.currency)} left`}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <BudgetSheet
        value={editing}
        existing={budgets}
        onClose={() => setEditing(null)}
        onSave={async (b) => {
          await saveBudget(userId, b);
          setEditing(null);
          await load();
        }}
        onDelete={async (id) => {
          await deleteBudget(id);
          setEditing(null);
          await load();
        }}
      />
    </div>
  );
}

function BudgetSheet({
  value,
  existing,
  onClose,
  onSave,
  onDelete,
}: {
  value: Partial<Budget> | null;
  existing: Budget[];
  onClose: () => void;
  onSave: (b: Omit<Budget, "id"> & { id?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [category, setCategory] = useState("food");
  const [amountText, setAmountText] = useState("");
  const [currency, setCurrency] = useState<Currency>("NGN");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value) return;
    setCategory(value.category ?? CATEGORIES.find((c) => !existing.some((b) => b.category === c.id))?.id ?? "other");
    setAmountText(value.amount ? String(value.amount) : "");
    setCurrency(value.currency ?? "NGN");
    setError(null);
  }, [value, existing]);

  const amount = parseLine(amountText, currency).amount;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!amount) {
      setError("Please type an amount, like 50,000 or 50k.");
      return;
    }
    setBusy(true);
    try {
      await onSave({ id: value?.id, category, amount, currency });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={Boolean(value)} onClose={onClose} title={value?.id ? "Edit budget" : "New budget"}>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <div className="label">Spending on</div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.filter((c) => c.id !== "stock").map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => setCategory(c.id)}
                disabled={Boolean(value?.id)}
                className={clsx(
                  "rounded-full border-2 px-3 py-1.5 text-sm font-bold transition disabled:opacity-60",
                  category === c.id ? "border-brand bg-brand-soft" : "border-line bg-white",
                )}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="budget-amount">How much per month?</label>
          <div className="flex gap-2">
            <div className="flex overflow-hidden rounded-2xl border-2 border-line">
              {CURRENCIES.map((c) => (
                <button
                  type="button"
                  key={c}
                  disabled={Boolean(value?.id)}
                  onClick={() => setCurrency(c)}
                  className={clsx("px-4 font-extrabold", currency === c ? "bg-brand text-white" : "bg-white")}
                >
                  {CURRENCY_SYMBOL[c]}
                </button>
              ))}
            </div>
            <input
              id="budget-amount"
              inputMode="decimal"
              className="field"
              placeholder="e.g. 50,000 or 50k"
              value={amountText}
              onChange={(e) => setAmountText(e.target.value)}
            />
          </div>
          {amount ? <p className="mt-1 text-sm font-bold text-muted">{formatMoney(amount, currency)} a month</p> : null}
        </div>

        {error && <ErrorNote>{error}</ErrorNote>}

        <div className="flex gap-2">
          {value?.id && (
            <button type="button" className="btn-ghost text-coral" disabled={busy} onClick={() => onDelete(value.id!)} aria-label="Delete budget">
              <Trash2 className="h-5 w-5" />
            </button>
          )}
          <button className="btn-primary flex-1" disabled={busy}>{busy ? <Spinner /> : "Save budget"}</button>
        </div>
      </form>
    </Sheet>
  );
}
