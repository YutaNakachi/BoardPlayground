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
  positionCounts: Record<string, number>;
};

export type MiniShogiMove =
  | { kind: "move"; from: number; to: number; promote: boolean }
  | { kind: "drop"; piece: Droppable; to: number };

export type MiniShogiStatus =
  | { kind: "playing" }
  | { kind: "checkmate"; winner: Player }
  | { kind: "king-captured"; winner: Player }
  | { kind: "repetition"; winner: 1 };

const SIZE = 5;

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

/** 敵陣の最奥1段（先手=1段目 row0、後手=5段目 row4） */
export function enemyBackRank(player: Player): number {
  return player === 0 ? 0 : SIZE - 1;
}

export function initialMiniShogiState(): MiniShogiState {
  const board: Board = Array(SIZE * SIZE).fill(null);

  // 後手（一段）
  board[miniShogiIndex(0, 0)] = { type: "R", player: 1, promoted: false };
  board[miniShogiIndex(0, 1)] = { type: "B", player: 1, promoted: false };
  board[miniShogiIndex(0, 2)] = { type: "S", player: 1, promoted: false };
  board[miniShogiIndex(0, 3)] = { type: "G", player: 1, promoted: false };
  board[miniShogiIndex(0, 4)] = { type: "K", player: 1, promoted: false };
  // 二段 1二歩
  board[miniShogiIndex(1, 4)] = { type: "P", player: 1, promoted: false };
  // 四段 5四歩
  board[miniShogiIndex(3, 0)] = { type: "P", player: 0, promoted: false };
  // 先手（五段）
  board[miniShogiIndex(4, 0)] = { type: "K", player: 0, promoted: false };
  board[miniShogiIndex(4, 1)] = { type: "G", player: 0, promoted: false };
  board[miniShogiIndex(4, 2)] = { type: "S", player: 0, promoted: false };
  board[miniShogiIndex(4, 3)] = { type: "B", player: 0, promoted: false };
  board[miniShogiIndex(4, 4)] = { type: "R", player: 0, promoted: false };

  const state: MiniShogiState = {
    board,
    hands: [emptyHand(), emptyHand()],
    current: 0,
    positionCounts: {},
  };
  recordPosition(state);
  return state;
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

export function canChoosePromotion(piece: MiniPiece, from: number, to: number): boolean {
  if (piece.promoted || piece.type === "K" || piece.type === "G") return false;
  const back = enemyBackRank(piece.player);
  return rowOf(from) === back || rowOf(to) === back;
}

export function mustPromote(piece: MiniPiece, to: number): boolean {
  return piece.type === "P" && rowOf(to) === enemyBackRank(piece.player);
}

function addStepMoves(
  board: Board,
  from: number,
  piece: MiniPiece,
  dirs: [number, number][],
  moves: Array<{ from: number; to: number }>
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
      moves.push({ from, to });
    }
  }
}

