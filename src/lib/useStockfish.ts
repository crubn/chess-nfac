"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Square } from "chess.js";

export type StockfishMove = {
  from: Square;
  to: Square;
  promotion?: "q" | "r" | "b" | "n";
};

export function useStockfish() {
  const workerRef = useRef<Worker | null>(null);
  const resolveRef = useRef<((move: StockfishMove | null) => void) | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [thinking, setThinking] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const worker = new Worker("/stockfish-18-lite-single.js");
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<string>) => {
      const line = e.data;
      if (line === "uciok") {
        worker.postMessage("isready");
      }
      if (line === "readyok") {
        setEngineReady(true);
      }
      if (line.startsWith("bestmove")) {
        const moveStr = line.split(" ")[1];
        const resolve = resolveRef.current;
        resolveRef.current = null;
        setThinking(false);

        if (!resolve) return;
        if (!moveStr || moveStr === "(none)") {
          resolve(null);
          return;
        }

        const from = moveStr.slice(0, 2) as Square;
        const to = moveStr.slice(2, 4) as Square;
        const promo = moveStr[4] as "q" | "r" | "b" | "n" | undefined;
        resolve({ from, to, promotion: promo });
      }
    };

    worker.onerror = () => {
      resolveRef.current?.(null);
      resolveRef.current = null;
      setThinking(false);
    };

    worker.postMessage("uci");

    return () => {
      worker.postMessage("quit");
      workerRef.current = null;
    };
  }, []);

  const getBestMove = useCallback(
    (fen: string, skill = 10): Promise<StockfishMove | null> => {
      const worker = workerRef.current;
      if (!worker) return Promise.resolve(null);

      if (resolveRef.current) {
        resolveRef.current(null);
        resolveRef.current = null;
        worker.postMessage("stop");
      }

      setThinking(true);

      return new Promise((resolve) => {
        resolveRef.current = resolve;
        worker.postMessage(`setoption name Skill Level value ${skill}`);
        worker.postMessage(`position fen ${fen}`);
        worker.postMessage("go movetime 800");
      });
    },
    []
  );

  const stopSearch = useCallback(() => {
    const worker = workerRef.current;
    if (!worker) return;
    if (resolveRef.current) {
      resolveRef.current(null);
      resolveRef.current = null;
      worker.postMessage("stop");
      setThinking(false);
    }
  }, []);

  return { engineReady, thinking, getBestMove, stopSearch };
}
