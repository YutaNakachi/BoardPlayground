import type { SupabaseClient } from "@supabase/supabase-js";
import { jstToday } from "./jst-date";

export async function incrementPlayCount(
  db: SupabaseClient,
  gameSlug: string
): Promise<void> {
  const today = jstToday();

  const { data: daily } = await db
    .from("game_stats_daily")
    .select("play_count")
    .eq("game_slug", gameSlug)
    .eq("play_date", today)
    .maybeSingle();

  await db.from("game_stats_daily").upsert({
    game_slug: gameSlug,
    play_date: today,
    play_count: (daily?.play_count ?? 0) + 1,
  });

  const { data: total } = await db
    .from("game_stats_total")
    .select("play_count")
    .eq("game_slug", gameSlug)
    .maybeSingle();

  await db.from("game_stats_total").upsert({
    game_slug: gameSlug,
    play_count: (total?.play_count ?? 0) + 1,
  });
}
