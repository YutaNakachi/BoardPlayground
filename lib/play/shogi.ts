export type Player = 0 | 1;

export type ShogiPieceType = "K" | "G" | "S" | "N" | "L" | "B" | "R" | "P";

export type Droppable = Exclude<ShogiPieceType, "K">;

export type ShogiPiece = {
  type: ShogiPieceType;
  player: Player;
  promoted: boolean;
};

export type Board = (ShogiPiece | null)[];

export type Hand = Record<Droppable, number>;

export type ShogiState = {
  board: Board;
  hands: [Hand, Hand];
  current: Player;
};

export type ShogiMove =
  | { kind: "move"; from: number; to: number }
  | { kind: "drop"; piece: Droppable; to: number };

export type ShogiStatus =
  | { kind: "playing" }
  | { kind: "checkmate"; winner: Player };

const SIZE = 9;
const PROMO_ZONE = 3;

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

export function shogiIndex(row: number, col: number): number {
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

function emptyHand(): Hand {
  return { G: 0, S: 0, N: 0, L: 0, B: 0, R: 0, P: 0 };
}

export function initialShogiState(): ShogiState {
  const board: Board = Array(SIZE * SIZE).fill(null);
  const back: ShogiPieceType[] = ["L", "N", "S", "G", "K", "G", "S", "N", "L"];
  for (let col = 0; col < SIZE; col++) {
    board[shogiIndex(0, col)] = { type: back[col], player: 1, promoted: false };
    board[shogiIndex(8, col)] = { type: back[col], player: 0, promoted: false };
  }
  for (let col = 0; col < SIZE; col++) {
    if (col === 1 || col === 7) continue;
    board[shogiIndex(1, col)] = { type: "P", player: 1, promoted: false };
    board[shogiIndex(7, col)] = { type: "P", player: 0, promoted: false };
  }
  board[shogiIndex(1, 1)] = { type: "B", player: 1, promoted: false };
  board[shogiIndex(1, 7)] = { type: "R", player: 1, promoted: false };
  board[shogiIndex(7, 1)] = { type: "B", player: 0, promoted: false };
  board[shogiIndex(7, 7)] = { type: "R", player: 0, promoted: false };

  return {
    board,
    hands: [emptyHand(), emptyHand()],
    current: 0,
  };
}

function inPromotionZone(player: Player, row: number): boolean {
  return player === 0 ? row < PROMO_ZONE : row >= SIZE - PROMO_ZONE;
}

function goldDirs(player: Player): [number, number][] {
  const f = forwardDir(player);
  return [
    [f, -1],
    [f, 0],
    [f, 1],
    [0, -1],
    [0, 1],
    [-f, 0],
  ];
}

function silverDirs(player: Player): [number, number][] {
  const f = forwardDir(player);
  return [
    [f, -1],
    [f, 0],
    [f, 1],
    [-f, -1],
    [-f, 1],
  ];
}

function knightDirs(player: Player): [number, number][] {
  const f = forwardDir(player);
  return [
    [f * 2, -1],
    [f * 2, 1],
  ];
}

function canPromote(piece: ShogiPiece, to: number): boolean {
  if (piece.promoted || piece.type === "K" || piece.type === "G") return false;
  return inPromotionZone(piece.player, rowOf(to));
}

function addStepMoves(
  board: Board,
  from: number,
  piece: ShogiPiece,
  dirs: [number, number][],
  moves: ShogiMove[]
): void {
  const row = rowOf(from);
  const col = colOf(from);
  for (const [dr, dc] of dirs) {
    const r = row + dr;
    const c = col + dc;
    if (!inBoard(r, c)) continue;
    const to = shogiIndex(r, c);
    const target = board[to];
    if (!target || target.player !== piece.player) {
      moves.push({ kind: "move", from, to });
    }
  }
}

function addSlideMoves(
  board: Board,
  from: number,
  piece: ShogiPiece,
  dirs: [number, number][],
  moves: ShogiMove[]
): void {
  const row = rowOf(from);
  const col = colOf(from);
  for (const [dr, dc] of dirs) {
    let r = row + dr;
    let c = col + dc;
    while (inBoard(r, c)) {
      const to = shogiIndex(r, c);
      const target = board[to];
      if (!target) {
        moves.push({ kind: "move", from, to });
      } else {
        if (target.player !== piece.player) moves.push({ kind: "move", from, to });
        break;
      }
      r += dr;
      c += dc;
    }
  }
}

function promotedMoves(board: Board, from: number, piece: ShogiPiece, moves: ShogiMove[]): void {
  if (!piece.promoted) return;
  switch (piece.type) {
    case "P":
    case "S":
    case "N":
    case "L":
      addStepMoves(board, from, piece, goldDirs(piece.player), moves);
      break;
    case "B":
      addSlideMoves(board, from, piece, DIAG, moves);
      addStepMoves(board, from, piece, ORTHO, moves);
      break;
    case "R":
      addSlideMoves(board, from, piece, ORTHO, moves);
      addStepMoves(board, from, piece, DIAG, moves);
      break;
    default:
      break;
  }
}

function pseudoMovesFrom(board: Board, from: number): ShogiMove[] {
  const piece = board[from];
  if (!piece) return [];
  const moves: ShogiMove[] = [];

  if (piece.promoted) {
    promotedMoves(board, from, piece, moves);
    return moves;
  }

  switch (piece.type) {
    case "K":
      addStepMoves(board, from, piece, [...ORTHO, ...DIAG], moves);
      break;
    case "G":
      addStepMoves(board, from, piece, goldDirs(piece.player), moves);
      break;
    case "S":
      addStepMoves(board, from, piece, silverDirs(piece.player), moves);
      break;
    case "N":
      addStepMoves(board, from, piece, knightDirs(piece.player), moves);
      break;
    case "L": {
      const f = forwardDir(piece.player);
      addSlideMoves(board, from, piece, [[f, 0]], moves);
      break;
    }
    case "B":
      addSlideMoves(board, from, piece, DIAG, moves);
      break;
    case "R":
      addSlideMoves(board, from, piece, ORTHO, moves);
      break;
    case "P": {
      const f = forwardDir(piece.player);
      addStepMoves(board, from, piece, [[f, 0]], moves);
      break;
    }
    default:
      break;
  }
  return moves;
}

function findKing(board: Board, player: Player): number {
  for (let i = 0; i < board.length; i++) {
    const piece = board[i];
    if (piece?.player === player && piece.type === "K") return i;
  }
  return -1;
}

function attacksSquare(board: Board, from: number, target: number, piece: ShogiPiece): boolean {
  const moves = pseudoMovesFrom(board, from);
  return moves.some((m) => m.kind === "move" && m.to === target);
}

export function isShogiKingInCheck(board: Board, player: Player): boolean {
  const king = findKing(board, player);
  if (king < 0) return false;
  const enemy: Player = player === 0 ? 1 : 0;
  for (let i = 0; i < board.length; i++) {
    const piece = board[i];
    if (!piece || piece.player !== enemy) continue;
    if (attacksSquare(board, i, king, piece)) return true;
  }
  return false;
}

function applyBoardMove(board: Board, move: Extract<ShogiMove, { kind: "move" }>): Board {
  const next = board.slice();
  const piece = next[move.from];
  if (!piece) return next;
  next[move.from] = null;
  const promoted = canPromote(piece, move.to);
  next[move.to] = {
    type: piece.type,
    player: piece.player,
    promoted: piece.promoted || promoted,
  };
  return next;
}

function captureToHand(piece: ShogiPiece): Droppable {
  if (piece.type === "K") return "G";
  if (piece.promoted) {
    const demote: Record<ShogiPieceType, Droppable> = {
      K: "G",
      G: "G",
      S: "S",
      N: "N",
      L: "L",
      B: "B",
      R: "R",
      P: "P",
    };
    return demote[piece.type];
  }
  return piece.type;
}

function applyMoveBoard(state: ShogiState, move: ShogiMove): ShogiState {
  if (move.kind === "drop") {
    const nextBoard = state.board.slice();
    nextBoard[move.to] = { type: move.piece, player: state.current, promoted: false };
    const hands: [Hand, Hand] = [
      { ...state.hands[0] },
      { ...state.hands[1] },
    ];
    hands[state.current][move.piece] -= 1;
    return {
      board: nextBoard,
      hands,
      current: state.current === 0 ? 1 : 0,
    };
  }

  const captured = state.board[move.to];
  const nextBoard = applyBoardMove(state.board, move);
  const hands: [Hand, Hand] = [
    { ...state.hands[0] },
    { ...state.hands[1] },
  ];
  if (captured) {
    hands[state.current][captureToHand(captured)] += 1;
  }
  return {
    board: nextBoard,
    hands,
    current: state.current === 0 ? 1 : 0,
  };
}

function isLegalMove(state: ShogiState, move: ShogiMove): boolean {
  const next = applyMoveBoard(state, move);
  return !isShogiKingInCheck(next.board, state.current);
}

function pawnDropForbiddenRow(player: Player, row: number): boolean {
  return player === 0 ? row === 0 : row === SIZE - 1;
}

function knightDropForbiddenRow(player: Player, row: number): boolean {
  return player === 0 ? row <= 1 : row >= SIZE - 2;
}

function lanceDropForbiddenRow(player: Player, row: number): boolean {
  return pawnDropForbiddenRow(player, row);
}

function hasPawnInColumn(board: Board, player: Player, col: number): boolean {
  for (let row = 0; row < SIZE; row++) {
    const piece = board[shogiIndex(row, col)];
    if (piece && piece.player === player && piece.type === "P" && !piece.promoted) {
      return true;
    }
  }
  return false;
}

function dropMoves(state: ShogiState): ShogiMove[] {
  const moves: ShogiMove[] = [];
  const hand = state.hands[state.current];
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const to = shogiIndex(row, col);
      if (state.board[to]) continue;
      for (const piece of Object.keys(hand) as Droppable[]) {
        if (hand[piece] <= 0) continue;
        if (piece === "P") {
          if (pawnDropForbiddenRow(state.current, row)) continue;
          if (hasPawnInColumn(state.board, state.current, col)) continue;
        }
        if (piece === "N" && knightDropForbiddenRow(state.current, row)) continue;
        if (piece === "L" && lanceDropForbiddenRow(state.current, row)) continue;
        moves.push({ kind: "drop", piece, to });
      }
    }
  }
  return moves;
}

