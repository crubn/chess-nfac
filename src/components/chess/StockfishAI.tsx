"use client";

import { useEffect, useRef } from "react";
import { useChessGame } from "@/lib/useChessGame";
import { useStockfish } from "@/lib/useStockfish";

export function StockfishAI({ enabled, skill = 10 }: { enabled: boolean; skill?: number }) {
  const { fen, turn, outcome, applyExternalMove } = useChessGame();
  const { engineReady, thinking, getBestMove } = useStockfish();
  const lastFenRef = useRef<string>("");

  useEffect(() => {
    if (!enabled) lastFenRef.current = "";
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !engineReady) return;
    if (outcome) return;
    if (turn !== "b") return;
    if (fen === lastFenRef.current) return;

    lastFenRef.current = fen;

    void getBestMove(fen, skill).then((move) => {
      if (!move) return;
      applyExternalMove(move);
    });
  }, [enabled, engineReady, fen, turn, outcome, getBestMove, skill, applyExternalMove]);

  if (!enabled || !thinking) return null;

  return (
    <div className="pointer-events-none absolute bottom-20 left-1/2 z-50 -translate-x-1/2 md:bottom-6">
      <div className="flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-black/70 px-4 py-2.5 backdrop-blur-md">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" aria-hidden />
        <p className="font-mono text-[11px] text-white/70">Stockfish думает…</p>
      </div>
    </div>
  );
}
