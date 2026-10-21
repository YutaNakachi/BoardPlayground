export type CardKind = "king" | "citizen" | "spy";

export type KingAndSpyCard = {
  id: string;
  kind: CardKind;
};

export type WinningSide = "king-side" | "spy-side";

export type KingAndSpyPhase = "selecting" | "game-over";

export type KingAndSpyRoundRecord = {
  round: number;
  kingSeat: 0 | 1;
  spySeat: 0 | 1;
  winningSide: WinningSide;
  winnerSeat: 0 | 1;
  pointsAwarded: number;
};

export type KingAndSpyPublicState = {
  phase: KingAndSpyPhase;
  scores: [number, number];
  /** 現在のラウンド（1始まり・決着ごとに進む） */
  roundNumber: number;
  /** マッチ上限ラウンド（12＝キング／スパイ担当が各6ラウンドずつ） */
  maxRounds: number;
  roundHistory: KingAndSpyRoundRecord[];
  kingRoleSeat: 0 | 1;
  decisiveCount: number;
  handCounts: [number, number];
  committedReady: [boolean, boolean];
  discards: KingAndSpyCard[];
  lastReveal: null | {
    cards: [KingAndSpyCard, KingAndSpyCard];
    winningSide: WinningSide;
    pointsAwarded: number;
    recipientSeat: 0 | 1;
  };
  winner: 0 | 1 | null;
  /** 上限ラウンド到達などで引き分け終了 */
  draw?: boolean;
};

export type KingAndSpySecrets = {
  hands: [KingAndSpyCard[], KingAndSpyCard[]];
  pendingCommits: [KingAndSpyCard | null, KingAndSpyCard | null];
};

export type KingAndSpyViewState = KingAndSpyPublicState & {
  myHand: KingAndSpyCard[];
  mySeat: 0 | 1;
  myRole: "king" | "spy";
};
