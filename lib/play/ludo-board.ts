/** 15×15 十字型ルドー盤の座標定義 */

export const LUDO_GRID = 15;
export const LUDO_PATH_LEN = 52;
export const LUDO_HOME_LEN = 4;
export const LUDO_TRACK_STEPS = 51; // entry(0) からゴール列入口まで

export type Coord = { r: number; c: number };

/** 共有コース 52 マス（プレイヤー0のスタートから反時計回り） */
const RAW_PATH: readonly [number, number][] = [
  [6, 13], [6, 12], [6, 11], [6, 10], [6, 9],
  [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  [0, 7], [0, 6],
  [1, 6], [2, 6], [3, 6], [4, 6], [5, 6],
  [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0],
  [7, 0], [8, 0],
  [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
  [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
  [14, 7], [14, 8],
  [13, 8], [12, 8], [11, 8], [10, 8], [9, 8],
  [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14],
  [7, 14], [6, 14],
];

export const LUDO_PATH: readonly Coord[] = RAW_PATH.map(([c, r]) => ({ r, c }));

/** 各プレイヤーのスタートマス（コース上のインデックス） */
export const LUDO_ENTRY: readonly number[] = [0, 13, 26, 39];

/** ゴール列 4 マス（内側が最終ゴール） */
export const LUDO_HOME: readonly Coord[][] = [
  [{ r: 12, c: 7 }, { r: 11, c: 7 }, { r: 10, c: 7 }, { r: 9, c: 7 }],
  [{ r: 7, c: 12 }, { r: 7, c: 11 }, { r: 7, c: 10 }, { r: 7, c: 9 }],
  [{ r: 1, c: 7 }, { r: 2, c: 7 }, { r: 3, c: 7 }, { r: 4, c: 7 }],
  [{ r: 7, c: 1 }, { r: 7, c: 2 }, { r: 7, c: 3 }, { r: 7, c: 4 }],
];

/** コマ置き場（ヤード）の 4 スロット */
export const LUDO_YARD: readonly Coord[][] = [
  [{ r: 10, c: 1 }, { r: 10, c: 2 }, { r: 11, c: 1 }, { r: 11, c: 2 }],
  [{ r: 1, c: 1 }, { r: 1, c: 2 }, { r: 2, c: 1 }, { r: 2, c: 2 }],
  [{ r: 1, c: 12 }, { r: 1, c: 13 }, { r: 2, c: 12 }, { r: 2, c: 13 }],
  [{ r: 10, c: 12 }, { r: 10, c: 13 }, { r: 11, c: 12 }, { r: 11, c: 13 }],
];

export function ludoActivePlayers(count: number): number[] {
  if (count === 2) return [0, 2];
  if (count === 3) return [0, 1, 2];
  return [0, 1, 2, 3];
}

export function coordKey({ r, c }: Coord): string {
  return `${r},${c}`;
}

export function pathIndexForSteps(player: number, steps: number): number {
  return (LUDO_ENTRY[player] + steps) % LUDO_PATH_LEN;
}

export function trackCoord(player: number, steps: number): Coord {
  return LUDO_PATH[pathIndexForSteps(player, steps)];
}

export function isStartPathIndex(pathIndex: number): boolean {
  return LUDO_ENTRY.includes(pathIndex);
}
