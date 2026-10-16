import { chooseScoredMove } from "@/lib/play/cpu/difficulty";
import { pickRandom } from "@/lib/play/cpu/random";
import type { CpuDifficulty } from "@/lib/play/cpu/types";
import {
  clickMorris,
  morrisCount,
  morrisLegalDestinations,
  morrisRemovable,
  type MorrisState,
} from "@/lib/play/nine-mens-morris";

export type MorrisCpuAction = { point: number };

function enumerateActions(state: MorrisState): number[] {
  if (state.over) return [];

  if (state.removing) {
    const opponent = state.current === 0 ? 1 : 0;
    return morrisRemovable(state.board, opponent);
  }

  if (state.toPlace[state.current] > 0) {
    const points: number[] = [];
    for (let i = 0; i < state.board.length; i++) {
      if (state.board[i] === null) points.push(i);
    }
    return points;
  }

  const actions: number[] = [];
  for (let from = 0; from < state.board.length; from++) {
    if (state.board[from] !== state.current) continue;
    for (const to of morrisLegalDestinations(state, from)) {
      actions.push(to);
    }
  }
  return actions;
}

function applyAction(state: MorrisState, point: number): MorrisState {
  if (state.removing || state.toPlace[state.current] > 0) {
    return clickMorris(state, point);
  }
  if (state.selected === null) {
    const selected = clickMorris(state, point);
    if (selected.selected !== null) return selected;
  }
  if (state.selected !== null) {
    return clickMorris(state, point);
  }
  return state;
}

function evaluate(state: MorrisState, perspective: 0 | 1): number {
  if (state.over && state.winners) {
    return state.winners.includes(perspective) ? 1_000_000 : -1_000_000;
  }
  const mine = morrisCount(state.board, perspective);
  const theirs = morrisCount(state.board, perspective === 0 ? 1 : 0);
  return mine * 40 - theirs * 35;
}

export function chooseMorrisMove(
  state: MorrisState,
  difficulty: CpuDifficulty,
  cpuPlayer: 0 | 1
): MorrisCpuAction | null {
  if (state.over || state.current !== cpuPlayer) return null;
  const legal = enumerateActions(state);
  if (legal.length === 0) return null;

  const point =
    chooseScoredMove(difficulty, legal, (p) =>
      evaluate(applyAction(state, p), cpuPlayer)
    ) ?? pickRandom(legal);

  return point === null ? null : { point };
}
