import type { PieceSymbol } from "chess.js";

/**
 * Per-piece-type proportional tuning within the shared glTF scale constraints.
 * This runs AFTER base normalization in `PieceGltfModel` (all types fit to a shared target height).
 * Use this to restore natural chess proportions (K tallest, P shortest).
 */
export function getMassScaleForPieceType(
  type: PieceSymbol
): { xz: number; y: number } {
  switch (type) {
    case "p":
      // Target ~0.55 * CELL_SIZE relative to `TARGET_PIECE_HEIGHT = 0.92 * CELL_SIZE`.
      return { xz: 0.82, y: 0.6 };
    case "r":
      return { xz: 1.02, y: 0.9 };
    case "n":
      return { xz: 1.01, y: 0.92 };
    case "b":
      return { xz: 1.0, y: 0.95 };
    case "q":
      return { xz: 1.0, y: 1.0 };
    case "k":
      return { xz: 1.0, y: 1.05 };
    default:
      return { xz: 1.0, y: 1.0 };
  }
}
