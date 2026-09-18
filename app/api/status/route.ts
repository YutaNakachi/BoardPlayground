import { NextResponse } from "next/server";
import { checkBackendHealth } from "@/lib/supabase/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await checkBackendHealth();
  return NextResponse.json(health, {
    headers: { "Cache-Control": "no-store" },
  });
}
