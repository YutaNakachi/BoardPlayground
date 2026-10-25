import {
  applyKingAndSpyCommit,
  applyKingAndSpyHandReady,
} from "@/lib/play/king-and-spy/state";
import type {
  KingAndSpyPublicState,
  KingAndSpySecrets,
} from "@/lib/play/king-and-spy/types";
import type { MovePayload } from "./moves";

export function parseKingAndSpySecrets(payload: unknown): KingAndSpySecrets {
  if (
    payload &&
    typeof payload === "object" &&
    "hands" in payload &&
    "pendingCommits" in payload
  ) {
    return payload as KingAndSpySecrets;
  }
  throw new Error("Invalid king-and-spy secrets");
}

export function applyKingAndSpyOnlineMove(
  publicState: KingAndSpyPublicState,
  secrets: KingAndSpySecrets,
  seatIndex: number,
  move: MovePayload
): { state: KingAndSpyPublicState; secrets: KingAndSpySecrets } | { error: string } {
  const pub = structuredClone(publicState);
  const sec = structuredClone(secrets);
  const seat = seatIndex as 0 | 1;
  const result =
    move.type === "king-and-spy-hand-ready"
      ? applyKingAndSpyHandReady(pub, sec, seat)
      : move.type === "king-and-spy-commit"
        ? applyKingAndSpyCommit(pub, sec, seat, move.cardId, {
            deferResolve: true,
          })
        : { error: "Invalid move type" };
  if (result.error) {
    return { error: result.error };
  }
  return { state: pub, secrets: sec };
}
