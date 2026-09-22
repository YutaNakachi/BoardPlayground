export const HEX_SIZE = 11;
export const HEX_CELLS = HEX_SIZE * HEX_SIZE;

/** 盤面上の石の色: 0=赤, 1=青 */
export type Stone = 0 | 1;
export type Cell = Stone | null;
export type Board = Cell[];

/** ローカルプレイのプレイヤー番号 */
export type Player = 0 | 1;

export type HexWinResult = {
  winner: Stone;
  path: number[];
};

export type HexState = {
  board: Board;
  /** 手番のプレイヤー（0 または 1） */
  current: Player;
  /** 各プレイヤーが操作する石の色 */
  playerStone: [Stone, Stone];
  /** 先手の1手目のあと、後手がスワップを選べる */
  swapPending: boolean;
  firstMoveIndex: number | null;
};

/** 六角形の半径（viewBox 座標） */
export const HEX_RADIUS = 1;
const HEX_SQRT3 = Math.sqrt(3);

export function hexIndex(row: number, col: number): number {
  return row * HEX_SIZE + col;
}

export function hexCoord(index: number): { row: number; col: number } {
  return { row: Math.floor(index / HEX_SIZE), col: index % HEX_SIZE };
}

export function emptyHexBoard(): Board {
  return Array(HEX_CELLS).fill(null);
}

export function initialHexState(): HexState {
  return {
    board: emptyHexBoard(),
    current: 0,
    playerStone: [0, 1],
    swapPending: false,
    firstMoveIndex: null,
  };
}

/** 仕様どおりの6方向隣接 */
export function hexNeighbors(row: number, col: number): { row: number; col: number }[] {
  const candidates = [
    { row: row - 1, col },
    { row: row - 1, col: col + 1 },
    { row, col: col + 1 },
    { row: row + 1, col },
    { row: row + 1, col: col - 1 },
    { row, col: col - 1 },
  ];
  return candidates.filter(
    (pos) =>
      pos.row >= 0 &&
      pos.row < HEX_SIZE &&
      pos.col >= 0 &&
      pos.col < HEX_SIZE
  );
}

export function hexNeighborIndices(index: number): number[] {
  const { row, col } = hexCoord(index);
  return hexNeighbors(row, col).map((pos) => hexIndex(pos.row, pos.col));
}

/** flat-top 六角形の中心座標（菱形グリッド） */
export function hexCenter(row: number, col: number): { x: number; y: number } {
  const x = 1.5 * col * HEX_RADIUS;
  const y = HEX_SQRT3 * (row + col / 2) * HEX_RADIUS;
  return { x, y };
}

/** flat-top 六角形の頂点 */
export function hexPolygonPoints(row: number, col: number): string {
  const { x, y } = hexCenter(row, col);
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = ((60 * i - 30) * Math.PI) / 180;
    points.push(
      `${x + HEX_RADIUS * Math.cos(angle)},${y + HEX_RADIUS * Math.sin(angle)}`
    );
  }
  return points.join(" ");
}

function isStartCell(stone: Stone, row: number, col: number): boolean {
  return stone === 0 ? row === 0 : col === 0;
}

function isGoalCell(stone: Stone, row: number, col: number): boolean {
  return stone === 0 ? row === HEX_SIZE - 1 : col === HEX_SIZE - 1;
}

/** BFS で勝利経路を探索。赤=r0→r10、青=c0→c10 */
export function hexWinPath(board: Board, stone: Stone): number[] | null {
  const visited = new Set<number>();
  const parent = new Map<number, number | null>();
  const queue: number[] = [];

  for (let row = 0; row < HEX_SIZE; row++) {
    for (let col = 0; col < HEX_SIZE; col++) {
      const index = hexIndex(row, col);
      if (board[index] !== stone || !isStartCell(stone, row, col)) continue;
      if (visited.has(index)) continue;
      visited.add(index);
      parent.set(index, null);
      queue.push(index);
    }
  }

  if (queue.length === 0) return null;

  let goal: number | null = null;
  while (queue.length > 0) {
    const current = queue.shift()!;
    const { row, col } = hexCoord(current);
    if (isGoalCell(stone, row, col)) {
      goal = current;
      break;
    }
    for (const next of hexNeighborIndices(current)) {
      if (visited.has(next) || board[next] !== stone) continue;
      visited.add(next);
      parent.set(next, current);
      queue.push(next);
    }
  }

  if (goal === null) return null;

  const path: number[] = [];
  let cursor: number | null = goal;
  while (cursor !== null) {
    path.push(cursor);
    cursor = parent.get(cursor) ?? null;
  }
  return path.reverse();
}

