import {
  CREATURE_TYPES,
  DEJARIK_CELL_COUNT,
  placementCellsFromStart,
  type CreatureType,
  type Player,
  validPlacementStarts,
} from "./board";
import { attackTargetsFor, moveTargetsFor, type Cells } from "./moves";

export type { CreatureType, Player };

export type DejarikPiece = {
  id: number;
  owner: Player;
  type: CreatureType;
};

export type DejarikPhase = "setup" | "placement" | "playing" | "game-over";

export type ScoutPartial = {
  pieceId: number;
  didMove: boolean;
  didAttack: boolean;
};

export type DejarikState = {
  phase: DejarikPhase;
  /** 手番開始プレイヤー（先攻） */
  firstPlayer: Player;
  current: Player;
  cells: Cells;
  pieces: Record<number, DejarikPiece>;
  nextPieceId: number;
  /** 0–7: 後攻から交互に配置 */
  placementStep: number;
  homeStartOuter: [number | null, number | null];
  unplaced: Record<Player, CreatureType[]>;
  winner: Player | null;
  scoutPartial: ScoutPartial | null;
};

const PLACEMENT_ORDER: Player[] = [1, 0, 1, 0, 1, 0, 1, 0];

export function secondPlayer(first: Player): Player {
  return first === 0 ? 1 : 0;
}

export function placementPlayer(step: number): Player {
  return PLACEMENT_ORDER[step] ?? 0;
}

export function initialDejarik(firstPlayer: Player = Math.random() < 0.5 ? 0 : 1): DejarikState {
  const cells: Cells = Array.from({ length: DEJARIK_CELL_COUNT }, () => null);
  return {
    phase: "placement",
    firstPlayer,
    current: secondPlayer(firstPlayer),
    cells,
    pieces: {},
    nextPieceId: 1,
    placementStep: 0,
    homeStartOuter: [null, null],
    unplaced: {
      0: [...CREATURE_TYPES],
      1: [...CREATURE_TYPES],
    },
    winner: null,
    scoutPartial: null,
  };
}

export function homeCellsForPlayer(state: DejarikState, player: Player): number[] | null {
  const start = state.homeStartOuter[player];
  if (start === null) return null;
  return placementCellsFromStart(start);
}

export function countPiecesForOwner(state: DejarikState, owner: Player): number {
  let n = 0;
  for (const p of Object.values(state.pieces)) {
    if (p.owner === owner) n++;
  }
  return n;
}

export function checkWinner(state: DejarikState): Player | null {
  const c0 = countPiecesForOwner(state, 0);
  const c1 = countPiecesForOwner(state, 1);
  if (c0 === 0) return 1;
  if (c1 === 0) return 0;
  return null;
}

export function setHomeStart(
  state: DejarikState,
  player: Player,
  startOuter: number
): DejarikState | null {
  if (state.phase !== "placement") return null;
  if (placementPlayer(state.placementStep) !== player) return null;
  if (state.homeStartOuter[player] !== null) return null;
  if (!validPlacementStarts(player).includes(startOuter)) return null;
  return {
    ...state,
    homeStartOuter: player === 0 ? [startOuter, state.homeStartOuter[1]] : [state.homeStartOuter[0], startOuter],
  };
}

export function applyPlacement(
  state: DejarikState,
  type: CreatureType,
  cell: number
): DejarikState | null {
  if (state.phase !== "placement") return null;
  const player = placementPlayer(state.placementStep);
  const homes = homeCellsForPlayer(state, player);
  if (!homes) return null;
  if (!homes.includes(cell)) return null;
  if (state.cells[cell] !== null) return null;
  const pool = state.unplaced[player];
  if (!pool.includes(type)) return null;

  const id = state.nextPieceId;
  const cells = [...state.cells];
  cells[cell] = id;
  const pieces = { ...state.pieces, [id]: { id, owner: player, type } };
  const unplaced = {
    ...state.unplaced,
    [player]: pool.filter((t) => t !== type),
  };
  const placementStep = state.placementStep + 1;

  if (placementStep >= 8) {
    const winner = checkWinner({ ...state, cells, pieces });
    return {
      ...state,
      cells,
      pieces,
      nextPieceId: id + 1,
      placementStep,
      unplaced,
      phase: winner !== null ? "game-over" : "playing",
      current: state.firstPlayer,
      winner,
      scoutPartial: null,
    };
  }

  return {
    ...state,
    cells,
    pieces,
    nextPieceId: id + 1,
    placementStep,
    unplaced,
    current: placementPlayer(placementStep),
    scoutPartial: null,
  };
}

