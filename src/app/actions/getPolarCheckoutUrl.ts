"use server";

import { cookies } from "next/headers";
import { Polar } from "@polar-sh/sdk";
import { UID_COOKIE } from "@/lib/subscription/cookies";
import { getAppBaseUrl, getPolarServer, getPolarProProductId } from "@/lib/polar/config";

/**
 * Creates a Polar checkout session and returns the hosted URL.
 * Uses SDK directly per product requirement.
 */
export async function getPolarCheckoutUrl(): Promise<string> {
  // Demo fallback for local UX if token not set.
  const token = process.env.POLAR_ACCESS_TOKEN;
  if (!token) {
    return `${getAppBaseUrl()}/order/success?demo=1&no_token=1`;
  }

  const uid = (await cookies()).get(UID_COOKIE)?.value;
  const productId = getPolarProProductId();

  const polar = new Polar({ accessToken: token, server: getPolarServer() });
  const checkout = await polar.checkouts.create({
    products: [productId],
    successUrl: `${getAppBaseUrl()}/order/success?checkout_id={CHECKOUT_ID}`,
    externalCustomerId: uid ?? undefined,
  });

  return checkout.url;
}

