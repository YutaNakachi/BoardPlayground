export type Player = 0 | 1;

/** 0-5: P1 穴, 6: P1 倉, 7-12: P2 穴, 13: P2 倉 */
export const MANCALA_SLOTS = 14;
export const MANCALA_SEEDS = 4;

export function mancalaStore(player: Player): number {
  return player === 0 ? 6 : 13;
}

export function isMancalaPit(player: Player, index: number): boolean {
  return player === 0 ? index >= 0 && index <= 5 : index >= 7 && index <= 12;
}

export function mancalaOpposite(index: number): number {
  return 12 - index;
}

export function initialMancala(): number[] {
  const pits = Array(MANCALA_SLOTS).fill(0);
  for (let i = 0; i < 6; i++) pits[i] = MANCALA_SEEDS;
  for (let i = 7; i < 13; i++) pits[i] = MANCALA_SEEDS;
  return pits;
}

export function mancalaSideEmpty(pits: number[], player: Player): boolean {
  const start = player === 0 ? 0 : 7;
  for (let i = start; i < start + 6; i++) {
    if (pits[i] > 0) return false;
  }
  return true;
}

export function collectMancalaRemainder(pits: number[]): number[] {
  const next = pits.slice();
  for (let i = 0; i < 6; i++) {
    next[6] += next[i];
    next[i] = 0;
  }
  for (let i = 7; i < 13; i++) {
    next[13] += next[i];
    next[i] = 0;
  }
  return next;
}

export function finishMancalaIfSideEmpty(pits: number[]): number[] {
  if (mancalaSideEmpty(pits, 0) || mancalaSideEmpty(pits, 1)) {
    return collectMancalaRemainder(pits);
  }
  return pits;
}

export function mancalaOver(pits: number[]): boolean {
  return mancalaSideEmpty(pits, 0) || mancalaSideEmpty(pits, 1);
}

export type MancalaSow = {
  pits: number[];
  extraTurn: boolean;
  captured: boolean;
  over: boolean;
};

export function sowMancala(
  pits: number[],
  player: Player,
  pit: number
): MancalaSow | null {
  if (!isMancalaPit(player, pit) || pits[pit] <= 0) return null;

  const next = pits.slice();
  let stones = next[pit];
  next[pit] = 0;
  let index = pit;
  const ownStore = mancalaStore(player);
  const oppStore = mancalaStore(player === 0 ? 1 : 0);

  while (stones > 0) {
    index = (index + 1) % MANCALA_SLOTS;
    if (index === oppStore) continue;
    next[index] += 1;
    stones -= 1;
  }

  let captured = false;
  let extraTurn = index === ownStore;

  if (!extraTurn && isMancalaPit(player, index) && next[index] === 1) {
    const opp = mancalaOpposite(index);
    if (next[opp] > 0) {
      next[ownStore] += next[index] + next[opp];
      next[index] = 0;
      next[opp] = 0;
      captured = true;
    }
  }

  const finished = finishMancalaIfSideEmpty(next);
  const over = mancalaOver(finished);
  if (over) extraTurn = false;

  return { pits: finished, extraTurn, captured, over };
}