function pieceAt(state: DejarikState, pieceId: number): DejarikPiece | null {
  return state.pieces[pieceId] ?? null;
}

function cellOfPiece(state: DejarikState, pieceId: number): number | null {
  for (let c = 0; c < state.cells.length; c++) {
    if (state.cells[c] === pieceId) return c;
  }
  return null;
}

function advanceTurn(state: DejarikState): DejarikState {
  const winner = checkWinner(state);
  if (winner !== null) {
    return { ...state, phase: "game-over", winner, scoutPartial: null };
  }
  return {
    ...state,
    current: state.current === 0 ? 1 : 0,
    scoutPartial: null,
  };
}

function applyMoveOrAttack(
  state: DejarikState,
  pieceId: number,
  to: number,
  mode: "move" | "attack"
): DejarikState | null {
  if (state.phase !== "playing") return null;
  const piece = pieceAt(state, pieceId);
  if (!piece || piece.owner !== state.current) return null;

  const from = cellOfPiece(state, pieceId);
  if (from === null) return null;

  const targets =
    mode === "move"
      ? moveTargetsFor(piece.type, state.cells, state.pieces, piece.owner, pieceId, from)
      : attackTargetsFor(piece.type, state.cells, state.pieces, piece.owner, pieceId, from);
  if (!targets.includes(to)) return null;

  const cells = [...state.cells];
  const pieces = { ...state.pieces };

  if (mode === "attack") {
    const victim = cells[to];
    if (victim === null) return null;
    delete pieces[victim];
  }

  cells[from] = null;
  cells[to] = pieceId;

  let next: DejarikState = { ...state, cells, pieces };

  if (piece.type === "scout") {
    const partial = state.scoutPartial?.pieceId === pieceId
      ? state.scoutPartial
      : { pieceId, didMove: false, didAttack: false };
    const scoutPartial: ScoutPartial = {
      pieceId,
      didMove: partial.didMove || mode === "move",
      didAttack: partial.didAttack || mode === "attack",
    };
    next = { ...next, scoutPartial };
    const winner = checkWinner(next);
    if (winner !== null) {
      return { ...next, phase: "game-over", winner, scoutPartial: null };
    }
    if (scoutPartial.didMove && scoutPartial.didAttack) {
      return advanceTurn(next);
    }
    return next;
  }

  return advanceTurn(next);
}

export function applyDejarikMove(
  state: DejarikState,
  pieceId: number,
  to: number
): DejarikState | null {
  return applyMoveOrAttack(state, pieceId, to, "move");
}

export function applyDejarikAttack(
  state: DejarikState,
  pieceId: number,
  to: number
): DejarikState | null {
  return applyMoveOrAttack(state, pieceId, to, "attack");
}

export function endScoutTurn(state: DejarikState): DejarikState | null {
  if (state.phase !== "playing" || !state.scoutPartial) return null;
  const piece = pieceAt(state, state.scoutPartial.pieceId);
  if (!piece || piece.type !== "scout" || piece.owner !== state.current) return null;
  if (!state.scoutPartial.didMove && !state.scoutPartial.didAttack) return null;
  return advanceTurn(state);
}

export function scoutCanContinue(state: DejarikState, pieceId: number): boolean {
  const partial = state.scoutPartial;
  if (!partial || partial.pieceId !== pieceId) return true;
  return !(partial.didMove && partial.didAttack);
}

export function legalMoveTargets(state: DejarikState, pieceId: number): number[] {
  const piece = pieceAt(state, pieceId);
  if (!piece || piece.owner !== state.current) return [];
  if (piece.type === "scout") {
    const partial = state.scoutPartial;
    if (partial?.pieceId === pieceId && partial.didMove) return [];
  }
  const from = cellOfPiece(state, pieceId);
  if (from === null) return [];
  return moveTargetsFor(piece.type, state.cells, state.pieces, piece.owner, pieceId, from);
}

export function legalAttackTargets(state: DejarikState, pieceId: number): number[] {
  const piece = pieceAt(state, pieceId);
  if (!piece || piece.owner !== state.current) return [];
  if (piece.type === "scout") {
    const partial = state.scoutPartial;
    if (partial?.pieceId === pieceId && partial.didAttack) return [];
  }
  const from = cellOfPiece(state, pieceId);
  if (from === null) return [];
  return attackTargetsFor(piece.type, state.cells, state.pieces, piece.owner, pieceId, from);
}
