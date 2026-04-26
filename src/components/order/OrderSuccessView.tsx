"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { completeProOrder, type ProOrderResult } from "@/app/actions/orderSuccess";
import { OrderTrophy3D } from "@/components/order/OrderTrophy3D";

type ViewState = { status: "loading" } | { status: "done"; result: ProOrderResult };

export function OrderSuccessView({
  isDemo: demoParam,
  checkoutId,
}: {
  isDemo: boolean;
  checkoutId: string | null;
}) {
  const [st, setSt] = useState<ViewState>({ status: "loading" });

  useEffect(() => {
    let off = false;
    void (async () => {
      const result = await completeProOrder(demoParam, checkoutId);
      if (!off) setSt({ status: "done", result });
    })();
    return () => {
      off = true;
    };
  }, [demoParam, checkoutId]);

  if (st.status === "loading") {
    return (
      <div className="min-h-dvh w-full overflow-hidden bg-[#05040a] text-white">
        <div
          className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,162,39,0.12),transparent_45%),radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.4),#05040a_70%)]"
          aria-hidden
        />
        <div className="relative z-10 flex min-h-dvh items-center justify-center px-5">
          <p className="text-sm text-white/55">Подтверждаем оплату…</p>
        </div>
      </div>
    );
  }

  const { result } = st;
  const granted = result.kind === "granted";
  const isDemoMode = granted && result.mode === "demo";

  return (
    <div className="min-h-dvh w-full overflow-hidden bg-[#05040a] text-white">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,162,39,0.12),transparent_45%),radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.4),#05040a_70%)]"
        aria-hidden
      />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-5 py-20">
        <h1 className="mb-2 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          {isDemoMode
            ? "Pro unlocked (demo flow)"
            : granted
              ? "Pro subscription ready"
              : "Thanks for using NFAC"}
        </h1>
        <p className="mb-8 max-w-md text-center text-sm text-white/55">
          {isDemoMode
            ? "We marked this session as Pro for local testing. For production, wire POLAR_ACCESS_TOKEN, POLAR_PRO_PRODUCT_ID, and the webhook to Polar."
            : granted
              ? "Your checkout completed. This session is now Pro: full AI coach, both premium Vibe themes, and the complete analysis stack."
              : "If you just finished a checkout, you should be redirected with a checkout id. Otherwise open the app from the confirmation email or return to play."}
        </p>
        {granted ? (
          <div className="w-full max-w-sm border border-amber-500/20 bg-black/30 p-4 shadow-[0_0_80px_rgba(201,162,39,0.08)] backdrop-blur-2xl">
            <OrderTrophy3D />
          </div>
        ) : null}
        <div className="mt-10 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/15 py-3 text-sm font-semibold text-amber-100 transition hover:border-amber-300/50 hover:bg-amber-500/20 sm:min-w-[9rem]"
          >
            Return to the board
          </Link>
        </div>
      </div>
    </div>
  );
}
