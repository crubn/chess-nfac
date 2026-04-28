import type { PieceSymbol, Color, Square } from "chess.js";

export type PieceType = Exclude<PieceSymbol, "p"> | "p";
export type ChessColor = Color;

export const CELL_SIZE = 1;
export const BOARD_SIZE = 8;
// For an 8x8 board, cell centers map to world coords -3.5..3.5 when CELL_SIZE=1.
export const BOARD_OFFSET = (BOARD_SIZE - 1) / 2; // 3.5 at default settings
export const BOARD_CENTER = { x: 0, y: 0, z: 0 } as const;

export function squareToWorld(square: Square) {
  const file = square.charCodeAt(0) - "a".charCodeAt(0); // 0..7
  const rank = Number(square[1]) - 1; // 0..7 (rank 1 -> 0)

  // a1 is bottom-left from White's POV
  // Put cell centers into board-centered world coordinates.
  // Required mapping:
  // x = (colIndex - 3.5) * cellSize
  // z = (rowIndex - 3.5) * cellSize
  const x = (file - BOARD_OFFSET) * CELL_SIZE;
  const z = (rank - BOARD_OFFSET) * CELL_SIZE;
  return { x, y: 0, z };
}

export function fileRankToSquare(file: number, rank: number): Square {
  const f = String.fromCharCode("a".charCodeAt(0) + file);
  const r = String(rank + 1);
  return `${f}${r}` as Square;
}

export function isDarkSquare(square: Square) {
  const file = square.charCodeAt(0) - "a".charCodeAt(0);
  const rank = Number(square[1]) - 1;
  // a1 is dark in standard chessboards
  return (file + rank) % 2 === 0;
}

export type PieceState = {
  id: string;
  type: PieceSymbol;
  color: Color;
  square: Square;
  captured?: boolean;
};

