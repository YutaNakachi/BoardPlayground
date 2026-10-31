import { acceptPolledSnapshot, mergePolledRoom } from "./room-poll";

function assert(cond: boolean, message: string) {
  if (!cond) throw new Error(message);
}

assert(acceptPolledSnapshot(1, 0), "最初の完了は反映する");
assert(
  acceptPolledSnapshot(1, 0) && acceptPolledSnapshot(2, 1),
  "次の取得が飛んだあとに戻った完了も、未適用なら反映する"
);
assert(!acceptPolledSnapshot(1, 2), "新しい名簿を適用したあとの古い完了は捨てる");

const previous = {
  players: [{ seatIndex: 0, displayName: "ホストA" }],
  gameOptions: { playerCount: 4, firstPlayer: 1 },
};
const incoming = {
  players: [
    { seatIndex: 0, displayName: "ホストA" },
    { seatIndex: 1, displayName: "B" },
    { seatIndex: 2, displayName: "C" },
    { seatIndex: 3, displayName: "D" },
  ],
  gameOptions: { playerCount: 4, firstPlayer: 0 },
};

const merged = mergePolledRoom(previous, incoming, true);
assert(merged.players.length === 4, "先攻を残しても席一覧は応答の4人");
assert(
  merged.gameOptions.firstPlayer === 1,
  "取得中に進んだ先攻は手元の値を残す"
);
assert(
  mergePolledRoom(previous, incoming, false).players.length === 4,
  "通常の取得でも席一覧は応答どおり"
);
assert(
  mergePolledRoom(null, incoming, true).players.length === 4,
  "初回は応答をそのまま使う"
);

console.log("room-poll.test.ts: ok");
