-- Inventory: goods the business sells, their prices and stock.
-- Notebook lines that name an item record which item and how many moved.

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null check (length(name) between 1 and 60),
  other_names text,
  unit_name text not null default 'piece',
  pack_name text,
  units_per_pack numeric(12, 2) check (units_per_pack is null or units_per_pack > 0),
  cost_unit numeric(16, 2) check (cost_unit is null or cost_unit >= 0),
  cost_pack numeric(16, 2) check (cost_pack is null or cost_pack >= 0),
  sell_unit numeric(16, 2) check (sell_unit is null or sell_unit >= 0),
  sell_pack numeric(16, 2) check (sell_pack is null or sell_pack >= 0),
  currency text not null default 'NGN' check (currency in ('NGN', 'USD')),
  -- Stock counted at counted_at; notebook lines after it move it up or down
  stock_units numeric(14, 2) not null default 0,
  counted_at timestamptz not null default now(),
  low_stock_units numeric(14, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.inventory_items enable row level security;

drop policy if exists "own inventory" on public.inventory_items;
create policy "own inventory" on public.inventory_items
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Which item a notebook line moved, and how many single units
alter table public.entries add column if not exists item_id uuid references public.inventory_items (id) on delete set null;
alter table public.entries add column if not exists item_qty numeric(14, 2);

create index if not exists entries_user_item_idx on public.entries (user_id, item_id, entry_date) where item_id is not null;
