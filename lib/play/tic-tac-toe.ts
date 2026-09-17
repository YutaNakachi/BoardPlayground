export const TTT_SIZE = 3;
export const TTT_CELLS = TTT_SIZE * TTT_SIZE;
export const TTT_WIN = 3;

export type Player = 0 | 1;
export type Cell = Player | null;
export type Board = Cell[];

const DIRS: [number, number][] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

export function emptyTttBoard(): Board {
  return Array(TTT_CELLS).fill(null);
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
