"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type SubState = {
  isPro: boolean;
  externalUserId: string | null;
  source: string;
  ready: boolean;
  refresh: () => Promise<void>;
};

const Ctx = createContext<SubState | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [externalUserId, setExt] = useState<string | null>(null);
  const [source, setSource] = useState("none");
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const r = await fetch("/api/subscription", { cache: "no-store" });
    if (!r.ok) return;
    const j = (await r.json()) as { isPro: boolean; externalUserId: string | null; source: string };
    setIsPro(j.isPro);
    setExt(j.externalUserId);
    setSource(j.source);
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const v = useMemo<SubState>(
    () => ({ isPro, externalUserId, source, ready, refresh }),
    [isPro, externalUserId, source, ready, refresh]
  );

  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export function useSubscription() {
  const x = useContext(Ctx);
  if (!x) throw new Error("useSubscription must be used inside SubscriptionProvider");
  return x;
}
