import { connectNEvaluate, connectNWinner } from "@/lib/play/cpu/connect-n";
import { chooseScoredMove } from "@/lib/play/cpu/difficulty";
import { pickRandom } from "@/lib/play/cpu/random";
import type { CpuDifficulty } from "@/lib/play/cpu/types";
import {
  emptyGomokuBoard,
  GOMOKU_CELLS,
  GOMOKU_SIZE,
  gomokuBoardFull,
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
  if (moves.length <= 40) return moves;

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
  return near.length > 0 ? near : moves.slice(0, 24);
}

function place(board: Board, index: number, player: Player): Board | null {
  if (board[index] !== null) return null;
  const next = board.slice();
  next[index] = player;
  return next;
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
    const center = Math.floor(GOMOKU_SIZE / 2) * GOMOKU_SIZE + Math.floor(GOMOKU_SIZE / 2);
    return center;
  }

  return (
    chooseScoredMove(difficulty, legal, (index) => {
      const next = place(board, index, cpuPlayer);
      if (!next) return -1_000_000;
      const win = gomokuWinner(next) ?? connectNWinner(gridFor(next), next);
      if (win === cpuPlayer) return 1_000_000;
      const opp = cpuPlayer === 0 ? 1 : 0;
      const block = place(board, index, opp);
      if (block) {
        const oppWin = gomokuWinner(block) ?? connectNWinner(gridFor(block), block);
        if (oppWin === opp) return 900_000;
      }
      return connectNEvaluate(gridFor(next), next, cpuPlayer);
    }) ?? pickRandom(legal)
  );
}
