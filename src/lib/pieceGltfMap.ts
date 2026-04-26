import type { PieceSymbol, Color } from "chess.js";

const GLTF_URL =
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/ABeautifulGame/glTF-Binary/ABeautifulGame.glb";

export { GLTF_URL };

/**
 * A Beautiful Game (Khronos): mesh names. One template per type+color; reused for all instances.
 * See: https://github.com/KhronosGroup/glTF-Sample-Assets/blob/main/Models/ABeautifulGame/
 */
export function getPieceTemplateNodeName(type: PieceSymbol, color: Color): string {
  const c = color === "w" ? "W" : "B";
  const n = c === "W" ? 1 : 1;
  switch (type) {
    case "p":
      return `Pawn_Body_${c}1` as const;
    case "r":
      return `Castle_${c}${n}` as const;
    case "n":
      return `Knight_${c}${n}` as const;
    case "b":
      return `Bishop_${c}${n}` as const;
    case "q":
      // Black: glTF node names are swapped vs actual crown/cross geometry (FIDE: queen d8, king e8).
      if (c === "B") return "King_B" as const;
      return `Queen_${c}` as const;
    case "k":
      if (c === "B") return "Queen_B" as const;
      return `King_${c}` as const;
    default:
      return `Pawn_Body_W1`;
  }
}
