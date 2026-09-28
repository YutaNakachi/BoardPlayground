import { formatWinners } from "@/lib/game-engine";
import type { PlayMode } from "@/lib/online/types";

export type ResultPlayModeInfo = {
  mode: PlayMode;
  humanSeat?: number;
};

/** ResultPanel 用。CPU 対戦時は seat を「あなた / CPU」に置き換える */
export function formatResultWinnersLabel(
  winners: number[],
  playMode: ResultPlayModeInfo
): string {
  if (
    playMode.mode === "cpu" &&
    playMode.humanSeat !== undefined &&
    playMode.humanSeat >= 0
  ) {
    const label = (seat: number) =>
      seat === playMode.humanSeat ? "あなた" : "CPU";
    if (winners.length === 0) return "—";
    const names = winners.map(label);
    return winners.length > 1
      ? `${names.join(" / ")}（引き分け）`
      : names[0]!;
  }
  return formatWinners(winners);
}
