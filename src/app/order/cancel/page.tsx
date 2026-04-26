import Link from "next/link";
import { OrderTrophy3D } from "@/components/order/OrderTrophy3D";

export const dynamic = "force-dynamic";

export default function OrderCancelPage() {
  return (
    <div className="min-h-dvh w-full overflow-hidden bg-[#05040a] text-white">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(80,80,120,0.15),transparent_40%)]"
        aria-hidden
      />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-5 py-20">
        <h1 className="mb-2 text-center text-2xl font-semibold tracking-tight sm:text-3xl text-white/90">
          Checkout closed
        </h1>
        <p className="mb-8 max-w-md text-center text-sm text-white/50">
          No problem — you can upgrade anytime. Your game and Vibe are unchanged.
        </p>
        <div className="w-full max-w-sm border border-white/10 bg-white/[0.03] p-4 opacity-50 backdrop-blur-xl">
          <div className="h-40 sm:h-52">
            <div className="h-full w-full scale-90">
              <OrderTrophy3D />
            </div>
          </div>
        </div>
        <Link
          href="/"
          className="mt-10 inline-flex min-w-[9rem] items-center justify-center rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-medium text-white/80 transition hover:border-amber-400/30 hover:bg-amber-500/10"
        >
          Back to the board
        </Link>
      </div>
    </div>
  );
}
