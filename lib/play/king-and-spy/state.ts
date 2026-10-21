import {
  dealRound,
  makeHandForRole,
  matchWinner,
  pointsForWinningSide,
  recipientSeatForSide,
  roleForSeat,
  scoreMargin,
  winningFaction,
} from "./rules";
import type {
  KingAndSpyCard,
  KingAndSpyPublicState,
  KingAndSpySecrets,
  WinningSide,
} from "./types";

export const WIN_MARGIN = 3;
export const SWAP_EVERY_DECISIVE = 2;

export function initialKingAndSpyPublicState(
  kingRoleSeat: 0 | 1
): KingAndSpyPublicState {
  return {
    phase: "selecting",
    scores: [0, 0],
    kingRoleSeat,
    decisiveCount: 0,
    handCounts: [5, 5],
    committedReady: [false, false],
    discards: [],
    lastReveal: null,
    winner: null,
  };
}

export function initialKingAndSpySecrets(
  kingRoleSeat: 0 | 1
): KingAndSpySecrets {
  return dealRound(kingRoleSeat);
}

function clonePublic(publicState: KingAndSpyPublicState): KingAndSpyPublicState {
  return {
    ...publicState,
    scores: [...publicState.scores] as [number, number],
    handCounts: [...publicState.handCounts] as [number, number],
    committedReady: [...publicState.committedReady] as [boolean, boolean],
    discards: [...publicState.discards],
  };
}

function cloneSecrets(secrets: KingAndSpySecrets): KingAndSpySecrets {
  return {
    hands: [secrets.hands[0].slice(), secrets.hands[1].slice()],
    pendingCommits: [...secrets.pendingCommits] as [
      KingAndSpyCard | null,
      KingAndSpyCard | null,
    ],
  };
}

function startNewRound(
  publicState: KingAndSpyPublicState,
  secrets: KingAndSpySecrets
): void {
  const dealt = dealRound(publicState.kingRoleSeat);
  secrets.hands = dealt.hands;
  secrets.pendingCommits = [null, null];
  publicState.handCounts = [5, 5];
  publicState.committedReady = [false, false];
  publicState.lastReveal = null;
  publicState.phase = "selecting";
}

function applyDecisive(
  publicState: KingAndSpyPublicState,
  secrets: KingAndSpySecrets,
  side: WinningSide,
  cards: [KingAndSpyCard, KingAndSpyCard]
): void {
  const recipient = recipientSeatForSide(side, publicState.kingRoleSeat);
  const points = pointsForWinningSide(side);
  const scores = [...publicState.scores] as [number, number];
  scores[recipient] += points;
  publicState.scores = scores;
  publicState.decisiveCount += 1;
  publicState.lastReveal = {
    cards,
    winningSide: side,
    pointsAwarded: points,
    recipientSeat: recipient,
  };

  if (publicState.decisiveCount % SWAP_EVERY_DECISIVE === 0) {
    publicState.kingRoleSeat =
      publicState.kingRoleSeat === 0 ? 1 : 0;
  }

  const winner = matchWinner(scores);
  if (winner !== null) {
    publicState.winner = winner;
    publicState.phase = "game-over";
    secrets.pendingCommits = [null, null];
    return;
  }

  startNewRound(publicState, secrets);
}

function resolveBothCommitted(
  publicState: KingAndSpyPublicState,
  secrets: KingAndSpySecrets
): void {
  const c0 = secrets.pendingCommits[0]!;
  const c1 = secrets.pendingCommits[1]!;
  publicState.discards = [...publicState.discards, c0, c1];
  secrets.pendingCommits = [null, null];
  publicState.committedReady = [false, false];
  publicState.handCounts = [
    secrets.hands[0].length,
    secrets.hands[1].length,
  ];

  const outcome = winningFaction(c0.kind, c1.kind);
  if (outcome === "tie") {
    publicState.lastReveal = null;
    return;
  }

  applyDecisive(publicState, secrets, outcome, [c0, c1]);
}

export function applyKingAndSpyCommit(
  publicState: KingAndSpyPublicState,
  secrets: KingAndSpySecrets,
  seatIndex: 0 | 1,
  cardId: string
): { error?: string } {
  if (publicState.phase === "game-over") {
    return { error: "Game is over" };
  }
  if (publicState.committedReady[seatIndex]) {
    return { error: "Already committed" };
  }

  const hand = secrets.hands[seatIndex];
  const cardIndex = hand.findIndex((c) => c.id === cardId);
  if (cardIndex < 0) {
    return { error: "Card not in hand" };
  }

  const [card] = hand.splice(cardIndex, 1);
  secrets.pendingCommits[seatIndex] = card;
  publicState.committedReady[seatIndex] = true;
  publicState.handCounts = [
    secrets.hands[0].length,
    secrets.hands[1].length,
  ];

  if (publicState.committedReady[0] && publicState.committedReady[1]) {
    resolveBothCommitted(publicState, secrets);
  }

  return {};
}

export function projectKingAndSpyForSeat(
  publicState: KingAndSpyPublicState,
  secrets: KingAndSpySecrets | null,
  seatIndex: 0 | 1
): import("./types").KingAndSpyViewState {
  return {
    ...clonePublic(publicState),
    myHand: secrets ? secrets.hands[seatIndex].slice() : [],
    mySeat: seatIndex,
    myRole: roleForSeat(seatIndex, publicState.kingRoleSeat),
  };
}

export function kingAndSpyMarginLabel(scores: [number, number]): string {
  const m = scoreMargin(scores);
  const leader =
    scores[0] === scores[1]
      ? "同点"
      : scores[0] > scores[1]
        ? "プレイヤー1 +"
        : "プレイヤー2 +";
  return scores[0] === scores[1] ? "同点" : `${leader}${m}`;
}

export function decisivesUntilRoleSwap(decisiveCount: number): number {
  const rem = decisiveCount % SWAP_EVERY_DECISIVE;
  return rem === 0 ? SWAP_EVERY_DECISIVE : SWAP_EVERY_DECISIVE - rem;
}

/** ローカル用: 再配布のみ（スコア維持） */
export function reshuffleHandsForRoles(
  kingRoleSeat: 0 | 1
): KingAndSpySecrets {
  return dealRound(kingRoleSeat);
}
