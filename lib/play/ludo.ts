import { rollDie } from "@/lib/play/dice";
import {
  isStartPathIndex,
  ludoActivePlayers,
  LUDO_HOME_LEN,
  LUDO_TRACK_STEPS,
  pathIndexForSteps,
  trackCoord,
} from "@/lib/play/ludo-board";

export type LudoToken = {
  player: number;
  index: number;
  /** yard | track steps 0-50 | home slot 0-3 */
  zone: "yard" | "track" | "home";
  steps: number;
};

export type LudoState = {
  players: number;
  activePlayers: number[];
  tokens: LudoToken[];
  current: number;
  lastRoll: number | null;
  extraTurn: boolean;
  winner: number | null;
};

export type LudoMove = {
  tokenIndex: number;
};

export function initialLudo(players: number): LudoState {
  const activePlayers = ludoActivePlayers(players);
  const tokens: LudoToken[] = [];
  for (const p of activePlayers) {
    for (let i = 0; i < 4; i++) {
      tokens.push({ player: p, index: i, zone: "yard", steps: 0 });
    }
  }
  return {
    players,
    activePlayers,
    tokens,
    current: activePlayers[0],
    lastRoll: null,
    extraTurn: false,
    winner: null,
  };
}

export function rollLudo(state: LudoState): LudoState {
  if (state.winner != null || state.lastRoll != null) return state;
  const roll = rollDie();
  return { ...state, lastRoll: roll, extraTurn: roll === 6 };
}

function totalSteps(token: LudoToken): number {
  if (token.zone === "yard") return -1;
  if (token.zone === "track") return token.steps;
  return LUDO_TRACK_STEPS + token.steps;
}

function isFinished(token: LudoToken): boolean {
  return token.zone === "home" && token.steps === LUDO_HOME_LEN - 1;
}

function canAdvance(token: LudoToken, roll: number): boolean {
  if (isFinished(token)) return false;
  if (token.zone === "yard") return roll === 6;
  const next = totalSteps(token) + roll;
  return next <= LUDO_TRACK_STEPS + LUDO_HOME_LEN - 1;
}

export function ludoMoves(state: LudoState): LudoMove[] {
  if (state.lastRoll == null || state.winner != null) return [];
  const roll = state.lastRoll;
  const player = state.current;
  const moves: LudoMove[] = [];

  for (let i = 0; i < state.tokens.length; i++) {
    const token = state.tokens[i];
    if (token.player !== player) continue;
    if (canAdvance(token, roll)) moves.push({ tokenIndex: i });
  }
  return moves;
}

function applyTokenAdvance(token: LudoToken, roll: number): LudoToken {
  if (token.zone === "yard") {
    return { ...token, zone: "track", steps: 0 };
  }
  const nextTotal = totalSteps(token) + roll;
  if (nextTotal <= LUDO_TRACK_STEPS) {
    return { ...token, zone: "track", steps: nextTotal };
  }
  return { ...token, zone: "home", steps: nextTotal - LUDO_TRACK_STEPS - 1 };
}

function captureAt(
  tokens: LudoToken[],
  player: number,
  pathIndex: number,
  moverIndex: number
): LudoToken[] {
  if (isStartPathIndex(pathIndex)) return tokens;
  return tokens.map((t, i) => {
    if (i === moverIndex || t.player === player || t.zone !== "track") return t;
    if (pathIndexForSteps(t.player, t.steps) !== pathIndex) return t;
    return { ...t, zone: "yard", steps: 0 };
  });
}

export function applyLudoMove(state: LudoState, move: LudoMove): LudoState | null {
  const allowed = ludoMoves(state);
  if (!allowed.some((m) => m.tokenIndex === move.tokenIndex)) return null;

  const tokens = state.tokens.map((t) => ({ ...t }));
  const token = tokens[move.tokenIndex];
  const roll = state.lastRoll!;
  const player = state.current;
  const advanced = applyTokenAdvance(token, roll);

  if (advanced.zone === "track") {
    const pathIndex = pathIndexForSteps(player, advanced.steps);
    tokens[move.tokenIndex] = advanced;
    const captured = captureAt(tokens, player, pathIndex, move.tokenIndex);
    tokens.splice(0, tokens.length, ...captured);
  } else {
    tokens[move.tokenIndex] = advanced;
  }

  const allHome = tokens
    .filter((t) => t.player === player)
    .every((t) => t.zone === "home" && t.steps === LUDO_HOME_LEN - 1);

  const extra = state.extraTurn;
  const turnIndex = state.activePlayers.indexOf(player);
  const nextPlayer = extra
    ? player
    : state.activePlayers[(turnIndex + 1) % state.activePlayers.length];

  return {
    ...state,
    tokens,
    current: nextPlayer,
    lastRoll: null,
    extraTurn: false,
    winner: allHome ? player : null,
  };
}

export function mustMoveLudo(state: LudoState): boolean {
  return state.lastRoll != null && ludoMoves(state).length > 0;
}

export function ludoTokenPathIndex(token: LudoToken): number | null {
  if (token.zone !== "track") return null;
  return pathIndexForSteps(token.player, token.steps);
}

import { LUDO_HOME, LUDO_YARD, type Coord } from "@/lib/play/ludo-board";

export function ludoTokenCoord(token: LudoToken): Coord {
  if (token.zone === "yard") return LUDO_YARD[token.player][token.index];
  if (token.zone === "track") return trackCoord(token.player, token.steps);
  return LUDO_HOME[token.player][token.steps];
}

export function ludoGoalCount(state: LudoState, player: number): number {
  return state.tokens.filter(
    (t) => t.player === player && t.zone === "home" && t.steps === LUDO_HOME_LEN - 1
  ).length;
}

export { trackCoord } from "@/lib/play/ludo-board";
