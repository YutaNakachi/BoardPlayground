/**
 * 完了した取得を採用するか。
 * より新しい取得がすでに飛んでいても、それが未完了なら、今完了した分は反映する。
 * すでに適用したより古い完了だけ捨てる。
 */
export function acceptPolledSnapshot(
  completedSeq: number,
  lastAppliedSeq: number
): boolean {
  return completedSeq > lastAppliedSeq;
}

type RoomFields<P, O> = {
  players: P;
  gameOptions: O;
};

/**
 * ポーリング結果を部屋状態へ重ねる。
 * 先攻オプションを手元に残すときも、players は応答の名簿で置き換える。
 */
export function mergePolledRoom<T extends RoomFields<unknown, unknown>>(
  previous: T | null,
  incoming: T,
  keepPreviousOptions: boolean
): T {
  if (!previous || !keepPreviousOptions) return incoming;
  return {
    ...incoming,
    gameOptions: previous.gameOptions,
    players: incoming.players,
  };
}
