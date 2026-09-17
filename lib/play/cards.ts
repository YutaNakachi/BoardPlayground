import { shuffle } from "@/lib/game-engine";

export type Suit = "spade" | "heart" | "diamond" | "club";
export type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

export type PlayingCard = {
  id: string;
  suit: Suit;
  rank: Rank;
};

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];
const RANKS: Rank[] = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

export const SUIT_SYMBOL: Record<Suit, string> = {
  spade: "♠",
  heart: "♥",
  diamond: "♦",
  club: "♣",
};

export const SUIT_COLOR: Record<Suit, string> = {
  spade: "text-slate-100",
  heart: "text-rose-400",
  diamond: "text-rose-400",
  club: "text-slate-100",
};

export function rankValue(rank: Rank): number {
  if (rank === "A") return 1;
  if (rank === "J") return 11;
  if (rank === "Q") return 12;
  if (rank === "K") return 13;
  return Number(rank);
}

export function createDeck(decks = 1): PlayingCard[] {
  const cards: PlayingCard[] = [];
  let id = 0;
  for (let d = 0; d < decks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({ id: `${suit}-${rank}-${d}-${id++}`, suit, rank });
      }
    }
  }
  return shuffle(cards);
}

export function canPlaceKlondikeFoundation(
  target: PlayingCard | null,
  card: PlayingCard
): boolean {
  if (!target) return card.rank === "A";
  return (
    target.suit === card.suit &&
    rankValue(card.rank) === rankValue(target.rank) + 1
  );
}

export function canPlaceKlondikeTableau(
  target: PlayingCard | null,
  card: PlayingCard
): boolean {
  if (!target) return card.rank === "K";
  const alt =
    (target.suit === "spade" || target.suit === "club") ===
    (card.suit === "spade" || card.suit === "club");
  return alt && rankValue(target.rank) === rankValue(card.rank) + 1;
}
