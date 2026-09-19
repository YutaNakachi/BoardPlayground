import { NextResponse } from "next/server";
import type { RankingPeriod } from "@/lib/stats/jst-date";
import {
  fetchRankingCached,
  parseRankingPeriod,
} from "@/lib/stats/ranking-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = parseRankingPeriod(searchParams.get("period") ?? undefined);

  if (searchParams.get("period") && period !== searchParams.get("period")) {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  }

  const ranking = await fetchRankingCached(period as RankingPeriod);
  return NextResponse.json(
    { period, ranking },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    }
  );
}