function addSlideMoves(
  board: Board,
  from: number,
  piece: MiniPiece,
  dirs: [number, number][],
  moves: Array<{ from: number; to: number }>
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

function promotedMoves(
  board: Board,
  from: number,
  piece: MiniPiece,
  moves: Array<{ from: number; to: number }>
): void {
  if (!piece.promoted) return;
  switch (piece.type) {
    case "P":
    case "S":
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

function pseudoMovesFrom(board: Board, from: number): Array<{ from: number; to: number }> {
  const piece = board[from];
  if (!piece) return [];
  const moves: Array<{ from: number; to: number }> = [];

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

function expandPromotionMoves(
  board: Board,
  from: number,
  to: number
): MiniShogiMove[] {
  const piece = board[from];
  if (!piece) return [];

  if (mustPromote(piece, to)) {
    return [{ kind: "move", from, to, promote: true }];
  }
  if (canChoosePromotion(piece, from, to)) {
    return [
      { kind: "move", from, to, promote: true },
      { kind: "move", from, to, promote: false },
    ];
  }
  return [{ kind: "move", from, to, promote: false }];
}

function findKing(board: Board, player: Player): number {
  for (let i = 0; i < board.length; i++) {
    const piece = board[i];
    if (piece?.player === player && piece.type === "K") return i;
  }
  return -1;
}

function attacksSquare(board: Board, from: number, target: number): boolean {
  const moves = pseudoMovesFrom(board, from);
  return moves.some((m) => m.to === target);
}

export function isMiniKingInCheck(board: Board, player: Player): boolean {
  const king = findKing(board, player);
  if (king < 0) return false;
  const enemy: Player = player === 0 ? 1 : 0;
  for (let i = 0; i < board.length; i++) {
    const piece = board[i];
    if (!piece || piece.player !== enemy) continue;
    if (attacksSquare(board, i, king)) return true;
  }
  return false;
}

function captureToHand(piece: MiniPiece): Droppable {
  if (piece.type === "K") return "G";
  if (piece.promoted) {
    const demote: Record<MiniPieceType, Droppable> = {
      K: "G",
      G: "G",
      S: "S",
      B: "B",
      R: "R",
      P: "P",
    };
    return demote[piece.type];
  }
  return piece.type;
}

function applyBoardMove(
  board: Board,
  move: Extract<MiniShogiMove, { kind: "move" }>
): Board {
  const next = board.slice();
  const piece = next[move.from];
  if (!piece) return next;
  next[move.from] = null;
  next[move.to] = {
    type: piece.type,
    player: piece.player,
    promoted: piece.promoted || move.promote,
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
      positionCounts: { ...state.positionCounts },
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
    positionCounts: { ...state.positionCounts },
  };
}

function isLegalMove(state: MiniShogiState, move: MiniShogiMove): boolean {
  const next = applyMoveBoard(state, move);
  return !isMiniKingInCheck(next.board, state.current);
}

function pawnDropForbiddenRow(player: Player, row: number): boolean {
  return row === enemyBackRank(player);
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

export function miniShogiPositionKey(state: MiniShogiState): string {
  const boardPart = state.board
    .map((p) =>
      p ? `${p.player}${p.type}${p.promoted ? "+" : ""}` : "."
    )
    .join("");
  const handPart = [0, 1]
    .map((player) =>
      (Object.keys(state.hands[player]) as Droppable[])
        .map((t) => `${t}${state.hands[player][t]}`)
        .join("")
    )
    .join("|");
  return `${boardPart}:${handPart}:${state.current}`;
}

function recordPosition(state: MiniShogiState): void {
  const key = miniShogiPositionKey(state);
  state.positionCounts[key] = (state.positionCounts[key] ?? 0) + 1;
}

export function repetitionCount(state: MiniShogiState): number {
  const key = miniShogiPositionKey(state);
  return state.positionCounts[key] ?? 0;
}

export function miniShogiMoves(state: MiniShogiState): MiniShogiMove[] {
  const pseudo: MiniShogiMove[] = [];
  for (let i = 0; i < state.board.length; i++) {
    const piece = state.board[i];
    if (!piece || piece.player !== state.current) continue;
    for (const { from, to } of pseudoMovesFrom(state.board, i)) {
      pseudo.push(...expandPromotionMoves(state.board, from, to));
    }
  }
  pseudo.push(...dropMoves(state));
  return pseudo.filter((move) => isLegalMove(state, move));
}

export function findKingOnBoard(board: Board, player: Player): boolean {
  return findKing(board, player) >= 0;
}

export function miniShogiStatus(state: MiniShogiState): MiniShogiStatus {
  if (!findKingOnBoard(state.board, 0)) {
    return { kind: "king-captured", winner: 1 };
  }
  if (!findKingOnBoard(state.board, 1)) {
    return { kind: "king-captured", winner: 0 };
  }
  if (repetitionCount(state) >= 4) {
    return { kind: "repetition", winner: 1 };
  }
  const moves = miniShogiMoves(state);
  if (moves.length > 0) return { kind: "playing" };
  return { kind: "checkmate", winner: state.current === 0 ? 1 : 0 };
}

export function applyMiniShogiMove(state: MiniShogiState, move: MiniShogiMove): MiniShogiState {
  const next = applyMoveBoard(state, move);
  recordPosition(next);
  return next;
}

export function miniShogiPieceLabel(piece: MiniPiece): string {
  if (piece.promoted) {
    const promoted: Partial<Record<MiniPieceType, string>> = {
      P: "と",
      S: "成銀",
      B: "竜馬",
      R: "竜王",
    };
    return promoted[piece.type] ?? piece.type;
  }
  if (piece.type === "K") {
    return piece.player === 0 ? "玉" : "王";
  }
  const base: Record<Exclude<MiniPieceType, "K">, string> = {
    G: "金",
    S: "銀",
    B: "角",
    R: "飛",
    P: "歩",
  };
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

/** 同一マスへの移動候補（成り分岐あり） */
export function movesToSquare(
  moves: MiniShogiMove[],
  from: number,
  to: number
): MiniShogiMove[] {
  return moves.filter(
    (m) => m.kind === "move" && m.from === from && m.to === to
  );
}

export function needsPromotionChoice(moves: MiniShogiMove[]): boolean {
  if (moves.length !== 2) return false;
  return (
    moves.every((m) => m.kind === "move") &&
    moves[0].promote !== moves[1].promote
  );
}
