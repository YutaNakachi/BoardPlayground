const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** JST の今日の日付文字列 (YYYY-MM-DD) */
export function jstToday(): string {
  const jst = new Date(Date.now() + JST_OFFSET_MS);
  return jst.toISOString().slice(0, 10);
}

/** JST 基準で直近 n 日の開始日 */
export function jstDaysAgo(n: number): string {
  const jst = new Date(Date.now() + JST_OFFSET_MS - n * 24 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

export type RankingPeriod = "day" | "week" | "month" | "all";

export function periodStartDate(period: RankingPeriod): string | null {
  switch (period) {
    case "day":
      return jstToday();
    case "week":
      return jstDaysAgo(6);
    case "month":
      return jstDaysAgo(29);
    case "all":
      return null;
  }
}
