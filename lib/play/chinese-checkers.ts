export type HexCoord = { q: number; r: number };

export type ChineseCheckersPiece = {
  player: number;
  id: string;
};

export type ChineseCheckersState = {
  players: number;
  board: Map<string, ChineseCheckersPiece | null>;
  current: number;
  selected: string | null;
  winner: number | null;
};

const COORDS: HexCoord[] = [];
for (let r = 0; r < 17; r++) {
  const width = r < 9 ? r + 1 : 17 - r;
  const offset = r < 9 ? 8 - r : r - 8;
  for (let i = 0; i < width; i++) {
    COORDS.push({ q: offset + i, r });
  }
}

function key(c: HexCoord): string {
  return `${c.q},${c.r}`;
}

const NEIGHBORS: [number, number][] = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

function goalRows(player: number, players: number): number[] {
  if (players === 2) return player === 0 ? [12, 13, 14, 15, 16] : [0, 1, 2, 3, 4];
  if (players === 3) {
    const starts = [[0, 1, 2, 3, 4], [6, 7, 8], [12, 13, 14, 15, 16]];
    const goals = [[12, 13, 14, 15, 16], [9, 10, 11], [0, 1, 2, 3, 4]];
    return goals[player];
  }
  const goals = [
    [12, 13, 14, 15, 16],
    [9, 10, 11, 12],
    [0, 1, 2, 3, 4],
    [4, 5, 6, 7],
  ];
  return goals[player];
}

function startRows(player: number, players: number): number[] {
  if (players === 2) return player === 0 ? [0, 1, 2, 3, 4] : [12, 13, 14, 15, 16];
  if (players === 3) {
    const starts = [[0, 1, 2, 3, 4], [6, 7, 8], [12, 13, 14, 15, 16]];
    return starts[player];
  }
  const starts = [
    [0, 1, 2, 3, 4],
    [4, 5, 6, 7],
    [12, 13, 14, 15, 16],
    [9, 10, 11, 12],
  ];
  return starts[player];
}

function coordsInRows(rows: number[]): HexCoord[] {
  return COORDS.filter((c) => rows.includes(c.r));
}

export function initialChineseCheckers(players: number): ChineseCheckersState {
  const board = new Map<string, ChineseCheckersPiece | null>();
  for (const c of COORDS) board.set(key(c), null);

  for (let p = 0; p < players; p++) {
    const spots = coordsInRows(startRows(p, players));
    spots.forEach((c, i) => {
      board.set(key(c), { player: p, id: `p${p}-${i}` });
    });
  }

  return { players, board, current: 0, selected: null, winner: null };
}

function getCoord(k: string): HexCoord {
  const [q, r] = k.split(",").map(Number);
  return { q, r };
}

function boardHas(k: string): boolean {
  return COORDS.some((c) => key(c) === k);
}

function exploreJumps(
  state: ChineseCheckersState,
  fromKey: string,
  dests: Set<string>,
  visited: Set<string>
): void {
  if (visited.has(fromKey)) return;
  visited.add(fromKey);
  dests.add(fromKey);
  const from = getCoord(fromKey);
  for (const [dq, dr] of NEIGHBORS) {
    const adj = key({ q: from.q + dq, r: from.r + dr });
    if (!boardHas(adj) || !state.board.get(adj)) continue;
    const land = key({ q: from.q + dq * 2, r: from.r + dr * 2 });
    if (boardHas(land) && !state.board.get(land)) {
      exploreJumps(state, land, dests, visited);
    }
  }
}

export function chineseCheckersMoves(
  state: ChineseCheckersState,
  fromKey: string
): string[] {
  const piece = state.board.get(fromKey);
  if (!piece || piece.player !== state.current) return [];

  const dests = new Set<string>();
  const from = getCoord(fromKey);

  for (const [dq, dr] of NEIGHBORS) {
    const adj = key({ q: from.q + dq, r: from.r + dr });
    if (!boardHas(adj)) continue;
    if (!state.board.get(adj)) {
      dests.add(adj);
      continue;
    }
    const land = key({ q: from.q + dq * 2, r: from.r + dr * 2 });
    if (boardHas(land) && !state.board.get(land)) {
      exploreJumps(state, land, dests, new Set());
    }
  }

  return Array.from(dests);
}

function playerWon(state: ChineseCheckersState, player: number): boolean {
  const goals = new Set(coordsInRows(goalRows(player, state.players)).map(key));
  const pieces = Array.from(state.board.entries()).filter(([, p]) => p?.player === player);
  return pieces.length > 0 && pieces.every(([k]) => goals.has(k));
}

export function applyChineseCheckersMove(
  state: ChineseCheckersState,
  fromKey: string,
  toKey: string
): ChineseCheckersState | null {
  const moves = chineseCheckersMoves(state, fromKey);
  if (!moves.includes(toKey)) return null;
  const piece = state.board.get(fromKey);
  if (!piece) return null;

  const board = new Map(state.board);
  board.set(fromKey, null);
  board.set(toKey, piece);

  const nextPlayer = (state.current + 1) % state.players;
  const winner = playerWon({ ...state, board }, state.current) ? state.current : null;

  return {
    ...state,
    board,
    current: winner != null ? state.current : nextPlayer,
    selected: null,
    winner,
  };
}

export function chineseCheckersCells(): HexCoord[] {
  return COORDS;
}

export function coordKey(c: HexCoord): string {
  return key(c);
}
