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
