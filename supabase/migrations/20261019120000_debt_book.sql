-- Debt book: lines for paying back a debt, and a counter for AI line reading.

alter table public.entries drop constraint if exists entries_kind_check;
alter table public.entries add constraint entries_kind_check
  check (kind in ('sale', 'gift_in', 'purchase', 'expense', 'gift_out', 'owed_to_me', 'repaid_to_me', 'i_owe', 'i_repaid', 'note'));

drop index if exists entries_user_debts_idx;
create index if not exists entries_user_debts_idx on public.entries (user_id, kind)
  where kind in ('owed_to_me', 'repaid_to_me', 'i_owe', 'i_repaid');

alter table public.ai_usage add column if not exists lines integer not null default 0;
