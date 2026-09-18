export type Player = 0 | 1;

export type PieceType = "K" | "Q" | "R" | "B" | "N" | "P";

export type ChessPiece = {
  player: Player;
  type: PieceType;
};

export type Board = (ChessPiece | null)[];

export type CastlingRights = {
  kingSide: boolean;
  queenSide: boolean;
};

export type ChessState = {
  board: Board;
  current: Player;
  castling: [CastlingRights, CastlingRights];
  enPassant: number | null;
};

export type ChessMove = {
  from: number;
  to: number;
  castle?: "king" | "queen";
  enPassant?: boolean;
  promotion?: "Q";
};

export type ChessStatus =
  | { kind: "playing" }
  | { kind: "checkmate"; winner: Player }
  | { kind: "stalemate" };

const SIZE = 8;

const ORTHO: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];
const DIAG: [number, number][] = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];
const KNIGHT: [number, number][] = [
  [-2, -1],
  [-2, 1],
  [-1, -2],
  [-1, 2],
  [1, -2],
  [1, 2],
  [2, -1],
  [2, 1],
];

export function chessIndex(row: number, col: number): number {
  return row * SIZE + col;
}

function rowOf(index: number): number {
  return Math.floor(index / SIZE);
}

function colOf(index: number): number {
  return index % SIZE;
}

function inBoard(row: number, col: number): boolean {
  return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
}

function forwardDir(player: Player): number {
  return player === 0 ? -1 : 1;
}

function startRank(player: Player): number {
  return player === 0 ? 6 : 1;
}

function promotionRank(player: Player): number {
  return player === 0 ? 0 : 7;
}

export function initialChessState(): ChessState {
  const board: Board = Array(SIZE * SIZE).fill(null);
  const back = ["R", "N", "B", "Q", "K", "B", "N", "R"] as PieceType[];
  for (let col = 0; col < SIZE; col++) {
    board[chessIndex(0, col)] = { player: 1, type: back[col] };
    board[chessIndex(1, col)] = { player: 1, type: "P" };
    board[chessIndex(6, col)] = { player: 0, type: "P" };
    board[chessIndex(7, col)] = { player: 0, type: back[col] };
  }
  return {
    board,
    current: 0,
    castling: [
      { kingSide: true, queenSide: true },
      { kingSide: true, queenSide: true },
    ],
    enPassant: null,
  };
}

function pieceAt(board: Board, row: number, col: number): ChessPiece | null {
  if (!inBoard(row, col)) return null;
  return board[chessIndex(row, col)];
}

function findKing(board: Board, player: Player): number {
  for (let i = 0; i < board.length; i++) {
    const piece = board[i];
    if (piece?.player === player && piece.type === "K") return i;
  }
  return -1;
}

function isAttacked(board: Board, square: number, byPlayer: Player): boolean {
  const targetRow = rowOf(square);
  const targetCol = colOf(square);

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const piece = board[chessIndex(row, col)];
      if (!piece || piece.player !== byPlayer) continue;
      const from = chessIndex(row, col);
      if (canAttack(board, from, square, piece)) return true;
    }
  }
  return false;
}

function canAttack(board: Board, from: number, to: number, piece: ChessPiece): boolean {
  const fromRow = rowOf(from);
  const fromCol = colOf(from);
  const toRow = rowOf(to);
  const toCol = colOf(to);
  const dr = toRow - fromRow;
  const dc = toCol - fromCol;
  const fwd = forwardDir(piece.player);

  switch (piece.type) {
    case "K":
      return Math.max(Math.abs(dr), Math.abs(dc)) === 1;
    case "Q":
      if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return false;
      if (dr === 0 && dc === 0) return false;
      return pathClear(board, fromRow, fromCol, toRow, toCol);
    case "R":
      if (dr !== 0 && dc !== 0) return false;
      return pathClear(board, fromRow, fromCol, toRow, toCol);
    case "B":
      if (Math.abs(dr) !== Math.abs(dc) || dr === 0) return false;
      return pathClear(board, fromRow, fromCol, toRow, toCol);
    case "N":
      return (
        (Math.abs(dr) === 2 && Math.abs(dc) === 1) ||
        (Math.abs(dr) === 1 && Math.abs(dc) === 2)
      );
    case "P": {
      return dr === fwd && Math.abs(dc) === 1;
    }
    default:
      return false;
  }
}

function pathClear(
  board: Board,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number
): boolean {
  const dr = Math.sign(toRow - fromRow);
  const dc = Math.sign(toCol - fromCol);
  let row = fromRow + dr;
  let col = fromCol + dc;
  while (row !== toRow || col !== toCol) {
    if (board[chessIndex(row, col)]) return false;
    row += dr;
    col += dc;
  }
  return true;
}

