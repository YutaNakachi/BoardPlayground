import { shuffle, winnerIndices } from "@/lib/game-engine";

export type Era = "past" | "present" | "future";

export type Fragment = {
  id: string;
  era: Era;
  value: number;
};

export const CHRONO_SLOTS = 5;
const ERAS: Era[] = ["past", "present", "future"];

export type ChronoSplitState = {
  playerCount: number;
  currentPlayer: number;
  deck: Fragment[];
  offer: Fragment[];
  timelines: (Fragment | null)[][];
  gameOver: boolean;
};

export function createChronoDeck(): Fragment[] {
  const deck: Fragment[] = [];
  let n = 0;
  for (const era of ERAS) {
    for (let value = 1; value <= 4; value++) {
      for (let copy = 0; copy < 2; copy++) {
        deck.push({ id: `${era}-${value}-${copy}-${n++}`, era, value });
      }
    }
  }
  return shuffle(deck);
}

export function scoreChronoTimeline(line: (Fragment | null)[]) {
  const cards = line.filter((c): c is Fragment => c !== null);
  const base = cards.reduce((s, c) => s + c.value, 0);
  let adjacent = 0;
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i];
    const b = line[i + 1];
    if (a && b && a.era === b.era) adjacent += 2;
  }
  const eras = new Set(cards.map((c) => c.era)).size;
  const eraBonus = eras === 3 ? 3 : 0;
  let increasing = cards.length === CHRONO_SLOTS;
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i];
    const b = line[i + 1];
    if (!a || !b || a.value >= b.value) increasing = false;
  }
  const increaseBonus = increasing ? 7 : 0;
  return {
    total: base + adjacent + eraBonus + increaseBonus,
    base,
    adjacent,
    eraBonus,
    increaseBonus,
  };
}

export function initialChronoSplit(playerCount: number, deck = createChronoDeck()): ChronoSplitState {
  const d = [...deck];
  const offer = [d.pop()!, d.pop()!, d.pop()!];
  return {
    playerCount,
    currentPlayer: 0,
    deck: d,
    offer,
    timelines: Array.from({ length: playerCount }, () =>
      Array<Fragment | null>(CHRONO_SLOTS).fill(null)
    ),
    gameOver: false,
  };
}

export function applyChronoTake(
  state: ChronoSplitState,
  cardId: string,
  slotIndex: number
): ChronoSplitState | null {
  if (state.gameOver) return null;
  if (slotIndex < 0 || slotIndex >= CHRONO_SLOTS) return null;

  const line = state.timelines[state.currentPlayer];
  if (line[slotIndex] !== null) return null;
  const card = state.offer.find((c) => c.id === cardId);
  if (!card) return null;

  const nextOffer = state.offer.filter((c) => c.id !== cardId);
  const nextDeck = [...state.deck];
  if (nextDeck.length > 0 && nextOffer.length < 3) {
    nextOffer.push(nextDeck.pop()!);
  }

  const timelines = state.timelines.map((row, i) =>
    i === state.currentPlayer ? row.map((c, s) => (s === slotIndex ? card : c)) : row
  );

  if (timelines.every((row) => row.every((c) => c !== null))) {
    return {
      ...state,
      deck: nextDeck,
      offer: nextOffer,
      timelines,
      gameOver: true,
    };
  }

  return {
    ...state,
    deck: nextDeck,
    offer: nextOffer,
    timelines,
    currentPlayer: (state.currentPlayer + 1) % state.playerCount,
  };
}

export function chronoWinners(state: ChronoSplitState): number[] {
  const scores = state.timelines.map((line) => scoreChronoTimeline(line).total);
  return winnerIndices(scores);
}
