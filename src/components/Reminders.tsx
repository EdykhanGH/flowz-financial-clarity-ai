import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, BellOff, BellRing, X } from "lucide-react";
import clsx from "clsx";
import { useAuth, useUser } from "@/hooks/useAuth";
import { hasEntriesOn, saveSettings } from "@/lib/api";
import { todayISO } from "@/lib/dates";
import { deviceTimeZone, minutesOf, prettyTime, pushStatus, turnOffPush, turnOnPush, type PushStatus } from "@/lib/reminders";
import { ErrorNote, Spinner } from "./ui";

const PUSH_HELP: Record<PushStatus, string> = {
  on: "Notifications are on for this phone.",
  off: "Get a notification on this phone at your reminder time.",
  "needs-install": "On iPhone: tap the Share button, choose “Add to Home Screen”, then open Flowz from your home screen to turn on notifications.",
  blocked: "Notifications are blocked for Flowz. Allow them in your browser or phone settings, then come back here.",
  unsupported: "This browser can't show notifications. Flowz will still remind you inside the app.",
  "not-configured": "Phone notifications aren't switched on for Flowz yet. You'll still see the reminder inside the app.",
};

function usePushStatus() {
  const [status, setStatus] = useState<PushStatus | null>(null);
  useEffect(() => {
    pushStatus().then(setStatus).catch(() => setStatus("unsupported"));
  }, []);
  return [status, setStatus] as const;
}

/** Settings card: turn the reminder on/off, pick the time, allow phone notifications. */
export function ReminderSettings() {
  const { userId, settings } = useUser();
  const { setSettings } = useAuth();
  const [status, setStatus] = usePushStatus();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enabled = settings.reminder_enabled;

  async function update(values: { reminder_enabled?: boolean; reminder_time?: string }) {
    setError(null);
    try {
      setSettings(await saveSettings(userId, { ...values, time_zone: deviceTimeZone() }));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function togglePush() {
    setBusy(true);
    setError(null);
    try {
      setStatus(status === "on" ? await turnOffPush() : await turnOnPush(userId));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card space-y-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-extrabold"><BellRing className="h-5 w-5 text-brand" /> Daily reminder</div>
          <p className="text-sm text-muted">A nudge to write the day's money, only on days you haven't written yet.</p>
        </div>
        <button
          role="switch"
          aria-checked={enabled}
          aria-label="Daily reminder"
          onClick={() => update({ reminder_enabled: !enabled })}
          className={clsx("relative h-8 w-14 shrink-0 rounded-full transition", enabled ? "bg-brand" : "bg-line")}
        >
          <span className={clsx("absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all", enabled ? "left-7" : "left-1")} />
        </button>
      </div>

      {enabled && (
        <>
          <div>
            <label className="label" htmlFor="reminder-time">Remind me at</label>
            <input
              id="reminder-time"
              type="time"
              className="field"
              value={settings.reminder_time.slice(0, 5)}
              onChange={(e) => e.target.value && update({ reminder_time: `${e.target.value}:00` })}
            />
          </div>

          <div className="rounded-2xl bg-paper p-4">
            {status === null ? (
              <Spinner className="text-brand" />
            ) : (
              <>
                <p className="text-sm">
                  {import.meta.env.MODE === "demo"
                    ? "In this demo the reminder shows inside the app. In the real app it also arrives as a notification on your phone."
                    : PUSH_HELP[status]}
                </p>
                {(status === "on" || status === "off") && (
                  <button className={clsx("mt-3 w-full", status === "on" ? "btn-ghost" : "btn-primary")} onClick={togglePush} disabled={busy}>
                    {busy ? <Spinner /> : status === "on" ? <><BellOff className="h-5 w-5" /> Turn off on this phone</> : <><Bell className="h-5 w-5" /> Turn on notifications</>}
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}
      {error && <ErrorNote>{error}</ErrorNote>}
    </div>
  );
}

/** Banner on other screens when it's past reminder time and today's page is still empty. */
export function ReminderBanner() {
  const { settings } = useUser();
  const location = useLocation();
  const [due, setDue] = useState(false);

  useEffect(() => {
    if (!settings.reminder_enabled || location.pathname === "/today") {
      setDue(false);
      return;
    }
    let cancelled = false;
    const check = () => {
      const now = new Date();
      if (now.getHours() * 60 + now.getMinutes() < minutesOf(settings.reminder_time)) {
        setDue(false);
        return;
      }
      hasEntriesOn(todayISO())
        .then((has) => !cancelled && setDue(!has))
        .catch(() => !cancelled && setDue(false));
    };
    check();
    const t = window.setInterval(check, 5 * 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [settings.reminder_enabled, settings.reminder_time, location.pathname]);

  if (!due) return null;
  return (
    <Link to="/today" className="mx-4 mb-2 flex items-center gap-3 rounded-2xl bg-brand px-4 py-3 text-white shadow-card">
      <BellRing className="h-5 w-5 shrink-0" />
      <span className="flex-1 text-sm font-bold">You haven't written today's money yet. Tap to open today's page.</span>
    </Link>
  );
}

const NUDGE_KEY = "flowz:reminder-nudge-dismissed";

/** One-time offer on the Today page to turn on phone notifications. */
export function ReminderNudge() {
  const { userId, settings } = useUser();
  const [status, setStatus] = usePushStatus();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(NUDGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [busy, setBusy] = useState(false);

  if (dismissed || !settings.reminder_enabled || status !== "off") return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(NUDGE_KEY, "1");
    } catch {
      // fine
    }
  }

  return (
    <div className="card flex items-start gap-3 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-sun-soft text-amber-700"><Bell className="h-5 w-5" /></span>
      <div className="flex-1">
        <div className="font-extrabold">Want a reminder every evening?</div>
        <p className="text-sm text-muted">We'll remind you at {prettyTime(settings.reminder_time)} on days you haven't written. Change the time in Settings.</p>
        <button
          className="btn-primary mt-3 px-4 py-2 text-sm"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const next = await turnOnPush(userId);
              setStatus(next);
              if (next === "on") dismiss();
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? <Spinner /> : "Turn on reminders"}
        </button>
      </div>
      <button onClick={dismiss} className="rounded-full p-1 text-muted hover:bg-line/50" aria-label="Not now">
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
