export const FH_NODE_COUNT = 11;

/**
 * 正式盤（1-3-3-3-1 の11点）。
 * 列番号は左=0。猟犬は列が減る方向へ戻れない。
 *
 *        0
 *      1 2 3
 *      4 5 6
 *      7 8 9
 *       10
 */
export const FH_NODE_COL = [0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4] as const;

/** ウサギの突破目標（左の3点列） */
export const FH_LEFT_NODES = [1, 2, 3] as const;

export const FH_HARE_START = 10;
/** 左端・左列の上下（左列中央は空き） */
export const FH_HOUND_START = [0, 1, 3] as const;

export const FH_STALL_LIMIT = 10;

export type Player = 0 | 1; // 0 = 猟犬, 1 = ウサギ

export type FoxHoundsWinReason =
  | "hare-trapped"
  | "hare-breakthrough"
  | "hounds-stuck"
  | "hounds-stalling";

export type FoxHoundsState = {
  board: (Player | null)[];
  current: Player;
  stallTurns: number;
};

export type FoxHoundsMove = {
  from: number;
  to: number;
};

/** 11点ボードの隣接リスト（隣接点のみ。2—5—8 などは経由移動） */
export const FH_NEIGHBORS: readonly number[][] = [
  [1, 2, 3], // 0 左端
  [0, 2, 4, 5], // 1 左列上
  [0, 1, 3, 5], // 2 左列中
  [0, 2, 5, 6], // 3 左列下
  [1, 5, 7], // 4 中列上
  [1, 2, 3, 4, 6, 7, 8, 9], // 5 中央ハブ
  [3, 5, 9], // 6 中列下
  [4, 5, 8, 10], // 7 右列上
  [5, 7, 9, 10], // 8 右列中
  [5, 6, 8, 10], // 9 右列下
  [7, 8, 9], // 10 右端
];

/** 描画用の点座標（viewBox 0–100） */
export const FH_NODE_POS: readonly { x: number; y: number }[] = [
  { x: 5, y: 50 },
  { x: 24, y: 10 },
  { x: 24, y: 50 },
  { x: 24, y: 90 },
  { x: 43, y: 10 },
  { x: 43, y: 50 },
  { x: 43, y: 90 },
  { x: 62, y: 10 },
  { x: 62, y: 50 },
  { x: 62, y: 90 },
  { x: 81, y: 50 },
];

/** 盤面の線（表示用）。参照画像どおりに描画 */
export const FH_BOARD_LINES: readonly [number, number][] = [
  // 先端（水平＋斜め2本）
  [0, 2],
  [0, 1],
  [0, 3],
  [10, 8],
  [10, 7],
  [10, 9],
  // 縦線（3点列×3）
  [1, 2],
  [2, 3],
  [4, 5],
  [5, 6],
  [7, 8],
  [8, 9],
  // 横線（上・中・下）
  [1, 4],
  [4, 7],
  [2, 5],
  [5, 8],
  [3, 6],
  [6, 9],
  // 中央ハブへの斜め
  [1, 5],
  [3, 5],
  [5, 7],
  [5, 9],
];

export function initialFoxHounds(): FoxHoundsState {
  const board: (Player | null)[] = Array(FH_NODE_COUNT).fill(null);
  for (const node of FH_HOUND_START) board[node] = 0;
  board[FH_HARE_START] = 1;
  return {
    board,
    current: 0,
    stallTurns: 0,
  };
}

function hareNode(board: (Player | null)[]): number {
  return board.indexOf(1);
}

function isHoundForward(from: number, to: number): boolean {
  return FH_NODE_COL[to] >= FH_NODE_COL[from];
}

export function foxHoundsHoundDestinations(
  board: (Player | null)[],
  from: number
): number[] {
  if (board[from] !== 0) return [];
  return FH_NEIGHBORS[from].filter(
    (to) => board[to] === null && isHoundForward(from, to)
  );
}

export function foxHoundsHareDestinations(board: (Player | null)[]): number[] {
  const from = hareNode(board);
  if (from < 0) return [];
  return FH_NEIGHBORS[from].filter((to) => board[to] === null);
}

export function foxHoundsMoves(
  state: FoxHoundsState,
  player: Player
): FoxHoundsMove[] {
  const { board } = state;
  const moves: FoxHoundsMove[] = [];

  if (player === 1) {
    const from = hareNode(board);
    if (from < 0) return moves;
    for (const to of foxHoundsHareDestinations(board)) {
      moves.push({ from, to });
    }
    return moves;
  }

  for (let from = 0; from < board.length; from++) {
    if (board[from] !== 0) continue;
    for (const to of foxHoundsHoundDestinations(board, from)) {
      moves.push({ from, to });
    }
  }
  return moves;
}

function hareBreakthrough(board: (Player | null)[]): boolean {
  const hare = hareNode(board);
  return hare >= 0 && (FH_LEFT_NODES as readonly number[]).includes(hare);
}

export function foxHoundsWinner(
  state: FoxHoundsState,
  nextPlayer: Player
): { winner: Player; reason: FoxHoundsWinReason } | null {
  if (hareBreakthrough(state.board)) {
    return { winner: 1, reason: "hare-breakthrough" };
  }
  if (state.stallTurns >= FH_STALL_LIMIT) {
    return { winner: 1, reason: "hounds-stalling" };
  }

  const nextMoves = foxHoundsMoves(state, nextPlayer);
  if (nextMoves.length > 0) return null;

  if (nextPlayer === 1) {
    return { winner: 0, reason: "hare-trapped" };
  }
  return { winner: 1, reason: "hounds-stuck" };
}

export function applyFoxHoundsMove(
  state: FoxHoundsState,
  from: number,
  to: number
): FoxHoundsState | null {
  const { board, current } = state;
  if (board[from] !== current || board[to] !== null) return null;

  const legal = foxHoundsMoves(state, current);
  if (!legal.some((move) => move.from === from && move.to === to)) return null;

  const nextBoard = board.slice();
  nextBoard[from] = null;
  nextBoard[to] = current;

  let stallTurns = state.stallTurns;
  if (current === 0) {
    stallTurns =
      FH_NODE_COL[to] > FH_NODE_COL[from] ? 0 : state.stallTurns + 1;
  }

  return {
    board: nextBoard,
    current: current === 0 ? 1 : 0,
    stallTurns,
  };
}

export function foxHoundsWinMessage(reason: FoxHoundsWinReason): string {
  switch (reason) {
    case "hare-trapped":
      return "猟犬がウサギを囲み、動けなくしました。";
    case "hare-breakthrough":
      return "ウサギが左端の列に到達しました。";
    case "hounds-stuck":
      return "猟犬に動ける手がなくなりました。";
    case "hounds-stalling":
      return "猟犬が10手連続で前進しなかったため、ウサギの不戦勝です。";
  }
}
