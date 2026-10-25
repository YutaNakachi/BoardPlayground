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
  KingAndSpyViewState,
  WinningSide,
} from "./types";

export const WIN_MARGIN = 3;
export const SWAP_EVERY_DECISIVE = 2;
/** シミュレーション p90 決着≈16・自然終了が多いよう 12（4の倍数で担当均等） */
export const MATCH_MAX_ROUNDS = 12;

function winnerByScore(scores: [number, number]): 0 | 1 | null {
  if (scores[0] > scores[1]) return 0;
  if (scores[1] > scores[0]) return 1;
  return null;
}

function endMatch(
  publicState: KingAndSpyPublicState,
  secrets: KingAndSpySecrets,
  winner: 0 | 1 | null,
  draw = false
): void {
  publicState.winner = winner;
  publicState.draw = draw;
  publicState.phase = "game-over";
  secrets.pendingCommits = [null, null];
}

export function initialKingAndSpyPublicState(
  kingRoleSeat: 0 | 1
): KingAndSpyPublicState {
  return {
    phase: "selecting",
    scores: [0, 0],
    roundNumber: 1,
    maxRounds: MATCH_MAX_ROUNDS,
    roundHistory: [],
    kingRoleSeat,
    decisiveCount: 0,
    handCounts: [5, 5],
    committedReady: [false, false],
    handReady: [false, false],
    discards: [],
    lastReveal: null,
    showcase: null,
    winner: null,
  };
}

export function initialKingAndSpySecrets(
  kingRoleSeat: 0 | 1
): KingAndSpySecrets {
  return dealRound(kingRoleSeat);
}

function readHandReady(
  publicState: KingAndSpyPublicState
): [boolean, boolean] {
  return [
    Boolean(publicState.handReady?.[0]),
    Boolean(publicState.handReady?.[1]),
  ];
}

function clonePublic(publicState: KingAndSpyPublicState): KingAndSpyPublicState {
  return {
    ...publicState,
    scores: [...publicState.scores] as [number, number],
    handCounts: [...publicState.handCounts] as [number, number],
    committedReady: [...publicState.committedReady] as [boolean, boolean],
    handReady: readHandReady(publicState),
    discards: [...publicState.discards],
    roundHistory: [...publicState.roundHistory],
    showcase: publicState.showcase
      ? {
          cards: [
            publicState.showcase.cards[0],
            publicState.showcase.cards[1],
          ],
          tie: publicState.showcase.tie,
        }
      : null,
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
  publicState.handReady = [false, false];
  publicState.phase = "selecting";
  publicState.roundNumber += 1;
}

function applyDecisive(
  publicState: KingAndSpyPublicState,
  secrets: KingAndSpySecrets,
  side: WinningSide,
  cards: [KingAndSpyCard, KingAndSpyCard]
): void {
  const kingSeat = publicState.kingRoleSeat;
  const spySeat: 0 | 1 = kingSeat === 0 ? 1 : 0;
  const recipient = recipientSeatForSide(side, kingSeat);
  const points = pointsForWinningSide(side);
  const scores = [...publicState.scores] as [number, number];
  scores[recipient] += points;
  publicState.scores = scores;
  publicState.decisiveCount += 1;
  publicState.roundHistory = [
    ...publicState.roundHistory,
    {
      round: publicState.roundNumber,
      kingSeat,
      spySeat,
      winningSide: side,
      winnerSeat: recipient,
      pointsAwarded: points,
    },
  ];
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

  const marginWinner = matchWinner(scores);
  if (marginWinner !== null) {
    endMatch(publicState, secrets, marginWinner);
    return;
  }

  if (publicState.roundNumber >= publicState.maxRounds) {
    const capWinner = winnerByScore(scores);
    endMatch(publicState, secrets, capWinner, capWinner === null);
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
  publicState.handReady = [false, false];
  publicState.handCounts = [
    secrets.hands[0].length,
    secrets.hands[1].length,
  ];

  const outcome = winningFaction(c0.kind, c1.kind);
  publicState.showcase = {
    cards: [c0, c1],
    tie: outcome === "tie",
  };
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
  cardId: string,
  options?: { deferResolve?: boolean }
): { error?: string } {
  if (publicState.phase === "game-over") {
    return { error: "Game is over" };
  }
  if (
    !publicState.committedReady[0] &&
    !publicState.committedReady[1]
  ) {
    publicState.lastReveal = null;
    publicState.showcase = null;
    publicState.handReady = [false, false];
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

  if (
    !options?.deferResolve &&
    publicState.committedReady[0] &&
    publicState.committedReady[1]
  ) {
    resolveBothCommitted(publicState, secrets);
  }

  return {};
}

/**
 * 手札から消した表示が終わった席を記録する。
 * 両者の確定と両者が揃ったときだけ公開・得点・補充を行う。
 */
export function applyKingAndSpyHandReady(
  publicState: KingAndSpyPublicState,
  secrets: KingAndSpySecrets,
  seatIndex: 0 | 1
): { error?: string } {
  if (publicState.phase === "game-over") {
    return { error: "Game is over" };
  }
  if (publicState.showcase) {
    return {};
  }
  if (!publicState.committedReady[seatIndex]) {
    return { error: "Not committed" };
  }

  const ready = readHandReady(publicState);
  ready[seatIndex] = true;
  publicState.handReady = ready;

  if (
    ready[0] &&
    ready[1] &&
    publicState.committedReady[0] &&
    publicState.committedReady[1] &&
    secrets.pendingCommits[0] &&
    secrets.pendingCommits[1]
  ) {
    resolveBothCommitted(publicState, secrets);
  }

  return {};
}

/** オンライン用: 自席の確定だけを即時反映（両者確定の決着はサーバー待ち） */
export function optimisticKingAndSpyCommitView(
  view: KingAndSpyViewState,
  cardId: string
): KingAndSpyViewState | { error: string } {
  if (view.phase === "game-over") {
    return { error: "Game is over" };
  }
  if (view.committedReady[view.mySeat]) {
    return { error: "Already committed" };
  }
  const card = view.myHand.find((c) => c.id === cardId);
  if (!card) {
    return { error: "Card not in hand" };
  }

  const committedReady = [...view.committedReady] as [boolean, boolean];
  committedReady[view.mySeat] = true;
  const myHand = view.myHand.filter((c) => c.id !== cardId);
  const handCounts = [...view.handCounts] as [number, number];
  handCounts[view.mySeat] = myHand.length;

  const clearLastReveal =
    !view.committedReady[0] && !view.committedReady[1];

  return {
    ...view,
    myHand,
    committedReady,
    handCounts,
    lastReveal: clearLastReveal ? null : view.lastReveal,
  };
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
