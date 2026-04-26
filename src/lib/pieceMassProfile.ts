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
      return { xz: 1.2, y: 0.985 };
    case "r":
      return { xz: 1.32, y: 0.968 };
    case "n":
      return { xz: 1.28, y: 0.97 };
    case "b":
      return { xz: 1.27, y: 0.97 };
    case "q":
      return { xz: 1.1, y: 0.992 };
    case "k":
      return { xz: 1.08, y: 0.995 };
    default:
      return { xz: 1.12, y: 0.99 };
  }
}
