// Stand-in for the Supabase client in the demo build: sign-up and sign-in work against
// the browser-only demo store, so the real screens can be tried without a backend.

import { load, reset, save } from "./store";

type Listener = (event: string, session: unknown) => void;
const listeners = new Set<Listener>();

// Every visit starts on the landing page. Notebook data stays in the browser, so signing in
// again with the same email picks up where the visitor left off.
let signedInThisVisit = false;

function sessionFor(user: { id: string; email: string } | null) {
  if (!user) return null;
  return {
    access_token: "demo",
    refresh_token: "demo",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: user.id, email: user.email, aud: "authenticated", role: "authenticated" },
  };
}

function emit(event: string) {
  const s = signedInThisVisit ? sessionFor(load().user) : null;
  listeners.forEach((l) => l(event, s));
}

function signIn(email: string) {
  const data = load();
  if (!data.user || data.user.email !== email) {
    reset();
    save({ ...load(), user: { id: crypto.randomUUID(), email } });
  }
  signedInThisVisit = true;
  emit("SIGNED_IN");
  return { data: { session: sessionFor(load().user), user: load().user }, error: null };
}

export const supabase = {
  auth: {
    async getSession() {
      return { data: { session: signedInThisVisit ? sessionFor(load().user) : null }, error: null };
    },
    onAuthStateChange(cb: Listener) {
      listeners.add(cb);
      return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
    },
    async signUp({ email }: { email: string; password: string; options?: unknown }) {
      return signIn(email);
    },
    async signInWithPassword({ email }: { email: string; password: string }) {
      return signIn(email);
    },
    async signOut() {
      signedInThisVisit = false;
      reset();
      emit("SIGNED_OUT");
      return { error: null };
    },
    async resetPasswordForEmail(_email: string, _opts?: unknown) {
      return { data: {}, error: null };
    },
    async updateUser(_attrs: unknown) {
      return { data: {}, error: null };
    },
  },
};
