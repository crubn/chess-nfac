import { OrderSuccessView } from "@/components/order/OrderSuccessView";

export const dynamic = "force-dynamic";

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const isDemo = first(sp?.demo) === "1";
  const checkoutId =
    first(sp?.checkout_id) ?? first(sp?.checkoutId) ?? null;
  return (
    <OrderSuccessView
      isDemo={isDemo}
      checkoutId={checkoutId ?? null}
    />
  );
}
