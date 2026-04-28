import type { PieceSymbol, Color } from "chess.js";

/** Self-hosted in `/public` so the board works when external CDNs are slow or blocked. */
function getNextBuildId(): string | null {
  // Next.js exposes buildId on the client via __NEXT_DATA__. It changes each deployment.
  if (typeof window === "undefined") return null;
  const anyGlobal = globalThis as unknown as { __NEXT_DATA__?: { buildId?: string } };
  return anyGlobal.__NEXT_DATA__?.buildId ?? null;
}

export function getGltfUrl(): string {
  const buildId = getNextBuildId();
  const v =
    buildId ??
    process.env.NEXT_PUBLIC_ASSET_VERSION ??
    "dev";
  return `/models/ABeautifulGame.glb?v=${encodeURIComponent(v)}`;
}

const GLTF_URL = getGltfUrl();

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
      // NOTE: ABeautifulGame.glb may not include pawn meshes at all, and some assets nest pawns
      // under unexpected nodes. `PieceGltfModel` resolves pawns dynamically (or generates a
      // procedural pawn fallback) so we return a sentinel here.
      return `__PAWN__${c}${n}` as const;
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
      return `__PAWN__W${n}`;
  }
}
