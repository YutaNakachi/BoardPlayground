import type { CpuDifficulty } from "@/lib/play/cpu/types";
import { pickFromBottomTier, pickFromTopTier, pickRandom } from "@/lib/play/cpu/random";

export function cpuThinkDelayMs(difficulty: CpuDifficulty): number {
  if (difficulty === "hard") return 650 + Math.random() * 300;
  if (difficulty === "normal") return 450 + Math.random() * 250;
  return 320 + Math.random() * 180;
}

export function opponentSeat(player: 0 | 1): 0 | 1 {
  return player === 0 ? 1 : 0;
}

export function cpuSearchDepth(
  difficulty: CpuDifficulty,
  depths: { easy: number; normal: number; hard: number }
): number {
  return depths[difficulty];
}

/** スコア付き合法手から難易度に応じて1手選ぶ */
export function chooseScoredMove<T>(
  difficulty: CpuDifficulty,
  legal: readonly T[],
  scoreMove: (move: T) => number,
  winScore = 1_000_000
): T | null {
  if (legal.length === 0) return null;
  const scored = legal.map((move) => ({ move, score: scoreMove(move) }));

  if (difficulty === "easy") {
    const wins = scored.filter((s) => s.score >= winScore - 1000);
    if (wins.length > 0) return pickRandom(wins)?.move ?? null;
    const pool = scored.filter((s) => s.score > -winScore / 2);
    const usePool = pool.length > 0 ? pool : scored;
    if (Math.random() < 0.72) {
      return pickFromTopTier(usePool, 40)?.move ?? pickRandom(legal);
    }
    return pickFromBottomTier(usePool, 35)?.move ?? pickRandom(legal);
  }

  if (difficulty === "normal") {
    const wins = scored.filter((s) => s.score >= winScore - 1000);
    if (wins.length > 0) {
      if (wins.length === 1) return wins[0]!.move;
      return pickFromTopTier(wins, 5)?.move ?? wins[0]!.move;
    }
    return pickFromTopTier(scored, 8)?.move ?? pickRandom(legal);
  }

  let best: T | null = null;
  let bestScore = -Infinity;
  for (const { move, score } of scored) {
    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }
  return best;
}