export function isInCheck(board: Board, player: Player): boolean {
  const king = findKing(board, player);
  if (king < 0) return false;
  const enemy: Player = player === 0 ? 1 : 0;
  return isAttacked(board, king, enemy);
}

function addSlideMoves(
  board: Board,
  from: number,
  piece: ChessPiece,
  dirs: [number, number][],
  moves: ChessMove[]
): void {
  const row = rowOf(from);
  const col = colOf(from);
  for (const [dr, dc] of dirs) {
    let r = row + dr;
    let c = col + dc;
    while (inBoard(r, c)) {
      const to = chessIndex(r, c);
      const target = board[to];
      if (!target) {
        moves.push({ from, to });
      } else {
        if (target.player !== piece.player) moves.push({ from, to });
        break;
      }
      r += dr;
      c += dc;
    }
  }
}

function pseudoLegalMovesFrom(board: Board, from: number, state: ChessState): ChessMove[] {
  const piece = board[from];
  if (!piece) return [];
  const moves: ChessMove[] = [];
  const row = rowOf(from);
  const col = colOf(from);
  const fwd = forwardDir(piece.player);

  switch (piece.type) {
    case "K": {
      for (const [dr, dc] of [...ORTHO, ...DIAG]) {
        const r = row + dr;
        const c = col + dc;
        if (!inBoard(r, c)) continue;
        const to = chessIndex(r, c);
        const target = board[to];
        if (!target || target.player !== piece.player) moves.push({ from, to });
      }
      addCastling(board, from, piece, state, moves);
      break;
    }
    case "Q":
      addSlideMoves(board, from, piece, [...ORTHO, ...DIAG], moves);
      break;
    case "R":
      addSlideMoves(board, from, piece, ORTHO, moves);
      break;
    case "B":
      addSlideMoves(board, from, piece, DIAG, moves);
      break;
    case "N": {
      for (const [dr, dc] of KNIGHT) {
        const r = row + dr;
        const c = col + dc;
        if (!inBoard(r, c)) continue;
        const to = chessIndex(r, c);
        const target = board[to];
        if (!target || target.player !== piece.player) moves.push({ from, to });
      }
      break;
    }
    case "P": {
      const one = row + fwd;
      if (inBoard(one, col) && !board[chessIndex(one, col)]) {
        const to = chessIndex(one, col);
        if (one === promotionRank(piece.player)) {
          moves.push({ from, to, promotion: "Q" });
        } else {
          moves.push({ from, to });
        }
        if (row === startRank(piece.player)) {
          const two = row + fwd * 2;
          if (inBoard(two, col) && !board[chessIndex(two, col)]) {
            moves.push({ from, to: chessIndex(two, col) });
          }
        }
      }
      for (const dc of [-1, 1]) {
        const r = row + fwd;
        const c = col + dc;
        if (!inBoard(r, c)) continue;
        const to = chessIndex(r, c);
        const target = board[to];
        if (target && target.player !== piece.player) {
          if (r === promotionRank(piece.player)) {
            moves.push({ from, to, promotion: "Q" });
          } else {
            moves.push({ from, to });
          }
        } else if (state.enPassant === to) {
          moves.push({ from, to, enPassant: true });
        }
      }
      break;
    }
  }
  return moves;
}

function addCastling(
  board: Board,
  from: number,
  piece: ChessPiece,
  state: ChessState,
  moves: ChessMove[]
): void {
  const row = rowOf(from);
  const col = colOf(from);
  if (row !== (piece.player === 0 ? 7 : 0) || col !== 4) return;
  const rights = state.castling[piece.player];
  const enemy: Player = piece.player === 0 ? 1 : 0;

  if (rights.kingSide) {
    const rookCol = 7;
    const rook = board[chessIndex(row, rookCol)];
    if (
      rook?.type === "R" &&
      rook.player === piece.player &&
      !board[chessIndex(row, 5)] &&
      !board[chessIndex(row, 6)] &&
      !isAttacked(board, from, enemy) &&
      !isAttacked(board, chessIndex(row, 5), enemy) &&
      !isAttacked(board, chessIndex(row, 6), enemy)
    ) {
      moves.push({ from, to: chessIndex(row, 6), castle: "king" });
    }
  }

  if (rights.queenSide) {
    const rookCol = 0;
    const rook = board[chessIndex(row, rookCol)];
    if (
      rook?.type === "R" &&
      rook.player === piece.player &&
      !board[chessIndex(row, 1)] &&
      !board[chessIndex(row, 2)] &&
      !board[chessIndex(row, 3)] &&
      !isAttacked(board, from, enemy) &&
      !isAttacked(board, chessIndex(row, 3), enemy) &&
      !isAttacked(board, chessIndex(row, 2), enemy)
    ) {
      moves.push({ from, to: chessIndex(row, 2), castle: "queen" });
    }
  }
}

