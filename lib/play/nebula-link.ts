export const NEBULA_SIZE = 5;
export const NEBULA_CORE = 12;
export const NEBULA_CORE_RING = [7, 11, 13, 17];
export const NEBULA_CORE_RING_WIN = 3;

export type NebulaBoard = (number | null)[];

export type NebulaState = {
  playerCount: number;
  currentPlayer: number;
  board: NebulaBoard;
  remaining: number[];
  gameOver: boolean;
  winners: number[];
  isDraw: boolean;
};

export function nebulaTokensFor(playerCount: number): number {
  return 24 / playerCount;
}

export function nebulaNeighbors(index: number): number[] {
  const r = Math.floor(index / NEBULA_SIZE);
  const c = index % NEBULA_SIZE;
  const out: number[] = [];
  if (r > 0) out.push(index - NEBULA_SIZE);
  if (r < NEBULA_SIZE - 1) out.push(index + NEBULA_SIZE);
  if (c > 0) out.push(index - 1);
  if (c < NEBULA_SIZE - 1) out.push(index + 1);
  return out;
}

export function legalNebulaMoves(
  board: NebulaBoard,
  player: number,
  tokensLeft: number,
  playerCount: number
): number[] {
  const moves: number[] = [];
  const isFirst = tokensLeft === nebulaTokensFor(playerCount);

  for (let i = 0; i < board.length; i++) {
    if (i === NEBULA_CORE || board[i] !== null) continue;
    if (isFirst) {
      moves.push(i);
      continue;
    }
    if (nebulaNeighbors(i).some((n) => board[n] === player)) {
      moves.push(i);
    }
  }

  return moves;
}

function findNextPlayer(
  board: NebulaBoard,
  remaining: number[],
  fromPlayer: number,
  playerCount: number
): number | null {
  for (let step = 1; step <= playerCount; step++) {
    const player = (fromPlayer + step) % playerCount;
    if (remaining[player] <= 0) continue;
    if (legalNebulaMoves(board, player, remaining[player], playerCount).length > 0) {
      return player;
    }
  }
  return null;
}

/** 星核隣接マスを NEBULA_CORE_RING_WIN 個以上含む連結グループがあれば勝ち */
export function nebulaVictoryPlayer(
  board: NebulaBoard,
  playerCount: number
): number | null {
  const seen = new Set<number>();

  for (let i = 0; i < board.length; i++) {
    const owner = board[i];
    if (owner === null || owner < 0 || owner >= playerCount || seen.has(i)) continue;

    let coreCount = 0;
    const stack = [i];
    seen.add(i);

    while (stack.length) {
      const cur = stack.pop()!;
      if (NEBULA_CORE_RING.includes(cur)) coreCount += 1;
      for (const n of nebulaNeighbors(cur)) {
        if (board[n] === owner && !seen.has(n)) {
          seen.add(n);
          stack.push(n);
        }
      }
    }

    if (coreCount >= NEBULA_CORE_RING_WIN) return owner;
  }

  return null;
}

export function nebulaCoreRingProgress(board: NebulaBoard, player: number): number {
  const seen = new Set<number>();
  let best = 0;

  for (let i = 0; i < board.length; i++) {
    if (board[i] !== player || seen.has(i)) continue;

    let coreCount = 0;
    const stack = [i];
    seen.add(i);

    while (stack.length) {
      const cur = stack.pop()!;
      if (NEBULA_CORE_RING.includes(cur)) coreCount += 1;
      for (const n of nebulaNeighbors(cur)) {
        if (board[n] === player && !seen.has(n)) {
          seen.add(n);
          stack.push(n);
        }
      }
    }

    best = Math.max(best, coreCount);
  }

  return best;
}

export function initialNebulaLink(playerCount: number): NebulaState {
  const board = Array<number | null>(NEBULA_SIZE * NEBULA_SIZE).fill(null);
  board[NEBULA_CORE] = -1;
  return {
    playerCount,
    currentPlayer: 0,
    board,
    remaining: Array.from({ length: playerCount }, () => nebulaTokensFor(playerCount)),
    gameOver: false,
    winners: [],
    isDraw: false,
  };
}

function finishState(
  state: NebulaState,
  board: NebulaBoard,
  remaining: number[],
  winners: number[],
  isDraw: boolean
): NebulaState {
  return {
    ...state,
    board,
    remaining,
    gameOver: true,
    winners,
    isDraw,
    currentPlayer: state.currentPlayer,
  };
}

export function applyNebulaPlace(
  state: NebulaState,
  index: number
): NebulaState | null {
  if (state.gameOver) return null;
  const player = state.currentPlayer;
  const moves = legalNebulaMoves(
    state.board,
    player,
    state.remaining[player],
    state.playerCount
  );
  if (!moves.includes(index)) return null;

  const board = state.board.map((v, i) => (i === index ? player : v));
  const remaining = state.remaining.map((n, i) => (i === player ? n - 1 : n));

  const victor = nebulaVictoryPlayer(board, state.playerCount);
  if (victor !== null) {
    return finishState(state, board, remaining, [victor], false);
  }

  const nextPlayer = findNextPlayer(board, remaining, player, state.playerCount);
  if (nextPlayer === null) {
    return finishState(
      state,
      board,
      remaining,
      Array.from({ length: state.playerCount }, (_, i) => i),
      true
    );
  }

  return {
    ...state,
    board,
    remaining,
    currentPlayer: nextPlayer,
  };
}

export function applyNebulaPass(state: NebulaState): NebulaState | null {
  if (state.gameOver) return null;
  const player = state.currentPlayer;
  if (state.remaining[player] <= 0) return null;
  if (legalNebulaMoves(state.board, player, state.remaining[player], state.playerCount).length > 0) {
    return null;
  }

  const nextPlayer = findNextPlayer(
    state.board,
    state.remaining,
    player,
    state.playerCount
  );
  if (nextPlayer === null) {
    return finishState(
      state,
      state.board,
      state.remaining,
      Array.from({ length: state.playerCount }, (_, i) => i),
      true
    );
  }

  return { ...state, currentPlayer: nextPlayer };
}

export function nebulaWinners(state: NebulaState): number[] {
  if (!state.gameOver) return [];
  return state.isDraw
    ? Array.from({ length: state.playerCount }, (_, i) => i)
    : state.winners;
}
