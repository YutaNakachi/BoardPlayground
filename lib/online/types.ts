export type PlayMode = "local" | "online" | "cpu";

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
  maxPlayers: number;
  players: RoomPlayer[];
  hostPlayerId: string;
  gameOptions: Record<string, unknown>;
};

export type RoomGameState = {
  state: unknown;
  version: number;
  currentPlayer: number | null;
};

/** Games that support online play (2-player or host-selected 2–4) */
export const ONLINE_GAME_SLUGS = [
  "reversi",
  "tic-tac-toe",
  "gomoku",
  "checkers",
  "gravity-four",
  "nim",
  "hex",
  "mancala",
  "dots-and-boxes",
  "fox-hounds",
  "dejarik",
  "mini-shogi",
  "ludo",
  "nebula-link",
  "king-and-spy",
  "overheat-chicken",
] as const;

export type OnlineGameSlug = (typeof ONLINE_GAME_SLUGS)[number];

export function isOnlineGame(slug: string): slug is OnlineGameSlug {
  return (ONLINE_GAME_SLUGS as readonly string[]).includes(slug);
}
