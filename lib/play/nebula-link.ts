import { winnerIndices } from "@/lib/game-engine";

export const NEBULA_SIZE = 5;
export const NEBULA_CORE = 12;

export type NebulaBoard = (number | null)[];

export type NebulaState = {
  playerCount: number;
  currentPlayer: number;
  board: NebulaBoard;
  remaining: number[];
  gameOver: boolean;
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

export function nebulaLargestGroup(board: NebulaBoard, player: number): number {
  const seen = new Set<number>();
  let best = 0;
  for (let i = 0; i < board.length; i++) {
    if (board[i] !== player || seen.has(i)) continue;
    let size = 0;
    const stack = [i];
    seen.add(i);
    while (stack.length) {
      const cur = stack.pop()!;
      size += 1;
      for (const n of nebulaNeighbors(cur)) {
        if (board[n] === player && !seen.has(n)) {
          seen.add(n);
          stack.push(n);
        }
      }
    }
    best = Math.max(best, size);
  }
  return best;
}

export function nebulaCoreAdjacent(board: NebulaBoard, player: number): number {
  return nebulaNeighbors(NEBULA_CORE).filter((i) => board[i] === player).length;
}

export function nebulaScorePlayer(board: NebulaBoard, player: number) {
  const group = nebulaLargestGroup(board, player);
  const adj = nebulaCoreAdjacent(board, player);
  return { total: group * 2 + adj, group, adj };
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
  };
}

export function applyNebulaPlace(
  state: NebulaState,
  index: number
): NebulaState | null {
  if (state.gameOver) return null;
  if (index === NEBULA_CORE || state.board[index] !== null) return null;
  if (state.remaining[state.currentPlayer] <= 0) return null;

  const board = state.board.map((v, i) => (i === index ? state.currentPlayer : v));
  const remaining = state.remaining.map((n, i) =>
    i === state.currentPlayer ? n - 1 : n
  );

  if (remaining.every((n) => n === 0)) {
    return { ...state, board, remaining, gameOver: true };
  }

  return {
    ...state,
    board,
    remaining,
    currentPlayer: (state.currentPlayer + 1) % state.playerCount,
  };
}

export function nebulaWinners(state: NebulaState): number[] {
  const scores = Array.from({ length: state.playerCount }, (_, i) =>
    nebulaScorePlayer(state.board, i).total
  );
  return winnerIndices(scores);
}
