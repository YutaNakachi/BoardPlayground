import { API_ERROR, apiError } from "@/lib/api/errors";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { checkBackendHealth } from "@/lib/supabase/health";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function requireOnlineBackend(): Promise<
  { db: SupabaseClient } | Response
> {
  const health = await checkBackendHealth();
  if (!health.online) {
    return apiError(
      health.reason === "db_error" ? API_ERROR.DB_UNAVAILABLE : API_ERROR.ONLINE_NOT_CONFIGURED,
      503
    );
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return apiError(API_ERROR.ONLINE_NOT_CONFIGURED, 503);
  }

  return { db };
}
