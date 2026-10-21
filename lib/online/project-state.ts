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
    if (!secrets) {
      return state;
    }
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
