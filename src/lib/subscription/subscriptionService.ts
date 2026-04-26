import { cookies } from "next/headers";
import { getProForExternalUser } from "@/lib/subscription/memoryStore";
import { PRO_SESSION_COOKIE, UID_COOKIE } from "@/lib/subscription/cookies";

const MOCK_PRO =
  process.env.NEXT_PUBLIC_SUBSCRIPTION_MOCK === "pro" ||
  process.env.SUBSCRIPTION_MOCK_PRO === "true";

/**
 * Resolves “Pro” for the current browser session.
 * - `nfa_pro=1` cookie: set after successful checkout (or dev tools), fast path.
 * - In-memory: updated by Polar webhooks (`customer.externalId` must match `nfa_uid` cookie).
 * - Mock: `NEXT_PUBLIC_SUBSCRIPTION_MOCK=pro` for UI demos.
 */
export async function getIsProForCurrentSession(): Promise<{
  isPro: boolean;
  externalUserId: string | null;
  source: "cookie" | "memory" | "mock" | "none";
}> {
  if (MOCK_PRO) {
    return { isPro: true, externalUserId: "mock", source: "mock" };
  }
  const jar = await cookies();
  const proCookie = jar.get(PRO_SESSION_COOKIE)?.value;
  if (proCookie === "1" || proCookie === "true") {
    return { isPro: true, externalUserId: jar.get(UID_COOKIE)?.value ?? null, source: "cookie" };
  }
  const uid = jar.get(UID_COOKIE)?.value;
  if (uid && getProForExternalUser(uid)) {
    return { isPro: true, externalUserId: uid, source: "memory" };
  }
  return { isPro: false, externalUserId: uid ?? null, source: "none" };
}
