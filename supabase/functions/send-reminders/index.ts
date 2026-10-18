// Sends the evening "write today's money" notification.
// Run every 15 minutes by pg_cron (see supabase/cron/reminders.sql).
//
// Secrets needed (Supabase dashboard → Edge Functions → Secrets):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY   – create once with: npx web-push generate-vapid-keys
//   VAPID_SUBJECT                         – e.g. mailto:hello@yourdomain.com
//   CRON_SECRET                           – any long random string, also used in the cron job

import webpush from "npm:web-push@3";
import { createClient } from "npm:@supabase/supabase-js@2";

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
    Deno.env.get("VAPID_SUBJECT") ?? "mailto:hello@flowz.app",
    Deno.env.get("VAPID_PUBLIC_KEY")!,
    Deno.env.get("VAPID_PRIVATE_KEY")!,
  );

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: users, error } = await db
    .from("user_settings")
    .select("user_id, display_name, reminder_time, time_zone, last_reminded_on")
    .eq("reminder_enabled", true);
  if (error) return new Response(error.message, { status: 500 });

  let sent = 0;
  for (const u of (users ?? []) as SettingsRow[]) {
    const now = localNow(u.time_zone);
    const [h, m] = u.reminder_time.split(":").map(Number);
    // Due from the chosen time until midnight, once per day.
    if (now.minutes < h * 60 + m || u.last_reminded_on === now.date) continue;

    // Already wrote today? Then no need to nudge.
    const { count } = await db
      .from("entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", u.user_id)
      .eq("entry_date", now.date);

    await db.from("user_settings").update({ last_reminded_on: now.date }).eq("user_id", u.user_id);
    if ((count ?? 0) > 0) continue;

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

  return new Response(JSON.stringify({ checked: users?.length ?? 0, sent }), { headers: { "Content-Type": "application/json" } });
});
