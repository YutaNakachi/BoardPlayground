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

/** pointy-top 六角形の中心座標（ゲームロジックと一致する axial 配置） */
export function hexCenter(row: number, col: number): { x: number; y: number } {
  const x = HEX_SQRT3 * (col + row * 0.5) * HEX_RADIUS;
  const y = row * 1.5 * HEX_RADIUS;
  return { x, y };
}

/** pointy-top 六角形の頂点 */
export function hexCorner(
  row: number,
  col: number,
  corner: 0 | 1 | 2 | 3 | 4 | 5
): { x: number; y: number } {
  const { x, y } = hexCenter(row, col);
  const angle = (Math.PI / 3) * corner + Math.PI / 6;
  return {
    x: x + HEX_RADIUS * Math.cos(angle),
    y: y + HEX_RADIUS * Math.sin(angle),
  };
}

/** pointy-top 六角形の SVG ポリゴン座標 */
export function hexPolygonPoints(row: number, col: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const { x, y } = hexCorner(row, col, i as 0 | 1 | 2 | 3 | 4 | 5);
    points.push(`${x},${y}`);
  }
  return points.join(" ");
}

export type HexPoint = { x: number; y: number };

/** 各辺がどの隣接マスに接続するか（side 0〜5） */
const HEX_SIDE_NEIGHBOR = [
  { dr: -1, dc: 0 },
  { dr: -1, dc: 1 },
  { dr: 0, dc: 1 },
  { dr: 1, dc: 0 },
  { dr: 1, dc: -1 },
  { dr: 0, dc: -1 },
] as const;

function edgeKey(a: HexPoint, b: HexPoint): string {
  return [
    `${a.x.toFixed(4)},${a.y.toFixed(4)}`,
    `${b.x.toFixed(4)},${b.y.toFixed(4)}`,
  ]
    .sort()
    .join("|");
}

/** pointy-top: 辺0=上(N), 1=右上(NE), 2=右(E), 3=下(S), 4=左下(SW), 5=左(W) */
function outerEdgeColor(side: number, row: number, col: number): "red" | "blue" {
  if (side === 0 || side === 3) return "red";
  if (side === 2 || side === 5) return "blue";
  if (side === 1) return row === 0 ? "red" : "blue";
  return col === 0 ? "blue" : "red";
}

export type HexBoardEdge = {
  a: HexPoint;
  b: HexPoint;
  border: "red" | "blue" | null;
};

/** グリッド辺を一意化。外周は赤/青、内部は null */
export function hexBoardEdges(): HexBoardEdge[] {
  const seen = new Map<string, HexBoardEdge>();

  for (let row = 0; row < HEX_SIZE; row++) {
    for (let col = 0; col < HEX_SIZE; col++) {
      for (let side = 0; side < 6; side++) {
        const a = hexCorner(row, col, side as 0 | 1 | 2 | 3 | 4 | 5);
        const b = hexCorner(row, col, ((side + 1) % 6) as 0 | 1 | 2 | 3 | 4 | 5);
        const key = edgeKey(a, b);
        if (seen.has(key)) continue;

        const { dr, dc } = HEX_SIDE_NEIGHBOR[side];
        const nr = row + dr;
        const nc = col + dc;
        const hasNeighbor =
          nr >= 0 && nr < HEX_SIZE && nc >= 0 && nc < HEX_SIZE;

        seen.set(key, {
          a,
          b,
          border: hasNeighbor ? null : outerEdgeColor(side, row, col),
        });
      }
    }
  }

  return Array.from(seen.values());
}

export const HEX_GRID_STROKE = "#374151";
export const HEX_GRID_STROKE_WIDTH = 0.048;
export const HEX_CELL_FILL = "#9ca3af";
export const HEX_CELL_FILL_WIN = "#a8a29e";
export const HEX_BORDER_FILL = {
  red: "#dc2626",
  blue: "#2563eb",
} as const;
export const HEX_BORDER_BAND_DEPTH = 0.62;
export const HEX_COLUMN_LABELS = "ABCDEFGHIJK".split("");

