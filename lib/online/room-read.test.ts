import { isTransientDbError, rosterFromQuery } from "./room-read";

function assert(cond: boolean, message: string) {
  if (!cond) throw new Error(message);
}

const four = [
  { player_id: "a", seat_index: 0, display_name: "ホストA" },
  { player_id: "b", seat_index: 1, display_name: "B" },
  { player_id: "c", seat_index: 2, display_name: "C" },
  { player_id: "d", seat_index: 3, display_name: "D" },
];

const roster = rosterFromQuery(four, false);
assert(roster?.length === 4, "成功した名簿は4人");
assert(rosterFromQuery(null, true) === null, "失敗を空の席一覧にしない");
assert(rosterFromQuery(null, false)?.length === 0, "行が無い成功は空");
assert(
  isTransientDbError({ message: "TypeError: fetch failed" }),
  "一時的な通信失敗は再試行する"
);
assert(!isTransientDbError(null), "エラーが無ければ再試行しない");
assert(
  !isTransientDbError({ message: "column does not exist", code: "42703" }),
  "スキーマエラーは一時障害ではない"
);

console.log("room-read.test.ts: ok");
