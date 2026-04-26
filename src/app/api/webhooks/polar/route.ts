import { Webhooks } from "@polar-sh/nextjs";
import type { NextRequest } from "next/server";
import type { Subscription } from "@polar-sh/sdk/models/components/subscription";
import { setProForExternalUser } from "@/lib/subscription/memoryStore";
import { syncProToDatabase } from "@/lib/subscription/syncProToDatabase";

const secret = process.env.POLAR_WEBHOOK_SECRET;

function isProFromSubscription(s: Subscription) {
  const st = String(s.status);
  return st === "active" || st === "trialing";
}

async function applySubscriptionPro(_kind: string, data: Subscription) {
  const ext = data.customer?.externalId;
  if (!ext) {
    return;
  }
  const pro = isProFromSubscription(data);
  setProForExternalUser(ext, {
    isPro: pro,
    customerId: data.customerId,
    subscriptionId: data.id,
  });
  await syncProToDatabase({
    externalUserId: ext,
    isPro: pro,
    polarCustomerId: data.customerId,
    subscriptionId: data.id,
  });
}

const noSecret = async () =>
  new Response(JSON.stringify({ received: false, error: "POLAR_WEBHOOK_SECRET not set" }), { status: 501 });

// Inferred types come from @polar-sh/adapter-utils’ nested @polar-sh/sdk; use structural cast to avoid duplicate-sdk conflicts.
type WithSubscription = { data: Subscription };

const handler = secret
  ? Webhooks({
      webhookSecret: secret,
      onSubscriptionCreated: async (payload) => {
        await applySubscriptionPro("subscription.created", (payload as WithSubscription).data);
      },
      onSubscriptionUpdated: async (payload) => {
        await applySubscriptionPro("subscription.updated", (payload as WithSubscription).data);
      },
      onSubscriptionActive: async (payload) => {
        await applySubscriptionPro("subscription.active", (payload as WithSubscription).data);
      },
      // Revoke Pro when subscription is fully ended (past billing period).
      onSubscriptionRevoked: async (payload) => {
        await applySubscriptionPro("subscription.revoked", (payload as WithSubscription).data);
      },
      // Cancellation fires when user cancels but may still be in active period;
      // applySubscriptionPro checks the current status so Pro is kept until period ends.
      onSubscriptionCanceled: async (payload) => {
        await applySubscriptionPro("subscription.canceled", (payload as WithSubscription).data);
      },
    })
  : null;

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!handler) {
    return noSecret();
  }
  return handler(request);
}
