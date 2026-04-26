import { NextResponse } from "next/server";
import { getIsProForCurrentSession } from "@/lib/subscription/subscriptionService";
import { cookies } from "next/headers";
import { UID_COOKIE } from "@/lib/subscription/cookies";

export const dynamic = "force-dynamic";

export async function GET() {
  const { isPro, externalUserId, source } = await getIsProForCurrentSession();
  const uid = (await cookies()).get(UID_COOKIE)?.value ?? externalUserId;
  return NextResponse.json({ isPro, externalUserId: uid ?? null, source });
}
