import type { CardKind } from "./types";

const BASE = "/games/king-and-spy";

export const KING_AND_SPY_CARD_BACK = `${BASE}/card-back.jpg`;

export function kingAndSpyCardFaceSrc(kind: CardKind): string {
  switch (kind) {
    case "king":
      return `${BASE}/card-king.jpg`;
    case "spy":
      return `${BASE}/card-spy.jpg`;
    case "citizen":
      return `${BASE}/card-citizen.jpg`;
  }
}
