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
