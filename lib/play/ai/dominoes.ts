import { chooseScoredMove } from "@/lib/play/cpu/difficulty";
import { pickRandom } from "@/lib/play/cpu/random";
import type { CpuDifficulty } from "@/lib/play/cpu/types";
import {
  applyDominoPlay,
  dominoPlays,
  drawDomino,
  type DominoPlay,
  type DominoesState,
} from "@/lib/play/dominoes";

function pipSum(state: DominoesState, play: DominoPlay): number {
  const hand = state.hands[state.current];
  const tile = hand.find((t) => t.id === play.tileId);
  return tile ? tile.high + tile.low : 0;
}

export function chooseDominoMove(
  state: DominoesState,
  difficulty: CpuDifficulty,
  cpuPlayer: 0 | 1
): DominoPlay | "draw" | "pass" | null {
  if (state.current !== cpuPlayer || state.winner !== null) return null;

  const plays = dominoPlays(state, cpuPlayer);
  if (plays.length > 0) {
    return (
      chooseScoredMove(difficulty, plays, (play) => {
        const after = applyDominoPlay(state, play);
        if (!after) return -1_000_000;
        if (after.hands[cpuPlayer].length === 0) return 1_000_000;
        return pipSum(state, play) * 5 + (7 - after.hands[cpuPlayer].length) * 20;
      }) ?? pickRandom(plays)
    );
  }

  if (state.boneyard.length > 0) return "draw";
  return "pass";
}

export function applyDominoCpuChoice(
  state: DominoesState,
  choice: DominoPlay | "draw" | "pass"
): DominoesState | null {
  if (choice === "draw") {
    const drawn = drawDomino(state);
    return drawn ?? state;
  }
  if (choice === "pass") {
    return {
      ...state,
      current: state.current === 0 ? 1 : 0,
    };
  }
  return applyDominoPlay(state, choice);
}
