import { NextResponse } from "next/server";
import { API_ERROR, apiError } from "@/lib/api/errors";
import { getGameBySlug } from "@/lib/games";
import { incrementPlayCount } from "@/lib/stats/record-play";
import { checkPlayRateLimit, hashIp } from "@/lib/stats/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { checkBackendHealth } from "@/lib/supabase/health";

export async function POST(request: Request) {
  const health = await checkBackendHealth();
  if (!health.stats) {
    return NextResponse.json(
      { ok: false, skipped: true, reason: health.reason ?? "not_configured" },
      { status: health.configured ? 503 : 200 }
    );
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return apiError(API_ERROR.STATS_NOT_CONFIGURED, 503);
  }

  let body: { slug?: string; mode?: string };
  try {
    body = await request.json();
  } catch {
    return apiError(API_ERROR.INVALID_JSON, 400);
  }

  const slug = body.slug;
  if (!slug || typeof slug !== "string") {
    return apiError("slug is required", 400);
  }

  const game = getGameBySlug(slug);
  if (!game || game.status !== "playable") {
    return apiError(API_ERROR.UNKNOWN_GAME, 404);
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = hashIp(ip);

  const allowed = await checkPlayRateLimit(db, ipHash, slug);
  if (!allowed) {
    return NextResponse.json({ ok: true, throttled: true });
  }

  const result = await incrementPlayCount(db, slug);
  if (!result.ok) {
    console.error("[stats/play]", result.message);
    return apiError(API_ERROR.DB_UNAVAILABLE, 503);
  }

  return NextResponse.json({ ok: true });
}
