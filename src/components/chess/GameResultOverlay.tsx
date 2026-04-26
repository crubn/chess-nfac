"use client";

import { useChessGame } from "@/lib/useChessGame";
import type { EndedGameOutcome } from "@/lib/chessOutcome";

/** Mayon в боковой панели — играет белыми. */
const USER_IS = "white" as const;

const CONFETTI = [12, 7, 19, 4, 16, 22, 9, 14, 3, 18, 6, 11, 2, 20, 5];

function reasonLine(o: EndedGameOutcome): string {
  if (o.reason === "stalemate") return "Пат";
  if (o.reason === "insufficient") return "Недостаточно материала";
  if (o.reason === "threefold") return "Трёхкратное повторение";
  if (o.reason === "fifty") return "Правило 50 ходов";
  return "Ничья";
}

export function GameResultOverlay() {
  const { outcome, playAgain } = useChessGame();
  if (!outcome) return null;

  const userWon = outcome.result === USER_IS;
  const userLost = outcome.result !== "draw" && !userWon;
  const isDraw = outcome.result === "draw";

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Результат партии"
    >
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" aria-hidden />
        {userWon && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            {CONFETTI.map((left, i) => (
              <span
                key={i}
                className="nfac-confetti absolute top-0 h-2 w-1 rounded-sm opacity-80"
                style={{
                  left: `${left}%`,
                  background: i % 2 ? "linear-gradient(180deg,#fbbf24,#b45309)" : "linear-gradient(180deg,#fde68a,#d97706)",
                  animation: `nfac-confetti-fall ${2.3 + (i % 4) * 0.2}s ease-in ${i * 0.04}s forwards`,
                }}
              />
            ))}
          </div>
        )}

      <div className="nfac-victory-card relative z-10 w-full max-w-sm rounded-2xl border border-amber-400/35 bg-gradient-to-b from-[#12100e] to-[#05040a] p-6 text-center text-white shadow-[0_0_80px_rgba(201,162,39,0.2)]">
        {userWon && (
          <p className="mb-1 text-4xl drop-shadow-lg" aria-hidden>
            🏆
          </p>
        )}
        <h2
          className={[
            "text-xl font-semibold tracking-tight",
            userWon ? "text-amber-100" : isDraw ? "text-white/90" : "text-rose-100/95",
          ].join(" ")}
        >
          {userWon && "Победа!"}
          {userLost && "Соперник поставил мат"}
          {isDraw && "Ничья"}
        </h2>
        <p className="mt-2 text-sm text-white/60">
          {userWon && "Белыми сделан мат. Отлично сыграно, Mayon."}
          {userLost && "Чёрные (oversend) выиграли эту партию."}
          {isDraw && reasonLine(outcome)}
        </p>
        {userWon && (
          <p className="mt-3 text-[10px] uppercase tracking-[0.35em] text-amber-300/60">Nfac · checkmate</p>
        )}
        <button
          type="button"
          onClick={playAgain}
          className="mt-6 w-full rounded-xl border border-amber-400/40 bg-amber-500/20 py-3 text-sm font-semibold text-amber-50 transition hover:border-amber-300/50 hover:bg-amber-500/30"
        >
          Сыграть снова
        </button>
      </div>
    </div>
  );
}
