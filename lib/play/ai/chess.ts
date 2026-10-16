import { chooseScoredMove } from "@/lib/play/cpu/difficulty";
import { pickRandom } from "@/lib/play/cpu/random";
import type { CpuDifficulty } from "@/lib/play/cpu/types";
import {
  applyChessMove,
  chessMoves,
  chessStatus,
  type ChessMove,
  type ChessState,
} from "@/lib/play/chess";

const PIECE_VALUE: Record<string, number> = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 20_000,
};

function material(state: ChessState, player: 0 | 1): number {
  let total = 0;
  for (const cell of state.board) {
    if (!cell || cell.player !== player) continue;
    total += PIECE_VALUE[cell.type] ?? 0;
  }
  return total;
}

function evaluate(state: ChessState, perspective: 0 | 1): number {
  const opp = perspective === 0 ? 1 : 0;
  const status = chessStatus(state);
  if (status.kind === "checkmate") {
    return status.winner === perspective ? 1_000_000 : -1_000_000;
  }
  return material(state, perspective) - material(state, opp);
}

function search(state: ChessState, depth: number, perspective: 0 | 1): number {
  const status = chessStatus(state);
  if (depth === 0 || status.kind === "checkmate" || status.kind === "stalemate") {
    return evaluate(state, perspective);
  }
  const moves = chessMoves(state);
  if (moves.length === 0) return evaluate(state, perspective);

  if (state.current === perspective) {
    let best = -Infinity;
    for (const move of moves) {
      const next = applyChessMove(state, move);
      best = Math.max(best, search(next, depth - 1, perspective));
    }
    return best;
  }

  let best = Infinity;
  for (const move of moves) {
    const next = applyChessMove(state, move);
    best = Math.min(best, search(next, depth - 1, perspective));
  }
  return best;
}

export function chooseChessMove(
  state: ChessState,
  difficulty: CpuDifficulty,
  cpuPlayer: 0 | 1
): ChessMove | null {
  if (state.current !== cpuPlayer) return null;
  const legal = chessMoves(state);
  if (legal.length === 0) return null;

  const depth = difficulty === "hard" ? 3 : difficulty === "normal" ? 2 : 1;

  if (difficulty !== "easy") {
    let best: ChessMove | null = null;
    let bestScore = -Infinity;
    for (const move of legal) {
      const next = applyChessMove(state, move);
      const score = search(next, depth - 1, cpuPlayer);
      if (score > bestScore) {
        bestScore = score;
        best = move;
      }
    }
    return best;
  }

  return (
    chooseScoredMove(difficulty, legal, (move) => {
      const next = applyChessMove(state, move);
      return evaluate(next, cpuPlayer);
    }) ?? pickRandom(legal)
  );
}
