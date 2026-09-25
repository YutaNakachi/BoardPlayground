export const NEBULA_SIZE = 15;
export const NEBULA_CORE = Math.floor(NEBULA_SIZE / 2) * NEBULA_SIZE + Math.floor(NEBULA_SIZE / 2);

export const NEBULA_MONO_ID = "mono";

export type NebulaEdge = "north" | "south" | "east" | "west";

export type NebulaPiece = {
  id: string;
  cells: [number, number][];
  roulette: boolean;
};

/** ルーレット対象の形状（単マスは常時別枠） */
export const NEBULA_PIECES: NebulaPiece[] = [
  { id: "domino", cells: [[0, 0], [0, 1]], roulette: true },
  { id: "tri", cells: [[0, 0], [0, 1], [0, 2]], roulette: true },
  { id: "L3", cells: [[0, 0], [1, 0], [1, 1]], roulette: true },
  { id: "L4", cells: [[0, 0], [1, 0], [2, 0], [2, 1]], roulette: true },
  { id: "T4", cells: [[0, 0], [0, 1], [0, 2], [1, 1]], roulette: true },
  { id: "square", cells: [[0, 0], [0, 1], [1, 0], [1, 1]], roulette: true },
  { id: "Z4", cells: [[0, 0], [0, 1], [1, 1], [1, 2]], roulette: true },
  { id: "line4", cells: [[0, 0], [0, 1], [0, 2], [0, 3]], roulette: true },
  { id: "plus", cells: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]], roulette: true },
  { id: "F5", cells: [[0, 1], [0, 2], [1, 0], [1, 1], [2, 1]], roulette: true },
  { id: NEBULA_MONO_ID, cells: [[0, 0]], roulette: false },
];

const PIECE_BY_ID = new Map(NEBULA_PIECES.map((p) => [p.id, p]));

export function getNebulaPiece(pieceId: string): NebulaPiece | undefined {
  return PIECE_BY_ID.get(pieceId);
}

/** 盤上のマスがどのプレイヤーのホーム辺か（3人時の南は neutral） */
export function homeEdgeOwnerAt(
  index: number,
  playerCount: number
): number | "neutral" | null {
  const { row, col } = nebulaRowCol(index);
  const last = NEBULA_SIZE - 1;
  if (playerCount === 2) {
    if (row === 0) return 0;
    if (row === last) return 1;
    return null;
  }
  if (playerCount === 3) {
    if (row === 0) return 0;
    if (col === last) return 1;
    if (col === 0) return 2;
    if (row === last) return "neutral";
    return null;
  }
  if (row === 0) return 0;
  if (col === last) return 1;
  if (row === last) return 2;
  if (col === 0) return 3;
  return null;
}
const ROULETTE_POOL = NEBULA_PIECES.filter((p) => p.roulette).map((p) => p.id);

export type NebulaBoard = (number | null)[];

export type NebulaPlacement = {
  pieceId: string;
  rotation: number;
  anchorRow: number;
  anchorCol: number;
};

export type NebulaState = {
  playerCount: number;
  currentPlayer: number;
  board: NebulaBoard;
  gameOver: boolean;
  winners: number[];
  isDraw: boolean;
  roulette: string[];
  passesInRow: number;
};

export function nebulaIndex(row: number, col: number): number {
  return row * NEBULA_SIZE + col;
}

export function nebulaRowCol(index: number): { row: number; col: number } {
  return { row: Math.floor(index / NEBULA_SIZE), col: index % NEBULA_SIZE };
}

export function rotateCells(cells: [number, number][], quarterTurns: number): [number, number][] {
  const t = ((quarterTurns % 4) + 4) % 4;
  return cells.map(([r, c]) => {
    let nr = r;
    let nc = c;
    for (let i = 0; i < t; i++) {
      const tr = nc;
      const tc = -nr;
      nr = tr;
      nc = tc;
    }
    return [nr, nc] as [number, number];
  });
}

