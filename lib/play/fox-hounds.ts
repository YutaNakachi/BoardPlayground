export const FH_SIZE = 8;
export const FH_CELLS = FH_SIZE * FH_SIZE;

export type Player = 0 | 1; // 0 rabbit, 1 hounds
export type Cell = Player | null;
export type Board = Cell[];

const HOUND_START = [1, 3, 5, 7].map((col) => col);

export function initialFoxHounds(): Board {
  const board: Board = Array(FH_CELLS).fill(null);
  board[FH_CELLS - 1] = 0;
  for (const col of HOUND_START) {
    board[col] = 1;
  }
  return board;
}

export function foxHoundsMoves(board: Board, player: Player): number[] {
  const moves: number[] = [];
  if (player === 0) {
    const fox = board.indexOf(0);
    if (fox < 0) return moves;
    const row = Math.floor(fox / FH_SIZE);
    const col = fox % FH_SIZE;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr < 0 || nr >= FH_SIZE || nc < 0 || nc >= FH_SIZE) continue;
        const ni = nr * FH_SIZE + nc;
        if (board[ni] === null) moves.push(ni);
      }
    }
    return moves;
  }

  for (let i = 0; i < board.length; i++) {
    if (board[i] !== 1) continue;
    const row = Math.floor(i / FH_SIZE);
    const col = i % FH_SIZE;
    if (row <= 0) continue;
    for (const dc of [-1, 1]) {
      const nr = row - 1;
      const nc = col + dc;
      if (nc < 0 || nc >= FH_SIZE) continue;
      const ni = nr * FH_SIZE + nc;
      if (board[ni] === null) moves.push(ni);
    }
  }
  return moves;
}

export function applyFoxHoundsMove(
  board: Board,
  player: Player,
  from: number,
  to: number
): Board | null {
  if (board[from] !== player || board[to] !== null) return null;
  const moves = foxHoundsMoves(board, player);
  if (!moves.includes(to)) return null;
  const next = board.slice();
  next[from] = null;
  next[to] = player;
  return next;
}

export function foxHoundsWinner(board: Board, current: Player): Player | null {
  const fox = board.indexOf(0);
  if (fox < 0) return 1;
  const foxRow = Math.floor(fox / FH_SIZE);
  if (foxRow === 0) return 0;
  const rabbitMoves = foxHoundsMoves(board, 0);
  const houndMoves = foxHoundsMoves(board, 1);
  if (rabbitMoves.length === 0) return 1;
  if (current === 1 && houndMoves.length === 0) return 0;
  return null;
}
