import type { PieceSymbol } from "chess.js";

/**
 * Per-piece-type mass tuning on the shared glTF clones (non-uniform scale).
 * - xz > 1: thicker plan silhouette (wider bases & stems) — the main "fatten" pass.
 * - y < 1: slight vertical squash so width gains read as added mass, not just height.
 * All 8 pawns use the same `p` profile → identical geometry treatment.
 * R/N/B get stronger xz so spindly silhouettes in the source feel as solid as K/Q.
 */
export function getMassScaleForPieceType(
  type: PieceSymbol
): { xz: number; y: number } {
  switch (type) {
    case "p":
      return { xz: 1.05, y: 0.995 };
    case "r":
      return { xz: 1.1, y: 0.99 };
    case "n":
      return { xz: 1.08, y: 0.99 };
    case "b":
      return { xz: 1.07, y: 0.99 };
    case "q":
      return { xz: 1.03, y: 0.997 };
    case "k":
      return { xz: 1.02, y: 0.997 };
    default:
      return { xz: 1.05, y: 0.995 };
  }
}
