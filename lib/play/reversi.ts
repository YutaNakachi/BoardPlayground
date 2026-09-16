export const REVERSI_SIZE = 8;
export const REVERSI_CELLS = REVERSI_SIZE * REVERSI_SIZE;

export type Player = 0 | 1;
export type Cell = Player | null;
export type Board = Cell[];

const DIRS: [number, number][] = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

function inBoard(row: number, col: number): boolean {
  return row >= 0 && row < REVERSI_SIZE && col >= 0 && col < REVERSI_SIZE;
}

export function reversiIndex(row: number, col: number): number {
  return row * REVERSI_SIZE + col;
}

export function initialReversiBoard(): Board {
  const board: Board = Array(REVERSI_CELLS).fill(null);
  board[reversiIndex(3, 3)] = 1;
  board[reversiIndex(3, 4)] = 0;
  board[reversiIndex(4, 3)] = 0;
  board[reversiIndex(4, 4)] = 1;
  return board;
}

export function reversiFlipsAt(board: Board, index: number, player: Player): number[] {
  if (board[index] !== null) return [];
  const row0 = Math.floor(index / REVERSI_SIZE);
  const col0 = index % REVERSI_SIZE;
  const opponent: Player = player === 0 ? 1 : 0;
  const flips: number[] = [];

  for (const [dr, dc] of DIRS) {
    const line: number[] = [];
    let row = row0 + dr;
    let col = col0 + dc;
    while (inBoard(row, col) && board[reversiIndex(row, col)] === opponent) {
      line.push(reversiIndex(row, col));
      row += dr;
      col += dc;
    }
    if (
      line.length > 0 &&
      inBoard(row, col) &&
      board[reversiIndex(row, col)] === player
    ) {
      flips.push(...line);
    }
  }
  return flips;
}

export function reversiLegalMoves(board: Board, player: Player): number[] {
  const moves: number[] = [];
  for (let i = 0; i < REVERSI_CELLS; i++) {
    if (reversiFlipsAt(board, i, player).length > 0) moves.push(i);
  }
  return moves;
}

export function playReversiMove(
  board: Board,
  index: number,
  player: Player
): Board | null {
  const flips = reversiFlipsAt(board, index, player);
  if (flips.length === 0) return null;
  const next = board.slice();
  next[index] = player;
  for (const f of flips) next[f] = player;
  return next;
}

export function reversiCounts(board: Board): [number, number] {
  let dark = 0;
  let light = 0;
  for (const cell of board) {
    if (cell === 0) dark += 1;
    else if (cell === 1) light += 1;
  }
  return [dark, light];
}

/** 相手に合法手があれば相手。なければ自分。両方なければ null（終局）。 */
export function reversiNextPlayer(board: Board, player: Player): Player | null {
  const opponent: Player = player === 0 ? 1 : 0;
  if (reversiLegalMoves(board, opponent).length > 0) return opponent;
  if (reversiLegalMoves(board, player).length > 0) return player;
  return null;
}
