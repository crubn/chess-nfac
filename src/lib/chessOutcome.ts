import type { Chess } from "chess.js";

export type EndedGameOutcome = {
  result: "white" | "black" | "draw";
  reason: "checkmate" | "stalemate" | "insufficient" | "threefold" | "fifty" | "draw";
};

/** `null` while the game is ongoing. */
export function getOutcomeFromChess(c: Chess): EndedGameOutcome | null {
  if (!c.isGameOver()) return null;
  if (c.isCheckmate()) {
    const mated = c.turn();
    return { result: mated === "w" ? "black" : "white", reason: "checkmate" };
  }
  if (c.isStalemate()) return { result: "draw", reason: "stalemate" };
  if (c.isInsufficientMaterial()) return { result: "draw", reason: "insufficient" };
  if (c.isThreefoldRepetition()) return { result: "draw", reason: "threefold" };
  if (c.isDrawByFiftyMoves()) return { result: "draw", reason: "fifty" };
  return { result: "draw", reason: "draw" };
}
