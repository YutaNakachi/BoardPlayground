import type {
  CardKind,
  KingAndSpyCard,
  KingAndSpySecrets,
  WinningSide,
} from "./types";

export function winningFaction(
  a: CardKind,
  b: CardKind
): WinningSide | "tie" {
  if (a === "citizen" && b === "citizen") return "tie";
  const beats: Record<CardKind, CardKind> = {
    king: "citizen",
    citizen: "spy",
    spy: "king",
  };
  if (beats[a] === b) {
    return a === "spy" ? "spy-side" : "king-side";
  }
  if (beats[b] === a) {
    return b === "spy" ? "spy-side" : "king-side";
  }
  throw new Error(`Invalid card pair: ${a}, ${b}`);
}

export function pointsForWinningSide(side: WinningSide): number {
  return side === "spy-side" ? 2 : 1;
}

export function recipientSeatForSide(
  side: WinningSide,
  kingRoleSeat: 0 | 1
): 0 | 1 {
  return side === "king-side" ? kingRoleSeat : (kingRoleSeat === 0 ? 1 : 0);
}

export function scoreMargin(scores: [number, number]): number {
  return Math.abs(scores[0] - scores[1]);
}

export function matchWinner(scores: [number, number]): 0 | 1 | null {
  const diff = scores[0] - scores[1];
  if (diff >= 3) return 0;
  if (diff <= -3) return 1;
  return null;
}

export function roleForSeat(
  seat: 0 | 1,
  kingRoleSeat: 0 | 1
): "king" | "spy" {
  return seat === kingRoleSeat ? "king" : "spy";
}

export function makeHandForRole(role: "king" | "spy"): KingAndSpyCard[] {
  const cards: KingAndSpyCard[] = [];
  let seq = 0;
  const push = (kind: CardKind) => {
    cards.push({ id: `${kind}-${seq++}`, kind });
  };
  if (role === "king") push("king");
  else push("spy");
  for (let i = 0; i < 4; i++) push("citizen");
  return cards;
}

export function dealRound(kingRoleSeat: 0 | 1): KingAndSpySecrets {
  const kingHand = makeHandForRole("king");
  const spyHand = makeHandForRole("spy");
  const hands: [KingAndSpyCard[], KingAndSpyCard[]] =
    kingRoleSeat === 0 ? [kingHand, spyHand] : [spyHand, kingHand];
  return {
    hands,
    pendingCommits: [null, null],
  };
}
