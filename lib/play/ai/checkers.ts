import { chooseScoredMove } from "@/lib/play/cpu/difficulty";
import { pickRandom } from "@/lib/play/cpu/random";
import type { CpuDifficulty } from "@/lib/play/cpu/types";
import {
  applyCheckersMove,
  checkersMoves,
  checkersPieceCount,
  type Board,
  type CheckersMove,
  type Player,
} from "@/lib/play/checkers";

function evaluate(board: Board, player: Player): number {
  const mine = checkersPieceCount(board, player);
  const theirs = checkersPieceCount(board, player === 0 ? 1 : 0);
  return (mine - theirs) * 100;
}

function search(
  board: Board,
  player: Player,
  perspective: Player,
  fromLock: number | null,
  depth: number
): number {
  const moves = checkersMoves(board, player, fromLock);
  if (depth === 0 || moves.length === 0) {
    return evaluate(board, perspective);
  }

  if (player === perspective) {
    let best = -Infinity;
    for (const move of moves) {
      const { board: next, continueFrom } = applyCheckersMove(board, move);
      const nextPlayer = continueFrom !== null ? player : player === 0 ? 1 : 0;
      const val = search(next, nextPlayer, perspective, continueFrom, depth - 1);
      best = Math.max(best, val);
    }
    return best;
  }

  let best = Infinity;
  for (const move of moves) {
    const { board: next, continueFrom } = applyCheckersMove(board, move);
    const nextPlayer = continueFrom !== null ? player : player === 0 ? 1 : 0;
    const val = search(next, nextPlayer, perspective, continueFrom, depth - 1);
    best = Math.min(best, val);
  }
  return best;
}

export function chooseCheckersMove(
  board: Board,
  current: Player,
  fromLock: number | null,
  difficulty: CpuDifficulty,
  cpuPlayer: Player
): CheckersMove | null {
  if (current !== cpuPlayer) return null;
  const legal = checkersMoves(board, current, fromLock);
  if (legal.length === 0) return null;

  const captures = legal.filter((m) => m.capture !== undefined);
  const pool = captures.length > 0 ? captures : legal;

  const depth = difficulty === "hard" ? 4 : difficulty === "normal" ? 3 : 2;

  if (difficulty === "hard") {
    let best: CheckersMove | null = null;
    let bestScore = -Infinity;
    for (const move of pool) {
      const { board: next, continueFrom } = applyCheckersMove(board, move);
      const nextPlayer = continueFrom !== null ? current : current === 0 ? 1 : 0;
      const score = search(next, nextPlayer, cpuPlayer, continueFrom, depth - 1);
      if (score > bestScore) {
        bestScore = score;
        best = move;
      }
    }
    return best;
  }

  return (
    chooseScoredMove(difficulty, pool, (move) => {
      const { board: next } = applyCheckersMove(board, move);
      let score = evaluate(next, cpuPlayer);
      if (move.capture !== undefined) score += 120;
      return score;
    }) ?? pickRandom(pool)
  );
}
