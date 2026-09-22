import {
  canPlaceKlondikeFoundation,
  canPlaceKlondikeTableau,
  createDeck,
  type PlayingCard,
  type Suit,
} from "@/lib/play/cards";

export type TableauCard = {
  card: PlayingCard;
  faceUp: boolean;
};

export type KlondikeState = {
  tableau: TableauCard[][];
  foundations: Record<Suit, PlayingCard[]>;
  stock: PlayingCard[];
  waste: PlayingCard[];
};

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];

export function initialKlondike(): KlondikeState {
  const deck = createDeck(1);
  const tableau: TableauCard[][] = Array.from({ length: 7 }, () => []);
  let i = 0;
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = deck[i++];
      tableau[col].push({ card, faceUp: row === col });
    }
  }
  return {
    tableau,
    foundations: { spade: [], heart: [], diamond: [], club: [] },
    stock: deck.slice(i),
    waste: [],
  };
}

export function klondikeWon(state: KlondikeState): boolean {
  return SUITS.every((suit) => state.foundations[suit].length === 13);
}

export function drawKlondike(state: KlondikeState): KlondikeState {
  if (state.stock.length === 0) {
    if (state.waste.length === 0) return state;
    return { ...state, stock: [...state.waste].reverse(), waste: [] };
  }
  const card = state.stock[state.stock.length - 1];
  return {
    ...state,
    stock: state.stock.slice(0, -1),
    waste: [...state.waste, card],
  };
}

function isValidTableauRun(cards: TableauCard[]): boolean {
  for (let i = 0; i < cards.length - 1; i++) {
    if (!cards[i].faceUp || !cards[i + 1].faceUp) return false;
    if (!canPlaceKlondikeTableau(cards[i].card, cards[i + 1].card)) return false;
  }
  return true;
}

export type KlondikeSource =
  | { kind: "waste" }
  | { kind: "tableau"; col: number; from: number }
  | { kind: "foundation"; suit: Suit };

export type KlondikeTarget =
  | { kind: "foundation"; suit: Suit }
  | { kind: "tableau"; col: number };

export function canMoveKlondike(
  state: KlondikeState,
  source: KlondikeSource,
  target: KlondikeTarget
): boolean {
  const moving = getMovingCards(state, source);
  if (moving.length === 0) return false;
  const top = moving[0].card;

  if (target.kind === "foundation") {
    if (moving.length !== 1) return false;
    const pile = state.foundations[target.suit];
    const current = pile.length ? pile[pile.length - 1] : null;
    return canPlaceKlondikeFoundation(current, top);
  }

  const col = state.tableau[target.col];
  const dest = col.length ? col[col.length - 1].card : null;
  return canPlaceKlondikeTableau(dest, top);
}

function getMovingCards(state: KlondikeState, source: KlondikeSource): TableauCard[] {
  if (source.kind === "waste") {
    if (!state.waste.length) return [];
    return [{ card: state.waste[state.waste.length - 1], faceUp: true }];
  }
  if (source.kind === "foundation") {
    const pile = state.foundations[source.suit];
    if (!pile.length) return [];
    return [{ card: pile[pile.length - 1], faceUp: true }];
  }
  const col = state.tableau[source.col];
  const run = col.slice(source.from);
  if (!run.length || !run[0].faceUp) return [];
  if (!isValidTableauRun(run)) return [];
  return run;
}

export function applyKlondikeMove(
  state: KlondikeState,
  source: KlondikeSource,
  target: KlondikeTarget
): KlondikeState | null {
  if (!canMoveKlondike(state, source, target)) return null;
  const moving = getMovingCards(state, source);
  const next: KlondikeState = {
    tableau: state.tableau.map((c) => [...c]),
    foundations: {
      spade: [...state.foundations.spade],
      heart: [...state.foundations.heart],
      diamond: [...state.foundations.diamond],
      club: [...state.foundations.club],
    },
    stock: [...state.stock],
    waste: [...state.waste],
  };

  if (source.kind === "waste") next.waste.pop();
  else if (source.kind === "foundation") next.foundations[source.suit].pop();
  else next.tableau[source.col] = next.tableau[source.col].slice(0, source.from);

  if (target.kind === "foundation") {
    next.foundations[target.suit].push(moving[0].card);
  } else {
    next.tableau[target.col].push(...moving);
  }

  if (source.kind === "tableau") {
    const col = next.tableau[source.col];
    if (col.length && !col[col.length - 1].faceUp) {
      col[col.length - 1] = { ...col[col.length - 1], faceUp: true };
    }
  }
  return next;
}

export function autoFoundationKlondike(state: KlondikeState): KlondikeState {
  let current = state;
  let changed = true;
  while (changed) {
    changed = false;
    if (current.waste.length) {
      const card = current.waste[current.waste.length - 1];
      for (const suit of SUITS) {
        const pile = current.foundations[suit];
        const top = pile.length ? pile[pile.length - 1] : null;
        if (canPlaceKlondikeFoundation(top, card)) {
          const moved = applyKlondikeMove(current, { kind: "waste" }, { kind: "foundation", suit });
          if (moved) {
            current = moved;
            changed = true;
            break;
          }
        }
      }
      if (changed) continue;
    }
    for (let col = 0; col < 7; col++) {
      const column = current.tableau[col];
      if (!column.length) continue;
      const topIdx = column.length - 1;
      if (!column[topIdx].faceUp) continue;
      for (const suit of SUITS) {
        const pile = current.foundations[suit];
        const top = pile.length ? pile[pile.length - 1] : null;
        if (canPlaceKlondikeFoundation(top, column[topIdx].card)) {
          const moved = applyKlondikeMove(
            current,
            { kind: "tableau", col, from: topIdx },
            { kind: "foundation", suit }
          );
          if (moved) {
            current = moved;
            changed = true;
            break;
          }
        }
      }
      if (changed) break;
    }
  }
  return current;
}
