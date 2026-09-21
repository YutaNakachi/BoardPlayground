import { unstable_cache } from "next/cache";
import { getAllGames } from "@/lib/games";
import { jstToday, periodStartDate, type RankingPeriod } from "@/lib/stats/jst-date";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const RANKING_CACHE_SECONDS = 60;

export type RankingEntry = {
  rank: number;
  slug: string;
  title: string;
  playCount: number;
};

const VALID_PERIODS: RankingPeriod[] = ["day", "week", "month", "all"];

export function parseRankingPeriod(value?: string): RankingPeriod {
  if (value && VALID_PERIODS.includes(value as RankingPeriod)) {
    return value as RankingPeriod;
  }
  return "all";
}

export async function fetchRanking(period: RankingPeriod): Promise<RankingEntry[]> {
  const slugToTitle = new Map(getAllGames().map((g) => [g.slug, g.title]));

  if (!isSupabaseConfigured()) return [];

  const db = getSupabaseAdmin();
  if (!db) return [];

  if (period === "all") {
    const { data } = await db
      .from("game_stats_total")
      .select("game_slug, play_count")
      .order("play_count", { ascending: false })
      .limit(50);

    return (data ?? []).map((row, i) => ({
      rank: i + 1,
      slug: row.game_slug,
      title: slugToTitle.get(row.game_slug) ?? row.game_slug,
      playCount: row.play_count,
    }));
  }

  const startDate = periodStartDate(period)!;
  const endDate = jstToday();

  const { data } = await db
    .from("game_stats_daily")
    .select("game_slug, play_count")
    .gte("play_date", startDate)
    .lte("play_date", endDate);

  const totals = new Map<string, number>();
  for (const row of data ?? []) {
    totals.set(row.game_slug, (totals.get(row.game_slug) ?? 0) + row.play_count);
  }

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([slug, playCount], i) => ({
      rank: i + 1,
      slug,
      title: slugToTitle.get(slug) ?? slug,
      playCount,
    }));
}

export function fetchRankingCached(period: RankingPeriod): Promise<RankingEntry[]> {
  return unstable_cache(() => fetchRanking(period), ["ranking", period], {
    revalidate: RANKING_CACHE_SECONDS,
    tags: [`ranking-${period}`],
  })();
}
