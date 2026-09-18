import type { SupabaseClient } from "@supabase/supabase-js";
import { jstToday } from "./jst-date";

async function incrementPlayCountFallback(
  db: SupabaseClient,
  gameSlug: string,
  today: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data: daily } = await db
    .from("game_stats_daily")
    .select("play_count")
    .eq("game_slug", gameSlug)
    .eq("play_date", today)
    .maybeSingle();

  const { error: dailyError } = await db.from("game_stats_daily").upsert(
    {
      game_slug: gameSlug,
      play_date: today,
      play_count: (daily?.play_count ?? 0) + 1,
    },
    { onConflict: "game_slug,play_date" }
  );

  if (dailyError) return { ok: false, message: dailyError.message };

  const { data: total } = await db
    .from("game_stats_total")
    .select("play_count")
    .eq("game_slug", gameSlug)
    .maybeSingle();

  const { error: totalError } = await db.from("game_stats_total").upsert(
    {
      game_slug: gameSlug,
      play_count: (total?.play_count ?? 0) + 1,
    },
    { onConflict: "game_slug" }
  );

  if (totalError) return { ok: false, message: totalError.message };
  return { ok: true };
}

export async function incrementPlayCount(
  db: SupabaseClient,
  gameSlug: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const today = jstToday();

  const { error } = await db.rpc("increment_game_play_count", {
    p_game_slug: gameSlug,
    p_play_date: today,
  });

  if (!error) return { ok: true };

  if (
    error.code === "PGRST202" ||
    error.message.includes("increment_game_play_count")
  ) {
    return incrementPlayCountFallback(db, gameSlug, today);
  }

  return { ok: false, message: error.message };
}
