import { connectNEvaluate, connectNWinner } from "@/lib/play/cpu/connect-n";
import { chooseScoredMove } from "@/lib/play/cpu/difficulty";
import { pickRandom } from "@/lib/play/cpu/random";
import type { CpuDifficulty } from "@/lib/play/cpu/types";
import {
  applyTttPlace,
  tttBoardFull,
  TTT_CELLS,
  TTT_SIZE,
  TTT_WIN,
  type Board,
  type Player,
  type TttHistories,
  type TttMode,
} from "@/lib/play/tic-tac-toe";

export type TttCpuSnapshot = {
  board: Board;
  histories: TttHistories;
  current: Player;
  mode: TttMode;
};

function gridFor(board: Board) {
  return {
    cols: TTT_SIZE,
    rows: TTT_SIZE,
    winLength: TTT_WIN,
    cell: (row: number, col: number) => board[row * TTT_SIZE + col],
    setCell: () => [],
  };
}

function legalCells(board: Board): number[] {
  const moves: number[] = [];
  for (let i = 0; i < TTT_CELLS; i++) {
    if (board[i] === null) moves.push(i);
  }
  return moves;
}

function solveTtt(
  board: Board,
  histories: TttHistories,
  current: Player,
  mode: TttMode,
  perspective: Player
): number {
  const winner = connectNWinner(gridFor(board), board);
  if (winner === perspective) return 1_000_000;
  if (winner !== null) return -1_000_000;
  if (mode === "classic" && tttBoardFull(board)) return 0;

  const moves = legalCells(board);
  if (moves.length === 0) return 0;

  if (current === perspective) {
    let best = -Infinity;
    for (const index of moves) {
      const placed = applyTttPlace(board, histories, index, current, mode);
      if (!placed) continue;
      const val = solveTtt(
        placed.board,
        placed.histories,
        current === 0 ? 1 : 0,
        mode,
        perspective
      );
      best = Math.max(best, val);
    }
    return best;
  }

  let best = Infinity;
  for (const index of moves) {
    const placed = applyTttPlace(board, histories, index, current, mode);
    if (!placed) continue;
    const val = solveTtt(
      placed.board,
      placed.histories,
      current === 0 ? 1 : 0,
      mode,
      perspective
    );
    best = Math.min(best, val);
  }
  return best;
}

export function chooseTttMove(
  snapshot: TttCpuSnapshot,
  difficulty: CpuDifficulty,
  cpuPlayer: Player
): number | null {
  if (snapshot.current !== cpuPlayer) return null;
  const legal = legalCells(snapshot.board);
  if (legal.length === 0) return null;

  if (difficulty === "hard" && snapshot.mode === "classic") {
    let bestIndex: number | null = null;
    let best = -Infinity;
    for (const index of legal) {
      const placed = applyTttPlace(
        snapshot.board,
        snapshot.histories,
        index,
        cpuPlayer,
        snapshot.mode
      );
      if (!placed) continue;
      const score = solveTtt(
        placed.board,
        placed.histories,
        cpuPlayer === 0 ? 1 : 0,
        snapshot.mode,
        cpuPlayer
      );
      if (score > best) {
        best = score;
        bestIndex = index;
      }
    }
    return bestIndex;
  }

  return (
    chooseScoredMove(difficulty, legal, (index) => {
      const placed = applyTttPlace(
        snapshot.board,
        snapshot.histories,
        index,
        cpuPlayer,
        snapshot.mode
      );
      if (!placed) return -1_000_000;
      const win = connectNWinner(gridFor(placed.board), placed.board);
      if (win === cpuPlayer) return 1_000_000;
      if (win !== null) return -1_000_000;
      if (snapshot.mode === "classic" && tttBoardFull(placed.board)) return 0;
      return connectNEvaluate(gridFor(placed.board), placed.board, cpuPlayer);
    }) ?? pickRandom(legal)
  );
}
