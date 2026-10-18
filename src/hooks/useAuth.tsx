import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getSettings, type Settings } from "@/lib/api";

interface AuthState {
  session: Session | null;
  settings: Settings | null;
  loading: boolean;
  setSettings: (s: Settings) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async (s: Session | null) => {
    if (!s) {
      setSettings(null);
      setLoading(false);
      return;
    }
    try {
      setSettings(await getSettings());
    } catch (e) {
      console.error(e);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      loadSettings(data.session);
    });
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        setLoading(true);
        // Run outside the auth callback so Supabase isn't called while it holds its lock.
        setTimeout(() => loadSettings(s), 0);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [loadSettings]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ session, settings, loading, setSettings, signOut }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/** For screens that are only shown once signed in and set up. */
export function useUser() {
  const { session, settings } = useAuth();
  if (!session || !settings) throw new Error("useUser used outside a signed-in screen");
  return { userId: session.user.id, settings };
}
