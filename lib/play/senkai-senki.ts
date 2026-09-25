export type Player = 0 | 1;

export const SS_COLS = 5;
export const SS_ROWS = 5;

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
  /** 旋回後、同じ駒で移動または射撃が必須 */
  lockedAfterRotate: number | null;
  /** 直後の移動・射撃では旋回権を付与しない */
  skipRotateGrant: boolean;
};

const FWD: [number, number][] = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
];

const COMMAND_DIRS: [number, number][] = [
  ...FWD,
  [-1, -1],
  [-1, 1],
  [1, 1],
  [1, -1],
];

const PIECE_LABEL: Record<PieceType, string> = {
  command: "指揮車",
  light: "軽戦車",
  heavy: "重戦車",
  scout: "特攻車",
};

const SHOOT_RANGE: Partial<Record<PieceType, number>> = {
  light: 2,
  heavy: 3,
};

export function pieceLabel(type: PieceType): string {
  return PIECE_LABEL[type];
}

export function pieceHasFacing(type: PieceType): boolean {
  return type !== "command";
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

function forwardDiagonals(facing: Facing): [number, number][] {
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

  const p1Front = SS_ROWS - 1;
  const p2Front = 0;
  const types: PieceType[] = ["light", "heavy", "command", "scout", "light"];
  types.forEach((type, col) => place(p1Front, col, 0, type, 0));
  const mirrorCol = (c: number) => SS_COLS - 1 - c;
  types.forEach((type, col) => place(p2Front, mirrorCol(col), 1, type, 2));

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
    lockedAfterRotate: null,
    skipRotateGrant: false,
  };
}

export type MoveAction = { kind: "move"; to: number };
export type ShootAction = { kind: "shoot" };
export type RotateAction = { kind: "rotate"; facing: Facing };

export type SenkaiAction = MoveAction | ShootAction | RotateAction;

function lineDestinations(
  state: SenkaiState,
  from: number,
  piece: SenkaiPiece,
  dr: number,
  dc: number,
  maxDist: number,
  canRam: boolean
): number[] {
  const { row, col } = ssCoord(from);
  const dests: number[] = [];

  for (let dist = 1; dist <= maxDist; dist++) {
    const nr = row + dr * dist;
    const nc = col + dc * dist;
    if (!inBounds(nr, nc)) break;
    const to = ssIndex(nr, nc);
    const target = pieceAt(state, to);
    if (target) {
      if (target.owner === piece.owner) break;
      if (canRam) dests.push(to);
      break;
    }
    dests.push(to);
  }

  return dests;
}

function tokkoDestinations(state: SenkaiState, from: number, piece: SenkaiPiece): number[] {
  const dests = new Set<number>();
  for (const [ddr, ddc] of forwardDiagonals(piece.facing)) {
    for (const idx of lineDestinations(state, from, piece, ddr, ddc, 2, true)) {
      dests.add(idx);
    }
  }
  return [...dests];
}

function lightDestinations(state: SenkaiState, from: number, piece: SenkaiPiece): number[] {
  const dests = new Set<number>();
  const [fdr, fdc] = FWD[piece.facing];
  for (const idx of lineDestinations(state, from, piece, fdr, fdc, 1, false)) {
    dests.add(idx);
  }
  for (const [ddr, ddc] of forwardDiagonals(piece.facing)) {
    for (const idx of lineDestinations(state, from, piece, ddr, ddc, 1, false)) {
      dests.add(idx);
    }
  }
  return [...dests];
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

  if (piece.type === "command") {
    const { row, col } = ssCoord(from);
    const dests: number[] = [];
    for (const [dr, dc] of COMMAND_DIRS) {
      const nr = row + dr;
      const nc = col + dc;
      if (!inBounds(nr, nc)) continue;
      const to = ssIndex(nr, nc);
      const target = pieceAt(state, to);
      if (!target || target.owner !== piece.owner) dests.push(to);
    }
    return dests;
  }

  if (piece.type === "scout") {
    return tokkoDestinations(state, from, piece);
  }

  if (piece.type === "light") {
    return lightDestinations(state, from, piece);
  }

  if (piece.type === "heavy") {
    const { row, col } = ssCoord(from);
    const [dr, dc] = FWD[piece.facing];
    const nr = row + dr;
    const nc = col + dc;
    if (!inBounds(nr, nc)) return [];
    const to = ssIndex(nr, nc);
    if (pieceAt(state, to)) return [];
    return [to];
  }

  return [];
}

