export const GOMOKU_SIZE = 13;
export const GOMOKU_CELLS = GOMOKU_SIZE * GOMOKU_SIZE;

export type Player = 0 | 1;
export type Cell = Player | null;
export type Board = Cell[];

const DIRS: [number, number][] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

export function emptyGomokuBoard(): Board {
  return Array(GOMOKU_CELLS).fill(null);
}

export function gomokuWinner(board: Board): Player | null {
  for (let row = 0; row < GOMOKU_SIZE; row++) {
    for (let col = 0; col < GOMOKU_SIZE; col++) {
      const player = board[row * GOMOKU_SIZE + col];
      if (player === null) continue;
      for (const [dr, dc] of DIRS) {
        const prevR = row - dr;
        const prevC = col - dc;
        if (
          prevR >= 0 &&
          prevR < GOMOKU_SIZE &&
          prevC >= 0 &&
          prevC < GOMOKU_SIZE &&
          board[prevR * GOMOKU_SIZE + prevC] === player
        ) {
          continue;
        }
        let n = 0;
        let r = row;
        let c = col;
        while (
          r >= 0 &&
          r < GOMOKU_SIZE &&
          c >= 0 &&
          c < GOMOKU_SIZE &&
          board[r * GOMOKU_SIZE + c] === player
        ) {
          n += 1;
          r += dr;
          c += dc;
        }
        if (n >= 5) return player;
      }
    }
  }
  return null;
}

export function gomokuBoardFull(board: Board): boolean {
  return board.every((cell) => cell !== null);
}
