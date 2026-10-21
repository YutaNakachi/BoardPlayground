export type CardKind = "king" | "citizen" | "spy";

export type KingAndSpyCard = {
  id: string;
  kind: CardKind;
};

export type WinningSide = "king-side" | "spy-side";

export type KingAndSpyPhase = "selecting" | "game-over";

export type KingAndSpyPublicState = {
  phase: KingAndSpyPhase;
  scores: [number, number];
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
