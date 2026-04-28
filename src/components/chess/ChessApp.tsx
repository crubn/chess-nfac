"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ChessGameProvider } from "@/lib/useChessGame";
import { ChessOverlay } from "@/components/chess/ChessOverlay";
import { AssetPreload } from "@/components/chess/AssetPreload";
import { SubscriptionProvider } from "@/components/subscription/SubscriptionContext";
import type { VibeTheme } from "@/lib/vibeTheme";
import { MultiplayerBridge } from "@/lib/multiplayer/MultiplayerBridge";
import { StockfishAI } from "@/components/chess/StockfishAI";

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

export function ChessApp({ roomId }: { roomId?: string | null } = {}) {
  const [vibe, setVibe] = useState<VibeTheme>("standard");
  const [systemDesignMode, setSystemDesignMode] = useState(false);
  const [vsAI, setVsAI] = useState(false);
  const [mpPresence, setMpPresence] = useState<{ connected: boolean; peerSeen: boolean; peerIsPro: boolean | null }>({
    connected: false,
    peerSeen: false,
    peerIsPro: null,
  });

  return (
    <ChessGameProvider>
      <AssetPreload />
      <div className="relative h-dvh w-full overflow-hidden bg-[#0A0F1A] text-white">
        <div className="absolute inset-0 z-0">
          <ChessScene key={vibe} vibe={vibe} />
        </div>

        {systemDesignMode && (
          <div
            className="pointer-events-none absolute inset-0 z-[5] opacity-30 mix-blend-screen"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(56,189,248,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(56,189,248,0.22) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
            aria-hidden
          />
        )}

        <SubscriptionProvider>
          <ChessOverlay
            vibe={vibe}
            onVibeChange={setVibe}
            roomId={roomId ?? null}
            mpPresence={mpPresence}
            systemDesignMode={systemDesignMode}
            onSystemDesignModeChange={setSystemDesignMode}
            vsAI={vsAI}
            onVsAIChange={setVsAI}
          />
        </SubscriptionProvider>

        <StockfishAI enabled={vsAI} skill={10} />

        <MultiplayerBridge
          roomId={roomId ?? null}
          vibe={vibe}
          onVibeChange={setVibe}
          onPresenceChange={setMpPresence}
        />

        <div className="pointer-events-none absolute bottom-2 left-0 right-0 z-10 mx-auto hidden max-w-sm px-3 sm:bottom-4 sm:left-auto sm:right-4 sm:block sm:max-w-md">
          <p className="text-right text-[9px] text-white/35 sm:text-[10px]">
            BigTech Interview Chess · Select a piece, then a highlighted square.
          </p>
        </div>
      </div>
    </ChessGameProvider>
  );
}
