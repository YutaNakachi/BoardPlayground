/** 15×15 十字型ルドー盤（クラシック盤面準拠） */

export const LUDO_GRID = 15;
export const LUDO_PATH_LEN = 52;
export const LUDO_HOME_LEN = 5;
export const LUDO_TRACK_STEPS = LUDO_PATH_LEN - 1;

export type Coord = { r: number; c: number };

/** 盤面表示用のプレイヤー色インデックス（赤・緑・黄・青） */
export const LUDO_STYLE_INDEX: readonly number[] = [0, 2, 3, 1];

/**
 * プレイヤー配置（画像と同じ：左上から反時計回り）
 * 0=赤・左上 / 1=緑・右上 / 2=黄・右下 / 3=青・左下
 */
export const LUDO_PLAYER_META = [
  { name: "赤", corner: "左上" },
  { name: "緑", corner: "右上" },
  { name: "黄", corner: "右下" },
  { name: "青", corner: "左下" },
] as const;

/** 共有コース 52 マス（青スタートから反時計回り） */
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

/** 各プレイヤーのスタート（コース上のインデックス） */
export const LUDO_ENTRY: readonly number[] = [13, 26, 39, 0];

/** スタートマスの進行方向（矢印表示用） */
export const LUDO_START_ARROW: readonly ("right" | "down" | "left" | "up")[] = [
  "right",
  "down",
  "left",
  "up",
];

/** ゴール列 5 マス（外側=入口 → 内側=ゴール） */
export const LUDO_HOME: readonly Coord[][] = [
  [{ r: 7, c: 1 }, { r: 7, c: 2 }, { r: 7, c: 3 }, { r: 7, c: 4 }, { r: 7, c: 5 }],
  [{ r: 1, c: 7 }, { r: 2, c: 7 }, { r: 3, c: 7 }, { r: 4, c: 7 }, { r: 5, c: 7 }],
  [{ r: 7, c: 13 }, { r: 7, c: 12 }, { r: 7, c: 11 }, { r: 7, c: 10 }, { r: 7, c: 9 }],
  [{ r: 13, c: 7 }, { r: 12, c: 7 }, { r: 11, c: 7 }, { r: 10, c: 7 }, { r: 9, c: 7 }],
];

/** ゴール列入口（外周の矢印マス） */
export const LUDO_HOME_ENTRY: readonly Coord[] = LUDO_HOME.map((home) => home[0]);

/** ゴール列の進行方向 */
export const LUDO_HOME_ARROW: readonly ("right" | "down" | "left" | "up")[] = [
  "right",
  "down",
  "left",
  "up",
];

/** 6×6 コーナー内に 2×2 で中央配置したコマ待機位置 */
export const LUDO_YARD: readonly Coord[][] = [
  [{ r: 2, c: 2 }, { r: 2, c: 3 }, { r: 3, c: 2 }, { r: 3, c: 3 }],
  [{ r: 2, c: 11 }, { r: 2, c: 12 }, { r: 3, c: 11 }, { r: 3, c: 12 }],
  [{ r: 11, c: 11 }, { r: 11, c: 12 }, { r: 12, c: 11 }, { r: 12, c: 12 }],
  [{ r: 11, c: 2 }, { r: 11, c: 3 }, { r: 12, c: 2 }, { r: 12, c: 3 }],
];

/** 6×6 コーナー領域 */
export const LUDO_BASE_REGIONS: readonly {
  player: number;
  rows: [number, number];
  cols: [number, number];
}[] = [
  { player: 0, rows: [0, 5], cols: [0, 5] },
  { player: 1, rows: [0, 5], cols: [9, 14] },
  { player: 2, rows: [9, 14], cols: [9, 14] },
  { player: 3, rows: [9, 14], cols: [0, 5] },
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

export const LUDO_START: readonly Coord[] = LUDO_ENTRY.map((i) => LUDO_PATH[i]);

export function ludoStartCoord(player: number): Coord {
  return LUDO_PATH[LUDO_ENTRY[player]];
}

/** 十字の先端1列（表示不要・3マス×4方向） */
export function isLudoArmTip(r: number, c: number): boolean {
  if (r === 0 && c >= 6 && c <= 8) return true;
  if (r === 14 && c >= 6 && c <= 8) return true;
  if (c === 0 && r >= 6 && r <= 8) return true;
  if (c === 14 && r >= 6 && r <= 8) return true;
  return false;
}
