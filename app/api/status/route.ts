import { NextResponse } from "next/server";
import { checkBackendHealth } from "@/lib/supabase/health";

export const revalidate = 0;

export async function GET() {
  const health = await checkBackendHealth();
  return NextResponse.json(health);
}
