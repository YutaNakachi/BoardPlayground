import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { checkBackendHealth } from "@/lib/supabase/health";

export const revalidate = 60;

export async function GET() {
  const health = await checkBackendHealth();
  if (!health.stats) {
    return NextResponse.json({ counts: {}, enabled: false });
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ counts: {}, enabled: false });
  }

  const { data, error } = await db
    .from("game_stats_total")
    .select("game_slug, play_count");

  if (error) {
    console.error("[stats/games]", error.message);
    return NextResponse.json({ counts: {}, enabled: false });
  }

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.game_slug] = row.play_count;
  }

  return NextResponse.json(
    { counts, enabled: true },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
  );
}
