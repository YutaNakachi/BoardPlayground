import {
  connectNEvaluate,
  connectNWinner,
  minimaxConnectN,
} from "@/lib/play/cpu/connect-n";
import { chooseScoredMove } from "@/lib/play/cpu/difficulty";
import { pickRandom } from "@/lib/play/cpu/random";
import type { CpuDifficulty } from "@/lib/play/cpu/types";
import {
  dropGravityFour,
  GF_COLS,
  GF_ROWS,
  GF_WIN,
  gfDropRow,
  gfIndex,
  gfLegalColumns,
  gravityFourBoardFull,
  type Board,
  type Player,
} from "@/lib/play/gravity-four";

function gridFor(board: Board) {
  return {
    cols: GF_COLS,
    rows: GF_ROWS,
    winLength: GF_WIN,
    cell: (row: number, col: number) => board[gfIndex(row, col)],
    setCell: () => [],
  };
}

export function chooseGravityFourMove(
  board: Board,
  current: Player,
  difficulty: CpuDifficulty,
  cpuPlayer: Player
): number | null {
  if (current !== cpuPlayer) return null;
  const legal = gfLegalColumns(board);
  if (legal.length === 0) return null;

  const depth = difficulty === "hard" ? 6 : difficulty === "normal" ? 4 : 2;

  if (difficulty === "hard" || difficulty === "normal") {
    let bestCol: number | null = null;
    let best = -Infinity;
    for (const col of legal) {
      const next = dropGravityFour(board, col, cpuPlayer);
      if (!next) continue;
      const score = minimaxConnectN(
        gridFor(next),
        next,
        depth - 1,
        current === 0 ? 1 : 0,
        cpuPlayer,
        (b) => gfLegalColumns(b),
        (b, c) => dropGravityFour(b, c, current === 0 ? 1 : 0),
        (b) =>
          connectNWinner(gridFor(b), b) !== null || gravityFourBoardFull(b)
      );
      if (score > best) {
        best = score;
        bestCol = col;
      }
    }
    if (bestCol !== null) return bestCol;
  }

  return (
    chooseScoredMove(difficulty, legal, (col) => {
      const next = dropGravityFour(board, col, cpuPlayer);
      if (!next) return -1_000_000;
      const win = connectNWinner(gridFor(next), next);
      if (win === cpuPlayer) return 1_000_000;
      if (win !== null) return -1_000_000;
      const center = Math.floor(GF_COLS / 2);
      let score = connectNEvaluate(gridFor(next), next, cpuPlayer);
      if (col === center) score += 40;
      return score;
    }) ?? pickRandom(legal)
  );
}
