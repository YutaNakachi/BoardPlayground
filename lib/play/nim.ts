export type Player = 0 | 1;

export const NIM_HEAPS = [3, 5, 7];

export function initialNim(): number[] {
  return [...NIM_HEAPS];
}

export function nimTotal(heaps: number[]): number {
  return heaps.reduce((sum, n) => sum + n, 0);
}

export function nimXor(heaps: number[]): number {
  return heaps.reduce((x, n) => x ^ n, 0);
}

export function takeNim(
  heaps: number[],
  heapIndex: number,
  count: number
): number[] | null {
  if (heapIndex < 0 || heapIndex >= heaps.length) return null;
  if (count < 1 || count > heaps[heapIndex]) return null;
  const next = heaps.slice();
  next[heapIndex] -= count;
  return next;
}

export function nimOver(heaps: number[]): boolean {
  return nimTotal(heaps) === 0;
}
