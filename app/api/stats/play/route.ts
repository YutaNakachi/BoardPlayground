import { NextResponse } from "next/server";
import { getGameBySlug } from "@/lib/games";
import { incrementPlayCount } from "@/lib/stats/record-play";
import { checkPlayRateLimit, hashIp } from "@/lib/stats/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  let body: { slug?: string; mode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slug = body.slug;
  if (!slug || typeof slug !== "string") {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const game = getGameBySlug(slug);
  if (!game || game.status !== "playable") {
    return NextResponse.json({ error: "Unknown game" }, { status: 404 });
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = hashIp(ip);

  const allowed = await checkPlayRateLimit(db, ipHash, slug);
  if (!allowed) {
    return NextResponse.json({ ok: true, throttled: true });
  }

  await incrementPlayCount(db, slug);
  return NextResponse.json({ ok: true });
}
