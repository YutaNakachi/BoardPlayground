import { chooseScoredMove } from "@/lib/play/cpu/difficulty";
import { pickRandom } from "@/lib/play/cpu/random";
import type { CpuDifficulty } from "@/lib/play/cpu/types";
import {
  applyBackgammonMove,
  backgammonMoves,
  endBackgammonTurn,
  rollBackgammon,
  type BackgammonMove,
  type BackgammonState,
  type Player,
} from "@/lib/play/backgammon";

function evaluate(state: BackgammonState, player: Player): number {
  const off = state.off[player];
  const bar = state.bar[player];
  return off * 120 - bar * 40 + state.off[player === 0 ? 1 : 0] * -5;
}

export function chooseBackgammonAction(
  state: BackgammonState,
  difficulty: CpuDifficulty,
  cpuPlayer: Player
): BackgammonMove | "roll" | "end-turn" | null {
  if (state.winner !== null) return null;
  if (state.current !== cpuPlayer) return null;

  if (!state.dice || state.dice.length === 0) {
    return "roll";
  }

  const moves = backgammonMoves(state);
  if (moves.length === 0) {
    return "end-turn";
  }

  return (
    chooseScoredMove(difficulty, moves, (move) => {
      const next = applyBackgammonMove(state, move);
      if (!next) return -1_000_000;
      if (next.winner === cpuPlayer) return 1_000_000;
      return evaluate(next, cpuPlayer);
    }) ?? pickRandom(moves)
  );
}

export function applyBackgammonCpuAction(
  state: BackgammonState,
  action: BackgammonMove | "roll" | "end-turn"
): BackgammonState {
  if (action === "roll") return rollBackgammon(state);
  if (action === "end-turn") return endBackgammonTurn(state);
  const next = applyBackgammonMove(state, action);
  return next ?? state;
}
