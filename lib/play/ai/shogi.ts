import { chooseScoredMove } from "@/lib/play/cpu/difficulty";
import { pickRandom } from "@/lib/play/cpu/random";
import type { CpuDifficulty } from "@/lib/play/cpu/types";
import {
  applyShogiMove,
  shogiMoves,
  shogiStatus,
  type ShogiMove,
  type ShogiState,
} from "@/lib/play/shogi";

const VALUE: Record<string, number> = {
  king: 20_000,
  rook: 600,
  bishop: 550,
  gold: 320,
  silver: 280,
  knight: 260,
  lance: 240,
  pawn: 100,
};

function handValue(hand: ShogiState["hands"][0]): number {
  return Object.entries(hand).reduce(
    (sum, [type, count]) => sum + (VALUE[type] ?? 50) * count,
    0
  );
}

function evaluate(state: ShogiState, perspective: 0 | 1): number {
  const status = shogiStatus(state);
  if (status.kind === "checkmate") {
    return status.winner === perspective ? 1_000_000 : -1_000_000;
  }
  let boardVal = 0;
  for (const cell of state.board) {
    if (!cell) continue;
    const v = VALUE[cell.type] ?? 80;
    boardVal += cell.player === perspective ? v : -v;
  }
  return (
    boardVal +
    handValue(state.hands[perspective]) -
    handValue(state.hands[perspective === 0 ? 1 : 0])
  );
}

export function chooseShogiMove(
  state: ShogiState,
  difficulty: CpuDifficulty,
  cpuPlayer: 0 | 1
): ShogiMove | null {
  if (state.current !== cpuPlayer) return null;
  const legal = shogiMoves(state);
  if (legal.length === 0) return null;

  return (
    chooseScoredMove(difficulty, legal, (move) => {
      const next = applyShogiMove(state, move);
      const status = shogiStatus(next);
      if (status.kind === "checkmate" && status.winner === cpuPlayer) {
        return 1_000_000;
      }
      return evaluate(next, cpuPlayer);
    }) ?? pickRandom(legal)
  );
}
