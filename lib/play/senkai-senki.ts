export type Player = 0 | 1;

export const SS_COLS = 5;
export const SS_ROWS = 7;

export type PieceType = "command" | "light" | "heavy" | "scout";
export type Facing = 0 | 1 | 2 | 3;

export type SenkaiPiece = {
  id: number;
  owner: Player;
  type: PieceType;
  facing: Facing;
  rotateToken: boolean;
};

export type SenkaiState = {
  cells: (number | null)[];
  pieces: Record<number, SenkaiPiece>;
  current: Player;
  gameOver: boolean;
  winner: Player | null;
  winReason: "shoot" | "ram" | null;
};

const FWD: [number, number][] = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
];

const PIECE_LABEL: Record<PieceType, string> = {
  command: "指揮車",
  light: "軽戦車",
  heavy: "重戦車",
  scout: "偵察車",
};

const RANGE: Partial<Record<PieceType, number>> = {
  command: 2,
  light: 1,
  heavy: 3,
};

export function pieceLabel(type: PieceType): string {
  return PIECE_LABEL[type];
}

export function ssIndex(row: number, col: number): number {
  return row * SS_COLS + col;
}

export function ssCoord(index: number): { row: number; col: number } {
  return { row: Math.floor(index / SS_COLS), col: index % SS_COLS };
}

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < SS_ROWS && col >= 0 && col < SS_COLS;
}

function fixDiagonal(facing: Facing): [number, number][] {
  switch (facing) {
    case 0:
      return [[-1, -1], [-1, 1]];
    case 1:
      return [[-1, 1], [1, 1]];
    case 2:
      return [[1, 1], [1, -1]];
    case 3:
      return [[1, -1], [-1, -1]];
    default:
      return [];
  }
}

function pieceAt(state: SenkaiState, index: number): SenkaiPiece | null {
  const id = state.cells[index];
  if (id === null) return null;
  return state.pieces[id] ?? null;
}

function initialPieces(): { cells: (number | null)[]; pieces: Record<number, SenkaiPiece> } {
  const cells: (number | null)[] = Array(SS_COLS * SS_ROWS).fill(null);
  const pieces: Record<number, SenkaiPiece> = {};
  let id = 0;

  const place = (
    row: number,
    col: number,
    owner: Player,
    type: PieceType,
    facing: Facing
  ) => {
    const pid = id++;
    pieces[pid] = {
      id: pid,
      owner,
      type,
      facing,
      rotateToken: false,
    };
    cells[ssIndex(row, col)] = pid;
  };

  // Player 0 (bottom): rows 5–6, faces up (0)
  place(5, 0, 0, "light", 0);
  place(5, 2, 0, "scout", 0);
  place(5, 3, 0, "light", 0);
  place(6, 1, 0, "heavy", 0);
  place(6, 2, 0, "command", 0);

  // Player 1 (top): mirror left–right, rows 0–1, faces down (2)
  const mirrorCol = (c: number) => SS_COLS - 1 - c;
  place(1, mirrorCol(0), 1, "light", 2);
  place(1, mirrorCol(2), 1, "scout", 2);
  place(1, mirrorCol(3), 1, "light", 2);
  place(0, mirrorCol(1), 1, "heavy", 2);
  place(0, mirrorCol(2), 1, "command", 2);

  return { cells, pieces };
}

export function initialSenkaiSenki(): SenkaiState {
  const { cells, pieces } = initialPieces();
  return {
    cells,
    pieces,
    current: 0,
    gameOver: false,
    winner: null,
    winReason: null,
  };
}

export type MoveAction = { kind: "move"; to: number };
export type ShootAction = { kind: "shoot" };
export type RotateAction = { kind: "rotate"; facing: Facing };

export type SenkaiAction = MoveAction | ShootAction | RotateAction;

function moveDeltas(piece: SenkaiPiece): [number, number][] {
  const fwd = FWD[piece.facing];
  if (piece.type === "scout") {
    return [fwd, ...fixDiagonal(piece.facing)];
  }
  return [fwd];
}

export function shootTarget(
  state: SenkaiState,
  pieceId: number
): number | null {
  const piece = state.pieces[pieceId];
  if (!piece) return null;
  const range = RANGE[piece.type];
  if (range === undefined) return null;

  const { row, col } = ssCoord(
    state.cells.findIndex((c) => c === pieceId)
  );
  if (row < 0) return null;

  const [dr, dc] = FWD[piece.facing];
  for (let dist = 1; dist <= range; dist++) {
    const nr = row + dr * dist;
    const nc = col + dc * dist;
    if (!inBounds(nr, nc)) break;
    const idx = ssIndex(nr, nc);
    const occupant = pieceAt(state, idx);
    if (occupant) {
      if (occupant.owner === piece.owner) return null;
      return idx;
    }
  }
  return null;
}

export function legalMovesForPiece(
  state: SenkaiState,
  pieceId: number
): number[] {
  if (state.gameOver) return [];
  const piece = state.pieces[pieceId];
  if (!piece || piece.owner !== state.current) return [];

  const from = state.cells.findIndex((c) => c === pieceId);
  if (from < 0) return [];

  const { row, col } = ssCoord(from);
  const dests: number[] = [];

  for (const [dr, dc] of moveDeltas(piece)) {
    const nr = row + dr;
    const nc = col + dc;
    if (!inBounds(nr, nc)) continue;
    const to = ssIndex(nr, nc);
    const target = pieceAt(state, to);
    if (!target || target.owner !== piece.owner) dests.push(to);
  }

  return dests;
}

