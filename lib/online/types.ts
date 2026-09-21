export type PlayMode = "local" | "online";

export type RoomStatus = "waiting" | "playing" | "finished";

export type RoomPlayer = {
  playerId: string;
  seatIndex: number;
  displayName: string;
};

export type RoomInfo = {
  id: string;
  code: string;
  gameSlug: string;
  status: RoomStatus;
  players: RoomPlayer[];
  hostPlayerId: string;
  gameOptions: Record<string, unknown>;
};

export type RoomGameState = {
  state: unknown;
  version: number;
  currentPlayer: number | null;
};

/** Games that support online 2-player play */
export const ONLINE_GAME_SLUGS = [
  "reversi",
  "tic-tac-toe",
  "gomoku",
  "checkers",
] as const;

export type OnlineGameSlug = (typeof ONLINE_GAME_SLUGS)[number];

export function isOnlineGame(slug: string): slug is OnlineGameSlug {
  return (ONLINE_GAME_SLUGS as readonly string[]).includes(slug);
}
