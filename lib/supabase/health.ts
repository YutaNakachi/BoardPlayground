import { getSupabaseAdmin } from "./admin";
import { isSupabaseConfigured } from "./config";

export type BackendHealth = {
  configured: boolean;
  stats: boolean;
  online: boolean;
  reason?: "missing_env" | "db_error";
  detail?: string;
};

export async function checkBackendHealth(): Promise<BackendHealth> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      stats: false,
      online: false,
      reason: "missing_env",
    };
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return {
      configured: false,
      stats: false,
      online: false,
      reason: "missing_env",
    };
  }

  const { error } = await db.from("game_stats_total").select("game_slug").limit(1);
  if (error) {
    return {
      configured: true,
      stats: false,
      online: false,
      reason: "db_error",
      detail: error.message,
    };
  }

  const { error: roomError } = await db.from("rooms").select("id").limit(1);
  if (roomError) {
    return {
      configured: true,
      stats: true,
      online: false,
      reason: "db_error",
      detail: roomError.message,
    };
  }

  return {
    configured: true,
    stats: true,
    online: true,
  };
}
