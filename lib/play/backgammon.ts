import { rollDice } from "@/lib/play/dice";

export type Player = 0 | 1;
export const BG_POINTS = 24;

export type BackgammonState = {
  points: number[];
  bar: [number, number];
  off: [number, number];
  current: Player;
  dice: number[] | null;
  movesLeft: number[];
  winner: Player | null;
};

/** Standard opening: P0 moves 23→0, P1 moves 0→23 */
export function initialBackgammon(): BackgammonState {
  const points = Array(BG_POINTS).fill(0);
  points[0] = -2;
  points[5] = 5;
  points[7] = 3;
  points[11] = -5;
  points[12] = 5;
  points[16] = -3;
  points[18] = -5;
  points[23] = 2;
  return {
    points,
    bar: [0, 0],
    off: [0, 0],
    current: 0,
    dice: null,
    movesLeft: [],
    winner: null,
  };
}

export function rollBackgammon(state: BackgammonState): BackgammonState {
  if (state.winner != null || state.dice) return state;
  const [a, b] = rollDice(2);
  const moves = a === b ? [a, a, a, a] : [a, b];
  return { ...state, dice: [a, b], movesLeft: moves };
}

function homeRange(player: Player): [number, number] {
  return player === 0 ? [0, 5] : [18, 23];
}

function allInHome(state: BackgammonState, player: Player): boolean {
  if (state.bar[player] > 0) return false;
  const [lo, hi] = homeRange(player);
  for (let i = 0; i < BG_POINTS; i++) {
    const n = state.points[i];
    if (player === 0 && n > 0 && (i < lo || i > hi)) return false;
    if (player === 1 && n < 0 && (i < lo || i > hi)) return false;
  }
  return true;
}

function direction(player: Player): number {
  return player === 0 ? -1 : 1;
}

function entryPoint(player: Player, die: number): number {
  return player === 0 ? 24 - die : die - 1;
}

export type BackgammonMove = {
  from: number | "bar";
  to: number | "off";
  die: number;
};

function cloneState(state: BackgammonState): BackgammonState {
  return {
    ...state,
    points: [...state.points],
    bar: [...state.bar] as [number, number],
    off: [...state.off] as [number, number],
    movesLeft: [...state.movesLeft],
  };
}

function applyOneMove(state: BackgammonState, move: BackgammonMove): BackgammonState | null {
  const player = state.current;
  const sign = player === 0 ? 1 : -1;
  const next = cloneState(state);
  const dieIdx = next.movesLeft.indexOf(move.die);
  if (dieIdx < 0) return null;

  if (move.from === "bar") {
    if (next.bar[player] <= 0) return null;
    const to = move.to as number;
    if (to !== entryPoint(player, move.die)) return null;
    if (next.points[to] * sign < -1) return null;
    next.bar[player] -= 1;
    if (next.points[to] === -sign) next.bar[player === 0 ? 1 : 0] += 1;
    next.points[to] += sign;
  } else if (move.to === "off") {
    const from = move.from as number;
    if (!allInHome(next, player)) return null;
    const [lo, hi] = homeRange(player);
    if (from < lo || from > hi) return null;
    const dist = player === 0 ? from + 1 : BG_POINTS - from;
    if (dist > move.die) return null;
    if (next.points[from] * sign <= 0) return null;
    next.points[from] -= sign;
    next.off[player] += 1;
  } else {
    const from = move.from as number;
    const to = move.to as number;
    if (Math.abs(to - from) !== move.die) return null;
    if (next.points[from] * sign <= 0) return null;
    if (next.points[to] * sign < -1) return null;
    next.points[from] -= sign;
    if (next.points[to] === -sign) next.bar[player === 0 ? 1 : 0] += 1;
    next.points[to] += sign;
  }

  next.movesLeft.splice(dieIdx, 1);
  return next;
}

function generateMoves(state: BackgammonState): BackgammonMove[] {
  const player = state.current;
  const sign = player === 0 ? 1 : -1;
  const dir = direction(player);
  const moves: BackgammonMove[] = [];

  if (state.bar[player] > 0) {
    for (const die of state.movesLeft) {
      const to = entryPoint(player, die);
      if (state.points[to] * sign >= -1) {
        moves.push({ from: "bar", to, die });
      }
    }
    return moves;
  }

  for (let from = 0; from < BG_POINTS; from++) {
    if (state.points[from] * sign <= 0) continue;
    for (const die of state.movesLeft) {
      const to = from + dir * die;
      if (to >= 0 && to < BG_POINTS) {
        if (state.points[to] * sign >= -1) moves.push({ from, to, die });
      } else if (allInHome(state, player)) {
        const [lo, hi] = homeRange(player);
        if (from >= lo && from <= hi) {
          const dist = player === 0 ? from + 1 : BG_POINTS - from;
          if (dist <= die) moves.push({ from, to: "off", die });
        }
      }
    }
  }
  return moves;
}

export function backgammonMoves(state: BackgammonState): BackgammonMove[] {
  if (!state.dice || state.winner != null) return [];
  return generateMoves(state);
}

export function applyBackgammonMove(state: BackgammonState, move: BackgammonMove): BackgammonState | null {
  const next = applyOneMove(state, move);
  if (!next) return null;

  if (next.off[next.current] === 15) {
    return { ...next, winner: next.current, dice: null, movesLeft: [] };
  }

  if (next.movesLeft.length === 0) {
    return { ...next, current: next.current === 0 ? 1 : 0, dice: null, movesLeft: [] };
  }

  const remaining = generateMoves(next);
  if (remaining.length === 0) {
    return {
      ...next,
      current: next.current === 0 ? 1 : 0,
      dice: null,
      movesLeft: [],
    };
  }
  return next;
}

export function endBackgammonTurn(state: BackgammonState): BackgammonState {
  if (!state.dice) return state;
  return {
    ...state,
    current: state.current === 0 ? 1 : 0,
    dice: null,
    movesLeft: [],
  };
}

export function checkerCount(state: BackgammonState, player: Player, point: number): number {
  const n = state.points[point];
  if (player === 0) return n > 0 ? n : 0;
  return n < 0 ? -n : 0;
}