export function legalRotations(piece: SenkaiPiece): Facing[] {
  if (!piece.rotateToken) return [];
  const turns: Facing[] = [
    ((piece.facing + 1) % 4) as Facing,
    ((piece.facing + 3) % 4) as Facing,
  ];
  if (piece.type === "light" || piece.type === "scout") {
    turns.push(((piece.facing + 2) % 4) as Facing);
  }
  return turns;
}

export function legalActionsForPiece(
  state: SenkaiState,
  pieceId: number
): SenkaiAction[] {
  const piece = state.pieces[pieceId];
  if (!piece || piece.owner !== state.current || state.gameOver) return [];

  const actions: SenkaiAction[] = [];
  for (const to of legalMovesForPiece(state, pieceId)) {
    actions.push({ kind: "move", to });
  }
  if (shootTarget(state, pieceId) !== null) {
    actions.push({ kind: "shoot" });
  }
  for (const facing of legalRotations(piece)) {
    actions.push({ kind: "rotate", facing });
  }
  return actions;
}

export function hasAnyLegalAction(state: SenkaiState): boolean {
  for (const id of Object.values(state.pieces)) {
    if (id.owner !== state.current) continue;
    const idx = state.cells.findIndex((c) => c === id.id);
    if (idx < 0) continue;
    if (legalActionsForPiece(state, id.id).length > 0) return true;
  }
  return false;
}

function grantRotateToken(pieces: Record<number, SenkaiPiece>, pieceId: number) {
  const p = pieces[pieceId];
  if (p) pieces[pieceId] = { ...p, rotateToken: true };
}

function removePiece(
  cells: (number | null)[],
  pieces: Record<number, SenkaiPiece>,
  pieceId: number
) {
  const idx = cells.findIndex((c) => c === pieceId);
  if (idx >= 0) cells[idx] = null;
  delete pieces[pieceId];
}

export function applySenkaiAction(
  state: SenkaiState,
  pieceId: number,
  action: SenkaiAction
): SenkaiState | null {
  if (state.gameOver) return null;
  const piece = state.pieces[pieceId];
  if (!piece || piece.owner !== state.current) return null;

  const legal = legalActionsForPiece(state, pieceId);
  const ok = legal.some((a) => {
    if (a.kind !== action.kind) return false;
    if (action.kind === "move") return a.kind === "move" && a.to === action.to;
    if (action.kind === "shoot") return a.kind === "shoot";
    if (action.kind === "rotate")
      return a.kind === "rotate" && a.facing === action.facing;
    return false;
  });
  if (!ok) return null;

  const cells = state.cells.slice();
  const pieces = { ...state.pieces };
  let winner: Player | null = null;
  let winReason: "shoot" | "ram" | null = null;

  const from = cells.findIndex((c) => c === pieceId);

  if (action.kind === "move") {
    const target = pieceAt({ ...state, cells, pieces }, action.to);
    cells[from] = null;

    if (target) {
      const defenderType = target.type;
      const defenderId = target.id;
      if (piece.type === "command") {
        removePiece(cells, pieces, defenderId);
        cells[action.to] = pieceId;
        if (defenderType === "command") {
          winner = piece.owner;
          winReason = "ram";
        } else if (!winner) {
          grantRotateToken(pieces, pieceId);
        }
      } else {
        removePiece(cells, pieces, defenderId);
        removePiece(cells, pieces, pieceId);
        if (defenderType === "command") {
          winner = piece.owner;
          winReason = "ram";
        }
      }
    } else {
      cells[action.to] = pieceId;
      grantRotateToken(pieces, pieceId);
    }
  } else if (action.kind === "shoot") {
    const targetIdx = shootTarget({ ...state, cells, pieces }, pieceId);
    if (targetIdx === null) return null;
    const target = pieceAt({ ...state, cells, pieces }, targetIdx);
    if (!target) return null;
    removePiece(cells, pieces, target.id);
    if (target.type === "command") {
      winner = piece.owner;
      winReason = "shoot";
    }
    grantRotateToken(pieces, pieceId);
  } else if (action.kind === "rotate") {
    pieces[pieceId] = {
      ...piece,
      facing: action.facing,
      rotateToken: false,
    };
  }

  if (winner !== null) {
    return {
      cells,
      pieces,
      current: state.current,
      gameOver: true,
      winner,
      winReason,
    };
  }

  const loserCommandGone =
    !Object.values(pieces).some((p) => p.owner === 0 && p.type === "command") ||
    !Object.values(pieces).some((p) => p.owner === 1 && p.type === "command");
  if (loserCommandGone) {
    const w = Object.values(pieces).find((p) => p.type === "command")?.owner;
    return {
      cells,
      pieces,
      current: state.current,
      gameOver: true,
      winner: w ?? null,
      winReason: winReason ?? "shoot",
    };
  }

  return {
    cells,
    pieces,
    current: state.current === 0 ? 1 : 0,
    gameOver: false,
    winner: null,
    winReason: null,
  };
}

export function winReasonLabel(reason: "shoot" | "ram"): string {
  return reason === "shoot" ? "指揮車を射撃で撃破" : "指揮車を体当たりで撃破";
}

export function illegalNotice(
  state: SenkaiState,
  pieceId: number,
  intent: "move" | "shoot" | "rotate"
): string | null {
  const piece = state.pieces[pieceId];
  if (!piece) return "駒がありません";
  if (piece.owner !== state.current) return "相手の駒です";
  if (intent === "rotate" && !piece.rotateToken) {
    return "旋回権がありません（先に移動または射撃）";
  }
  if (intent === "shoot") {
    if (piece.type === "scout") return "偵察車は射撃できません";
    if (shootTarget(state, pieceId) === null) {
      return "合法な射撃がありません";
    }
  }
  return null;
}
