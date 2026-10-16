import { chooseScoredMove } from "@/lib/play/cpu/difficulty";
import { pickRandom } from "@/lib/play/cpu/random";
import type { CpuDifficulty } from "@/lib/play/cpu/types";
import {
  allDotsBoxesEdges,
  drawDotsBoxesEdge,
  type DotsBoxesState,
  type Edge,
} from "@/lib/play/dots-and-boxes";

function legalEdges(state: DotsBoxesState): Edge[] {
  return allDotsBoxesEdges(state).filter(
    (edge) => state.edgeOwners[`${edge.kind}:${edge.row}:${edge.col}`] === undefined
  );
}

function captureGain(state: DotsBoxesState, edge: Edge, player: 0 | 1): number {
  const trial = drawDotsBoxesEdge(state, edge);
  if (!trial) return 0;
  return trial.scores[player] - state.scores[player];
}

export function chooseDotsBoxesMove(
  state: DotsBoxesState,
  difficulty: CpuDifficulty,
  cpuPlayer: 0 | 1
): Edge | null {
  if (state.over || state.current !== cpuPlayer) return null;
  const legal = legalEdges(state);
  if (legal.length === 0) return null;

  const scoring = legal.filter((edge) => captureGain(state, edge, cpuPlayer) > 0);
  if (scoring.length > 0) {
    return (
      chooseScoredMove(difficulty, scoring, (edge) => {
        return captureGain(state, edge, cpuPlayer) * 1000;
      }) ?? pickRandom(scoring)
    );
  }

  const safe = legal.filter((edge) => captureGain(state, edge, cpuPlayer) === 0);
  const pool = safe.length > 0 ? safe : legal;

  return (
    chooseScoredMove(difficulty, pool, (edge) => {
      const trial = drawDotsBoxesEdge(state, edge);
      if (!trial) return -1_000_000;
      const opp = cpuPlayer === 0 ? 1 : 0;
      return trial.scores[cpuPlayer] * 50 - trial.scores[opp] * 30;
    }) ?? pickRandom(pool)
  );
}
