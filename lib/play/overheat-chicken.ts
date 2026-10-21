/** 縁まで満たした杯。コインが capacity を超えると、その手番の負け。 */

export const CAPACITY_MIN = 5;
export const CAPACITY_MAX = 9;
export const MIN_DROP = 1;
export const MAX_DROP = 3;

export type PlayerId = 0 | 1;

export type OverheatDrop = {
  player: PlayerId;
  count: number;
};

export type OverheatState = {
  fill: number;
  capacity: number;
  current: PlayerId;
  winner: PlayerId | null;
  drops: OverheatDrop[];
};

export type CoinView = {
  player: PlayerId;
  spilled: boolean;
};

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
    winner: null,
    drops: [],
  };
}

export function applyDrop(
  state: OverheatState,
  count: number
): OverheatState | null {
  if (state.winner !== null) return null;
  if (!Number.isInteger(count) || count < MIN_DROP || count > MAX_DROP) {
    return null;
  }
  const fill = state.fill + count;
  const drops = [...state.drops, { player: state.current, count }];
  if (fill > state.capacity) {
    const winner: PlayerId = state.current === 0 ? 1 : 0;
    return { ...state, fill, winner, drops };
  }
  const current: PlayerId = state.current === 0 ? 1 : 0;
  return { ...state, fill, current, drops };
}

export function possibleCapacity(state: OverheatState): {
  min: number;
  max: number;
} {
  if (state.winner !== null) {
    return { min: state.capacity, max: state.capacity };
  }
  return { min: Math.max(CAPACITY_MIN, state.fill), max: CAPACITY_MAX };
}

export function tensionNotice(state: OverheatState): string {
  if (state.winner !== null) return "";
  if (state.fill >= CAPACITY_MAX) return "次は必ず溢れる";
  if (state.fill >= CAPACITY_MIN) {
    const { min, max } = possibleCapacity(state);
    return min === max ? `上限は${min}枚` : `上限は${min}〜${max}枚`;
  }
  const remain = CAPACITY_MIN - state.fill;
  return `あと${remain}枚は確実`;
}

export function coinsOf(state: OverheatState): CoinView[] {
  const coins: CoinView[] = [];
  let index = 0;
  for (const drop of state.drops) {
    for (let i = 0; i < drop.count; i += 1) {
      index += 1;
      coins.push({
        player: drop.player,
        spilled: state.winner !== null && index > state.capacity,
      });
    }
  }
  return coins;
}

/** 溢れたコインの枚数位置（1始まり）。対局中は null。 */
export function overflowCoinNumber(state: OverheatState): number | null {
  if (state.winner === null) return null;
  return state.capacity + 1;
}
