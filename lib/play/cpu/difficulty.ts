import type { CpuDifficulty } from "@/lib/play/cpu/types";
import { pickFromBottomTier, pickFromTopTier, pickRandom } from "@/lib/play/cpu/random";

export function cpuThinkDelayMs(difficulty: CpuDifficulty): number {
  if (difficulty === "hard") return 550 + Math.random() * 250;
  if (difficulty === "normal") return 400 + Math.random() * 250;
  return 300 + Math.random() * 200;
}

export function opponentSeat(player: 0 | 1): 0 | 1 {
  return player === 0 ? 1 : 0;
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
    if (Math.random() < 0.38) {
      return pickFromTopTier(usePool, 85)?.move ?? pickRandom(legal);
    }
    return pickFromBottomTier(usePool, 50)?.move ?? pickRandom(legal);
  }

  if (difficulty === "normal") {
    const wins = scored.filter((s) => s.score >= winScore - 1000);
    if (wins.length === 1) return wins[0]!.move;
    if (wins.length > 1) return pickRandom(wins)?.move ?? wins[0]!.move;
    return pickFromTopTier(scored, 24)?.move ?? pickRandom(legal);
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