export function shogiMoves(state: ShogiState): ShogiMove[] {
  const pseudo: ShogiMove[] = [];
  for (let i = 0; i < state.board.length; i++) {
    const piece = state.board[i];
    if (!piece || piece.player !== state.current) continue;
    pseudo.push(...pseudoMovesFrom(state.board, i));
  }
  pseudo.push(...dropMoves(state));
  return pseudo.filter((move) => isLegalMove(state, move));
}

export function shogiStatus(state: ShogiState): ShogiStatus {
  const moves = shogiMoves(state);
  if (moves.length > 0) return { kind: "playing" };
  return { kind: "checkmate", winner: state.current === 0 ? 1 : 0 };
}

export function applyShogiMove(state: ShogiState, move: ShogiMove): ShogiState {
  return applyMoveBoard(state, move);
}

export function shogiPieceLabel(piece: ShogiPiece): string {
  if (piece.promoted) {
    const promoted: Partial<Record<ShogiPieceType, string>> = {
      P: "と",
      S: "成銀",
      N: "成桂",
      L: "成香",
      B: "馬",
      R: "竜",
    };
    return promoted[piece.type] ?? piece.type;
  }
  const base: Record<ShogiPieceType, string> = {
    K: "玉",
    G: "金",
    S: "銀",
    N: "桂",
    L: "香",
    B: "角",
    R: "飛",
    P: "歩",
  };
  return base[piece.type];
}

export function shogiHandLabel(type: Droppable): string {
  const labels: Record<Droppable, string> = {
    G: "金",
    S: "銀",
    N: "桂",
    L: "香",
    B: "角",
    R: "飛",
    P: "歩",
  };
  return labels[type];
}
