/** 13×13 十字型ルドー盤（どようび堂の木製盤面準拠） */

export const LUDO_GRID = 13;
export const LUDO_PATH_LEN = 44;
export const LUDO_HOME_LEN = 4;
export const LUDO_TRACK_STEPS = LUDO_PATH_LEN - 1;

export type Coord = { r: number; c: number };

/**
 * プレイヤーと色（サイト表示色との対応）
 * 0=赤・左下 / 1=青・左上 / 2=緑・右下 / 3=黄・右上
 */
export const LUDO_PLAYER_META = [
  { name: "赤", corner: "左下" },
  { name: "青", corner: "左上" },
  { name: "緑", corner: "右下" },
  { name: "黄", corner: "右上" },
] as const;

/** 共有コース 44 マス（赤スタートから反時計回り） */
const RAW_PATH: readonly [number, number][] = [
  [5, 12], [5, 11], [5, 10], [5, 9], [5, 8],
  [4, 7], [3, 7], [2, 7], [1, 7], [0, 7],
  [0, 6], [0, 5],
  [1, 5], [2, 5], [3, 5], [4, 5],
  [5, 4], [5, 3], [5, 2], [5, 1], [5, 0],
  [6, 0], [7, 0],
  [7, 1], [7, 2], [7, 3], [7, 4],
  [8, 5], [9, 5], [10, 5], [11, 5], [12, 5],
  [12, 6], [12, 7],
  [11, 7], [10, 7], [9, 7], [8, 7],
  [7, 8], [7, 9], [7, 10], [7, 11], [7, 12],
  [6, 12],
];

export const LUDO_PATH: readonly Coord[] = RAW_PATH.map(([c, r]) => ({ r, c }));

/** 各プレイヤーのスタート（コース上のインデックス） */
export const LUDO_ENTRY: readonly number[] = [0, 11, 33, 22];

/** ゴール列 4 マス（外側=入口 → 内側=★ゴール） */
export const LUDO_HOME: readonly Coord[][] = [
  [{ r: 11, c: 6 }, { r: 10, c: 6 }, { r: 9, c: 6 }, { r: 8, c: 6 }],
  [{ r: 6, c: 8 }, { r: 6, c: 9 }, { r: 6, c: 10 }, { r: 6, c: 11 }],
  [{ r: 6, c: 3 }, { r: 6, c: 2 }, { r: 6, c: 1 }, { r: 6, c: 0 }],
  [{ r: 3, c: 6 }, { r: 2, c: 6 }, { r: 1, c: 6 }, { r: 0, c: 6 }],
];

/** 5×5 コーナー内に 2×2 で中央配置したコマ待機位置 */
export const LUDO_YARD: readonly Coord[][] = [
  [{ r: 10, c: 1 }, { r: 10, c: 2 }, { r: 11, c: 1 }, { r: 11, c: 2 }],
  [{ r: 1, c: 1 }, { r: 1, c: 2 }, { r: 2, c: 1 }, { r: 2, c: 2 }],
  [{ r: 10, c: 9 }, { r: 10, c: 10 }, { r: 11, c: 9 }, { r: 11, c: 10 }],
  [{ r: 1, c: 9 }, { r: 1, c: 10 }, { r: 2, c: 9 }, { r: 2, c: 10 }],
];

export function ludoActivePlayers(count: number): number[] {
  if (count === 2) return [0, 3];
  if (count === 3) return [0, 1, 3];
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

export const LUDO_START: readonly Coord[] = LUDO_ENTRY.map((i) => LUDO_PATH[i]);

export function ludoStartCoord(player: number): Coord {
  return LUDO_PATH[LUDO_ENTRY[player]];
}
