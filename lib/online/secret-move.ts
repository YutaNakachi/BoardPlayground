import type { SupabaseClient } from "@supabase/supabase-js";
import {
  applyKingAndSpyOnlineMove,
  parseKingAndSpySecrets,
} from "./king-and-spy-online";
import type { GameState, MovePayload } from "./moves";
import { projectGameStateForSeat } from "./project-state";
import { deleteRoomSecrets, loadRoomSecrets, saveRoomSecrets } from "./room-secrets";
import { isOnlineSecretGame } from "./secret-games";

const CAS_ATTEMPTS = 6;

/**
 * 同時確定でも後着が先着を消さないよう、room_state.version で直列化する。
 * 期待バージョンが古くても、席が未確定なら最新状態へ確定を載せる。
 */
async function commitKingAndSpySerialized(
  db: SupabaseClient,
  roomId: string,
  seatIndex: number,
  move: MovePayload
): Promise<
  | {
      publicState: GameState;
      projectedState: GameState;
      currentPlayer: number | null;
      newVersion: number;
      finished: boolean;
    }
  | { error: string }
> {
  let lastError = "State conflict";

  for (let attempt = 0; attempt < CAS_ATTEMPTS; attempt++) {
    const { data: stateRow, error: stateError } = await db
      .from("room_state")
      .select("state, version")
      .eq("room_id", roomId)
      .single();

    if (stateError || !stateRow) {
      return { error: "Game state not found" };
    }

    const secretsRow = await loadRoomSecrets(db, roomId);
    if (!secretsRow) {
      return { error: "Secrets not found" };
    }

    if (secretsRow.version !== stateRow.version) {
      await new Promise((resolve) => setTimeout(resolve, 40));
      continue;
    }

    let secrets;
    try {
      secrets = parseKingAndSpySecrets(secretsRow.payload);
    } catch {
      return { error: "Invalid secrets" };
    }

    const result = applyKingAndSpyOnlineMove(
      stateRow.state as import("@/lib/play/king-and-spy/types").KingAndSpyPublicState,
      secrets,
      seatIndex,
      move
    );
    if ("error" in result) {
      return { error: result.error };
    }

    const newVersion = stateRow.version + 1;
    const { data: updated, error: updateError } = await db
      .from("room_state")
      .update({
        state: result.state,
        version: newVersion,
        current_player: null,
        updated_at: new Date().toISOString(),
      })
      .eq("room_id", roomId)
      .eq("version", stateRow.version)
      .select("version");

    if (updateError) {
      return { error: updateError.message };
    }
    if (!updated || updated.length === 0) {
      lastError = "State conflict";
      continue;
    }

    await saveRoomSecrets(db, roomId, result.secrets, newVersion);
    const finished = result.state.phase === "game-over";
    if (finished) {
      await deleteRoomSecrets(db, roomId);
    }
    const projected = projectGameStateForSeat(
      "king-and-spy",
      result.state,
      finished ? null : result.secrets,
      seatIndex
    );
    return {
      publicState: result.state,
      projectedState: projected,
      currentPlayer: null,
      newVersion,
      finished,
    };
  }

  return { error: lastError };
}

export async function applyOnlineMoveWithSecrets(
  db: SupabaseClient,
  roomId: string,
  slug: string,
  _publicState: GameState,
  _stateVersion: number,
  seatIndex: number,
  move: MovePayload
): Promise<
  | {
      publicState: GameState;
      projectedState: GameState;
      currentPlayer: number | null;
      newVersion: number;
      finished: boolean;
    }
  | { error: string }
> {
  if (!isOnlineSecretGame(slug)) {
    return { error: "Not a secret game" };
  }

  if (slug === "king-and-spy") {
    return commitKingAndSpySerialized(db, roomId, seatIndex, move);
  }

  return { error: "Unsupported secret game" };
}
