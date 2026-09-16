export function winnerIndices(scores: number[]): number[] {
  if (scores.length === 0) return [];
  const max = Math.max(...scores);
  return scores.flatMap((score, index) => (score === max ? [index] : []));
}

export function formatWinners(winners: number[]): string {
  const names = winners.map((i) => `プレイヤー ${i + 1}`).join(" / ");
  return winners.length > 1 ? `${names}（共同勝利）` : names;
}
