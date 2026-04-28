"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ChessGameProvider } from "@/lib/useChessGame";
import { ChessOverlay } from "@/components/chess/ChessOverlay";
import { AssetPreload } from "@/components/chess/AssetPreload";
import { SubscriptionProvider } from "@/components/subscription/SubscriptionContext";
import type { VibeTheme } from "@/lib/vibeTheme";

const ChessScene = dynamic(
  () => import("@/components/chess/ChessScene").then((m) => m.ChessScene),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-[#0A0F1A] text-sm text-white/55">
        Loading 3D board…
      </div>
    ),
  }
);

export function ChessApp() {
  const [vibe, setVibe] = useState<VibeTheme>("standard");

  return (
    <ChessGameProvider>
      <AssetPreload />
      <div className="relative h-dvh w-full overflow-hidden bg-[#0A0F1A] text-white">
        <div className="absolute inset-0 z-0">
          <ChessScene key={vibe} vibe={vibe} />
        </div>

        <SubscriptionProvider>
          <ChessOverlay vibe={vibe} onVibeChange={setVibe} />
        </SubscriptionProvider>

        <div className="pointer-events-none absolute bottom-2 left-0 right-0 z-10 mx-auto max-w-sm px-3 sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-md">
          <p className="text-center text-[9px] text-white/50 sm:text-left sm:text-[10px]">
            Select a piece, then a highlighted square. Vibe theme updates the board live.
          </p>
        </div>
      </div>
    </ChessGameProvider>
  );
}
