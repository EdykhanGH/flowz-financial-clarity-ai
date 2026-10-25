import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ChevronDown, Package, Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import { deleteItem, listItems, listStockLines, saveItem } from "@/lib/api";
import { describeStock, isLow, packPrice, stockDirection, stockLevels, unitPrice, type InventoryItem } from "@/lib/inventory";
import { shortDay } from "@/lib/dates";
import { formatMoney, type Entry } from "@/lib/money";
import type { Currency } from "@/lib/parse";
import { useUser } from "@/hooks/useAuth";
import { ErrorNote, Sheet, Spinner } from "@/components/ui";

export default function Inventory() {
  const { settings } = useUser();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [moves, setMoves] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<InventoryItem | "new" | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await listItems();
      setItems(list);
      const since = list.reduce((min, i) => (i.counted_at.slice(0, 10) < min ? i.counted_at.slice(0, 10) : min), "9999-12-31");
      setMoves(list.length ? await listStockLines(since) : []);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const levels = useMemo(() => stockLevels(items, moves), [items, moves]);
  const value = useMemo(() => {
    const out: Partial<Record<Currency, number>> = {};
    for (const i of items) {
      const cost = unitPrice(i, "cost");
      const left = levels.get(i.id) ?? 0;
      if (cost != null && left > 0) out[i.currency] = (out[i.currency] ?? 0) + cost * left;
    }
    return out;
  }, [items, levels]);
  const low = items.filter((i) => isLow(i, levels.get(i.id) ?? 0));

  async function save(item: InventoryItem) {
    await saveItem(item);
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    await deleteItem(id);
    setEditing(null);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="flex items-center gap-2">
          <Link to="/today" className="rounded-full p-2 hover:bg-line/50" aria-label="Back to notebook">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-extrabold">Inventory</h1>
        </span>
        {items.length > 0 && (
          <button className="btn-primary px-4 py-2" onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" /> Add item
          </button>
        )}
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}

      {loading ? (
        <div className="grid h-40 place-items-center text-brand"><Spinner className="h-8 w-8" /></div>
      ) : items.length === 0 ? (
        <section className="card space-y-4 p-6">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-sky-soft text-sky"><Package className="h-7 w-7" /></div>
          <h2 className="text-xl font-extrabold">Keep track of your goods</h2>
          <p className="text-muted">
            Add the things you sell with their prices. Then just write in your notebook, and Flowz does the maths and counts your stock.
          </p>
          <ul className="space-y-1.5 rounded-2xl bg-line/30 p-4">
            <Example text="Sold 3 indomie" note="₦1,200 sale · stock −3" />
            <Example text="Bought 2 cartons of indomie" note="₦27,200 purchase · stock +80" />
            <Example text="Joy took 1 carton indomie on credit" note="Joy owes ₦15,000 · stock −40" />
          </ul>
          <button className="btn-primary w-full" onClick={() => setEditing("new")}>
            <Plus className="h-5 w-5" /> Add your first item
          </button>
        </section>
      ) : (
        <>
          <section className="card grid grid-cols-3 divide-x divide-line p-4 text-center">
            <Stat label="Items" value={String(items.length)} />
            <Stat
              label="Stock value"
              value={(Object.entries(value) as [Currency, number][]).map(([c, v]) => formatMoney(v, c, { compact: true })).join(" + ") || "—"}
              hint="at buying price"
            />
            <Stat label="Running low" value={String(low.length)} tone={low.length ? "text-coral" : undefined} />
          </section>

          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id}>
                <ItemCard item={item} left={levels.get(item.id) ?? 0} moves={moves.filter((m) => m.item_id === item.id)} onEdit={() => setEditing(item)} />
              </li>
            ))}
          </ul>

          <Hint item={items.find((i) => i.pack_name) ?? items[0]} />
        </>
      )}

      <ItemSheet
        item={editing === "new" ? null : editing}
        open={editing !== null}
        currency={settings.default_currency}
        left={editing && editing !== "new" ? levels.get(editing.id) ?? 0 : 0}
        onClose={() => setEditing(null)}
        onSave={save}
        onDelete={remove}
      />
    </div>
  );
}