export function pieceCellsAt(
  pieceId: string,
  rotation: number,
  anchorRow: number,
  anchorCol: number
): { row: number; col: number }[] {
  const piece = PIECE_BY_ID.get(pieceId);
  if (!piece) return [];
  const rotated = rotateCells(piece.cells, rotation);
  let minR = 0;
  let minC = 0;
  for (const [r, c] of rotated) {
    minR = Math.min(minR, r);
    minC = Math.min(minC, c);
  }
  return rotated.map(([r, c]) => ({
    row: anchorRow + r - minR,
    col: anchorCol + c - minC,
  }));
}

export function playerHomeEdge(player: number, playerCount: number): NebulaEdge {
  if (playerCount === 2) {
    return player === 0 ? "north" : "south";
  }
  if (playerCount === 3) {
    if (player === 0) return "north";
    if (player === 1) return "east";
    return "west";
  }
  const edges: NebulaEdge[] = ["north", "east", "south", "west"];
  return edges[player] ?? "north";
}

export function cellOnEdge(row: number, col: number, edge: NebulaEdge): boolean {
  if (edge === "north") return row === 0;
  if (edge === "south") return row === NEBULA_SIZE - 1;
  if (edge === "west") return col === 0;
  return col === NEBULA_SIZE - 1;
}

export function borderEdgesAt(row: number, col: number): NebulaEdge[] {
  const out: NebulaEdge[] = [];
  if (row === 0) out.push("north");
  if (row === NEBULA_SIZE - 1) out.push("south");
  if (col === 0) out.push("west");
  if (col === NEBULA_SIZE - 1) out.push("east");
  return out;
}

export function nebulaNeighbors4(index: number): number[] {
  const { row, col } = nebulaRowCol(index);
  const out: number[] = [];
  if (row > 0) out.push(index - NEBULA_SIZE);
  if (row < NEBULA_SIZE - 1) out.push(index + NEBULA_SIZE);
  if (col > 0) out.push(index - 1);
  if (col < NEBULA_SIZE - 1) out.push(index + 1);
  return out;
}

export function nebulaNeighbors8(index: number): number[] {
  const { row, col } = nebulaRowCol(index);
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nr >= NEBULA_SIZE || nc < 0 || nc >= NEBULA_SIZE) continue;
      out.push(nebulaIndex(nr, nc));
    }
  }
  return out;
}

function playerHasPieces(board: NebulaBoard, player: number): boolean {
  return board.some((v) => v === player);
}

function touchesOwnCorner(
  board: NebulaBoard,
  player: number,
  newCells: { row: number; col: number }[]
): boolean {
  for (const { row, col } of newCells) {
    const idx = nebulaIndex(row, col);
    for (const n of nebulaNeighbors8(idx)) {
      if (board[n] !== player) continue;
      const { row: nr, col: nc } = nebulaRowCol(n);
      const edgeTouch = Math.abs(nr - row) + Math.abs(nc - col) === 1;
      if (!edgeTouch) return true;
    }
  }
  return false;
}

function touchesOwnEdge(
  board: NebulaBoard,
  player: number,
  newCells: { row: number; col: number }[]
): boolean {
  for (const { row, col } of newCells) {
    const idx = nebulaIndex(row, col);
    for (const n of nebulaNeighbors4(idx)) {
      if (board[n] === player) return true;
    }
  }
  return false;
}

export function isLegalNebulaPlacement(
  board: NebulaBoard,
  player: number,
  playerCount: number,
  pieceId: string,
  rotation: number,
  anchorRow: number,
  anchorCol: number
): boolean {
  const piece = PIECE_BY_ID.get(pieceId);
  if (!piece) return false;

  const cells = pieceCellsAt(pieceId, rotation, anchorRow, anchorCol);
  if (cells.length === 0) return false;

  const home = playerHomeEdge(player, playerCount);

  for (const { row, col } of cells) {
    if (row < 0 || row >= NEBULA_SIZE || col < 0 || col >= NEBULA_SIZE) return false;
    const idx = nebulaIndex(row, col);
    if (idx === NEBULA_CORE || board[idx] !== null) return false;
  }

  const first = !playerHasPieces(board, player);
  if (first) {
    if (!cells.some(({ row, col }) => cellOnEdge(row, col, home))) return false;
  } else {
    if (!touchesOwnCorner(board, player, cells)) return false;
    if (touchesOwnEdge(board, player, cells)) return false;
  }

  return true;
}

