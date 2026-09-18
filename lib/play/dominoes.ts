import { shuffle } from "@/lib/game-engine";

export type DominoTile = {
  id: string;
  high: number;
  low: number;
};

export type DominoesState = {
  hands: DominoTile[][];
  boneyard: DominoTile[];
  chain: DominoTile[];
  ends: { left: number; right: number } | null;
  current: 0 | 1;
  winner: 0 | 1 | null;
};

function createDominoSet(): DominoTile[] {
  const tiles: DominoTile[] = [];
  let id = 0;
  for (let high = 0; high <= 6; high++) {
    for (let low = 0; low <= high; low++) {
      tiles.push({ id: `d-${id++}`, high, low });
    }
  }
  return shuffle(tiles);
}

export function initialDominoes(): DominoesState {
  const deck = createDominoSet();
  const hands: DominoTile[][] = [[], []];
  for (let i = 0; i < 14; i++) {
    hands[i % 2].push(deck[i]);
  }
  return {
    hands,
    boneyard: deck.slice(14),
    chain: [],
    ends: null,
    current: 0,
    winner: null,
  };
}

function canPlayOnEnd(tile: DominoTile, end: number): boolean {
  return tile.high === end || tile.low === end;
}

export type DominoPlay =
  | { kind: "start"; tileId: string }
  | { kind: "left"; tileId: string }
  | { kind: "right"; tileId: string };

export function dominoPlays(state: DominoesState, player: 0 | 1): DominoPlay[] {
  const hand = state.hands[player];
  const plays: DominoPlay[] = [];
  if (!state.ends) {
    for (const tile of hand) plays.push({ kind: "start", tileId: tile.id });
    return plays;
  }
  for (const tile of hand) {
    if (canPlayOnEnd(tile, state.ends.left)) plays.push({ kind: "left", tileId: tile.id });
    if (canPlayOnEnd(tile, state.ends.right)) plays.push({ kind: "right", tileId: tile.id });
  }
  return plays;
}

function placedTile(tile: DominoTile, match: number): { tile: DominoTile; newEnd: number } {
  if (tile.high === match) {
    return { tile, newEnd: tile.low };
  }
  if (tile.low === match) {
    return { tile: { ...tile, high: tile.low, low: tile.high }, newEnd: tile.high };
  }
  return { tile, newEnd: match };
}

export function applyDominoPlay(state: DominoesState, play: DominoPlay): DominoesState | null {
  const player = state.current;
  const hand = state.hands[player];
  const tile = hand.find((t) => t.id === play.tileId);
  if (!tile) return null;

  const nextHands = state.hands.map((h) => [...h]) as DominoTile[][];

  if (play.kind === "start") {
    if (state.ends) return null;
    nextHands[player] = nextHands[player].filter((t) => t.id !== tile.id);
    const ends = { left: tile.high, right: tile.low };
    const winner = nextHands[player].length === 0 ? player : null;
    return {
      ...state,
      hands: nextHands,
      chain: [tile],
      ends,
      current: player === 0 ? 1 : 0,
      winner,
    };
  }

  if (!state.ends) return null;
  const match = play.kind === "left" ? state.ends.left : state.ends.right;
  if (!canPlayOnEnd(tile, match)) return null;

  const { tile: oriented, newEnd } = placedTile(tile, match);
  nextHands[player] = nextHands[player].filter((t) => t.id !== tile.id);
  const chain = play.kind === "left" ? [oriented, ...state.chain] : [...state.chain, oriented];
  const ends =
    play.kind === "left"
      ? { left: newEnd, right: state.ends.right }
      : { left: state.ends.left, right: newEnd };
  const winner = nextHands[player].length === 0 ? player : null;
  return {
    ...state,
    hands: nextHands,
    chain,
    ends,
    current: player === 0 ? 1 : 0,
    winner,
  };
}

export function drawDomino(state: DominoesState): DominoesState | null {
  if (dominoPlays(state, state.current).length > 0) return null;
  if (!state.boneyard.length) {
    return { ...state, current: state.current === 0 ? 1 : 0 };
  }
  const boneyard = [...state.boneyard];
  const drawn = boneyard.pop()!;
  const hands = state.hands.map((h) => [...h]) as DominoTile[][];
  hands[state.current].push(drawn);
  return { ...state, boneyard, hands };
}

export function dominoTileLabel(tile: DominoTile): string {
  return `${tile.high}|${tile.low}`;
}
