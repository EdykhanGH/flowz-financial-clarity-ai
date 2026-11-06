// Sends the evening "write today's money" notification.
// Run every 15 minutes by pg_cron (see supabase/cron/reminders.sql).
//
// Secrets needed (Supabase dashboard → Edge Functions → Secrets):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY   – create once with: npx web-push generate-vapid-keys
//   VAPID_SUBJECT                         – e.g. mailto:hello@yourdomain.com
//   CRON_SECRET                           – any long random string, also used in the cron job

import webpush from "npm:web-push@3";
import { createClient } from "npm:@supabase/supabase-js@2";

const BATCH = 25; // users reminded at the same time

interface SettingsRow {
  user_id: string;
  display_name: string;
  reminder_time: string; // "20:00:00"
  time_zone: string;
  last_reminded_on: string | null;
}

function localNow(timeZone: string) {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());
  } catch {
    return localNow("Africa/Lagos");
  }
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

Deno.serve(async (req) => {
  if (req.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) {
    return new Response("Forbidden", { status: 403 });
  }

  webpush.setVapidDetails(
    Deno.env.get("VAPID_SUBJECT") ?? "mailto:hello@flowz.ng",
    Deno.env.get("VAPID_PUBLIC_KEY")!,
    Deno.env.get("VAPID_PRIVATE_KEY")!,
  );

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Everyone with reminders on, read in pages (a single read stops at 1,000 rows).
  const users: SettingsRow[] = [];
  for (let page = 0; page < 200; page++) {
    const { data, error } = await db
      .from("user_settings")
      .select("user_id, display_name, reminder_time, time_zone, last_reminded_on")
      .eq("reminder_enabled", true)
      .order("user_id")
      .range(page * 1000, page * 1000 + 999);
    if (error) return new Response(error.message, { status: 500 });
    users.push(...((data ?? []) as SettingsRow[]));
    if ((data ?? []).length < 1000) break;
  }

  // Due from the chosen time until midnight, once per day.
  const due = users
    .map((u) => ({ u, now: localNow(u.time_zone) }))
    .filter(({ u, now }) => {
      const [h, m] = u.reminder_time.split(":").map(Number);
      return now.minutes >= h * 60 + m && u.last_reminded_on !== now.date;
    });

  let sent = 0;
  async function remind(u: SettingsRow, today: string) {
    // Already wrote today? Then no need to nudge.
    const { count } = await db
      .from("entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", u.user_id)
      .eq("entry_date", today);

    await db.from("user_settings").update({ last_reminded_on: today }).eq("user_id", u.user_id);
    if ((count ?? 0) > 0) return;

    const { data: subs } = await db.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("user_id", u.user_id);
    const payload = JSON.stringify({
      title: "Time to write today's money 📝",
      body: `${u.display_name ? `${u.display_name}, what` : "What"} did you sell, buy and spend today? It takes a minute.`,
      url: "/today",
    });
    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 4 });
        sent++;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        // The phone unsubscribed or the app was removed: forget it.
        if (status === 404 || status === 410) await db.from("push_subscriptions").delete().eq("id", s.id);
        else console.error("push failed", status, err);
      }
    }
  }

  // Many at a time, and stop well before the function's time limit. Anyone left over
  // is still due, so the next run (15 minutes later) picks them up.
  const started = Date.now();
  let done = 0;
  for (let i = 0; i < due.length && Date.now() - started < 100_000; i += BATCH) {
    const batch = due.slice(i, i + BATCH);
    const results = await Promise.allSettled(batch.map(({ u, now }) => remind(u, now.date)));
    results.forEach((r) => r.status === "rejected" && console.error("reminder failed", r.reason));
    done += batch.length;
  }

  return new Response(JSON.stringify({ checked: users.length, due: due.length, done, sent }), { headers: { "Content-Type": "application/json" } });
});
