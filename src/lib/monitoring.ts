// Error tracking with Sentry: when something breaks on a user's phone, the error (not their data)
// is reported so it can be fixed. Only on the live site; the demo uses src/demo/monitoring.ts.
//
// Privacy: no screen recording, no notebook text, amounts or names, no console output, and no web
// addresses' query or "#" part (sign-in and password-reset links carry tokens there).

import * as Sentry from "@sentry/react";

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const on = Boolean(dsn) && import.meta.env.PROD;

/** "https://x.supabase.co/rest/v1/entries?text=ilike.%rice%" → "https://x.supabase.co/rest/v1/entries" */
export function withoutQuery(url: string) {
  return url.split(/[?#]/)[0];
}

export function startMonitoring() {
  if (!on) return;
  Sentry.init({
    dsn,
    environment: location.hostname === "www.flowz.ng" || location.hostname === "flowz.ng" ? "production" : "preview",
    // Collect nothing personal: no cookies, headers, request bodies or query parameters.
    dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false },
    beforeBreadcrumb(crumb) {
      // Console messages and typing can contain what people wrote.
      if (crumb.category === "console" || crumb.category === "ui.input") return null;
      if (crumb.data) {
        for (const key of ["url", "from", "to"]) {
          const value = crumb.data[key];
          if (typeof value === "string") crumb.data[key] = withoutQuery(value);
        }
      }
      return crumb;
    },
    beforeSend(event) {
      if (event.request) {
        if (event.request.url) event.request.url = withoutQuery(event.request.url);
        delete event.request.query_string;
        delete event.request.cookies;
        delete event.request.data;
      }
      return event;
    },
  });
}

/** Tie errors to an anonymous account id (never an email or name), so repeat problems can be seen. */
export function setMonitoringUser(id: string | null) {
  if (on) Sentry.setUser(id ? { id } : null);
}

export const ErrorBoundary = Sentry.ErrorBoundary;
