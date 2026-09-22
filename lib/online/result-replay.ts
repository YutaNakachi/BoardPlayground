export type OnlineResultReplayProps = {
  onReplay?: () => void;
  replayLabel?: string;
  replayHint?: string;
};

export function getOnlineResultReplayProps(
  isOnline: boolean,
  isHost: boolean,
  onRematch: () => void,
  onLocalReset: () => void
): OnlineResultReplayProps {
  if (!isOnline) {
    return { onReplay: onLocalReset };
  }
  if (isHost) {
    return { onReplay: onRematch, replayLabel: "再戦" };
  }
  return { replayHint: "ホストの再戦を待っています…" };
}
