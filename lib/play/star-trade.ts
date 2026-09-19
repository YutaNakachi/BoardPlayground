import { shuffle, winnerIndices } from "@/lib/game-engine";

export type Suit = "star" | "moon" | "sun" | "comet";

export type StarTradeCard = {
  id: string;
  suit: Suit;
  value: number;
};

export type StarTradeTurnStep = "draw" | "play";

export type StarTradeState = {
  playerCount: number;
  round: number;
  currentPlayer: number;
  turnStep: StarTradeTurnStep;
  deck: StarTradeCard[];
  hands: StarTradeCard[][];
  markets: StarTradeCard[][];
  scores: number[];
  gameOver: boolean;
};

const SUITS: Suit[] = ["star", "moon", "sun", "comet"];

export function createStarTradeDeck(): StarTradeCard[] {
  const deck: StarTradeCard[] = [];
  let id = 0;
  for (const suit of SUITS) {
    for (let value = 1; value <= 5; value++) {
      deck.push({ id: `${suit}-${value}-${id++}`, suit, value });
    }
  }
  return shuffle(deck);
}

export function scoreStarTradeCards(cards: StarTradeCard[]): {
  total: number;
  base: number;
  bonus: number;
  suits: number;
} {
  const base = cards.reduce((s, c) => s + c.value, 0);
  const suits = new Set(cards.map((c) => c.suit)).size;
  const bonus = suits >= 3 ? 5 : suits === 2 ? 2 : 0;
  return { total: base + bonus, base, bonus, suits };
}

export function dealStarTradeRound(playerCount: number, deck = createStarTradeDeck()) {
  const d = [...deck];
  const hands: StarTradeCard[][] = Array.from({ length: playerCount }, () => []);
  for (let i = 0; i < playerCount * 3; i++) {
    hands[i % playerCount].push(d.pop()!);
  }
  return {
    deck: d,
    hands,
    markets: Array.from({ length: playerCount }, () => [] as StarTradeCard[]),
  };
}

export function initialStarTrade(playerCount: number): StarTradeState {
  const dealt = dealStarTradeRound(playerCount);
  return {
    playerCount,
    round: 1,
    currentPlayer: 0,
    turnStep: "draw",
    deck: dealt.deck,
    hands: dealt.hands,
    markets: dealt.markets,
    scores: Array(playerCount).fill(0),
    gameOver: false,
  };
}

export function scoreStarTradeRound(hands: StarTradeCard[][], markets: StarTradeCard[][]): number[] {
  return hands.map((hand, i) => scoreStarTradeCards([...hand, ...markets[i]]).total);
}

export function applyStarTradeDraw(state: StarTradeState): StarTradeState | null {
  if (state.gameOver || state.turnStep !== "draw") return null;
  if (state.deck.length === 0) {
    return finishStarTradeRound(state);
  }
  const card = state.deck[state.deck.length - 1];
  return {
    ...state,
    deck: state.deck.slice(0, -1),
    hands: state.hands.map((h, i) => (i === state.currentPlayer ? [...h, card] : h)),
    turnStep: "play",
  };
}

export function applyStarTradePlay(
  state: StarTradeState,
  cardId: string
): StarTradeState | null {
  if (state.gameOver || state.turnStep !== "play") return null;
  const hand = state.hands[state.currentPlayer];
  const card = hand.find((c) => c.id === cardId);
  if (!card) return null;
  if (state.markets[state.currentPlayer].length >= 3) return null;

  const hands = state.hands.map((h, i) =>
    i === state.currentPlayer ? h.filter((c) => c.id !== cardId) : h
  );
  const markets = state.markets.map((m, i) =>
    i === state.currentPlayer ? [...m, card] : m
  );

  if (markets.every((m) => m.length >= 3)) {
    return finishStarTradeRound({ ...state, hands, markets });
  }

  return {
    ...state,
    hands,
    markets,
    currentPlayer: (state.currentPlayer + 1) % state.playerCount,
    turnStep: "draw",
  };
}

function finishStarTradeRound(state: StarTradeState): StarTradeState {
  const roundScores = scoreStarTradeRound(state.hands, state.markets);
  const scores = state.scores.map((s, i) => s + roundScores[i]);
  if (state.round >= 3) {
    return { ...state, scores, gameOver: true };
  }
  const dealt = dealStarTradeRound(state.playerCount);
  return {
    ...state,
    round: state.round + 1,
    currentPlayer: 0,
    turnStep: "draw",
    deck: dealt.deck,
    hands: dealt.hands,
    markets: dealt.markets,
    scores,
    gameOver: false,
  };
}

export function starTradeWinners(state: StarTradeState): number[] {
  return winnerIndices(state.scores);
}
