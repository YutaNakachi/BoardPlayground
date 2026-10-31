export type RoomPlayerRow = {
  player_id: string;
  seat_index: number;
  display_name: string;
};

export type RoomPlayerView = {
  playerId: string;
  seatIndex: number;
  displayName: string;
};

/**
 * 名簿クエリの失敗を空配列にしない。
 * 失敗を空として 200 にすると、待機室の席が消える。
 */
export function rosterFromQuery(
  rows: RoomPlayerRow[] | null,
  failed: boolean
): RoomPlayerView[] | null {
  if (failed) return null;
  return (rows ?? []).map((p) => ({
    playerId: p.player_id,
    seatIndex: p.seat_index,
    displayName: p.display_name,
  }));
}

export function isTransientDbError(error: {
  message?: string;
  code?: string;
} | null): boolean {
  if (!error) return false;
  const message = error.message ?? "";
  if (
    /fetch failed|timeout|timed out|ECONNRESET|EAI_AGAIN|502|503|504|upstream|schema cache/i.test(
      message
    )
  ) {
    return true;
  }
  return error.code === "57014" || error.code === "PGRST000" || error.code === "PGRST301";
}
