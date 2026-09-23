import type { GameState } from "./moves";

/**
 * 同一部屋での再戦時、version が 1 に戻る更新を前ゲームの終局状態より優先して適用する。
 * 再戦後に着手済み（currentVersion > 1）のときは遅延した version 1 を無視する。
 */
export function shouldApplyRemoteGameVersion(
  remoteVersion: number,
  currentVersion: number,
  remoteState: GameState,
  currentState: GameState | null
): boolean {
  if (remoteVersion >= currentVersion) return true;
  return (
    remoteVersion === 1 &&
    remoteState.phase === "playing" &&
    currentState?.phase === "game-over"
  );
}
