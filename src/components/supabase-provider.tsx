"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Session, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "../lib/supabase/client";

type SupabaseContextValue = {
  supabase: SupabaseClient;
  session: Session | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
};

const SupabaseContext = createContext<SupabaseContextValue | undefined>(
  undefined,
);

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (!error) {
        setSession(data.session);
      }
      setLoading(false);
    };
    load();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      },
    );

    return () => {
      active = false;
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);

  const value: SupabaseContextValue = {
    supabase,
    session,
    loading,
    refreshSession: async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    },
    signOut: async () => {
      await supabase.auth.signOut();
      setSession(null);
    },
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error("useSupabase must be used within SupabaseProvider");
  return ctx;
}
