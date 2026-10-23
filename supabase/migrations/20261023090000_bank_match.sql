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