export function legalNebulaPlacements(
  board: NebulaBoard,
  player: number,
  playerCount: number,
  pieceIds: string[]
): NebulaPlacement[] {
  const out: NebulaPlacement[] = [];
  const ids = [...new Set(pieceIds)];
  for (const pieceId of ids) {
    for (let rotation = 0; rotation < 4; rotation++) {
      for (let row = 0; row < NEBULA_SIZE; row++) {
        for (let col = 0; col < NEBULA_SIZE; col++) {
          if (
            isLegalNebulaPlacement(board, player, playerCount, pieceId, rotation, row, col)
          ) {
            out.push({ pieceId, rotation, anchorRow: row, anchorCol: col });
          }
        }
      }
    }
  }
  return out;
}

export function rollNebulaRoulette(random = Math.random): string[] {
  const pool = [...ROULETTE_POOL];
  const picks: string[] = [];
  while (picks.length < 3 && pool.length > 0) {
    const i = Math.floor(random() * pool.length);
    picks.push(pool.splice(i, 1)[0]);
  }
  return picks;
}

function floodBorderEdges(board: NebulaBoard, blocked: Set<number>): Set<NebulaEdge> {
  const visited = new Set<number>();
  const edges = new Set<NebulaEdge>();
  const stack = [NEBULA_CORE];
  visited.add(NEBULA_CORE);

  while (stack.length) {
    const cur = stack.pop()!;
    const { row, col } = nebulaRowCol(cur);
    for (const e of borderEdgesAt(row, col)) edges.add(e);

    for (const n of nebulaNeighbors4(cur)) {
      if (visited.has(n) || blocked.has(n)) continue;
      if (n === NEBULA_CORE) continue;
      const cell = board[n];
      if (cell !== null && cell >= 0) {
        visited.add(n);
        stack.push(n);
        continue;
      }
      if (cell === null) {
        visited.add(n);
        stack.push(n);
      }
    }
  }

  return edges;
}

function eightConnectedGroup(board: NebulaBoard, player: number, start: number): Set<number> {
  const group = new Set<number>();
  const stack = [start];
  group.add(start);

  while (stack.length) {
    const cur = stack.pop()!;
    for (const n of nebulaNeighbors8(cur)) {
      if (board[n] === player && !group.has(n)) {
        group.add(n);
        stack.push(n);
      }
    }
  }

  return group;
}

function groupTouchesHome(group: Set<number>, home: NebulaEdge): boolean {
  for (const idx of group) {
    const { row, col } = nebulaRowCol(idx);
    if (cellOnEdge(row, col, home)) return true;
  }
  return false;
}

function groupEnclosesCore(board: NebulaBoard, group: Set<number>, home: NebulaEdge): boolean {
  const edges = floodBorderEdges(board, group);
  for (const e of edges) {
    if (e !== home) return false;
  }
  return edges.has(home);
}

/** 星核を閉じ込め、ホーム辺につながった8連結グループがあれば勝者 */
export function nebulaVictoryPlayer(board: NebulaBoard, playerCount: number): number | null {
  const seen = new Set<number>();

  for (let i = 0; i < board.length; i++) {
    const owner = board[i];
    if (owner === null || owner < 0 || owner >= playerCount || seen.has(i)) continue;

    const group = eightConnectedGroup(board, owner, i);
    for (const g of group) seen.add(g);

    const home = playerHomeEdge(owner, playerCount);
    if (!groupTouchesHome(group, home)) continue;
    if (!groupEnclosesCore(board, group, home)) continue;
    return owner;
  }

  return null;
}

export function initialNebulaLink(playerCount: number): NebulaState {
  const board = Array<number | null>(NEBULA_SIZE * NEBULA_SIZE).fill(null);
  return {
    playerCount,
    currentPlayer: 0,
    board,
    gameOver: false,
    winners: [],
    isDraw: false,
    roulette: [],
    passesInRow: 0,
  };
}