export function shootTarget(
  state: SenkaiState,
  pieceId: number
): number | null {
  const piece = state.pieces[pieceId];
  if (!piece) return null;
  const range = SHOOT_RANGE[piece.type];
  if (range === undefined) return null;

  const from = state.cells.findIndex((c) => c === pieceId);
  if (from < 0) return null;
  const { row, col } = ssCoord(from);

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

export function legalRotations(piece: SenkaiPiece): Facing[] {
  if (piece.type === "command" || !piece.rotateToken) return [];
  const turns: Facing[] = [
    ((piece.facing + 1) % 4) as Facing,
    ((piece.facing + 3) % 4) as Facing,
  ];
  if (piece.type === "light" || piece.type === "scout") {
    turns.push(((piece.facing + 2) % 4) as Facing);
  }
  return turns;
}

function isPerimeterCell(index: number): boolean {
  const { row, col } = ssCoord(index);
  return (
    row === 0 ||
    row === SS_ROWS - 1 ||
    col === 0 ||
    col === SS_COLS - 1
  );
}

/** 外周で移動・射撃がなく旋回権もないときの救済（180°のみ） */
export function isEdgeStuck(state: SenkaiState, pieceId: number): boolean {
  const piece = state.pieces[pieceId];
  if (!piece || piece.type === "command" || piece.rotateToken) return false;

  const from = state.cells.findIndex((c) => c === pieceId);
  if (from < 0 || !isPerimeterCell(from)) return false;

  if (legalMovesForPiece(state, pieceId).length > 0) return false;

  if (piece.type === "light" || piece.type === "heavy") {
    if (shootTarget(state, pieceId) !== null) return false;
  }

  return true;
}

export function legalRotationFacings(
  state: SenkaiState,
  pieceId: number
): Facing[] {
  const piece = state.pieces[pieceId];
  if (!piece || piece.type === "command") return [];
  if (state.lockedAfterRotate !== null) return [];
  if (piece.rotateToken) return legalRotations(piece);
  if (isEdgeStuck(state, pieceId)) {
    return [((piece.facing + 2) % 4) as Facing];
  }
  return [];
}

function isReliefRotate(
  state: SenkaiState,
  pieceId: number,
  facing: Facing
): boolean {
  const piece = state.pieces[pieceId];
  if (!piece) return false;
  return (
    isEdgeStuck(state, pieceId) &&
    facing === (((piece.facing + 2) % 4) as Facing)
  );
}

export function legalActionsForPiece(
  state: SenkaiState,
  pieceId: number
): SenkaiAction[] {
  const piece = state.pieces[pieceId];
  if (!piece || piece.owner !== state.current || state.gameOver) return [];

  if (
    state.lockedAfterRotate !== null &&
    pieceId !== state.lockedAfterRotate
  ) {
    return [];
  }

  const actions: SenkaiAction[] = [];
  for (const to of legalMovesForPiece(state, pieceId)) {
    actions.push({ kind: "move", to });
  }
  if (shootTarget(state, pieceId) !== null) {
    actions.push({ kind: "shoot" });
  }
  if (state.lockedAfterRotate === null) {
    for (const facing of legalRotationFacings(state, pieceId)) {
      actions.push({ kind: "rotate", facing });
    }
  }
  return actions;
}

export function hasAnyLegalAction(state: SenkaiState): boolean {
  for (const id of Object.values(state.pieces)) {
    if (id.owner !== state.current) continue;
    if (legalActionsForPiece(state, id.id).length > 0) return true;
  }
  return false;
}

function grantRotateToken(pieces: Record<number, SenkaiPiece>, pieceId: number) {
  const p = pieces[pieceId];
  if (!p || p.type === "command") return;
  pieces[pieceId] = { ...p, rotateToken: true };
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

function resolveRam(
  cells: (number | null)[],
  pieces: Record<number, SenkaiPiece>,
  attackerId: number,
  defenderId: number,
  defenderType: PieceType
): { winner: Player | null; winReason: "ram" | null } {
  const attacker = pieces[attackerId];
  if (!attacker) return { winner: null, winReason: null };

  if (attacker.type === "command") {
    removePiece(cells, pieces, defenderId);
    if (defenderType === "command") {
      return { winner: attacker.owner, winReason: "ram" };
    }
    return { winner: null, winReason: null };
  }

  removePiece(cells, pieces, defenderId);
  removePiece(cells, pieces, attackerId);
  if (defenderType === "command") {
    return { winner: attacker.owner, winReason: "ram" };
  }
  return { winner: null, winReason: null };
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
  const mayGrantRotate = !state.skipRotateGrant;

  if (action.kind === "move") {
    const target = pieceAt({ ...state, cells, pieces }, action.to);
    cells[from] = null;

    if (target) {
      const ram = resolveRam(cells, pieces, pieceId, target.id, target.type);
      winner = ram.winner;
      winReason = ram.winReason;
      if (!winner && pieces[pieceId]) {
        cells[action.to] = pieceId;
        if (mayGrantRotate) grantRotateToken(pieces, pieceId);
      }
    } else {
      cells[action.to] = pieceId;
      if (mayGrantRotate) grantRotateToken(pieces, pieceId);
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
    if (mayGrantRotate) grantRotateToken(pieces, pieceId);
  } else if (action.kind === "rotate") {
    const relief = isReliefRotate(state, pieceId, action.facing);
    pieces[pieceId] = {
      ...piece,
      facing: action.facing,
      rotateToken: false,
    };
    if (relief) {
      return {
        cells,
        pieces,
        current: state.current === 0 ? 1 : 0,
        gameOver: false,
        winner: null,
        winReason: null,
        lockedAfterRotate: null,
        skipRotateGrant: false,
      };
    }
    return {
      cells,
      pieces,
      current: state.current,
      gameOver: false,
      winner: null,
      winReason: null,
      lockedAfterRotate: pieceId,
      skipRotateGrant: true,
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
      lockedAfterRotate: null,
      skipRotateGrant: false,
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
      lockedAfterRotate: null,
      skipRotateGrant: false,
    };
  }

  return {
    cells,
    pieces,
    current: state.current === 0 ? 1 : 0,
    gameOver: false,
    winner: null,
    winReason: null,
    lockedAfterRotate: null,
    skipRotateGrant: false,
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
  if (
    state.lockedAfterRotate !== null &&
    pieceId !== state.lockedAfterRotate
  ) {
    return "旋回後は同じ駒で移動または射撃してください";
  }
  if (intent === "rotate" && piece.type === "command") {
    return "指揮車は旋回しません";
  }
  if (intent === "rotate" && !piece.rotateToken) {
    if (isEdgeStuck(state, pieceId)) {
      return null;
    }
    return "旋回権がありません（先に移動または射撃）";
  }
  if (intent === "shoot") {
    if (piece.type === "command") return "指揮車は射撃できません";
    if (piece.type === "scout") return "特攻車は射撃できません";
    if (shootTarget(state, pieceId) === null) {
      return "合法な射撃がありません";
    }
  }
  return null;
}

export function rotateArrowNeighbor(
  pieceIndex: number,
  facing: Facing
): number | null {
  const { row, col } = ssCoord(pieceIndex);
  const [dr, dc] = FWD[facing];
  const nr = row + dr;
  const nc = col + dc;
  if (!inBounds(nr, nc)) return null;
  return ssIndex(nr, nc);
}
