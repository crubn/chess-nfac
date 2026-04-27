"use client";

import { create } from "zustand";

type ProState = {
  isPro: boolean;
  ready: boolean;
  /** Fetches current session pro status from `/api/polar/check`. */
  checkSubscriptionStatus: () => Promise<void>;
  /** Local override (used after success page completes). */
  setIsPro: (v: boolean) => void;
};

export const useProStore = create<ProState>((set) => ({
  isPro: false,
  ready: false,
  setIsPro: (v) => set({ isPro: v, ready: true }),
  checkSubscriptionStatus: async () => {
    try {
      const r = await fetch("/api/polar/check", { cache: "no-store" });
      if (!r.ok) {
        set({ isPro: false, ready: true });
        return;
      }
      const j = (await r.json()) as { isPro?: boolean };
      set({ isPro: Boolean(j?.isPro), ready: true });
    } catch {
      // Default false, but mark ready so UI can show teasers.
      set({ isPro: false, ready: true });
    }
  },
}));

/** Convenience function (matches requested name). */
export async function checkSubscriptionStatus() {
  return useProStore.getState().checkSubscriptionStatus();
}

