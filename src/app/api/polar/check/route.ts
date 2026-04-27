import { NextResponse } from "next/server";
import { getIsProForCurrentSession } from "@/lib/subscription/subscriptionService";

export const dynamic = "force-dynamic";

/**
 * Minimal “Pro” check endpoint used by the client state manager.
 * Default: false unless our session resolver says otherwise.
 */
export async function GET() {
  const { isPro } = await getIsProForCurrentSession();
  return NextResponse.json({ isPro });
}

