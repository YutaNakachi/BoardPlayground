export type KingAndSpyGameOptions = {
  /** true: ホストがキング側で開始。false: ホストがスパイ側で開始 */
  hostStartsAsKing?: boolean;
};

export function parseHostStartsAsKing(raw: unknown): boolean {
  if (raw && typeof raw === "object" && "hostStartsAsKing" in raw) {
    return Boolean((raw as { hostStartsAsKing: unknown }).hostStartsAsKing);
  }
  return true;
}

export function kingRoleSeatFromHost(
  hostSeat: 0 | 1,
  hostStartsAsKing: boolean
): 0 | 1 {
  if (hostStartsAsKing) return hostSeat;
  return hostSeat === 0 ? 1 : 0;
}
