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
  /**
   * 場に出したあと、手札から消した表示まで終わった席。
   * 両者 true になるまで公開・得点・補充はしない。古い対局データには無い。
   */
  handReady?: [boolean, boolean];
  discards: KingAndSpyCard[];
  lastReveal: null | {
    cards: [KingAndSpyCard, KingAndSpyCard];
    winningSide: WinningSide;
    pointsAwarded: number;
    recipientSeat: 0 | 1;
  };
  /**
   * 両者確定直後の公開トリック。次のトリックの最初の確定まで残す。
   * クライアントはこの組だけを見て、裏→オープン→リセットを再生する。
   */
  showcase: null | {
    cards: [KingAndSpyCard, KingAndSpyCard];
    tie: boolean;
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
