import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const revalidate = 60;

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ counts: {} });
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ counts: {} });
  }

  const { data, error } = await db
    .from("game_stats_total")
    .select("game_slug, play_count");

  if (error) {
    return NextResponse.json({ counts: {} });
  }

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.game_slug] = row.play_count;
  }

  return NextResponse.json(
    { counts },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
  );
}
