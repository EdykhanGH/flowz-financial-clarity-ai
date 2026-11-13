-- Flowz: full database setup (run once in Supabase → SQL Editor).
-- Same as the files in supabase/migrations, combined.

-- Flowz v1: a money notebook.
-- New tables only; nothing from the old app is changed or dropped.

-- Who the user is and how they use Flowz
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade default auth.uid(),
  display_name text not null default '',
  business_name text,
  mode text not null default 'personal' check (mode in ('personal', 'business')),
  default_currency text not null default 'NGN' check (default_currency in ('NGN', 'USD')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per line written in the notebook
create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  entry_date date not null,
  position integer not null default 0,
  text text not null default '',
  amount numeric(16, 2) check (amount is null or amount >= 0),
  currency text check (currency in ('NGN', 'USD')),
  kind text not null default 'note'
    check (kind in ('sale', 'gift_in', 'purchase', 'expense', 'gift_out', 'owed_to_me', 'i_owe', 'note')),
  category text,
  person text,
  kind_locked boolean not null default false,
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists entries_user_date_idx on public.entries (user_id, entry_date, position);
create index if not exists entries_user_debts_idx on public.entries (user_id, kind) where kind in ('owed_to_me', 'i_owe');

-- Monthly spending limits per category
create table if not exists public.budget_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  category text not null,
  amount numeric(16, 2) not null check (amount > 0),
  currency text not null default 'NGN' check (currency in ('NGN', 'USD')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category, currency)
);

-- The AI-written monthly summary, saved so it isn't regenerated on every visit
create table if not exists public.monthly_summaries (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  month date not null,
  headline text not null,
  points jsonb not null default '[]'::jsonb,
  tip text not null default '',
  generated_at timestamptz not null default now(),
  generation_count integer not null default 1,
  primary key (user_id, month)
);

-- Keep updated_at fresh
create or replace function public.flowz_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_settings_touch on public.user_settings;
create trigger user_settings_touch before update on public.user_settings
  for each row execute function public.flowz_touch_updated_at();

drop trigger if exists entries_touch on public.entries;
create trigger entries_touch before update on public.entries
  for each row execute function public.flowz_touch_updated_at();

drop trigger if exists budget_limits_touch on public.budget_limits;
create trigger budget_limits_touch before update on public.budget_limits
  for each row execute function public.flowz_touch_updated_at();

-- Everyone can only ever see and change their own rows
alter table public.user_settings enable row level security;
alter table public.entries enable row level security;
alter table public.budget_limits enable row level security;
alter table public.monthly_summaries enable row level security;

drop policy if exists "own settings" on public.user_settings;
create policy "own settings" on public.user_settings
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own entries" on public.entries;
create policy "own entries" on public.entries
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own budgets" on public.budget_limits;
create policy "own budgets" on public.budget_limits
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Summaries are written only by the edge function (service role); users can read their own.
drop policy if exists "read own summaries" on public.monthly_summaries;
create policy "read own summaries" on public.monthly_summaries
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Daily reminder to write the day's money.

alter table public.user_settings
  add column if not exists reminder_enabled boolean not null default true,
  add column if not exists reminder_time time not null default '20:00',
  add column if not exists time_zone text not null default 'Africa/Lagos',
  add column if not exists last_reminded_on date;

-- Phones and browsers that agreed to receive notifications
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "own push subscriptions" on public.push_subscriptions;
create policy "own push subscriptions" on public.push_subscriptions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Ask Flowz: count questions per user per day so the AI bill stays predictable.
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  questions integer not null default 0,
  primary key (user_id, day)
);

-- Only the edge function (service role) reads and writes this table.
alter table public.ai_usage enable row level security;

-- Debt book: lines for paying back a debt, and a counter for AI line reading.

alter table public.entries drop constraint if exists entries_kind_check;
alter table public.entries add constraint entries_kind_check
  check (kind in ('sale', 'gift_in', 'purchase', 'expense', 'gift_out', 'owed_to_me', 'repaid_to_me', 'i_owe', 'i_repaid', 'note'));

drop index if exists entries_user_debts_idx;
create index if not exists entries_user_debts_idx on public.entries (user_id, kind)
  where kind in ('owed_to_me', 'repaid_to_me', 'i_owe', 'i_repaid');

alter table public.ai_usage add column if not exists lines integer not null default 0;

-- Bank Match: bank statements the user uploads, checked against the notebook.
-- Flowz only reads statements. It can't see the bank account or move money.

-- One row per uploaded statement (deleting it deletes its transactions)
create table if not exists public.bank_statements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  file_name text not null default '',
  bank_name text,
  currency text not null default 'NGN' check (currency in ('NGN', 'USD')),
  period_start date,
  period_end date,
  created_at timestamptz not null default now()
);

