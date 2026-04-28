import type { LoggedMove } from "@/lib/chessGameContext";
import type { Square } from "chess.js";
import type { VibeTheme } from "@/lib/vibeTheme";

export type MpHello = { t: "hello"; clientId: string; isPro: boolean };
export type MpState = {
  t: "state";
  from: string;
  fen: string;
  moveLog: LoggedMove[];
  vibe?: VibeTheme;
};
export type MpMove = { t: "move"; from: string; m: { from: Square; to: Square; promotion?: "q" | "r" | "b" | "n" } };
export type MpVibe = { t: "vibe"; from: string; vibe: VibeTheme };

export type MpMsg = MpHello | MpState | MpMove | MpVibe;

