import { pickRandom } from "@/lib/play/cpu/random";
import type { CpuDifficulty } from "@/lib/play/cpu/types";
import { nimOver, nimXor, takeNim, type Player } from "@/lib/play/nim";

export type NimCpuMove = { heapIndex: number; count: number };

function legalNimMoves(heaps: number[]): NimCpuMove[] {
  const moves: NimCpuMove[] = [];
  for (let h = 0; h < heaps.length; h++) {
    for (let c = 1; c <= heaps[h]; c++) {
      moves.push({ heapIndex: h, count: c });
    }
  }
  return moves;
}

function optimalNimMove(heaps: number[]): NimCpuMove | null {
  const xor = nimXor(heaps);
  if (xor === 0) return null;
  for (let h = 0; h < heaps.length; h++) {
    const target = heaps[h] ^ xor;
    if (target < heaps[h]) {
      return { heapIndex: h, count: heaps[h] - target };
    }
  }
  return null;
}

export function chooseNimMove(
  heaps: number[],
  current: Player,
  difficulty: CpuDifficulty,
  cpuPlayer: Player
): NimCpuMove | null {
  if (current !== cpuPlayer || nimOver(heaps)) return null;
  const legal = legalNimMoves(heaps);
  if (legal.length === 0) return null;

  const optimal = optimalNimMove(heaps);

  if (difficulty === "easy") {
    if (optimal && Math.random() < 0.35) return optimal;
    return pickRandom(legal);
  }

  if (difficulty === "normal") {
    if (optimal && Math.random() < 0.85) return optimal;
    return pickRandom(legal);
  }

  return optimal ?? pickRandom(legal);
}
