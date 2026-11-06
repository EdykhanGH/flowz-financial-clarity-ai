-- New line types: refunds, ajo/esusu/savings, and the owner's own money in and out.
alter table public.entries drop constraint if exists entries_kind_check;
alter table public.entries add constraint entries_kind_check
  check (kind in ('sale', 'gift_in', 'purchase', 'expense', 'gift_out', 'owed_to_me', 'repaid_to_me', 'i_owe', 'i_repaid',
                  'refund', 'saving', 'savings_back', 'owner_in', 'owner_out', 'note'));