function isStartCell(stone: Stone, row: number, col: number): boolean {
  return stone === 0 ? row === 0 : col === 0;
}

function isGoalCell(stone: Stone, row: number, col: number): boolean {
  return stone === 0 ? row === HEX_SIZE - 1 : col === HEX_SIZE - 1;
}

/** BFS で勝利経路を探索。赤=北(r0)→南(r10)、青=西(c0)→東(c10) */
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

function boardCenter(): HexPoint {
  let sx = 0;
  let sy = 0;
  for (let row = 0; row < HEX_SIZE; row++) {
    for (let col = 0; col < HEX_SIZE; col++) {
      const { x, y } = hexCenter(row, col);
      sx += x;
      sy += y;
    }
  }
  const n = HEX_SIZE * HEX_SIZE;
  return { x: sx / n, y: sy / n };
}

function outwardNormal(
  a: HexPoint,
  b: HexPoint,
  cx: number,
  cy: number
): { nx: number; ny: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len;
  let ny = dx / len;
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dot = (mx + nx - cx) * nx + (my + ny - cy) * ny;
  if (dot < 0) {
    nx = -nx;
    ny = -ny;
  }
  return { nx, ny };
}

function extrudeEdgePath(
  a: HexPoint,
  b: HexPoint,
  depth: number,
  cx: number,
  cy: number
): string {
  const { nx, ny } = outwardNormal(a, b, cx, cy);
  const a2 = { x: a.x + nx * depth, y: a.y + ny * depth };
  const b2 = { x: b.x + nx * depth, y: b.y + ny * depth };
  return `${a2.x},${a2.y} ${b2.x},${b2.y} ${b.x},${b.y} ${a.x},${a.y}`;
}

export type HexBorderSegment = {
  color: "red" | "blue";
  path: string;
  label?: { text: string; x: number; y: number };
};

/** 外周の各辺を法線方向に押し出した均一幅の台形セグメント */
export function hexBorderSegments(): HexBorderSegment[] {
  const last = HEX_SIZE - 1;
  const depth = HEX_BORDER_BAND_DEPTH;
  const center = boardCenter();
  const segments: HexBorderSegment[] = [];

  for (let row = 0; row < HEX_SIZE; row++) {
    for (let col = 0; col < HEX_SIZE; col++) {
      for (let side = 0; side < 6; side++) {
        const { dr, dc } = HEX_SIDE_NEIGHBOR[side];
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < HEX_SIZE && nc >= 0 && nc < HEX_SIZE) continue;

        const cornerA = side as 0 | 1 | 2 | 3 | 4 | 5;
        const cornerB = ((side + 1) % 6) as 0 | 1 | 2 | 3 | 4 | 5;
        const a = hexCorner(row, col, cornerA);
        const b = hexCorner(row, col, cornerB);
        const color = outerEdgeColor(side, row, col);
        const { nx, ny } = outwardNormal(a, b, center.x, center.y);
        const mx = (a.x + b.x) / 2 + nx * depth * 0.5;
        const my = (a.y + b.y) / 2 + ny * depth * 0.5;

        let label: HexBorderSegment["label"];
        if (color === "red" && row === 0 && side === 0) {
          label = { text: HEX_COLUMN_LABELS[col], x: mx, y: my };
        } else if (color === "red" && row === last && side === 3) {
          label = { text: HEX_COLUMN_LABELS[col], x: mx, y: my };
        } else if (color === "blue" && col === 0 && side === 5) {
          label = { text: String(row + 1), x: mx, y: my };
        } else if (color === "blue" && col === last && side === 2) {
          label = { text: String(row + 1), x: mx, y: my };
        }

        segments.push({
          color,
          path: extrudeEdgePath(a, b, depth, center.x, center.y),
          label,
        });
      }
    }
  }

  return segments;
}

/** viewBox 計算用: 全セルのバウンディングボックス */
export function hexViewBox(padding = 2.2): {
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

/** 赤辺（北 r=0 / 南 r=10）・青辺（西 c=0 / 東 c=10）の外周セル */
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
