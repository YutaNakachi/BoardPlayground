import { chooseScoredMove } from "@/lib/play/cpu/difficulty";
import { pickRandom } from "@/lib/play/cpu/random";
import type { CpuDifficulty } from "@/lib/play/cpu/types";
import {
  applyFoxHoundsMove,
  foxHoundsMoves,
  FH_LEFT_NODES,
  FH_NODE_COL,
  type FoxHoundsMove,
  type FoxHoundsState,
  type Player,
} from "@/lib/play/fox-hounds";

function harePosition(board: (Player | null)[]): number {
  return board.findIndex((c) => c === 1);
}

function evaluate(state: FoxHoundsState, perspective: Player): number {
  const hare = harePosition(state.board);
  if (hare < 0) return perspective === 0 ? 1_000_000 : -1_000_000;
  if (FH_LEFT_NODES.includes(hare as 1 | 2 | 3)) {
    return perspective === 1 ? 1_000_000 : -1_000_000;
  }
  const col = FH_NODE_COL[hare];
  const score = perspective === 1 ? (4 - col) * 80 : col * 80;
  const houndMoves = foxHoundsMoves(state, 0).length;
  const hareMoves = foxHoundsMoves(state, 1).length;
  if (perspective === 0) return score + houndMoves * 5 - hareMoves * 8;
  return -score + hareMoves * 10 - houndMoves * 4;
}

function search(
  state: FoxHoundsState,
  depth: number,
  perspective: Player
): number {
  if (depth === 0) return evaluate(state, perspective);
  const moves = foxHoundsMoves(state, state.current);
  if (moves.length === 0) {
    return evaluate(state, perspective);
  }

  if (state.current === perspective) {
    let best = -Infinity;
    for (const move of moves) {
      const next = applyFoxHoundsMove(state, move.from, move.to);
      if (!next) continue;
      best = Math.max(best, search(next, depth - 1, perspective));
    }
    return best;
  }

  let best = Infinity;
  for (const move of moves) {
    const next = applyFoxHoundsMove(state, move.from, move.to);
    if (!next) continue;
    best = Math.min(best, search(next, depth - 1, perspective));
  }
  return best;
}

export function chooseFoxHoundsMove(
  state: FoxHoundsState,
  difficulty: CpuDifficulty,
  cpuPlayer: Player
): FoxHoundsMove | null {
  if (state.current !== cpuPlayer) return null;
  const legal = foxHoundsMoves(state, state.current);
  if (legal.length === 0) return null;

  const depth = difficulty === "hard" ? 5 : difficulty === "normal" ? 4 : 2;

  if (difficulty !== "easy") {
    let best: FoxHoundsMove | null = null;
    let bestScore = cpuPlayer === 0 ? -Infinity : Infinity;
    for (const move of legal) {
      const next = applyFoxHoundsMove(state, move.from, move.to);
      if (!next) continue;
      const score = search(next, depth - 1, cpuPlayer);
      if (cpuPlayer === 0) {
        if (score > bestScore) {
          bestScore = score;
          best = move;
        }
      } else if (score < bestScore) {
        bestScore = score;
        best = move;
      }
    }
    if (best) return best;
  }

  return (
    chooseScoredMove(difficulty, legal, (move) => {
      const next = applyFoxHoundsMove(state, move.from, move.to);
      if (!next) return -1_000_000;
      return evaluate(next, cpuPlayer);
    }) ?? pickRandom(legal)
  );
}
