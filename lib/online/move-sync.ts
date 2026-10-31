export const MOVE_CONFLICT_NOTICE =
  "手の競合（他の更新とぶつかりました）。盤面を同期します。";

export function isMoveConflictMessage(
  message: string | null | undefined
): boolean {
  return message === MOVE_CONFLICT_NOTICE || message === "State conflict";
}

export function stateConflictPayload(
  version: number,
  state: unknown,
  currentPlayer: number | null
) {
  return {
    error: "State conflict" as const,
    version,
    gameState: {
      state,
      version,
      currentPlayer,
    },
  };
}

/**
 * 409 のあと次に送る版。古い expectedVersion へは戻さない。
 * すでに新しい版を持っていれば、それより下げない。
 */
export function versionAfterConflict(params: {
  staleExpected: number;
  currentVersion: number;
  serverVersion: number | null;
}): number {
  const floor = Math.max(params.currentVersion, 0);
  if (
    params.serverVersion == null ||
    !Number.isInteger(params.serverVersion) ||
    params.serverVersion < 0
  ) {
    return floor;
  }
  return Math.max(floor, params.serverVersion);
}

/** 権威ある状態を適用したら「手の競合」は消す。未解消なら残す。 */
export function noticeAfterAuthoritativeSync(
  notice: string | null,
  appliedVersion: number,
  conflictAtVersion: number | null
): string | null {
  if (!isMoveConflictMessage(notice)) return notice;
  if (conflictAtVersion == null) return null;
  if (appliedVersion >= conflictAtVersion) return null;
  return notice;
}

/** 送信中の二重押しは受け付けない。キューに積むと二重パスになる。 */
export function acceptMoveWhileSending(moveInFlight: boolean): boolean {
  return !moveInFlight;
}
