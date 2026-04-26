import type { NextRequest } from "next/server";
import { Checkout } from "@polar-sh/nextjs";
import { getAppBaseUrl, getPolarServer } from "@/lib/polar/config";

const accessToken = process.env.POLAR_ACCESS_TOKEN;
/** Polar replaces {CHECKOUT_ID} when redirecting after a successful checkout (see polar.sh/docs/guides/nextjs). */
const successUrl = `${getAppBaseUrl()}/order/success?checkout_id={CHECKOUT_ID}`;
const returnUrl = getAppBaseUrl() + "/";

const polarGet = accessToken
  ? Checkout({
      accessToken,
      successUrl,
      returnUrl,
      server: getPolarServer(),
      theme: "dark",
    })
  : null;

export async function GET(req: NextRequest) {
  if (!polarGet) {
    return Response.json(
      {
        error: "Missing POLAR_ACCESS_TOKEN",
        hint: "Add POLAR_ACCESS_TOKEN and POLAR_PRO_PRODUCT_ID. For a UI-only loop: open /order/success?demo=1",
        demoPath: "/order/success?demo=1",
      },
      { status: 501 }
    );
  }
  return polarGet(req);
}
