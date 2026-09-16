export type Player = 0 | 1;

export type Piece = {
  player: Player;
  king: boolean;
};

export type Board = (Piece | null)[];

export type CheckersMove = {
  from: number;
  to: number;
  capture?: number;
};

const SIZE = 8;

function inBoard(row: number, col: number): boolean {
  return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
}

export function checkersIndex(row: number, col: number): number {
  return row * SIZE + col;
}

export function isDarkSquare(index: number): boolean {
  const row = Math.floor(index / SIZE);
  const col = index % SIZE;
  return (row + col) % 2 === 1;
}

function dirsFor(piece: Piece): [number, number][] {
  if (piece.king) return [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];
  return piece.player === 0
    ? [
        [-1, -1],
        [-1, 1],
      ]
    : [
        [1, -1],
        [1, 1],
      ];
}

export function initialCheckersBoard(): Board {
  const board: Board = Array(SIZE * SIZE).fill(null);
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if ((row + col) % 2 !== 1) continue;
      const i = checkersIndex(row, col);
      if (row <= 2) board[i] = { player: 1, king: false };
      if (row >= 5) board[i] = { player: 0, king: false };
    }
  }
  return board;
}

function capturesFrom(board: Board, from: number): CheckersMove[] {
  const piece = board[from];
  if (!piece) return [];
  const row = Math.floor(from / SIZE);
  const col = from % SIZE;
  const moves: CheckersMove[] = [];
  for (const [dr, dc] of dirsFor(piece)) {
    const midR = row + dr;
    const midC = col + dc;
    const landR = row + dr * 2;
    const landC = col + dc * 2;
    if (!inBoard(midR, midC) || !inBoard(landR, landC)) continue;
    const mid = board[checkersIndex(midR, midC)];
    const land = board[checkersIndex(landR, landC)];
    if (mid && mid.player !== piece.player && land === null) {
      moves.push({
        from,
        to: checkersIndex(landR, landC),
        capture: checkersIndex(midR, midC),
      });
    }
  }
  return moves;
}

export function checkersMoves(
  board: Board,
  player: Player,
  fromLock?: number | null
): CheckersMove[] {
  const captures: CheckersMove[] = [];
  const quiet: CheckersMove[] = [];
  for (let i = 0; i < board.length; i++) {
    const piece = board[i];
    if (!piece || piece.player !== player) continue;
    if (fromLock != null && i !== fromLock) continue;
    const caps = capturesFrom(board, i);
    if (caps.length) {
      captures.push(...caps);
      continue;
    }
    if (fromLock != null) continue;
    const row = Math.floor(i / SIZE);
    const col = i % SIZE;
    for (const [dr, dc] of dirsFor(piece)) {
      const r = row + dr;
      const c = col + dc;
      if (!inBoard(r, c)) continue;
      const j = checkersIndex(r, c);
      if (board[j] === null) quiet.push({ from: i, to: j });
    }
  }
  if (fromLock != null) return captures;
  return captures.length ? captures : quiet;
}

export function wouldKing(piece: Piece, to: number): boolean {
  if (piece.king) return false;
  const row = Math.floor(to / SIZE);
  return (piece.player === 0 && row === 0) || (piece.player === 1 && row === 7);
}

export function applyCheckersMove(
  board: Board,
  move: CheckersMove
): { board: Board; continueFrom: number | null } {
  const piece = board[move.from];
  if (!piece) return { board, continueFrom: null };
  const next = board.slice();
  next[move.from] = null;
  if (move.capture != null) next[move.capture] = null;
  const kinged = wouldKing(piece, move.to);
  const placed: Piece = { player: piece.player, king: piece.king || kinged };
  next[move.to] = placed;
  if (move.capture != null && !kinged) {
    const more = capturesFrom(next, move.to);
    if (more.length > 0) return { board: next, continueFrom: move.to };
  }
  return { board: next, continueFrom: null };
}

export function checkersPieceCount(board: Board, player: Player): number {
  return board.reduce((n, cell) => (cell?.player === player ? n + 1 : n), 0);
}
