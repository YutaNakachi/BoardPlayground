import {
  CREATURE_TYPES,
  DEJARIK_CELL_COUNT,
  placementHomeCells,
  type CreatureType,
  type Player,
} from "./board";
import { attackTargetsFor, moveTargetsFor, type Cells } from "./moves";

export type { CreatureType, Player };

export type DejarikPiece = {
  id: number;
  owner: Player;
  type: CreatureType;
};

export type DejarikPhase = "setup" | "placement" | "playing" | "game-over";

export type DejarikWinReason = "elimination" | "stall";

export const STALL_LIMIT = 3;

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
  unplaced: Record<Player, CreatureType[]>;
  winner: Player | null;
  winReason: DejarikWinReason | null;
  /** 残り1体のとき、直近で取っていない手番数（取ったら0） */
  stallCounters: [number, number];
  scoutPartial: ScoutPartial | null;
};

export function secondPlayer(first: Player): Player {
  return first === 0 ? 1 : 0;
}

/** 配置 step の手番プレイヤー（step 0 は後攻 = secondPlayer(firstPlayer) から交互） */
export function placementPlayer(step: number, firstPlayer: Player): Player {
  const starter = secondPlayer(firstPlayer);
  return step % 2 === 0 ? starter : secondPlayer(starter);
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
    unplaced: {
      0: [...CREATURE_TYPES],
      1: [...CREATURE_TYPES],
    },
    winner: null,
    winReason: null,
    stallCounters: [0, 0],
    scoutPartial: null,
  };
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

export function applyPlacement(
  state: DejarikState,
  type: CreatureType,
  cell: number
): DejarikState | null {
  if (state.phase !== "placement") return null;
  const player = placementPlayer(state.placementStep, state.firstPlayer);
  const homes = placementHomeCells(player);
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
      winReason: winner !== null ? "elimination" : null,
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
    current: placementPlayer(placementStep, state.firstPlayer),
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

function endTurnAfterMove(
  state: DejarikState,
  player: Player,
  capturedThisTurn: boolean
): DejarikState {
  const elimination = checkWinner(state);
  if (elimination !== null) {
    return {
      ...state,
      phase: "game-over",
      winner: elimination,
      winReason: "elimination",
      scoutPartial: null,
    };
  }

  const stall: [number, number] = [state.stallCounters[0], state.stallCounters[1]];
  const remaining = countPiecesForOwner(state, player);
  if (remaining > 1) {
    stall[player] = 0;
  } else if (remaining === 1) {
    if (capturedThisTurn) {
      stall[player] = 0;
    } else {
      stall[player] += 1;
      if (stall[player] >= STALL_LIMIT) {
        const winner = player === 0 ? 1 : 0;
        return {
          ...state,
          phase: "game-over",
          winner,
          winReason: "stall",
          stallCounters: stall,
          scoutPartial: null,
        };
      }
    }
  }

  return {
    ...state,
    stallCounters: stall,
    current: player === 0 ? 1 : 0,
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

  const capturedThisTurn = mode === "attack";
  if (capturedThisTurn) {
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
      return {
        ...next,
        phase: "game-over",
        winner,
        winReason: "elimination",
        scoutPartial: null,
      };
    }
    if (scoutPartial.didMove && scoutPartial.didAttack) {
      return endTurnAfterMove(next, piece.owner, scoutPartial.didAttack);
    }
    return next;
  }

  return endTurnAfterMove(next, piece.owner, capturedThisTurn);
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
  const captured = Boolean(state.scoutPartial.didAttack);
  return endTurnAfterMove(state, piece.owner, captured);
}

export function stallLabelForPlayer(state: DejarikState, player: Player): string | null {
  if (state.phase !== "playing") return null;
  if (countPiecesForOwner(state, player) !== 1) return null;
  const used = state.stallCounters[player];
  if (used === 0) return "残り1体：3手以内に取ってください。";
  return `残り1体：あと${STALL_LIMIT - used}手で取れなければ負けです。`;
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
