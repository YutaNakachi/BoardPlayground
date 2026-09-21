export const SLIDE_SIZE_OPTIONS = [3, 4, 5, 6] as const;
export type SlideSize = (typeof SLIDE_SIZE_OPTIONS)[number];

/** @deprecated Use size parameter; default 4×4 */
export const SLIDE_SIZE = 4;

export function slideCells(size: SlideSize): number {
  return size * size;
}

export function solvedSlide(size: SlideSize = SLIDE_SIZE): number[] {
  const cells = slideCells(size);
  const board = Array.from({ length: cells - 1 }, (_, i) => i + 1);
  board.push(0);
  return board;
}

export function isSlideSolved(board: number[], size: SlideSize = SLIDE_SIZE): boolean {
  const cells = slideCells(size);
  if (board.length !== cells) return false;
  return board.every((value, index) => value === (index === cells - 1 ? 0 : index + 1));
}

function countInversions(board: number[]): number {
  const values = board.filter((v) => v !== 0);
  let inv = 0;
  for (let i = 0; i < values.length; i++) {
    for (let j = i + 1; j < values.length; j++) {
      if (values[i] > values[j]) inv += 1;
    }
  }
  return inv;
}

export function isSlideSolvable(board: number[], size: SlideSize = SLIDE_SIZE): boolean {
  const cells = slideCells(size);
  if (board.length !== cells || new Set(board).size !== cells) return false;
  const inv = countInversions(board);
  const blankRow = Math.floor(board.indexOf(0) / size);
  const blankFromBottom = size - blankRow;
  // 奇数幅: 逆転数が偶数 / 偶数幅: (逆転数 + 空きの下からの行) が奇数
  if (size % 2 === 1) return inv % 2 === 0;
  return (inv + blankFromBottom) % 2 === 1;
}

export function shuffledSlide(size: SlideSize = SLIDE_SIZE): number[] {
  let board: number[];
  do {
    board = solvedSlide(size)
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((item) => item.value);
  } while (!isSlideSolvable(board, size) || isSlideSolved(board, size));
  return board;
}

export function slideMove(
  board: number[],
  index: number,
  size: SlideSize = SLIDE_SIZE
): number[] | null {
  const blank = board.indexOf(0);
  const br = Math.floor(blank / size);
  const bc = blank % size;
  const r = Math.floor(index / size);
  const c = index % size;
  const adjacent =
    (r === br && Math.abs(c - bc) === 1) || (c === bc && Math.abs(r - br) === 1);
  if (!adjacent) return null;
  const next = board.slice();
  next[blank] = next[index];
  next[index] = 0;
  return next;
}
