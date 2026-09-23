import type { RoomPlayer } from "@/lib/online/types";

export function getSeatDisplayName(
  players: RoomPlayer[],
  seatIndex: number
): string {
  const player = players.find((p) => p.seatIndex === seatIndex);
  const name = player?.displayName?.trim();
  return name || `プレイヤー ${seatIndex + 1}`;
}

export function formatSeatLabel(
  players: RoomPlayer[],
  seatIndex: number,
  suffix?: string
): string {
  const name = getSeatDisplayName(players, seatIndex);
  return suffix ? `${name}（${suffix}）` : name;
}

export function formatWinnersWithNames(
  players: RoomPlayer[],
  winners: number[]
): string {
  const names = winners.map((i) => getSeatDisplayName(players, i)).join(" / ");
  return winners.length > 1 ? `${names}（引き分け）` : names;
}

/** サーバー生成の「プレイヤー1/2」文言を表示名に置き換える（表示のみ） */
export function localizePlayerNotice(
  notice: string | null,
  players: RoomPlayer[]
): string | null {
  if (!notice || players.length === 0) return notice;
  return notice.replace(/プレイヤー([12])/g, (_, num: string) =>
    getSeatDisplayName(players, Number(num) - 1)
  );
}
