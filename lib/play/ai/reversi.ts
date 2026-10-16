import { chooseScoredMove } from "@/lib/play/cpu/difficulty";
import { pickRandom } from "@/lib/play/cpu/random";
import type { CpuDifficulty } from "@/lib/play/cpu/types";
import {
  playReversiMove,
  reversiCounts,
  reversiLegalMoves,
  reversiNextPlayer,
  REVERSI_CELLS,
  REVERSI_SIZE,
  type Board,
  type Player,
} from "@/lib/play/reversi";

const CORNERS = [
  0,
  REVERSI_SIZE - 1,
  REVERSI_CELLS - REVERSI_SIZE,
  REVERSI_CELLS - 1,
];

function mobility(board: Board, player: Player): number {
  return reversiLegalMoves(board, player).length;
}

function evaluate(board: Board, player: Player): number {
  const [a, b] = reversiCounts(board);
  const mine = player === 0 ? a : b;
  const theirs = player === 0 ? b : a;
  let score = (mine - theirs) * 8;
  score += mobility(board, player) * 14;
  score -= mobility(board, player === 0 ? 1 : 0) * 10;
  for (const c of CORNERS) {
    if (board[c] === player) score += 120;
    else if (board[c] !== null) score -= 90;
  }
  return score;
}

function minimax(
  board: Board,
  player: Player,
  perspective: Player,
  depth: number
): number {
  const next = reversiNextPlayer(board, player);
  if (depth === 0 || next === null) {
    return evaluate(board, perspective);
  }
  const moves = reversiLegalMoves(board, next);
  if (moves.length === 0) {
    return evaluate(board, perspective);
  }

  if (next === perspective) {
    let best = -Infinity;
    for (const move of moves) {
      const after = playReversiMove(board, move, next);
      if (!after) continue;
      best = Math.max(best, minimax(after, next, perspective, depth - 1));
    }
    return best;
  }

  let best = Infinity;
  for (const move of moves) {
    const after = playReversiMove(board, move, next);
    if (!after) continue;
    best = Math.min(best, minimax(after, next, perspective, depth - 1));
  }
  return best;
}

export function chooseReversiMove(
  board: Board,
  current: Player,
  difficulty: CpuDifficulty,
  cpuPlayer: Player
): number | null {
  if (current !== cpuPlayer) return null;
  const legal = reversiLegalMoves(board, current);
  if (legal.length === 0) return null;

  if (difficulty === "hard") {
    let best: number | null = null;
    let bestScore = -Infinity;
    for (const move of legal) {
      const after = playReversiMove(board, move, current);
      if (!after) continue;
      const score = minimax(after, current, cpuPlayer, 6);
      if (score > bestScore) {
        bestScore = score;
        best = move;
      }
    }
    return best;
  }

  if (difficulty === "normal") {
    let best: number | null = null;
    let bestScore = -Infinity;
    for (const move of legal) {
      const after = playReversiMove(board, move, current);
      if (!after) continue;
      const score = minimax(after, current, cpuPlayer, 4);
      if (score > bestScore) {
        bestScore = score;
        best = move;
      }
    }
    return best;
  }

  return (
    chooseScoredMove(difficulty, legal, (move) => {
      const after = playReversiMove(board, move, current);
      if (!after) return -1_000_000;
      return evaluate(after, cpuPlayer);
    }) ?? pickRandom(legal)
  );
}
