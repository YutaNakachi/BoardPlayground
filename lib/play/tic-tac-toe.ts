export const TTT_SIZE = 3;
export const TTT_CELLS = TTT_SIZE * TTT_SIZE;
export const TTT_WIN = 3;
/** ローテモードで盤上に置ける最大枚数（4つ目を置くと最古が消える） */
export const TTT_ROTATING_MAX = 3;

export type Player = 0 | 1;
export type Cell = Player | null;
export type Board = Cell[];
export type TttMode = "classic" | "rotating";
export type TttHistories = [number[], number[]];

const DIRS: [number, number][] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

export function emptyTttBoard(): Board {
  return Array(TTT_CELLS).fill(null);
}

export function emptyTttHistories(): TttHistories {
  return [[], []];
}

export function tttWinner(board: Board): Player | null {
  for (let row = 0; row < TTT_SIZE; row++) {
    for (let col = 0; col < TTT_SIZE; col++) {
      const player = board[row * TTT_SIZE + col];
      if (player === null) continue;
      for (const [dr, dc] of DIRS) {
        let n = 0;
        let r = row;
        let c = col;
        while (
          r >= 0 &&
          r < TTT_SIZE &&
          c >= 0 &&
          c < TTT_SIZE &&
          board[r * TTT_SIZE + c] === player
        ) {
          n += 1;
          r += dr;
          c += dc;
        }
        if (n >= TTT_WIN) return player;
      }
    }
  }
  return null;
}

export function tttBoardFull(board: Board): boolean {
  return board.every((cell) => cell !== null);
}

export function applyTttPlace(
  board: Board,
  histories: TttHistories,
  index: number,
  player: Player,
  mode: TttMode
): { board: Board; histories: TttHistories } | null {
  if (index < 0 || index >= TTT_CELLS || board[index] !== null) return null;

  const nextBoard = board.slice();
  const nextHistories: TttHistories = [
    [...histories[0]],
    [...histories[1]],
  ];

  nextBoard[index] = player;
  nextHistories[player].push(index);

  if (mode === "rotating" && nextHistories[player].length > TTT_ROTATING_MAX) {
    const oldest = nextHistories[player].shift();
    if (oldest !== undefined) nextBoard[oldest] = null;
  }

  return { board: nextBoard, histories: nextHistories };
}

/** ローテモードで次に消える自分の駒（なければ null） */
export function tttRotatingOldest(
  histories: TttHistories,
  player: Player
): number | null {
  const history = histories[player];
  if (history.length < TTT_ROTATING_MAX) return null;
  return history[0] ?? null;
}
