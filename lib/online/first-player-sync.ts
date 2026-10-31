import { parseOpeningSeat } from "./player-count";

/** 終局画面の先攻ピッカーを使うゲーム（役職席のゲームは除く） */
const OPENING_SEAT_GAMES = new Set([
  "reversi",
  "tic-tac-toe",
  "gomoku",
  "checkers",
  "gravity-four",
  "nim",
  "hex",
  "mancala",
  "dots-and-boxes",
  "dejarik",
  "mini-shogi",
  "ludo",
  "nebula-link",
  "overheat-chicken",
]);

export function gameSupportsOpeningSeat(slug: string): boolean {
  return OPENING_SEAT_GAMES.has(slug);
}

export function explicitOpeningSeat(raw: unknown): number | null {
  if (!raw || typeof raw !== "object" || !("firstPlayer" in raw)) return null;
  const firstPlayer = (raw as { firstPlayer: unknown }).firstPlayer;
  if (
    typeof firstPlayer !== "number" ||
    !Number.isInteger(firstPlayer) ||
    firstPlayer < 0
  ) {
    return null;
  }
  return firstPlayer;
}

/** 先攻ボタンの席数。maxPlayers が小さくても、明示された先攻席は範囲に含める。 */
export function openingSeatCount(
  maxPlayers: number,
  explicitOpening: number | null
): number {
  const fromMax = maxPlayers >= 2 ? maxPlayers : 2;
  const fromOpening = explicitOpening != null ? explicitOpening + 1 : 0;
  return Math.max(fromMax, fromOpening);
}

/**
 * 全席共通の先攻表示。サーバーの gameOptions を正とする。
 * 席数が足りずパースできない値を 0（ホスト席）へ落とさない。
 */
export function shownOpeningSeat(
  gameOptions: unknown,
  maxPlayers: number
): number {
  const explicit = explicitOpeningSeat(gameOptions);
  const seatCount = openingSeatCount(maxPlayers, explicit);
  const parsed = parseOpeningSeat(gameOptions, seatCount);
  if (parsed != null) return parsed;
  if (explicit != null && explicit < seatCount) return explicit;
  return 0;
}

export function resolveOpeningDisplay(
  gameOptions: unknown,
  maxPlayers: number
): { seat: number; seatCount: number } {
  const explicit = explicitOpeningSeat(gameOptions);
  const seatCount = openingSeatCount(maxPlayers, explicit);
  return {
    seat: shownOpeningSeat(gameOptions, maxPlayers),
    seatCount,
  };
}

export function rematchOpeningSeat(current: number, seatCount: number): number {
  if (seatCount < 1) return 0;
  const normalized = ((current % seatCount) + seatCount) % seatCount;
  return (normalized + 1) % seatCount;
}

/**
 * 取得開始後に先攻が更新されていたら、遅い GET で上書きしない。
 */
export function gameOptionsAfterRefresh<T>(params: {
  previous: T;
  incoming: T;
  revisionAtFetchStart: number;
  currentRevision: number;
}): T {
  if (params.currentRevision !== params.revisionAtFetchStart) {
    return params.previous;
  }
  return params.incoming;
}
