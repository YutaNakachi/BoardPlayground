import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { checkBackendHealth } from "@/lib/supabase/health";

export async function fetchGameCounts(): Promise<{
  counts: Record<string, number>;
  enabled: boolean;
}> {
  const health = await checkBackendHealth();
  if (!health.stats) {
    return { counts: {}, enabled: false };
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return { counts: {}, enabled: false };
  }

  const { data, error } = await db
    .from("game_stats_total")
    .select("game_slug, play_count");

  if (error) {
    console.error("[stats/game-counts]", error.message);
    return { counts: {}, enabled: false };
  }

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.game_slug] = row.play_count;
  }

  return { counts, enabled: true };
}
