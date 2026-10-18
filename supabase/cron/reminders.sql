-- Run once in Supabase → SQL Editor after deploying the send-reminders function.
-- Replace YOUR-PROJECT-REF and YOUR-CRON-SECRET (the same value as the CRON_SECRET function secret).
-- Needs the pg_cron and pg_net extensions (Database → Extensions).

select cron.schedule(
  'flowz-daily-reminders',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', 'YOUR-CRON-SECRET'),
    body := '{}'::jsonb
  );
  $$
);
