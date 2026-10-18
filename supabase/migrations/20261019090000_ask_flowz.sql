-- Ask Flowz: count questions per user per day so the AI bill stays predictable.
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  questions integer not null default 0,
  primary key (user_id, day)
);

-- Only the edge function (service role) reads and writes this table.
alter table public.ai_usage enable row level security;
