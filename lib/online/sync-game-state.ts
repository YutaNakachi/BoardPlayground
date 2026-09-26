import type { GameState } from "./moves";

function dotsBoxesDrawnEdgeCount(state: GameState | null): number | null {
  if (!state || !("edgeOwners" in state)) return null;
  const edgeOwners = (state as { edgeOwners?: Record<string, unknown> })
    .edgeOwners;
  if (!edgeOwners) return null;
  return Object.keys(edgeOwners).length;
}

/**
 * 同一部屋での再戦時、version が 1 に戻る更新を前ゲームの終局状態より優先して適用する。
 * 再戦後に着手済み（currentVersion > 1）のときは遅延した version 1 を無視する。
 */
function isGameOverState(state: GameState | null): boolean {
  return state?.phase === "game-over";
}

function isRematchStart(
  remoteVersion: number,
  remoteState: GameState,
  currentState: GameState | null
): boolean {
  return (
    remoteVersion === 1 &&
    remoteState.phase === "playing" &&
    isGameOverState(currentState)
  );
}

export function shouldApplyRemoteGameVersion(
  remoteVersion: number,
  currentVersion: number,
  remoteState: GameState,
  currentState: GameState | null
): boolean {
  if (isRematchStart(remoteVersion, remoteState, currentState)) {
    return true;
  }

  if (isGameOverState(currentState) && remoteState.phase === "playing") {
    return false;
  }

  const remoteEdges = dotsBoxesDrawnEdgeCount(remoteState);
  const currentEdges = dotsBoxesDrawnEdgeCount(currentState);

  if (remoteVersion >= currentVersion) {
    if (
      remoteEdges !== null &&
      currentEdges !== null &&
      remoteEdges < currentEdges
    ) {
      return false;
    }
    if (
      remoteVersion === currentVersion &&
      isGameOverState(currentState) &&
      remoteState.phase === "playing"
    ) {
      return false;
    }
    return true;
  }

  if (isGameOverState(remoteState) && !isGameOverState(currentState)) {
    return true;
  }

  if (
    remoteEdges !== null &&
    currentEdges !== null &&
    remoteEdges > currentEdges
  ) {
    return true;
  }

  return false;
}
