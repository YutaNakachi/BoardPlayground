import type { BinaryPlayer } from "@/lib/play/cpu/types";

export type ConnectNGrid = {
  cols: number;
  rows: number;
  winLength: number;
  cell: (row: number, col: number) => BinaryPlayer | null;
  setCell: (board: number[], row: number, col: number, player: BinaryPlayer) => number[];
};

const DIRS: [number, number][] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

export function connectNWinner(grid: ConnectNGrid, board: readonly (BinaryPlayer | null)[]): BinaryPlayer | null {
  const { cols, rows, winLength } = grid;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const player = grid.cell(row, col);
      if (player === null) continue;
      for (const [dr, dc] of DIRS) {
        const prevR = row - dr;
        const prevC = col - dc;
        if (
          prevR >= 0 &&
          prevR < rows &&
          prevC >= 0 &&
          prevC < cols &&
          grid.cell(prevR, prevC) === player
        ) {
          continue;
        }
        let n = 0;
        let r = row;
        let c = col;
        while (
          r >= 0 &&
          r < rows &&
          c >= 0 &&
          c < cols &&
          grid.cell(r, c) === player
        ) {
          n += 1;
          r += dr;
          c += dc;
        }
        if (n >= winLength) return player;
      }
    }
  }
  return null;
}

export function connectNEvaluate(
  grid: ConnectNGrid,
  board: readonly (BinaryPlayer | null)[],
  player: BinaryPlayer
): number {
  const opp = player === 0 ? 1 : 0;
  let score = 0;
  const { cols, rows, winLength } = grid;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      for (const [dr, dc] of DIRS) {
        let mine = 0;
        let theirs = 0;
        let empty = 0;
        for (let k = 0; k < winLength; k++) {
          const r = row + dr * k;
          const c = col + dc * k;
          if (r < 0 || r >= rows || c < 0 || c >= cols) break;
          const cell = grid.cell(r, c);
          if (cell === player) mine += 1;
          else if (cell === opp) theirs += 1;
          else empty += 1;
        }
        if (mine > 0 && theirs > 0) continue;
        if (mine === winLength) score += 500_000;
        else if (mine === winLength - 1 && empty > 0) score += 8_000;
        else if (mine === winLength - 2 && empty > 1) score += 400;
        else if (mine > 0) score += mine * mine * 12;
        if (theirs === winLength - 1 && empty > 0) score -= 7_000;
      }
    }
  }

  if (cols % 2 === 1) {
    for (let row = rows - 1; row >= 0; row--) {
      const mid = Math.floor(cols / 2);
      const cell = grid.cell(row, mid);
      if (cell === player) score += 18;
      else if (cell === opp) score -= 10;
    }
  }

  return score;
}

export function minimaxConnectN<TMove>(
  grid: ConnectNGrid,
  board: (BinaryPlayer | null)[],
  depth: number,
  maximizing: BinaryPlayer,
  perspective: BinaryPlayer,
  legalMoves: (board: (BinaryPlayer | null)[]) => TMove[],
  applyMove: (board: (BinaryPlayer | null)[], move: TMove) => (BinaryPlayer | null)[] | null,
  isTerminal: (board: (BinaryPlayer | null)[]) => boolean
): number {
  const winner = connectNWinner(grid, board);
  if (winner !== null) {
    return winner === perspective ? 1_000_000 : -1_000_000;
  }
  if (depth === 0 || isTerminal(board)) {
    return connectNEvaluate(grid, board, perspective);
  }

  const moves = legalMoves(board);
  if (moves.length === 0) {
    return connectNEvaluate(grid, board, perspective);
  }

  const nextPlayer = maximizing === 0 ? 1 : 0;
  if (maximizing === perspective) {
    let best = -Infinity;
    for (const move of moves) {
      const next = applyMove(board, move);
      if (!next) continue;
      best = Math.max(
        best,
        minimaxConnectN(
          grid,
          next,
          depth - 1,
          nextPlayer,
          perspective,
          legalMoves,
          applyMove,
          isTerminal
        )
      );
    }
    return best;
  }

  let best = Infinity;
  for (const move of moves) {
    const next = applyMove(board, move);
    if (!next) continue;
    best = Math.min(
      best,
      minimaxConnectN(
        grid,
        next,
        depth - 1,
        nextPlayer,
        perspective,
        legalMoves,
        applyMove,
        isTerminal
      )
    );
  }
  return best;
}
