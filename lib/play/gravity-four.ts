export const GF_COLS = 7;
export const GF_ROWS = 6;
export const GF_CELLS = GF_COLS * GF_ROWS;
export const GF_WIN = 4;

export type Player = 0 | 1;
export type Cell = Player | null;
export type Board = Cell[];

const DIRS: [number, number][] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

export function emptyGravityFourBoard(): Board {
  return Array(GF_CELLS).fill(null);
}

export function gfIndex(row: number, col: number): number {
  return row * GF_COLS + col;
}

export function gfDropRow(board: Board, col: number): number | null {
  for (let row = GF_ROWS - 1; row >= 0; row--) {
    if (board[gfIndex(row, col)] === null) return row;
  }
  return null;
}

export function gfLegalColumns(board: Board): number[] {
  const cols: number[] = [];
  for (let col = 0; col < GF_COLS; col++) {
    if (gfDropRow(board, col) !== null) cols.push(col);
  }
  return cols;
}

export function dropGravityFour(
  board: Board,
  col: number,
  player: Player
): Board | null {
  const row = gfDropRow(board, col);
  if (row === null) return null;
  const next = board.slice();
  next[gfIndex(row, col)] = player;
  return next;
}

export function gravityFourWinner(board: Board): Player | null {
  for (let row = 0; row < GF_ROWS; row++) {
    for (let col = 0; col < GF_COLS; col++) {
      const player = board[gfIndex(row, col)];
      if (player === null) continue;
      for (const [dr, dc] of DIRS) {
        const prevR = row - dr;
        const prevC = col - dc;
        if (
          prevR >= 0 &&
          prevR < GF_ROWS &&
          prevC >= 0 &&
          prevC < GF_COLS &&
          board[gfIndex(prevR, prevC)] === player
        ) {
          continue;
        }
        let n = 0;
        let r = row;
        let c = col;
        while (
          r >= 0 &&
          r < GF_ROWS &&
          c >= 0 &&
          c < GF_COLS &&
          board[gfIndex(r, c)] === player
        ) {
          n += 1;
          r += dr;
          c += dc;
        }
        if (n >= GF_WIN) return player;
      }
    }
  }
  return null;
}

export function gravityFourBoardFull(board: Board): boolean {
  return gfLegalColumns(board).length === 0;
}
