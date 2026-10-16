import { chooseScoredMove } from "@/lib/play/cpu/difficulty";
import { pickRandom } from "@/lib/play/cpu/random";
import type { CpuDifficulty } from "@/lib/play/cpu/types";
import {
  declineHexSwap,
  HEX_SIZE,
  hexIndex,
  hexNeighborIndices,
  hexWinner,
  placeHexStone,
  stoneForPlayer,
  type HexState,
  type Player,
} from "@/lib/play/hex";

function legalCells(state: HexState): number[] {
  const cells: number[] = [];
  for (let i = 0; i < state.board.length; i++) {
    if (state.board[i] === null) cells.push(i);
  }
  if (cells.length <= 30) return cells;
  const near: number[] = [];
  for (const index of cells) {
    for (const n of hexNeighborIndices(index)) {
      if (state.board[n] !== null) {
        near.push(index);
        break;
      }
    }
  }
  return near.length > 0 ? near : cells.slice(0, 20);
}

function connectionScore(state: HexState, player: Player): number {
  const stone = stoneForPlayer(state, player);
  const targetRow = player === 0 ? 0 : HEX_SIZE - 1;
  let best = 999;
  for (let col = 0; col < HEX_SIZE; col++) {
    const top = hexIndex(0, col);
    const bottom = hexIndex(HEX_SIZE - 1, col);
    if (state.board[top] === stone || state.board[bottom] === stone) {
      best = Math.min(best, player === 0 ? 0 : 0);
    }
  }
  for (let i = 0; i < state.board.length; i++) {
    if (state.board[i] !== stone) continue;
    const row = Math.floor(i / HEX_SIZE);
    const dist = player === 0 ? row : HEX_SIZE - 1 - row;
    best = Math.min(best, dist);
  }
  return (HEX_SIZE - best) * 40;
}

export function chooseHexMove(
  state: HexState,
  difficulty: CpuDifficulty,
  cpuPlayer: Player
): number | "decline-swap" | null {
  if (state.current !== cpuPlayer) return null;

  if (state.swapPending && cpuPlayer === 1) {
    return "decline-swap";
  }

  const legal = legalCells(state);
  if (legal.length === 0) return null;

  if (state.board.every((c) => c === null)) {
    const center = hexIndex(Math.floor(HEX_SIZE / 2), Math.floor(HEX_SIZE / 2));
    return center;
  }

  return (
    chooseScoredMove(difficulty, legal, (index) => {
      const placed = placeHexStone(state, index);
      if (!placed) return -1_000_000;
      const win = hexWinner(placed.next.board);
      if (win && placed.next.playerStone[cpuPlayer] === win) return 1_000_000;
      return connectionScore(placed.next, cpuPlayer);
    }) ?? pickRandom(legal)
  );
}

export function applyHexCpuChoice(state: HexState, choice: number | "decline-swap"): HexState | null {
  if (choice === "decline-swap") {
    return declineHexSwap(state);
  }
  const placed = placeHexStone(state, choice);
  return placed?.next ?? null;
}
