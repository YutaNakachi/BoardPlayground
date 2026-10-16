import { chooseScoredMove } from "@/lib/play/cpu/difficulty";
import { pickRandom } from "@/lib/play/cpu/random";
import type { CpuDifficulty } from "@/lib/play/cpu/types";
import {
  mancalaStore,
  sowMancala,
  type Player,
} from "@/lib/play/mancala";

export type MancalaCpuMove = { pit: number };

function legalPits(pits: number[], player: Player): number[] {
  const moves: number[] = [];
  const start = player === 0 ? 0 : 7;
  for (let i = start; i < start + 6; i++) {
    if (pits[i] > 0) moves.push(i);
  }
  return moves;
}

function evaluate(pits: number[], player: Player): number {
  const mine = pits[mancalaStore(player)];
  const theirs = pits[mancalaStore(player === 0 ? 1 : 0)];
  return (mine - theirs) * 10;
}

function search(
  pits: number[],
  player: Player,
  perspective: Player,
  depth: number
): number {
  const legal = legalPits(pits, player);
  if (depth === 0 || legal.length === 0) {
    return evaluate(pits, perspective);
  }

  if (player === perspective) {
    let best = -Infinity;
    for (const pit of legal) {
      const result = sowMancala(pits, player, pit);
      if (!result) continue;
      const nextPlayer = result.extraTurn ? player : player === 0 ? 1 : 0;
      const val = result.over
        ? evaluate(result.pits, perspective)
        : search(result.pits, nextPlayer, perspective, depth - 1);
      best = Math.max(best, val);
    }
    return best;
  }

  let best = Infinity;
  for (const pit of legal) {
    const result = sowMancala(pits, player, pit);
    if (!result) continue;
    const nextPlayer = result.extraTurn ? player : player === 0 ? 1 : 0;
    const val = result.over
      ? evaluate(result.pits, perspective)
      : search(result.pits, nextPlayer, perspective, depth - 1);
    best = Math.min(best, val);
  }
  return best;
}

export function chooseMancalaMove(
  pits: number[],
  current: Player,
  difficulty: CpuDifficulty,
  cpuPlayer: Player
): MancalaCpuMove | null {
  if (current !== cpuPlayer) return null;
  const legal = legalPits(pits, current);
  if (legal.length === 0) return null;

  const depth = difficulty === "hard" ? 7 : difficulty === "normal" ? 5 : 3;

  if (difficulty !== "easy") {
    let best: MancalaCpuMove | null = null;
    let bestScore = -Infinity;
    for (const pit of legal) {
      const result = sowMancala(pits, current, pit);
      if (!result) continue;
      const nextPlayer = result.extraTurn ? current : current === 0 ? 1 : 0;
      const score = result.over
        ? evaluate(result.pits, cpuPlayer)
        : search(result.pits, nextPlayer, cpuPlayer, depth - 1);
      if (score > bestScore) {
        bestScore = score;
        best = { pit };
      }
    }
    if (best) return best;
  }

  const chosen =
    chooseScoredMove(difficulty, legal, (pit) => {
      const result = sowMancala(pits, current, pit);
      if (!result) return -1_000_000;
      let score = evaluate(result.pits, cpuPlayer);
      if (result.extraTurn) score += 80;
      if (result.captured) score += 50;
      return score;
    }) ?? pickRandom(legal);

  return chosen === null ? null : { pit: chosen };
}