-- One row per bank transaction
create table if not exists public.bank_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  statement_id uuid not null references public.bank_statements (id) on delete cascade,
  txn_date date not null,
  amount numeric(16, 2) not null check (amount > 0),
  direction text not null check (direction in ('in', 'out')),
  currency text not null default 'NGN' check (currency in ('NGN', 'USD')),
  description text not null default '',
  balance numeric(16, 2),
  -- Same transaction uploaded twice (overlapping statements) is only kept once
  fingerprint text not null,
  -- The notebook line the user linked it to, or added from it
  entry_id uuid references public.entries (id) on delete set null,
  status text not null default 'open' check (status in ('open', 'not_business')),
  created_at timestamptz not null default now(),
  unique (user_id, fingerprint)
);

create index if not exists bank_transactions_user_date_idx on public.bank_transactions (user_id, txn_date);
create index if not exists bank_transactions_statement_idx on public.bank_transactions (statement_id);

-- Words that mark transfers as not business, e.g. "MUM" or the user's own savings account
create table if not exists public.bank_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  phrase text not null check (length(phrase) between 2 and 80),
  created_at timestamptz not null default now(),
  unique (user_id, phrase)
);

alter table public.bank_statements enable row level security;
alter table public.bank_transactions enable row level security;
alter table public.bank_rules enable row level security;

drop policy if exists "own bank statements" on public.bank_statements;
create policy "own bank statements" on public.bank_statements
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own bank transactions" on public.bank_transactions;
create policy "own bank transactions" on public.bank_transactions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own bank rules" on public.bank_rules;
create policy "own bank rules" on public.bank_rules
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- AI reading of PDF and photo statements, counted per day like the other AI features
alter table public.ai_usage add column if not exists statement_pages integer not null default 0;

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

-- New line types: refunds, ajo/esusu/savings, and the owner's own money in and out.
alter table public.entries drop constraint if exists entries_kind_check;
alter table public.entries add constraint entries_kind_check
  check (kind in ('sale', 'gift_in', 'purchase', 'expense', 'gift_out', 'owed_to_me', 'repaid_to_me', 'i_owe', 'i_repaid',
                  'refund', 'saving', 'savings_back', 'owner_in', 'owner_out', 'note'));

-- Launch hardening: AI limits that can't be bypassed, size limits, and ownership checks.

-- 1. AI usage is counted on the server's own date, in one step, so the daily limit
--    can't be dodged by sending a different date or many requests at once.
alter table public.ai_usage add column if not exists summaries integer not null default 0;

