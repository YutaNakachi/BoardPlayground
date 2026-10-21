import type { SupabaseClient } from "@supabase/supabase-js";

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
