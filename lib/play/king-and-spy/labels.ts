import type { CardKind } from "./types";
import type { WinningSide } from "./types";

export const CARD_KIND_LABEL: Record<CardKind, string> = {
  king: "キング",
  citizen: "シチズン",
  spy: "スパイ",
};

export function playerRoleLabel(role: "king" | "spy"): string {
  return role === "king" ? "キング" : "スパイ";
}

export function winningSideLabel(side: WinningSide): string {
  return side === "king-side" ? "キング側" : "スパイ側";
}
