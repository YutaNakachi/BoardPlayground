import type { SupabaseClient } from "@supabase/supabase-js";
import {
  applyKingAndSpyOnlineMove,
  parseKingAndSpySecrets,
} from "./king-and-spy-online";
import type { GameState, MovePayload } from "./moves";
import { projectGameStateForSeat } from "./project-state";
import { deleteRoomSecrets, loadRoomSecrets, saveRoomSecrets } from "./room-secrets";
import { isOnlineSecretGame } from "./secret-games";

export async function applyOnlineMoveWithSecrets(
  db: SupabaseClient,
  roomId: string,
  slug: string,
  publicState: GameState,
  stateVersion: number,
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

  const secretsRow = await loadRoomSecrets(db, roomId);
  if (!secretsRow) {
    return { error: "Secrets not found" };
  }

  if (slug === "king-and-spy") {
    const secrets = parseKingAndSpySecrets(secretsRow.payload);
    const result = applyKingAndSpyOnlineMove(
      publicState as import("@/lib/play/king-and-spy/types").KingAndSpyPublicState,
      secrets,
      seatIndex,
      move
    );
    if ("error" in result) {
      return { error: result.error };
    }
    const newVersion = stateVersion + 1;
    await saveRoomSecrets(db, roomId, result.secrets, newVersion);
    const finished = result.state.phase === "game-over";
    if (finished) {
      await deleteRoomSecrets(db, roomId);
    }
    const projected = projectGameStateForSeat(
      slug,
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

  return { error: "Unsupported secret game" };
}
