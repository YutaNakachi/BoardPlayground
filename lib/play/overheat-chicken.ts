/** 縁まで満たした杯。水位が capacity を超えると、そのチップを入れた人の負け。 */

export const CAPACITY_MIN = 15;
export const CAPACITY_MAX = 20;
export const MAX_CHIPS_PER_TURN = 3;

export const CHIP_SIZES = ["s", "m", "l"] as const;
export type ChipSize = (typeof CHIP_SIZES)[number];

/** 水位の上がり。小 0.5、中 1、大 1.5。 */
export const CHIP_RISE: Record<ChipSize, number> = {
  s: 0.5,
  m: 1,
  l: 1.5,
};

export const CHIP_LABEL: Record<ChipSize, string> = {
  s: "小",
  m: "中",
  l: "大",
};

export type PlayerId = 0 | 1;

export type OverheatChip = {
  player: PlayerId;
  size: ChipSize;
};

/** 水位とは別に、この対局だけのドームの見え方。 */
export type OverheatVisual = {
  /** 全体の伸び。同じ水位でも対局ごとに高さが変わる。 */
  scale: number;
  /** 半ステップごとのばらつきの種。 */
  seed: number;
  /** この高さ（viewBox）を超えたら揺れ始める。水位の決まった地点ではない。 */
  wobbleAt: number;
};

export type OverheatState = {
  fill: number;
  capacity: number;
  current: PlayerId;
  /** この手番で入れた枚数。手番を終えると 0 に戻る。 */
  placed: number;
  winner: PlayerId | null;
  chips: OverheatChip[];
  visual: OverheatVisual;
};

/** あとの半ステップほど見た目の増分が小さい。長い対局でも枠の上を空けすぎない。 */
const DOME_UNIT = 4;

function unit(seed: number, index: number): number {
  let n = Math.imul(Math.floor(seed * 997) + 1, 374761393) + Math.imul(index + 1, 668265263);
  n = (n ^ (n >>> 13)) >>> 0;
  n = Math.imul(n, 1274126177);
  n = (n ^ (n >>> 16)) >>> 0;
  return n / 4294967296;
}

export function rollVisual(random: () => number = Math.random): OverheatVisual {
  return {
    scale: 0.72 + random() * 0.5,
    seed: random() * 1000,
    wobbleAt: 18 + random() * 48,
  };
}

/**
 * ドームの縦半径。水位が上がれば必ず高くなるが、
 * 対局の scale と半ステップごとのばらつきで、高さから水位は逆算できない。
 */
export function domeRise(state: OverheatState): number {
  if (state.winner !== null) return 0;
  const steps = Math.round(state.fill * 2);
  let rise = 0;
  for (let i = 0; i < steps; i += 1) {
    const jitter = 0.82 + unit(state.visual.seed, i) * 0.36;
    const fade = Math.exp(-i * 0.028);
    rise += DOME_UNIT * state.visual.scale * jitter * fade;
  }
  return rise;
}

function snap(value: number): number {
  return Math.round(value * 2) / 2;
}

function other(player: PlayerId): PlayerId {
  return player === 0 ? 1 : 0;
}

export function isChipSize(value: string): value is ChipSize {
  return (CHIP_SIZES as readonly string[]).includes(value);
}

export function randomCapacity(random: () => number = Math.random): number {
  const span = CAPACITY_MAX - CAPACITY_MIN + 1;
  return CAPACITY_MIN + Math.floor(random() * span);
}

export function createOverheat(
  first: PlayerId = 0,
  options?: { capacity?: number; random?: () => number }
): OverheatState {
  const random = options?.random ?? Math.random;
  const capacity =
    options?.capacity === undefined ? randomCapacity(random) : options.capacity;
  if (
    !Number.isInteger(capacity) ||
    capacity < CAPACITY_MIN ||
    capacity > CAPACITY_MAX
  ) {
    throw new Error(
      `capacity must be an integer from ${CAPACITY_MIN} to ${CAPACITY_MAX}`
    );
  }
  return {
    fill: 0,
    capacity,
    current: first,
    placed: 0,
    winner: null,
    chips: [],
    visual: rollVisual(random),
  };
}

export function placeChip(
  state: OverheatState,
  size: ChipSize
): OverheatState | null {
  if (state.winner !== null) return null;
  if (state.placed >= MAX_CHIPS_PER_TURN) return null;
  if (!isChipSize(size)) return null;
  const fill = snap(state.fill + CHIP_RISE[size]);
  const chips = [...state.chips, { player: state.current, size }];
  const placed = state.placed + 1;
  if (fill > state.capacity) {
    return { ...state, fill, chips, placed, winner: other(state.current) };
  }
  return { ...state, fill, chips, placed };
}

/** 1枚以上入れたあと、相手に手番を渡す。3枚入れても自動では渡さない。 */
export function endTurn(state: OverheatState): OverheatState | null {
  if (state.winner !== null) return null;
  if (state.placed < 1) return null;
  return { ...state, placed: 0, current: other(state.current) };
}

/** 画面に出す文言。水位や上限の数字は含めない。 */
export function tensionNotice(state: OverheatState): string {
  if (state.winner !== null) return "";
  if (snap(state.fill + CHIP_RISE.s) > CAPACITY_MAX) return "次は必ず溢れる";
  return "";
}
