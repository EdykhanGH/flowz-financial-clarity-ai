-- Flowz: full database setup (run once in Supabase → SQL Editor).
-- Same as the two files in supabase/migrations, combined.

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
