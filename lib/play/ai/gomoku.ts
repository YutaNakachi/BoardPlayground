import {
  connectNEvaluate,
  connectNWinner,
} from "@/lib/play/cpu/connect-n";
import { chooseScoredMove, cpuSearchDepth } from "@/lib/play/cpu/difficulty";
import { pickRandom } from "@/lib/play/cpu/random";
import type { CpuDifficulty } from "@/lib/play/cpu/types";
import {
  GOMOKU_CELLS,
  GOMOKU_SIZE,
  gomokuWinner,
  type Board,
  type Player,
} from "@/lib/play/gomoku";

function gridFor(board: Board) {
  return {
    cols: GOMOKU_SIZE,
    rows: GOMOKU_SIZE,
    winLength: 5,
    cell: (row: number, col: number) => board[row * GOMOKU_SIZE + col],
    setCell: () => [],
  };
}

function legalCells(board: Board): number[] {
  const moves: number[] = [];
  for (let i = 0; i < GOMOKU_CELLS; i++) {
    if (board[i] === null) moves.push(i);
  }
  if (moves.length <= 48) return moves;

  const near: number[] = [];
  for (const index of moves) {
    const row = Math.floor(index / GOMOKU_SIZE);
    const col = index % GOMOKU_SIZE;
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const r = row + dr;
        const c = col + dc;
        if (r < 0 || r >= GOMOKU_SIZE || c < 0 || c >= GOMOKU_SIZE) continue;
        if (board[r * GOMOKU_SIZE + c] !== null) {
          near.push(index);
          break;
        }
      }
    }
  }
  return near.length > 0 ? near : moves.slice(0, 32);
}

function place(board: Board, index: number, player: Player): Board | null {
  if (board[index] !== null) return null;
  const next = board.slice();
  next[index] = player;
  return next;
}

function scoreMove(board: Board, index: number, cpuPlayer: Player): number {
  const next = place(board, index, cpuPlayer);
  if (!next) return -1_000_000;
  const win = gomokuWinner(next) ?? connectNWinner(gridFor(next), next);
  if (win === cpuPlayer) return 1_000_000;
  const opp = cpuPlayer === 0 ? 1 : 0;
  const block = place(board, index, opp);
  if (block) {
    const oppWin = gomokuWinner(block) ?? connectNWinner(gridFor(block), block);
    if (oppWin === opp) return 950_000;
  }
  return connectNEvaluate(gridFor(next), next, cpuPlayer);
}

function minimax(
  board: Board,
  player: Player,
  perspective: Player,
  depth: number
): number {
  const winner = gomokuWinner(board) ?? connectNWinner(gridFor(board), board);
  if (winner === perspective) return 1_000_000;
  if (winner !== null) return -1_000_000;
  if (depth === 0) return connectNEvaluate(gridFor(board), board, perspective);

  const moves = legalCells(board);
  if (moves.length === 0) return 0;

  if (player === perspective) {
    let best = -Infinity;
    for (const index of moves) {
      const next = place(board, index, player);
      if (!next) continue;
      best = Math.max(
        best,
        minimax(next, player === 0 ? 1 : 0, perspective, depth - 1)
      );
    }
    return best;
  }

  let best = Infinity;
  for (const index of moves) {
    const next = place(board, index, player);
    if (!next) continue;
    best = Math.min(
      best,
      minimax(next, player === 0 ? 1 : 0, perspective, depth - 1)
    );
  }
  return best;
}

export function chooseGomokuMove(
  board: Board,
  current: Player,
  difficulty: CpuDifficulty,
  cpuPlayer: Player
): number | null {
  if (current !== cpuPlayer) return null;
  const legal = legalCells(board);
  if (legal.length === 0) return null;

  if (board.every((c) => c === null)) {
    const center =
      Math.floor(GOMOKU_SIZE / 2) * GOMOKU_SIZE + Math.floor(GOMOKU_SIZE / 2);
    return center;
  }

  const depth = cpuSearchDepth(difficulty, { easy: 0, normal: 2, hard: 3 });
  if (depth > 0) {
    let bestIndex: number | null = null;
    let bestScore = -Infinity;
    for (const index of legal) {
      const next = place(board, index, cpuPlayer);
      if (!next) continue;
      const score = minimax(
        next,
        cpuPlayer === 0 ? 1 : 0,
        cpuPlayer,
        depth - 1
      );
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }
    if (bestIndex !== null) return bestIndex;
  }

  return (
    chooseScoredMove(difficulty, legal, (index) =>
      scoreMove(board, index, cpuPlayer)
    ) ?? pickRandom(legal)
  );
}