export function hexWinner(board: Board): Stone | null {
  if (hexWinPath(board, 0)) return 0;
  if (hexWinPath(board, 1)) return 1;
  return null;
}

export function hexWinResult(board: Board): HexWinResult | null {
  const redPath = hexWinPath(board, 0);
  if (redPath) return { winner: 0, path: redPath };
  const bluePath = hexWinPath(board, 1);
  if (bluePath) return { winner: 1, path: bluePath };
  return null;
}

export function stoneForPlayer(state: HexState, player: Player): Stone {
  return state.playerStone[player];
}

export function applyHexSwap(state: HexState): HexState {
  if (!state.swapPending || state.firstMoveIndex === null) return state;
  const board = state.board.slice();
  board[state.firstMoveIndex] = 1;
  return {
    board,
    current: 0,
    playerStone: [1, 0],
    swapPending: false,
    firstMoveIndex: state.firstMoveIndex,
  };
}

export function declineHexSwap(state: HexState): HexState {
  if (!state.swapPending) return state;
  return { ...state, swapPending: false };
}

export function placeHexStone(
  state: HexState,
  index: number
): { next: HexState; win: HexWinResult | null } | null {
  if (state.board[index] !== null) return null;

  const stone = stoneForPlayer(state, state.current);
  const board = state.board.slice();
  board[index] = stone;

  let next: HexState = {
    board,
    current: state.current === 0 ? 1 : 0,
    playerStone: state.playerStone,
    swapPending: false,
    firstMoveIndex: state.firstMoveIndex,
  };

  const isOpeningMove =
    state.firstMoveIndex === null &&
    state.current === 0 &&
    board.every((cell, i) => i === index || cell === null);

  if (isOpeningMove) {
    next = {
      ...next,
      current: 1,
      swapPending: true,
      firstMoveIndex: index,
    };
    const win = hexWinResult(board);
    return { next, win };
  }

  if (state.swapPending) {
    next = declineHexSwap(next);
  }

  const win = hexWinResult(board);
  return { next, win };
}

/** viewBox 計算用: 全セルのバウンディングボックス */
export function hexViewBox(padding = 1.2): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let row = 0; row < HEX_SIZE; row++) {
    for (let col = 0; col < HEX_SIZE; col++) {
      const { x, y } = hexCenter(row, col);
      minX = Math.min(minX, x - HEX_RADIUS);
      maxX = Math.max(maxX, x + HEX_RADIUS);
      minY = Math.min(minY, y - HEX_RADIUS);
      maxY = Math.max(maxY, y + HEX_RADIUS);
    }
  }

  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}

/** 赤辺（r=0 / r=10）・青辺（c=0 / c=10）の外周セル */
export function hexEdgeCells(
  edge: "red-start" | "red-goal" | "blue-start" | "blue-goal"
): number[] {
  const cells: number[] = [];
  for (let row = 0; row < HEX_SIZE; row++) {
    for (let col = 0; col < HEX_SIZE; col++) {
      if (edge === "red-start" && row === 0) cells.push(hexIndex(row, col));
      if (edge === "red-goal" && row === HEX_SIZE - 1) cells.push(hexIndex(row, col));
      if (edge === "blue-start" && col === 0) cells.push(hexIndex(row, col));
      if (edge === "blue-goal" && col === HEX_SIZE - 1) cells.push(hexIndex(row, col));
    }
  }
  return cells;
}

export const HEX_STONE_COLORS = {
  0: { fill: "#ef4444", stroke: "#fca5a5", label: "赤" },
  1: { fill: "#3b82f6", stroke: "#93c5fd", label: "青" },
} as const;
