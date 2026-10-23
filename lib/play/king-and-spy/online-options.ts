import { parseHostStartsAsKing } from "./game-options";

export type KingAndSpyStoredOptions = {
  hostStartsAsKing?: boolean;
  kingRoleSeat?: 0 | 1;
};

export function kingRoleSeatFromOptions(raw: unknown): 0 | 1 {
  if (raw && typeof raw === "object" && "kingRoleSeat" in raw) {
    const v = (raw as { kingRoleSeat: unknown }).kingRoleSeat;
    if (v === 0 || v === 1) return v;
  }
  return 0;
}

export function parseKingAndSpyStoredOptions(raw: unknown): KingAndSpyStoredOptions {
  const hostStartsAsKing = parseHostStartsAsKing(raw);
  const kingRoleSeat = kingRoleSeatFromOptions(raw);
  return {
    hostStartsAsKing,
    ...(raw &&
    typeof raw === "object" &&
    "kingRoleSeat" in raw &&
    ((raw as { kingRoleSeat: unknown }).kingRoleSeat === 0 ||
      (raw as { kingRoleSeat: unknown }).kingRoleSeat === 1)
      ? { kingRoleSeat }
      : {}),
  };
}