/** How to use an item in the notebook, with the user's own item. */
function Hint({ item }: { item: InventoryItem }) {
  const name = item.name.toLowerCase();
  return (
    <p className="text-center text-sm text-muted">
      In your notebook, write <span className="font-hand text-lg text-ink">“Sold 3 {name}”</span> or{" "}
      <span className="font-hand text-lg text-ink">“Bought 2 {item.pack_name ? `${item.pack_name}s of ` : `${item.unit_name}s of `}{name}”</span>. Flowz works out
      the money and the stock.
    </p>
  );
}

function Example({ text, note }: { text: string; note: string }) {
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-3">
      <span className="font-hand text-xl">{text}</span>
      <span className="text-xs font-bold text-muted">{note}</span>
    </li>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: string }) {
  return (
    <div className="px-1">
      <div className="text-xs font-bold text-muted">{label}</div>
      <div className={clsx("text-lg font-extrabold", tone)}>{value}</div>
      {hint && <div className="text-[10px] font-bold text-muted">{hint}</div>}
    </div>
  );
}

function ItemCard({ item, left, moves, onEdit }: { item: InventoryItem; left: number; moves: Entry[]; onEdit: () => void }) {
  const [open, setOpen] = useState(false);
  const lowNow = isLow(item, left);
  const sell = unitPrice(item, "sell");
  const sellPack = item.pack_name ? packPrice(item, "sell") : null;
  return (
    <div className="card overflow-hidden">
      <button className="flex w-full items-center gap-3 px-5 py-4 text-left" onClick={onEdit}>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sky-soft font-extrabold text-sky">{item.name.charAt(0).toUpperCase()}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-lg font-extrabold">{item.name}</span>
          <span className="block text-sm text-muted">
            {sell != null ? `${formatMoney(sell, item.currency)} a ${item.unit_name}` : "No selling price yet"}
            {sellPack != null && ` · ${formatMoney(sellPack, item.currency)} a ${item.pack_name}`}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className={clsx("block font-extrabold", lowNow ? "text-coral" : left < 0 ? "text-coral" : "text-ink")}>{describeStock(item, left)}</span>
          <span className={clsx("flex items-center justify-end gap-1 text-xs font-bold", lowNow ? "text-coral" : "text-muted")}>
            {lowNow ? <><AlertTriangle className="h-3.5 w-3.5" /> running low</> : "in stock"}
          </span>
        </span>
      </button>
      {moves.length > 0 && (
        <div className="border-t border-line">
          <button className="flex w-full items-center gap-1 px-5 py-2 text-xs font-bold text-muted hover:text-ink" onClick={() => setOpen((o) => !o)}>
            <ChevronDown className={clsx("h-4 w-4 transition", open && "rotate-180")} /> Recent lines ({moves.length})
          </button>
          {open && (
            <ul className="divide-y divide-line border-t border-line">
              {[...moves].reverse().slice(0, 20).map((m) => (
                <li key={m.id}>
                  <Link to={`/day/${m.entry_date}`} className="flex items-center gap-3 px-5 py-2 hover:bg-line/20">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-hand text-lg">{m.text}</span>
                      <span className="text-xs font-bold text-muted">{shortDay(m.entry_date)}</span>
                    </span>
                    <span className={clsx("shrink-0 text-sm font-extrabold", stockDirection(m.kind) < 0 ? "text-coral" : "text-brand-dark")}>
                      {stockDirection(m.kind) < 0 ? "−" : "+"}
                      {m.item_qty}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

const UNIT_SUGGESTIONS = ["piece", "pack", "bottle", "bag", "sachet", "tin", "crate", "kg"];
const PACK_SUGGESTIONS = ["carton", "pack", "crate", "bag", "dozen", "box"];

const toText = (n: number | null | undefined) => (n == null ? "" : String(n));
const toNumber = (s: string) => {
  const n = Number(s.replace(/[,\s₦$]/g, ""));
  return s.trim() && Number.isFinite(n) && n >= 0 ? n : null;
};

function ItemSheet({
  item,
  open,
  currency,
  left,
  onClose,
  onSave,
  onDelete,
}: {
  item: InventoryItem | null;
  open: boolean;
  currency: Currency;
  left: number;
  onClose: () => void;
  onSave: (item: InventoryItem) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [f, setF] = useState<Record<string, string>>({});
  const [usesPack, setUsesPack] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const upp = item?.units_per_pack ?? null;
    const packs = upp && left > 0 ? Math.floor(left / upp) : 0;
    setUsesPack(Boolean(item?.pack_name));
    setF({
      name: item?.name ?? "",
      other_names: item?.other_names ?? "",
      unit_name: item?.unit_name ?? "piece",
      pack_name: item?.pack_name ?? "carton",
      units_per_pack: toText(upp),
      cost_unit: toText(item?.cost_unit),
      cost_pack: toText(item?.cost_pack),
      sell_unit: toText(item?.sell_unit),
      sell_pack: toText(item?.sell_pack),
      stock_packs: upp ? String(packs) : "",
      stock_units: String(Math.round((upp ? left - packs * upp : left) * 100) / 100),
      low_stock_units: toText(item?.low_stock_units),
    });
    setError(null);
  }, [open, item, left]);

  if (!open) return null;
  const set = (k: string) => (e: { target: { value: string } }) => setF((prev) => ({ ...prev, [k]: e.target.value }));
  const unit = f.unit_name?.trim() || "piece";
  const pack = f.pack_name?.trim() || "carton";
  const upp = usesPack ? toNumber(f.units_per_pack ?? "") : null;
  const sym = currency === "USD" ? "$" : "₦";
  const counted = (upp ?? 0) * (toNumber(f.stock_packs ?? "") ?? 0) + (toNumber(f.stock_units ?? "") ?? 0);

  // A hint for the price the user left empty, worked out from the other one.
  const hint = (one: string, many: string) => {
    const u = toNumber(f[one] ?? "");
    const p = toNumber(f[many] ?? "");
    if (!upp) return null;
    if (u != null && p == null) return `= ${sym}${(u * upp).toLocaleString("en-NG")} a ${pack}`;
    if (p != null && u == null) return `= ${sym}${(Math.round((p / upp) * 100) / 100).toLocaleString("en-NG")} a ${unit}`;
    return null;
  };

  async function submit() {
    if (!f.name?.trim()) return setError("Give the item a name.");
    if (usesPack && !upp) return setError(`How many ${unit}s are in one ${pack}?`);
    setBusy(true);
    try {
      const stockChanged = !item || Math.abs(counted - left) > 0.001;
      await onSave({
        id: item?.id ?? crypto.randomUUID(),
        name: f.name.trim(),
        other_names: f.other_names?.trim() || null,
        unit_name: unit.toLowerCase(),
        pack_name: usesPack ? pack.toLowerCase() : null,
        units_per_pack: upp,
        cost_unit: toNumber(f.cost_unit ?? ""),
        cost_pack: usesPack ? toNumber(f.cost_pack ?? "") : null,
        sell_unit: toNumber(f.sell_unit ?? ""),
        sell_pack: usesPack ? toNumber(f.sell_pack ?? "") : null,
        currency: item?.currency ?? currency,
        // A new count starts from now; otherwise the old count and the lines since are kept.
        stock_units: stockChanged ? counted : item!.stock_units,
        counted_at: stockChanged ? new Date().toISOString() : item!.counted_at,
        low_stock_units: toNumber(f.low_stock_units ?? ""),
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open onClose={onClose} title={item ? `Edit ${item.name}` : "Add an item"}>
      <div className="space-y-5">
        <Field label="Name" htmlFor="name">
          <input id="name" className="field" value={f.name ?? ""} onChange={set("name")} placeholder="e.g. Indomie" autoFocus={!item} />
        </Field>
        <Field label="Other names people write (optional)" htmlFor="other" hint="Separate with commas, e.g. noodles, indomie noodles">
          <input id="other" className="field" value={f.other_names ?? ""} onChange={set("other_names")} />
        </Field>

        <Field label="You sell it by the" htmlFor="unit">
          <input id="unit" className="field" value={f.unit_name ?? ""} onChange={set("unit_name")} placeholder="piece" />
          <Chips options={UNIT_SUGGESTIONS} value={unit} onPick={(v) => setF((p) => ({ ...p, unit_name: v }))} />
        </Field>

        <label className="flex items-center gap-3 font-bold">
          <input type="checkbox" className="h-5 w-5 accent-brand" checked={usesPack} onChange={(e) => setUsesPack(e.target.checked)} />
          It comes in cartons or packs
        </label>
        {usesPack && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Comes in a" htmlFor="pack">
              <input id="pack" className="field" value={f.pack_name ?? ""} onChange={set("pack_name")} placeholder="carton" />
            </Field>
            <Field label={`${unit}s in one ${pack}`} htmlFor="upp">
              <input id="upp" className="field" inputMode="decimal" value={f.units_per_pack ?? ""} onChange={set("units_per_pack")} placeholder="e.g. 40" />
            </Field>
            <div className="col-span-2 -mt-1">
              <Chips options={PACK_SUGGESTIONS} value={pack} onPick={(v) => setF((p) => ({ ...p, pack_name: v }))} />
            </div>
          </div>
        )}

        <PriceRow
          title="Buying price"
          sym={sym}
          unit={unit}
          pack={usesPack ? pack : null}
          unitValue={f.cost_unit ?? ""}
          packValue={f.cost_pack ?? ""}
          onUnit={set("cost_unit")}
          onPack={set("cost_pack")}
          hint={hint("cost_unit", "cost_pack")}
        />
        <PriceRow
          title="Selling price"
          sym={sym}
          unit={unit}
          pack={usesPack ? pack : null}
          unitValue={f.sell_unit ?? ""}
          packValue={f.sell_pack ?? ""}
          onUnit={set("sell_unit")}
          onPack={set("sell_pack")}
          hint={hint("sell_unit", "sell_pack")}
        />

        <div>
          <span className="label">{item ? "Stock now (change it after counting)" : "How many do you have now?"}</span>
          <div className="grid grid-cols-2 gap-3">
            {usesPack && (
              <Unit suffix={`${pack}s`}>
                <input className="field pr-20" inputMode="decimal" value={f.stock_packs ?? ""} onChange={set("stock_packs")} placeholder="0" aria-label={`${pack}s in stock`} />
              </Unit>
            )}
            <Unit suffix={`${unit}s`}>
              <input className="field pr-20" inputMode="decimal" value={f.stock_units ?? ""} onChange={set("stock_units")} placeholder="0" aria-label={`${unit}s in stock`} />
            </Unit>
          </div>
        </div>

        <Field label={`Warn me when stock falls to (${unit}s, optional)`} htmlFor="low">
          <input id="low" className="field" inputMode="decimal" value={f.low_stock_units ?? ""} onChange={set("low_stock_units")} placeholder="e.g. 10" />
        </Field>

        {error && <ErrorNote>{error}</ErrorNote>}
        <button className="btn-primary w-full" disabled={busy} onClick={submit}>
          {busy ? <Spinner /> : item ? "Save changes" : "Add item"}
        </button>
        {item && (
          <button
            className="btn-ghost w-full text-coral"
            onClick={() => {
              if (confirm(`Remove ${item.name}? Your notebook lines stay as they are.`)) onDelete(item.id);
            }}
          >
            <Trash2 className="h-4 w-4" /> Remove item
          </button>
        )}
      </div>
    </Sheet>
  );
}

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function Unit({ suffix, children }: { suffix: string; children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-bold text-muted">{suffix}</span>
    </div>
  );
}

function Chips({ options, value, onPick }: { options: string[]; value: string; onPick: (v: string) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onPick(o)}
          className={clsx("rounded-full border-2 px-3 py-1 text-xs font-bold", o === value ? "border-brand bg-brand-soft text-brand-dark" : "border-line text-muted")}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function PriceRow(props: {
  title: string;
  sym: string;
  unit: string;
  pack: string | null;
  unitValue: string;
  packValue: string;
  onUnit: (e: { target: { value: string } }) => void;
  onPack: (e: { target: { value: string } }) => void;
  hint: string | null;
}) {
  const { title, sym, unit, pack, unitValue, packValue, onUnit, onPack, hint } = props;
  return (
    <div>
      <span className="label">{title}</span>
      <div className={clsx("grid gap-3", pack ? "grid-cols-2" : "grid-cols-1")}>
        <Unit suffix={`a ${unit}`}>
          <input className="field pr-24" inputMode="decimal" value={unitValue} onChange={onUnit} placeholder={sym} aria-label={`${title} per ${unit}`} />
        </Unit>
        {pack && (
          <Unit suffix={`a ${pack}`}>
            <input className="field pr-24" inputMode="decimal" value={packValue} onChange={onPack} placeholder={sym} aria-label={`${title} per ${pack}`} />
          </Unit>
        )}
      </div>
      {hint && <p className="mt-1 text-xs font-bold text-brand-dark">{hint}</p>}
    </div>
  );
}
