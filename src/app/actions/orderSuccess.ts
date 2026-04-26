"use server";

import { cookies } from "next/headers";
import { Polar } from "@polar-sh/sdk";
import { setProForExternalUser } from "@/lib/subscription/memoryStore";
import { PRO_SESSION_COOKIE, UID_COOKIE } from "@/lib/subscription/cookies";
import { getPolarServer } from "@/lib/polar/config";

const ONE_YEAR = 60 * 60 * 24 * 365;

async function verifyCheckout(checkoutId: string): Promise<boolean> {
  const token = process.env.POLAR_ACCESS_TOKEN;
  if (!token) return false;
  try {
    const polar = new Polar({ accessToken: token, server: getPolarServer() });
    const ch = await polar.checkouts.get({ id: checkoutId });
    return ch.status === "succeeded";
  } catch {
    return false;
  }
}

export type ProOrderResult =
  | { kind: "granted"; mode: "demo" | "checkout" }
  | { kind: "not_granted" };

/**
 * Можно вызывать только из Server Action (или Route Handler) — нельзя из RSC.
 */
export async function completeProOrder(
  isDemo: boolean,
  checkoutId: string | null
): Promise<ProOrderResult> {
  const isVerified =
    isDemo || (checkoutId ? await verifyCheckout(checkoutId) : false);
  if (!isVerified) {
    return { kind: "not_granted" };
  }

  const store = await cookies();
  const uid = store.get(UID_COOKIE)?.value;
  if (uid) {
    setProForExternalUser(uid, { isPro: true });
  }

  store.set(PRO_SESSION_COOKIE, "1", {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
    httpOnly: true,
  });

  return { kind: "granted", mode: isDemo ? "demo" : "checkout" };
}
