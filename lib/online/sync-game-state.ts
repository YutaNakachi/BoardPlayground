import type { GameState } from "./moves";

/** 同一部屋での再戦時、version が 1 に戻る更新を古い手番より優先して適用する。 */
export function shouldApplyRemoteGameVersion(
  remoteVersion: number,
  currentVersion: number,
  state: GameState
): boolean {
  if (remoteVersion >= currentVersion) return true;
  return remoteVersion === 1 && state.phase === "playing";
}
