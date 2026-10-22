import { getGameBySlug, type GameMeta } from "@/lib/games";

export type PlayerCountOption = 2 | 3 | 4;

export function parsePlayerCount(raw: unknown): PlayerCountOption | undefined {
  if (raw && typeof raw === "object" && "playerCount" in raw) {
    const n = (raw as { playerCount: unknown }).playerCount;
    if (n === 2 || n === 3 || n === 4) return n;
  }
  return undefined;
}

export function gameAllowsVariablePlayerCount(game: GameMeta): boolean {
  return game.playersMax > 2;
}

/** 部屋の目標人数（create / start の正本） */
export function resolveMaxPlayers(
  gameSlug: string,
  gameOptions: unknown
): number | null {
  const game = getGameBySlug(gameSlug);
  if (!game) return null;
  if (!gameAllowsVariablePlayerCount(game)) {
    return game.playersMax;
  }
  const count = parsePlayerCount(gameOptions);
  if (count === undefined) return null;
  if (count < game.playersMin || count > game.playersMax) return null;
  return count;
}

export function requiredPlayerCountFromRoom(
  gameSlug: string,
  gameOptions: unknown,
  maxPlayers?: number
): number {
  if (maxPlayers !== undefined && maxPlayers >= 2) {
    return maxPlayers;
  }
  const game = getGameBySlug(gameSlug);
  if (!game) return 2;
  if (!gameAllowsVariablePlayerCount(game)) return game.playersMax;
  return parsePlayerCount(gameOptions) ?? 2;
}

export function parseOpeningSeat(raw: unknown, seatCount: number): number | null {
  if (seatCount < 1) return null;
  if (raw && typeof raw === "object" && "firstPlayer" in raw) {
    const firstPlayer = (raw as { firstPlayer: unknown }).firstPlayer;
    if (
      typeof firstPlayer === "number" &&
      Number.isInteger(firstPlayer) &&
      firstPlayer >= 0 &&
      firstPlayer < seatCount
    ) {
      return firstPlayer;
    }
    return null;
  }
  return 0;
}

export function nextFreeSeatIndex(
  takenSeats: number[],
  maxPlayers: number
): number | null {
  const taken = new Set(takenSeats);
  for (let i = 0; i < maxPlayers; i++) {
    if (!taken.has(i)) return i;
  }
  return null;
}
