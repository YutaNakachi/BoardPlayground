import { projectKingAndSpyForSeat } from "@/lib/play/king-and-spy/state";
import type {
  KingAndSpyPublicState,
  KingAndSpySecrets,
  KingAndSpyViewState,
} from "@/lib/play/king-and-spy/types";
import { isOnlineSecretGame } from "./secret-games";
import type { GameState } from "./moves";

export function projectGameStateForSeat(
  slug: string,
  state: GameState,
  secretsPayload: unknown | null,
  seatIndex: number
): GameState {
  if (!isOnlineSecretGame(slug)) {
    return state;
  }
  if (slug === "king-and-spy") {
    const secrets = secretsPayload as KingAndSpySecrets | null;
    return projectKingAndSpyForSeat(
      state as KingAndSpyPublicState,
      secrets,
      seatIndex as 0 | 1
    ) as GameState;
  }
  return state;
}

export function isKingAndSpyViewState(
  state: GameState
): state is KingAndSpyViewState {
  return (
    typeof state === "object" &&
    state !== null &&
    "myHand" in state &&
    Array.isArray((state as KingAndSpyViewState).myHand) &&
    "kingRoleSeat" in state
  );
}

/** 手札投影が無い公開状態でも、席付きの表示用状態にする（終局後に secrets を消したとき） */
export function coerceKingAndSpyView(
  state: GameState,
  seatIndex: number
): KingAndSpyViewState | null {
  if (typeof state !== "object" || state === null) return null;
  if (!("kingRoleSeat" in state) || !("scores" in state)) return null;
  const seat: 0 | 1 = seatIndex === 1 ? 1 : 0;
  if (isKingAndSpyViewState(state)) {
    return state;
  }
  return projectKingAndSpyForSeat(
    state as KingAndSpyPublicState,
    null,
    seat
  );
}