function applyMoveToBoard(board: Board, move: ChessMove): Board {
  const next = board.slice();
  const piece = next[move.from];
  if (!piece) return next;

  if (move.enPassant) {
    const capRow = rowOf(move.to) - forwardDir(piece.player);
    const capCol = colOf(move.to);
    next[chessIndex(capRow, capCol)] = null;
  }

  next[move.from] = null;

  if (move.castle === "king") {
    const row = rowOf(move.from);
    next[move.to] = piece;
    next[chessIndex(row, 7)] = null;
    next[chessIndex(row, 5)] = { player: piece.player, type: "R" };
    return next;
  }
  if (move.castle === "queen") {
    const row = rowOf(move.from);
    next[move.to] = piece;
    next[chessIndex(row, 0)] = null;
    next[chessIndex(row, 3)] = { player: piece.player, type: "R" };
    return next;
  }

  const placed: ChessPiece =
    move.promotion === "Q" ? { player: piece.player, type: "Q" } : piece;
  next[move.to] = placed;
  return next;
}

function isLegalMove(state: ChessState, move: ChessMove): boolean {
  const nextBoard = applyMoveToBoard(state.board, move);
  const piece = state.board[move.from];
  if (!piece) return false;
  return !isInCheck(nextBoard, piece.player);
}

export function chessMoves(state: ChessState): ChessMove[] {
  const legal: ChessMove[] = [];
  for (let i = 0; i < state.board.length; i++) {
    const piece = state.board[i];
    if (!piece || piece.player !== state.current) continue;
    for (const move of pseudoLegalMovesFrom(state.board, i, state)) {
      if (isLegalMove(state, move)) legal.push(move);
    }
  }
  return legal;
}

export function chessStatus(state: ChessState): ChessStatus {
  const moves = chessMoves(state);
  if (moves.length > 0) return { kind: "playing" };
  if (isInCheck(state.board, state.current)) {
    return { kind: "checkmate", winner: state.current === 0 ? 1 : 0 };
  }
  return { kind: "stalemate" };
}

function updateCastling(
  castling: [CastlingRights, CastlingRights],
  board: Board,
  move: ChessMove
): [CastlingRights, CastlingRights] {
  const piece = board[move.from];
  if (!piece) return castling;
  const next: [CastlingRights, CastlingRights] = [
    { ...castling[0] },
    { ...castling[1] },
  ];

  if (piece.type === "K" || move.castle) {
    next[piece.player] = { kingSide: false, queenSide: false };
  }
  if (piece.type === "R") {
    const row = rowOf(move.from);
    const col = colOf(move.from);
    const homeRow = piece.player === 0 ? 7 : 0;
    if (row === homeRow && col === 0) next[piece.player].queenSide = false;
    if (row === homeRow && col === 7) next[piece.player].kingSide = false;
  }

  const captured = board[move.to];
  if (captured?.type === "R") {
    const row = rowOf(move.to);
    const col = colOf(move.to);
    const homeRow = captured.player === 0 ? 7 : 0;
    if (row === homeRow && col === 0) next[captured.player].queenSide = false;
    if (row === homeRow && col === 7) next[captured.player].kingSide = false;
  }

  return next;
}

function nextEnPassant(state: ChessState, move: ChessMove): number | null {
  const piece = state.board[move.from];
  if (!piece || piece.type !== "P") return null;
  const fromRow = rowOf(move.from);
  const toRow = rowOf(move.to);
  if (Math.abs(toRow - fromRow) !== 2) return null;
  return chessIndex(fromRow + forwardDir(piece.player), colOf(move.from));
}

export function applyChessMove(state: ChessState, move: ChessMove): ChessState {
  const board = applyMoveToBoard(state.board, move);
  const castling = updateCastling(state.castling, state.board, move);
  const enPassant = nextEnPassant(state, move);
  const nextPlayer: Player = state.current === 0 ? 1 : 0;
  return {
    board,
    current: nextPlayer,
    castling,
    enPassant,
  };
}

export function chessPieceLabel(piece: ChessPiece): string {
  return piece.type;
}
