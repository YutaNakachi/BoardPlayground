import { getSupabaseAdmin } from "./admin";
import { isSupabaseConfigured } from "./config";

export type BackendHealth = {
  configured: boolean;
  stats: boolean;
  online: boolean;
  reason?: "missing_env" | "db_error";
  detail?: string;
};

export type StatsHealth = {
  configured: boolean;
  stats: boolean;
  reason?: BackendHealth["reason"];
  detail?: string;
};

/** ランキング等、統計機能のみ必要な画面向けの軽量チェック */
export async function checkStatsHealth(): Promise<StatsHealth> {
  if (!isSupabaseConfigured()) {
    return { configured: false, stats: false, reason: "missing_env" };
  }

  const db = getSupabaseAdmin();
  if (!db) {
    return { configured: false, stats: false, reason: "missing_env" };
  }

  const { error } = await db.from("game_stats_total").select("game_slug").limit(1);
  if (error) {
    return {
      configured: true,
      stats: false,
      reason: "db_error",
      detail: error.message,
    };
  }

  return { configured: true, stats: true };
}

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

  const [statsResult, roomResult] = await Promise.all([
    db.from("game_stats_total").select("game_slug").limit(1),
    db.from("rooms").select("id").limit(1),
  ]);

  if (statsResult.error) {
    return {
      configured: true,
      stats: false,
      online: false,
      reason: "db_error",
      detail: statsResult.error.message,
    };
  }

  if (roomResult.error) {
    return {
      configured: true,
      stats: true,
      online: false,
      reason: "db_error",
      detail: roomResult.error.message,
    };
  }

  return {
    configured: true,
    stats: true,
    online: true,
  };
}