create or replace function public.flowz_use_ai(p_user uuid, p_field text, p_amount integer, p_daily_limit integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_day date := (now() at time zone 'Africa/Lagos')::date;
  v_ok integer;
begin
  if p_field not in ('questions', 'lines', 'statement_pages', 'summaries') or p_amount < 1 then
    raise exception 'bad usage request';
  end if;
  insert into public.ai_usage (user_id, day) values (p_user, v_day) on conflict (user_id, day) do nothing;
  execute format(
    'update public.ai_usage set %1$I = %1$I + $1 where user_id = $2 and day = $3 and %1$I + $1 <= $4 returning 1',
    p_field
  ) into v_ok using p_amount, p_user, v_day, p_daily_limit;
  return v_ok is not null;
end;
$$;

-- Only the server functions (service role) may call it.
revoke all on function public.flowz_use_ai(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.flowz_use_ai(uuid, text, integer, integer) to service_role;

-- 2. Size limits, so one account can't fill the database or send huge text to the AI.
--    "not valid" applies the rule to new and changed rows without failing on old ones.
alter table public.entries drop constraint if exists entries_text_len;
alter table public.entries add constraint entries_text_len check (length(text) <= 500) not valid;
alter table public.entries drop constraint if exists entries_person_len;
alter table public.entries add constraint entries_person_len check (person is null or length(person) <= 80) not valid;
alter table public.entries drop constraint if exists entries_category_len;
alter table public.entries add constraint entries_category_len check (category is null or length(category) <= 40) not valid;

alter table public.user_settings drop constraint if exists user_settings_len;
alter table public.user_settings add constraint user_settings_len
  check (length(display_name) <= 80 and (business_name is null or length(business_name) <= 120) and length(time_zone) <= 64) not valid;

alter table public.budget_limits drop constraint if exists budget_limits_category_len;
alter table public.budget_limits add constraint budget_limits_category_len check (length(category) <= 40) not valid;

alter table public.push_subscriptions drop constraint if exists push_subscriptions_len;
alter table public.push_subscriptions add constraint push_subscriptions_len
  check (length(endpoint) <= 1000 and length(p256dh) <= 200 and length(auth) <= 100 and (user_agent is null or length(user_agent) <= 400)) not valid;

alter table public.inventory_items drop constraint if exists inventory_items_len;
alter table public.inventory_items add constraint inventory_items_len
  check ((other_names is null or length(other_names) <= 300) and length(unit_name) <= 30 and (pack_name is null or length(pack_name) <= 30)) not valid;

alter table public.bank_statements drop constraint if exists bank_statements_len;
alter table public.bank_statements add constraint bank_statements_len
  check (length(file_name) <= 200 and (bank_name is null or length(bank_name) <= 80)) not valid;
alter table public.bank_transactions drop constraint if exists bank_transactions_len;
alter table public.bank_transactions add constraint bank_transactions_len
  check (length(description) <= 500 and length(fingerprint) <= 200) not valid;

-- A day holds up to 300 lines, and dates must be sensible.
create or replace function public.flowz_check_entry()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.entry_date < date '2000-01-01' or new.entry_date > current_date + 366 then
    raise exception 'That date is outside what Flowz can save.';
  end if;
  if (select count(*) from public.entries e
      where e.user_id = new.user_id and e.entry_date = new.entry_date and e.id <> new.id) >= 300 then
    raise exception 'A day can hold up to 300 lines.';
  end if;
  return new;
end;
$$;

drop trigger if exists entries_check on public.entries;
create trigger entries_check before insert on public.entries
  for each row execute function public.flowz_check_entry();

-- Caps on the smaller lists. Saving an existing row again (an update) is never blocked.
create or replace function public.flowz_check_row_count()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_count integer;
begin
  if tg_table_name = 'push_subscriptions' then
    select count(*) into v_count from public.push_subscriptions t where t.user_id = new.user_id and t.endpoint <> new.endpoint;
  elsif tg_table_name = 'inventory_items' then
    select count(*) into v_count from public.inventory_items t where t.user_id = new.user_id and t.id <> new.id;
  elsif tg_table_name = 'budget_limits' then
    select count(*) into v_count from public.budget_limits t
      where t.user_id = new.user_id and not (t.category = new.category and t.currency = new.currency);
  elsif tg_table_name = 'bank_rules' then
    select count(*) into v_count from public.bank_rules t where t.user_id = new.user_id and t.phrase <> new.phrase;
  elsif tg_table_name = 'bank_statements' then
    select count(*) into v_count from public.bank_statements t where t.user_id = new.user_id and t.id <> new.id;
  elsif tg_table_name = 'bank_transactions' then
    select count(*) into v_count from public.bank_transactions t where t.statement_id = new.statement_id and t.id <> new.id;
  else
    return new;
  end if;
  if v_count >= tg_argv[0]::integer then
    raise exception 'You have reached the limit for this list.';
  end if;
  return new;
end;
$$;

drop trigger if exists push_subscriptions_count on public.push_subscriptions;
create trigger push_subscriptions_count before insert on public.push_subscriptions
  for each row execute function public.flowz_check_row_count('20');

drop trigger if exists inventory_items_count on public.inventory_items;
create trigger inventory_items_count before insert on public.inventory_items
  for each row execute function public.flowz_check_row_count('2000');

drop trigger if exists budget_limits_count on public.budget_limits;
create trigger budget_limits_count before insert on public.budget_limits
  for each row execute function public.flowz_check_row_count('100');

drop trigger if exists bank_rules_count on public.bank_rules;
create trigger bank_rules_count before insert on public.bank_rules
  for each row execute function public.flowz_check_row_count('200');

drop trigger if exists bank_statements_count on public.bank_statements;
create trigger bank_statements_count before insert on public.bank_statements
  for each row execute function public.flowz_check_row_count('500');

drop trigger if exists bank_transactions_count on public.bank_transactions;
create trigger bank_transactions_count before insert on public.bank_transactions
  for each row execute function public.flowz_check_row_count('5000');

-- 3. A row may only point at the same person's own item, statement or line.
drop policy if exists "own entries" on public.entries;
create policy "own entries" on public.entries
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (item_id is null or exists (
      select 1 from public.inventory_items i where i.id = item_id and i.user_id = (select auth.uid())))
  );

drop policy if exists "own bank transactions" on public.bank_transactions;
create policy "own bank transactions" on public.bank_transactions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.bank_statements s where s.id = statement_id and s.user_id = (select auth.uid()))
    and (entry_id is null or exists (
      select 1 from public.entries e where e.id = entry_id and e.user_id = (select auth.uid())))
  );
