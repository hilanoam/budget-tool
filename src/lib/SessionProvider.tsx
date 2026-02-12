"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

type SessionCtx = {
  userId: string | null;
  ready: boolean;
};

const Ctx = createContext<SessionCtx>({ userId: null, ready: false });

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      setUserId(data.session?.user.id ?? null);
      setReady(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      setReady(true);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return <Ctx.Provider value={{ userId, ready }}>{children}</Ctx.Provider>;
}

export function useSessionUser() {
  return useContext(Ctx);
}