export function applyNebulaSpinRoulette(state: NebulaState): NebulaState | null {
  if (state.gameOver || state.roulette.length > 0) return null;
  return { ...state, roulette: rollNebulaRoulette() };
}

function finishState(
  state: NebulaState,
  board: NebulaBoard,
  winners: number[],
  isDraw: boolean
): NebulaState {
  return {
    ...state,
    board,
    gameOver: true,
    winners,
    isDraw,
  };
}

function advanceTurn(state: NebulaState, board: NebulaBoard): NebulaState {
  const victor = nebulaVictoryPlayer(board, state.playerCount);
  if (victor !== null) {
    return finishState(state, board, [victor], false);
  }

  const nextPlayer = (state.currentPlayer + 1) % state.playerCount;
  return {
    ...state,
    board,
    currentPlayer: nextPlayer,
    roulette: [],
    passesInRow: 0,
  };
}

function allowedPieceIds(state: NebulaState): string[] {
  const ids = [NEBULA_MONO_ID];
  if (state.roulette.length > 0) ids.unshift(...state.roulette);
  return ids;
}

export function applyNebulaPlace(
  state: NebulaState,
  placement: NebulaPlacement
): NebulaState | null {
  if (state.gameOver) return null;
  const player = state.currentPlayer;
  const allowedPieces = allowedPieceIds(state);
  if (!allowedPieces.includes(placement.pieceId)) return null;
  if (
    placement.pieceId !== NEBULA_MONO_ID &&
    !state.roulette.includes(placement.pieceId)
  ) {
    return null;
  }

  if (
    !isLegalNebulaPlacement(
      state.board,
      player,
      state.playerCount,
      placement.pieceId,
      placement.rotation,
      placement.anchorRow,
      placement.anchorCol
    )
  ) {
    return null;
  }

  const board = [...state.board];
  const cells = pieceCellsAt(
    placement.pieceId,
    placement.rotation,
    placement.anchorRow,
    placement.anchorCol
  );
  for (const { row, col } of cells) {
    board[nebulaIndex(row, col)] = player;
  }

  const victor = nebulaVictoryPlayer(board, state.playerCount);
  if (victor !== null) {
    return finishState(state, board, [victor], false);
  }

  const nextPlayer = (state.currentPlayer + 1) % state.playerCount;
  return {
    ...state,
    board,
    currentPlayer: nextPlayer,
    roulette: [],
    passesInRow: 0,
  };
}

export function canNebulaPass(state: NebulaState): boolean {
  if (state.gameOver) return false;
  const player = state.currentPlayer;
  return (
    legalNebulaPlacements(state.board, player, state.playerCount, allowedPieceIds(state))
      .length === 0
  );
}

export function applyNebulaPass(state: NebulaState): NebulaState | null {
  if (!canNebulaPass(state)) return null;

  const passesInRow = state.passesInRow + 1;
  if (passesInRow >= state.playerCount) {
    return finishState(
      state,
      state.board,
      Array.from({ length: state.playerCount }, (_, i) => i),
      true
    );
  }

  const nextPlayer = (state.currentPlayer + 1) % state.playerCount;
  return {
    ...state,
    currentPlayer: nextPlayer,
    roulette: [],
    passesInRow,
  };
}

export function nebulaWinners(state: NebulaState): number[] {
  if (!state.gameOver) return [];
  return state.isDraw
    ? Array.from({ length: state.playerCount }, (_, i) => i)
    : state.winners;
}

export function homeEdgeLabel(edge: NebulaEdge): string {
  const map: Record<NebulaEdge, string> = {
    north: "北",
    south: "南",
    east: "東",
    west: "西",
  };
  return map[edge];
}

export function pieceLabel(pieceId: string): string {
  const piece = PIECE_BY_ID.get(pieceId);
  if (!piece) return pieceId;
  if (pieceId === NEBULA_MONO_ID) return "単マス";
  const n = piece.cells.length;
  return `${n}マス`;
}
