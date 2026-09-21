export const SLIDE_SIZE = 4;
export const SLIDE_CELLS = SLIDE_SIZE * SLIDE_SIZE;

export function solvedSlide(): number[] {
  const board = Array.from({ length: SLIDE_CELLS - 1 }, (_, i) => i + 1);
  board.push(0);
  return board;
}

export function isSlideSolved(board: number[]): boolean {
  return board.every((value, index) => value === (index === SLIDE_CELLS - 1 ? 0 : index + 1));
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

export function isSlideSolvable(board: number[]): boolean {
  if (new Set(board).size !== SLIDE_CELLS) return false;
  const inv = countInversions(board);
  const blankRow = Math.floor(board.indexOf(0) / SLIDE_SIZE);
  const blankFromBottom = SLIDE_SIZE - blankRow;
  // 偶数幅: (逆転数 + 空きマスの下からの行) が奇数なら解ける
  if (SLIDE_SIZE % 2 === 1) return inv % 2 === 0;
  return (inv + blankFromBottom) % 2 === 1;
}

export function shuffledSlide(): number[] {
  let board: number[];
  do {
    board = solvedSlide()
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((item) => item.value);
  } while (!isSlideSolvable(board) || isSlideSolved(board));
  return board;
}

export function slideMove(board: number[], index: number): number[] | null {
  const blank = board.indexOf(0);
  const br = Math.floor(blank / SLIDE_SIZE);
  const bc = blank % SLIDE_SIZE;
  const r = Math.floor(index / SLIDE_SIZE);
  const c = index % SLIDE_SIZE;
  const adjacent =
    (r === br && Math.abs(c - bc) === 1) || (c === bc && Math.abs(r - br) === 1);
  if (!adjacent) return null;
  const next = board.slice();
  next[blank] = next[index];
  next[index] = 0;
  return next;
}
