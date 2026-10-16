export function pickRandom<T>(items: readonly T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)] ?? null;
}

export function pickFromTopTier<T extends { score: number }>(
  scored: readonly T[],
  spread: number
): T | null {
  if (scored.length === 0) return null;
  const best = Math.max(...scored.map((s) => s.score));
  const tier = scored.filter((s) => s.score >= best - spread);
  return pickRandom(tier);
}

export function pickFromBottomTier<T extends { score: number }>(
  scored: readonly T[],
  spread: number
): T | null {
  if (scored.length === 0) return null;
  const worst = Math.min(...scored.map((s) => s.score));
  const tier = scored.filter((s) => s.score <= worst + spread);
  return pickRandom(tier);
}
