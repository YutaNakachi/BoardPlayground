import { applyKingAndSpyCommit } from "@/lib/play/king-and-spy/state";
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
  if (move.type !== "king-and-spy-commit") {
    return { error: "Invalid move type" };
  }
  const pub = structuredClone(publicState);
  const sec = structuredClone(secrets);
  const result = applyKingAndSpyCommit(
    pub,
    sec,
    seatIndex as 0 | 1,
    move.cardId
  );
  if (result.error) {
    return { error: result.error };
  }
  return { state: pub, secrets: sec };
}
