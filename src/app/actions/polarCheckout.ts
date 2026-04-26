"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getPolarProProductId } from "@/lib/polar/config";
import { UID_COOKIE } from "@/lib/subscription/cookies";

/**
 * Server action: start Polar hosted checkout. Requires `POLAR_ACCESS_TOKEN` and product id in env.
 * Without a token, redirects to a demo Pro success (local only when explicitly allowed).
 */
export async function startProCheckout() {
  const productId = getPolarProProductId();
  if (process.env.SUBSCRIPTION_MOCK_PRO === "true") {
    redirect("/order/success?demo=1&mock=env");
  }
  if (!process.env.POLAR_ACCESS_TOKEN) {
    redirect("/order/success?demo=1&no_token=1");
  }
  const c = await cookies();
  const uid = c.get(UID_COOKIE)?.value;
  if (!uid) {
    redirect("/?checkout=err_no_uid");
  }
  const p = new URLSearchParams();
  p.set("products", productId);
  p.set("customerExternalId", uid);
  redirect(`/api/checkout/polar?${p.toString()}`);
}
