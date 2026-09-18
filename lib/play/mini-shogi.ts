export type Player = 0 | 1;

export type MiniPieceType = "K" | "G" | "S" | "B" | "R" | "P";

export type Droppable = Exclude<MiniPieceType, "K">;

export type MiniPiece = {
  type: MiniPieceType;
  player: Player;
  promoted: boolean;
};

export type Board = (MiniPiece | null)[];

export type Hand = Record<Droppable, number>;

export type MiniShogiState = {
  board: Board;
  hands: [Hand, Hand];
  current: Player;
};

export type MiniShogiMove =
  | { kind: "move"; from: number; to: number }
  | { kind: "drop"; piece: Droppable; to: number };

export type MiniShogiStatus =
  | { kind: "playing" }
  | { kind: "checkmate"; winner: Player };

const SIZE = 5;
const PROMO_ZONE = 2;

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

export function miniShogiIndex(row: number, col: number): number {
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
  return { G: 0, S: 0, B: 0, R: 0, P: 0 };
}

export function initialMiniShogiState(): MiniShogiState {
  const board: Board = Array(SIZE * SIZE).fill(null);
  board[miniShogiIndex(0, 1)] = { type: "R", player: 1, promoted: false };
  board[miniShogiIndex(0, 3)] = { type: "B", player: 1, promoted: false };
  const goteRow: MiniPieceType[] = ["G", "S", "K", "S", "G"];
  for (let col = 0; col < SIZE; col++) {
    board[miniShogiIndex(1, col)] = { type: goteRow[col], player: 1, promoted: false };
  }
  board[miniShogiIndex(2, 2)] = { type: "P", player: 1, promoted: false };
  board[miniShogiIndex(3, 2)] = { type: "P", player: 0, promoted: false };

  const hands: [Hand, Hand] = [emptyHand(), emptyHand()];
  hands[0] = { G: 2, S: 2, B: 1, R: 1, P: 0 };

  return { board, hands, current: 0 };
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

function canPromote(piece: MiniPiece, to: number): boolean {
  if (piece.promoted || piece.type === "K" || piece.type === "G") return false;
  return inPromotionZone(piece.player, rowOf(to));
}

function addStepMoves(
  board: Board,
  from: number,
  piece: MiniPiece,
  dirs: [number, number][],
  moves: MiniShogiMove[]
): void {
  const row = rowOf(from);
  const col = colOf(from);
  for (const [dr, dc] of dirs) {
    const r = row + dr;
    const c = col + dc;
    if (!inBoard(r, c)) continue;
    const to = miniShogiIndex(r, c);
    const target = board[to];
    if (!target || target.player !== piece.player) {
      moves.push({ kind: "move", from, to });
    }
  }
}

function addSlideMoves(
  board: Board,
  from: number,
  piece: MiniPiece,
  dirs: [number, number][],
  moves: MiniShogiMove[]
): void {
  const row = rowOf(from);
  const col = colOf(from);
  for (const [dr, dc] of dirs) {
    let r = row + dr;
    let c = col + dc;
    while (inBoard(r, c)) {
      const to = miniShogiIndex(r, c);
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

function effectiveType(piece: MiniPiece): MiniPieceType | "G+" {
  if (piece.promoted && piece.type !== "K" && piece.type !== "G") return "G+";
  return piece.type;
}

function pseudoMovesFrom(board: Board, from: number): MiniShogiMove[] {
  const piece = board[from];
  if (!piece) return [];
  const moves: MiniShogiMove[] = [];
  const eff = effectiveType(piece);

  if (eff === "G+" || piece.type === "G") {
    addStepMoves(board, from, piece, goldDirs(piece.player), moves);
    return moves;
  }

  switch (piece.type) {
    case "K":
      addStepMoves(board, from, piece, [...ORTHO, ...DIAG], moves);
      break;
    case "S":
      addStepMoves(board, from, piece, silverDirs(piece.player), moves);
      break;
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

function attacksSquare(board: Board, from: number, target: number, piece: MiniPiece): boolean {
  const moves = pseudoMovesFrom(board, from);
  return moves.some((m) => m.kind === "move" && m.to === target);
}

export function isMiniKingInCheck(board: Board, player: Player): boolean {
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

function applyBoardMove(board: Board, move: Extract<MiniShogiMove, { kind: "move" }>): Board {
  const next = board.slice();
  const piece = next[move.from];
  if (!piece) return next;
  const captured = next[move.to];
  next[move.from] = null;
  const promoted = canPromote(piece, move.to);
  next[move.to] = {
    type: piece.type,
    player: piece.player,
    promoted: piece.promoted || promoted,
  };
  return next;
}

function applyMoveBoard(state: MiniShogiState, move: MiniShogiMove): MiniShogiState {
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

  const piece = state.board[move.from];
  if (!piece) return state;
  const captured = state.board[move.to];
  const nextBoard = applyBoardMove(state.board, move);
  const hands: [Hand, Hand] = [
    { ...state.hands[0] },
    { ...state.hands[1] },
  ];
  if (captured) {
    const dropType: Droppable =
      captured.type === "K" ? "G" : captured.promoted ? "G" : captured.type;
    hands[state.current][dropType] += 1;
  }
  return {
    board: nextBoard,
    hands,
    current: state.current === 0 ? 1 : 0,
  };
}

function isLegalMove(state: MiniShogiState, move: MiniShogiMove): boolean {
  const next = applyMoveBoard(state, move);
  return !isMiniKingInCheck(next.board, state.current);
}

function pawnDropForbiddenRow(player: Player, row: number): boolean {
  return player === 0 ? row === 0 : row === SIZE - 1;
}

function hasPawnInColumn(board: Board, player: Player, col: number): boolean {
  for (let row = 0; row < SIZE; row++) {
    const piece = board[miniShogiIndex(row, col)];
    if (piece && piece.player === player && piece.type === "P" && !piece.promoted) {
      return true;
    }
  }
  return false;
}

function dropMoves(state: MiniShogiState): MiniShogiMove[] {
  const moves: MiniShogiMove[] = [];
  const hand = state.hands[state.current];
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const to = miniShogiIndex(row, col);
      if (state.board[to]) continue;
      for (const piece of Object.keys(hand) as Droppable[]) {
        if (hand[piece] <= 0) continue;
        if (piece === "P") {
          if (pawnDropForbiddenRow(state.current, row)) continue;
          if (hasPawnInColumn(state.board, state.current, col)) continue;
        }
        moves.push({ kind: "drop", piece, to });
      }
    }
  }
  return moves;
}

export function miniShogiMoves(state: MiniShogiState): MiniShogiMove[] {
  const pseudo: MiniShogiMove[] = [];
  for (let i = 0; i < state.board.length; i++) {
    const piece = state.board[i];
    if (!piece || piece.player !== state.current) continue;
    pseudo.push(...pseudoMovesFrom(state.board, i));
  }
  pseudo.push(...dropMoves(state));
  return pseudo.filter((move) => isLegalMove(state, move));
}

export function miniShogiStatus(state: MiniShogiState): MiniShogiStatus {
  const moves = miniShogiMoves(state);
  if (moves.length > 0) return { kind: "playing" };
  return { kind: "checkmate", winner: state.current === 0 ? 1 : 0 };
}

export function applyMiniShogiMove(state: MiniShogiState, move: MiniShogiMove): MiniShogiState {
  return applyMoveBoard(state, move);
}

export function miniShogiPieceLabel(piece: MiniPiece): string {
  const base: Record<MiniPieceType, string> = {
    K: "玉",
    G: "金",
    S: "銀",
    B: "角",
    R: "飛",
    P: "歩",
  };
  if (piece.promoted && piece.type !== "K" && piece.type !== "G") {
    return "全";
  }
  return base[piece.type];
}

export function miniShogiHandLabel(type: Droppable): string {
  const labels: Record<Droppable, string> = {
    G: "金",
    S: "銀",
    B: "角",
    R: "飛",
    P: "歩",
  };
  return labels[type];
}
