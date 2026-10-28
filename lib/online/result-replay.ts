export type OnlineResultReplayProps = {
  onReplay?: () => void;
  replayLabel?: string;
  replayHint?: string;
  replayLoading?: boolean;
  replayLoadingLabel?: string;
};

export function getOnlineResultReplayProps(
  isOnline: boolean,
  isHost: boolean,
  onRematch: () => void,
  onLocalReset: () => void,
  rematchLoading = false
): OnlineResultReplayProps {
  if (!isOnline) {
    return { onReplay: onLocalReset };
  }
  if (isHost) {
    return rematchLoading
      ? {
          replayLoading: true,
          replayLoadingLabel: "再戦準備中…",
        }
      : { onReplay: onRematch, replayLabel: "再戦" };
  }
  return {
    replayHint: rematchLoading
      ? "ホストが再戦を準備しています…"
      : "ホストの再戦を待っています…",
    replayLoading: rematchLoading,
    replayLoadingLabel: "ホストが再戦を準備しています…",
  };
}

/** 終局〜再戦完了までの start/rematch API 待ち */
export function isOnlineRematchLoading(
  loading: boolean,
  phase: string,
  roomStatus: string | undefined,
  gamePhase: string | undefined
): boolean {
  if (!loading) return false;
  const ended =
    phase === "finished" ||
    roomStatus === "finished" ||
    gamePhase === "game-over";
  return ended;
}
