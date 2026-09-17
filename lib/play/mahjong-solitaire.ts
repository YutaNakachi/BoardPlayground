import { shuffle } from "@/lib/game-engine";

export type MahjongTile = {
  id: string;
  type: string;
  layer: number;
  row: number;
  col: number;
};

export type MahjongState = {
  tiles: MahjongTile[];
  removed: string[];
};

/** Simplified turtle layout: 36 positions, 18 pairs */
const LAYOUT: { layer: number; row: number; col: number }[] = [
  { layer: 0, row: 0, col: 1 },
  { layer: 0, row: 0, col: 2 },
  { layer: 0, row: 0, col: 3 },
  { layer: 0, row: 0, col: 4 },
  { layer: 0, row: 0, col: 5 },
  { layer: 0, row: 0, col: 6 },
  { layer: 0, row: 0, col: 7 },
  { layer: 0, row: 1, col: 1 },
  { layer: 0, row: 1, col: 2 },
  { layer: 0, row: 1, col: 3 },
  { layer: 0, row: 1, col: 4 },
  { layer: 0, row: 1, col: 5 },
  { layer: 0, row: 1, col: 6 },
  { layer: 0, row: 1, col: 7 },
  { layer: 0, row: 2, col: 1 },
  { layer: 0, row: 2, col: 2 },
  { layer: 0, row: 2, col: 3 },
  { layer: 0, row: 2, col: 4 },
  { layer: 0, row: 2, col: 5 },
  { layer: 0, row: 2, col: 6 },
  { layer: 0, row: 2, col: 7 },
  { layer: 0, row: 3, col: 2 },
  { layer: 0, row: 3, col: 3 },
  { layer: 0, row: 3, col: 4 },
  { layer: 0, row: 3, col: 5 },
  { layer: 0, row: 3, col: 6 },
  { layer: 1, row: 1, col: 3 },
  { layer: 1, row: 1, col: 4 },
  { layer: 1, row: 1, col: 5 },
  { layer: 1, row: 2, col: 2 },
  { layer: 1, row: 2, col: 3 },
  { layer: 1, row: 2, col: 4 },
  { layer: 1, row: 2, col: 5 },
  { layer: 1, row: 2, col: 6 },
  { layer: 2, row: 2, col: 3 },
  { layer: 2, row: 2, col: 4 },
  { layer: 2, row: 2, col: 5 },
];

const TILE_TYPES = [
  "竹1", "竹2", "竹3", "竹4", "竹5", "竹6",
  "丸1", "丸2", "丸3", "丸4", "丸5", "丸6",
  "字1", "字2", "字3", "字4", "字5", "字6",
];

export function initialMahjongSolitaire(): MahjongState {
  const pairs = shuffle([...TILE_TYPES, ...TILE_TYPES]);
  const tiles: MahjongTile[] = LAYOUT.map((pos, index) => ({
    id: `t-${index}`,
    type: pairs[index],
    ...pos,
  }));
  return { tiles, removed: [] };
}

function activeTiles(state: MahjongState): MahjongTile[] {
  const removed = new Set(state.removed);
  return state.tiles.filter((t) => !removed.has(t.id));
}

function covers(a: MahjongTile, b: MahjongTile): boolean {
  return a.layer > b.layer && a.row === b.row && a.col === b.col;
}

export function isMahjongTileFree(state: MahjongState, tile: MahjongTile): boolean {
  const active = activeTiles(state);
  if (active.some((t) => covers(t, tile))) return false;
  const sameLayer = active.filter((t) => t.layer === tile.layer && t.row === tile.row);
  const leftBlocked = sameLayer.some((t) => t.col === tile.col - 1);
  const rightBlocked = sameLayer.some((t) => t.col === tile.col + 1);
  return !leftBlocked || !rightBlocked;
}

export function mahjongFreeTiles(state: MahjongState): MahjongTile[] {
  return activeTiles(state).filter((t) => isMahjongTileFree(state, t));
}

export function mahjongWon(state: MahjongState): boolean {
  return state.removed.length === state.tiles.length;
}

export function mahjongStuck(state: MahjongState): boolean {
  if (mahjongWon(state)) return false;
  const free = mahjongFreeTiles(state);
  const byType = new Map<string, number>();
  for (const tile of free) {
    byType.set(tile.type, (byType.get(tile.type) ?? 0) + 1);
  }
  return !Array.from(byType.values()).some((n) => n >= 2);
}

export function removeMahjongPair(
  state: MahjongState,
  aId: string,
  bId: string
): MahjongState | null {
  if (aId === bId) return null;
  const removed = new Set(state.removed);
  if (removed.has(aId) || removed.has(bId)) return null;
  const a = state.tiles.find((t) => t.id === aId);
  const b = state.tiles.find((t) => t.id === bId);
  if (!a || !b || a.type !== b.type) return null;
  if (!isMahjongTileFree(state, a) || !isMahjongTileFree(state, b)) return null;
  return { ...state, removed: [...state.removed, aId, bId] };
}

export const MAHJONG_LAYOUT = LAYOUT;
