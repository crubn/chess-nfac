import type { PieceSymbol } from "chess.js";

/**
 * Per-piece-type proportional tuning within the shared glTF scale constraints.
 * - xz ≈ 1: minimal footprint inflation — rooks get a tiny base boost only.
 * - y > 1 on K/Q: king and queen read as the tallest pieces on the board.
 * Pawns are neutral (1.0/1.0) so they stay clearly the smallest.
 */
export function getMassScaleForPieceType(
  type: PieceSymbol
): { xz: number; y: number } {
  switch (type) {
    case "p":
      return { xz: 1.0, y: 1.0 };
    case "r":
      return { xz: 1.02, y: 0.98 };
    case "n":
      return { xz: 1.01, y: 1.0 };
    case "b":
      return { xz: 1.0, y: 1.02 };
    case "q":
      return { xz: 1.0, y: 1.04 };
    case "k":
      return { xz: 1.0, y: 1.05 };
    default:
      return { xz: 1.0, y: 1.0 };
  }
}
