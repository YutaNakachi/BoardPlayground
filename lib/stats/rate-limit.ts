import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const COOLDOWN_MS = 30_000;

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

export async function checkPlayRateLimit(
  db: SupabaseClient,
  ipHash: string,
  gameSlug: string
): Promise<boolean> {
  const { data } = await db
    .from("play_rate_limit")
    .select("recorded_at")
    .eq("ip_hash", ipHash)
    .eq("game_slug", gameSlug)
    .maybeSingle();

  if (data?.recorded_at) {
    const elapsed = Date.now() - new Date(data.recorded_at).getTime();
    if (elapsed < COOLDOWN_MS) return false;
  }

  const { error } = await db.from("play_rate_limit").upsert(
    {
      ip_hash: ipHash,
      game_slug: gameSlug,
      recorded_at: new Date().toISOString(),
    },
    { onConflict: "ip_hash,game_slug" }
  );

  if (error) return true;

  const cutoff = new Date(Date.now() - 60_000).toISOString();
  await db.from("play_rate_limit").delete().lt("recorded_at", cutoff);

  return true;
}
