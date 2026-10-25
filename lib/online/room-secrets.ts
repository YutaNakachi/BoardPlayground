import type { SupabaseClient } from "@supabase/supabase-js";

export const ROOM_SECRETS_MIGRATION_HINT =
  "Supabase で supabase/migrations/008_room_secrets.sql を実行するか、リポジトリで npm run db:migrate を実行してください。";

export type RoomSecretsProbe =
  | { ok: true }
  | { ok: false; message: string; code: "ROOM_SECRETS_TABLE_MISSING" };

export async function probeRoomSecretsTable(
  db: SupabaseClient
): Promise<RoomSecretsProbe> {
  const { error } = await db.from("room_secrets").select("room_id").limit(1);
  if (!error) {
    return { ok: true };
  }
  const msg = error.message ?? "";
  if (
    error.code === "PGRST205" ||
    (/room_secrets/i.test(msg) && /schema cache|does not exist/i.test(msg))
  ) {
    return {
      ok: false,
      code: "ROOM_SECRETS_TABLE_MISSING",
      message: `手札秘匿オンライン用の DB テーブル（room_secrets）がありません。${ROOM_SECRETS_MIGRATION_HINT}`,
    };
  }
  return {
    ok: false,
    code: "ROOM_SECRETS_TABLE_MISSING",
    message: `room_secrets の確認に失敗しました: ${msg}`,
  };
}

export function roomSecretsWriteErrorMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (
    /room_secrets/i.test(msg) &&
    (/schema cache|does not exist|PGRST205/i.test(msg) ||
      (error as { code?: string }).code === "PGRST205")
  ) {
    return `手札秘匿オンライン用の DB テーブル（room_secrets）がありません。${ROOM_SECRETS_MIGRATION_HINT}`;
  }
  return `手札情報の保存に失敗しました: ${msg}`;
}

export type RoomSecretsRow = {
  payload: unknown;
  version: number;
};

export async function loadRoomSecrets(
  db: SupabaseClient,
  roomId: string
): Promise<RoomSecretsRow | null> {
  const { data, error } = await db
    .from("room_secrets")
    .select("payload, version")
    .eq("room_id", roomId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) return null;
  return { payload: data.payload, version: data.version };
}

export async function saveRoomSecrets(
  db: SupabaseClient,
  roomId: string,
  payload: unknown,
  version: number
): Promise<void> {
  const { data: existing } = await db
    .from("room_secrets")
    .select("room_id")
    .eq("room_id", roomId)
    .maybeSingle();

  const row = {
    payload,
    version,
    updated_at: new Date().toISOString(),
  };

  const { error } = existing
    ? await db.from("room_secrets").update(row).eq("room_id", roomId)
    : await db.from("room_secrets").insert({ room_id: roomId, ...row });

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteRoomSecrets(
  db: SupabaseClient,
  roomId: string
): Promise<void> {
  const { error } = await db.from("room_secrets").delete().eq("room_id", roomId);
  if (error) {
    throw new Error(error.message);
  }
}
