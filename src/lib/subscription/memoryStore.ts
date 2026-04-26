/**
 * In-process subscription cache keyed by external customer id (Polar `customerExternalId` + webhooks).
 * In production, use Supabase/Postgres — see `syncProToDatabase` in the webhook route.
 */

type Row = { isPro: boolean; customerId?: string; subscriptionId?: string; updatedAt: number };

const g = globalThis as unknown as { __nfacSubStore?: Map<string, Row> };
g.__nfacSubStore ??= new Map<string, Row>();
const store = g.__nfacSubStore;

export function setProForExternalUser(
  externalUserId: string,
  patch: { isPro: boolean; customerId?: string; subscriptionId?: string }
) {
  const prev = store.get(externalUserId) ?? { isPro: false, updatedAt: 0 };
  store.set(externalUserId, {
    ...prev,
    isPro: patch.isPro,
    customerId: patch.customerId ?? prev.customerId,
    subscriptionId: patch.subscriptionId ?? prev.subscriptionId,
    updatedAt: Date.now(),
  });
}

export function getProForExternalUser(externalUserId: string | undefined): boolean {
  if (!externalUserId) return false;
  return store.get(externalUserId)?.isPro === true;
}

export function getStoreSnapshot(): Map<string, Row> {
  return new Map(store);
}
