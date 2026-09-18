import { NextResponse } from "next/server";
import { fetchGameCounts } from "@/lib/stats/game-counts";

export const dynamic = "force-dynamic";

export async function GET() {
  const { counts, enabled } = await fetchGameCounts();
  return NextResponse.json(
    { counts, enabled },
    { headers: { "Cache-Control": "no-store" } }
  );
}
