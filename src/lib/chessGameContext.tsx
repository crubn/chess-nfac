"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Chess, type Move, type Square } from "chess.js";
import { fileRankToSquare, type PieceState } from "@/lib/chess3d";
import { getOutcomeFromChess, type EndedGameOutcome } from "@/lib/chessOutcome";

type SelectState =
  | { kind: "none" }
  | { kind: "piece"; pieceId: string; from: Square; legalTo: Square[] };

function makeId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function initPiecesFromChess(chess: Chess) {
  const board = chess.board();
  const pieces: PieceState[] = [];

  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const p = board[7 - rank]?.[file];
      if (!p) continue;
      pieces.push({
        id: makeId(),
        type: p.type,
        color: p.color,
        square: fileRankToSquare(file, rank),
      });
    }
  }

  return pieces;
}

function enPassantCapturedSquare(m: Move): Square | null {
  if (!m.flags.includes("e")) return null;
  const file = m.to.charCodeAt(0) - "a".charCodeAt(0);
  const rank = Number(m.from[1]) - 1;
  return fileRankToSquare(file, rank);
}

function rookSquaresFromCastle(m: Move): { rookFrom: Square; rookTo: Square } | null {
  if (!m.flags.includes("k") && !m.flags.includes("q")) return null;
  const rank = m.color === "w" ? "1" : "8";
  if (m.flags.includes("k")) {
    return { rookFrom: (`h${rank}` as Square), rookTo: (`f${rank}` as Square) };
  }
  return { rookFrom: (`a${rank}` as Square), rookTo: (`d${rank}` as Square) };
}

type ChessGameContextValue = {
  pieces: PieceState[];
  selectedPieceId: string | null;
  legalTargets: Set<Square>;
  onSquareClick: (square: Square) => void;
  removePiece: (id: string) => void;
  pgn: string;
  pgnLine: string;
  historySan: string[];
  turn: "w" | "b";
  /** `null` пока партия идёт; после окончания — результат. */
  outcome: EndedGameOutcome | null;
  playAgain: () => void;
};

const ChessGameContext = createContext<ChessGameContextValue | null>(null);

const emptyLegalTargets = new Set<Square>();

export function ChessGameProvider({ children }: { children: ReactNode }) {
  const chessRef = useRef(new Chess());
  const [pieces, setPieces] = useState<PieceState[]>(() => initPiecesFromChess(chessRef.current));
  const [selection, setSelection] = useState<SelectState>({ kind: "none" });
  const [moveVersion, setMoveVersion] = useState(0);

  const turn = chessRef.current.turn();

  // moveVersion: bump when chessRef mutates (hook deps can't reference chess ref contents)
  const pgn = useMemo(() => chessRef.current.pgn({ newline: " " }), [moveVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const pgnLine = useMemo(
    () => pgn.replace(/\s+/g, " ").trim() || "— (no moves yet) —",
    [pgn]
  );

  const historySan = useMemo(() => chessRef.current.history(), [moveVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const outcome = useMemo(
    () => getOutcomeFromChess(chessRef.current),
    [moveVersion] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const playAgain = useCallback(() => {
    chessRef.current = new Chess();
    setPieces(initPiecesFromChess(chessRef.current));
    setSelection({ kind: "none" });
    setMoveVersion((n) => n + 1);
  }, []);

  const pieceBySquare = useMemo(() => {
    const map = new Map<Square, PieceState>();
    for (const p of pieces) {
      if (!p.captured) map.set(p.square, p);
    }
    return map;
  }, [pieces]);

  // Stable ref when there are no legal targets so React.memo(Board) can skip re-renders.
  const legalTargets = useMemo(() => {
    if (selection.kind !== "piece") return emptyLegalTargets;
    return new Set(selection.legalTo);
  }, [selection]);

  const clearSelection = useCallback(() => setSelection({ kind: "none" }), []);

  const removePiece = useCallback((id: string) => {
    setPieces((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const selectSquare = useCallback(
    (square: Square) => {
      const piece = pieceBySquare.get(square);
      if (!piece) {
        setSelection({ kind: "none" });
        return;
      }
      if (piece.color !== turn) {
        setSelection({ kind: "none" });
        return;
      }

      const moves = chessRef.current.moves({ square, verbose: true }) as Move[];
      setSelection({
        kind: "piece",
        pieceId: piece.id,
        from: square,
        legalTo: moves.map((m) => m.to),
      });
    },
    [pieceBySquare, turn]
  );

  const tryMoveTo = useCallback(
    (to: Square) => {
      if (selection.kind !== "piece") return;
      if (!legalTargets.has(to)) return;

      const from = selection.from;
      const move = chessRef.current.move({ from, to, promotion: "q" }) as Move | null;
      if (!move) return;

      setMoveVersion((n) => n + 1);

      setPieces((prev) => {
        const next = prev.map((p) => ({ ...p }));

        const moving = next.find((p) => p.id === selection.pieceId);
        if (moving) moving.square = move.to;

        const epSquare = enPassantCapturedSquare(move);
        const captureSquare = epSquare ?? (move.captured ? move.to : null);
        if (captureSquare) {
          // Must exclude the piece that just moved: after we set moving.square to `to`, both
          // attacker and victim can share the same square — .find() would mark the wrong one.
          const victim = next.find(
            (p) =>
              !p.captured && p.square === captureSquare && p.id !== selection.pieceId
          );
          if (victim) victim.captured = true;
        }

        const rookMove = rookSquaresFromCastle(move);
        if (rookMove) {
          const rook = next.find((p) => !p.captured && p.square === rookMove.rookFrom);
          if (rook) rook.square = rookMove.rookTo;
        }

        return next;
      });

      setSelection({ kind: "none" });
    },
    [legalTargets, selection]
  );

  const interactionRef = useRef<{
    selection: SelectState;
    legalTargets: Set<Square>;
    pieceBySquare: Map<Square, PieceState>;
    turn: "w" | "b";
    clearSelection: () => void;
    selectSquare: (s: Square) => void;
    tryMoveTo: (s: Square) => void;
  } | null>(null);

  interactionRef.current = {
    selection,
    legalTargets,
    pieceBySquare,
    turn,
    clearSelection,
    selectSquare,
    tryMoveTo,
  };

  const onSquareClick = useCallback((square: Square) => {
    const i = interactionRef.current;
    if (!i) return;

    if (i.selection.kind !== "piece") {
      i.selectSquare(square);
      return;
    }

    if (square === i.selection.from) {
      i.clearSelection();
      return;
    }

    if (i.legalTargets.has(square)) {
      i.tryMoveTo(square);
      return;
    }

    const maybePiece = i.pieceBySquare.get(square);
    if (maybePiece && maybePiece.color === i.turn) {
      i.selectSquare(square);
      return;
    }
    i.clearSelection();
  }, []);

  const selectedPieceId = selection.kind === "piece" ? selection.pieceId : null;

  const value = useMemo<ChessGameContextValue>(
    () => ({
      pieces,
      selectedPieceId,
      legalTargets,
      onSquareClick,
      removePiece,
      pgn,
      pgnLine,
      historySan,
      turn,
      outcome,
      playAgain,
    }),
    [
      pieces,
      selectedPieceId,
      legalTargets,
      onSquareClick,
      removePiece,
      pgn,
      pgnLine,
      historySan,
      turn,
      outcome,
      playAgain,
    ]
  );

  return <ChessGameContext.Provider value={value}>{children}</ChessGameContext.Provider>;
}

export function useChessGame() {
  const v = useContext(ChessGameContext);
  if (!v) throw new Error("useChessGame must be used within ChessGameProvider");
  return v;
}
