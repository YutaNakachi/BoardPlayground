import { rollDie } from "@/lib/play/dice";

export const LUDO_TRACK = 52;
export const LUDO_HOME_LEN = 6;

export type LudoToken = {
  player: number;
  index: number;
  /** -1 = yard, 0-51 track, 52-57 home stretch, 58 finished */
  position: number;
};

export type LudoState = {
  players: number;
  tokens: LudoToken[];
  current: number;
  lastRoll: number | null;
  extraTurn: boolean;
  winner: number | null;
};

function entrySquare(player: number, players: number): number {
  if (players === 2) return player === 0 ? 0 : 26;
  return player * 13;
}

function homeStart(player: number, players: number): number {
  return entrySquare(player, players);
}

function isSafeSquare(pos: number, players: number): boolean {
  for (let p = 0; p < players; p++) {
    if (pos === entrySquare(p, players)) return true;
  }
  return false;
}

export function initialLudo(players: number): LudoState {
  const tokens: LudoToken[] = [];
  for (let p = 0; p < players; p++) {
    for (let i = 0; i < 4; i++) tokens.push({ player: p, index: i, position: -1 });
  }
  return { players, tokens, current: 0, lastRoll: null, extraTurn: false, winner: null };
}

export function rollLudo(state: LudoState): LudoState {
  if (state.winner != null || state.lastRoll != null) return state;
  const roll = rollDie();
  return { ...state, lastRoll: roll, extraTurn: roll === 6 };
}

export type LudoMove = {
  tokenIndex: number;
  steps: number;
};

function trackPosition(player: number, players: number, stepsFromEntry: number): number {
  const start = entrySquare(player, players);
  return (start + stepsFromEntry) % LUDO_TRACK;
}

function stepsOnTrack(token: LudoToken, players: number): number {
  if (token.position < 0 || token.position >= LUDO_TRACK) return -1;
  const start = entrySquare(token.player, players);
  return (token.position - start + LUDO_TRACK) % LUDO_TRACK;
}

export function ludoMoves(state: LudoState): LudoMove[] {
  if (state.lastRoll == null || state.winner != null) return [];
  const roll = state.lastRoll;
  const moves: LudoMove[] = [];
  const player = state.current;
  const myTokens = state.tokens.filter((t) => t.player === player);

  for (const token of myTokens) {
    const globalIdx = state.tokens.indexOf(token);
    if (token.position === 58) continue;

    if (token.position === -1) {
      if (roll === 6) moves.push({ tokenIndex: globalIdx, steps: 0 });
      continue;
    }

    if (token.position >= LUDO_TRACK) {
      const homePos = token.position - LUDO_TRACK;
      const next = homePos + roll;
      if (next <= LUDO_HOME_LEN) moves.push({ tokenIndex: globalIdx, steps: roll });
      continue;
    }

    const walked = stepsOnTrack(token, state.players) + roll;
    if (walked < LUDO_TRACK) {
      moves.push({ tokenIndex: globalIdx, steps: roll });
    } else if (walked === LUDO_TRACK) {
      moves.push({ tokenIndex: globalIdx, steps: roll });
    } else {
      const homeSteps = walked - LUDO_TRACK;
      if (homeSteps <= LUDO_HOME_LEN) moves.push({ tokenIndex: globalIdx, steps: roll });
    }
  }
  return moves;
}

function applyCapture(tokens: LudoToken[], pos: number, mover: number, players: number): LudoToken[] {
  if (pos < 0 || pos >= LUDO_TRACK || isSafeSquare(pos, players)) return tokens;
  return tokens.map((t) => {
    if (t.player === mover || t.position !== pos || t.position < 0 || t.position >= LUDO_TRACK) return t;
    return { ...t, position: -1 };
  });
}

export function applyLudoMove(state: LudoState, move: LudoMove): LudoState | null {
  const allowed = ludoMoves(state);
  if (!allowed.some((m) => m.tokenIndex === move.tokenIndex)) return null;
  const tokens = state.tokens.map((t) => ({ ...t }));
  const token = tokens[move.tokenIndex];
  const roll = state.lastRoll!;
  const player = state.current;
  let capturedSomeone = false;

  if (token.position === -1) {
    token.position = entrySquare(player, state.players);
  } else if (token.position >= LUDO_TRACK) {
    token.position += roll;
    if (token.position >= LUDO_TRACK + LUDO_HOME_LEN) return null;
    if (token.position === LUDO_TRACK + LUDO_HOME_LEN) token.position = 58;
  } else {
    const walked = stepsOnTrack(token, state.players) + roll;
    if (walked < LUDO_TRACK) {
      const destPos = trackPosition(player, state.players, walked);
      const willCapture =
        !isSafeSquare(destPos, state.players) &&
        state.tokens.some(
          (t) =>
            t.player !== player &&
            t.position === destPos &&
            t.position >= 0 &&
            t.position < LUDO_TRACK
        );
      token.position = destPos;
      const captured = applyCapture(tokens, token.position, player, state.players);
      tokens.splice(0, tokens.length, ...captured);
      if (willCapture) capturedSomeone = true;
    } else if (walked === LUDO_TRACK) {
      token.position = LUDO_TRACK;
    } else {
      const homeSteps = walked - LUDO_TRACK;
      if (homeSteps > LUDO_HOME_LEN) return null;
      token.position = LUDO_TRACK + homeSteps;
      if (token.position === LUDO_TRACK + LUDO_HOME_LEN) token.position = 58;
    }
  }

  const allHome = tokens.filter((t) => t.player === player).every((t) => t.position === 58);
  const extra = state.extraTurn || capturedSomeone;

  let nextPlayer = player;
  if (!extra) nextPlayer = (player + 1) % state.players;

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
