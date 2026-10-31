import {
  MOVE_CONFLICT_NOTICE,
  acceptMoveWhileSending,
  noticeAfterAuthoritativeSync,
  stateConflictPayload,
  versionAfterConflict,
} from "./move-sync";

function assert(cond: boolean, message: string) {
  if (!cond) throw new Error(message);
}

assert(
  versionAfterConflict({
    staleExpected: 10,
    currentVersion: 10,
    serverVersion: 12,
  }) === 12,
  "409 後はサーバー版に追従し、送った古い版へ戻さない"
);
assert(
  versionAfterConflict({
    staleExpected: 10,
    currentVersion: 13,
    serverVersion: 12,
  }) === 13,
  "すでに新しい版があるときは下げない"
);
assert(
  versionAfterConflict({
    staleExpected: 10,
    currentVersion: 10,
    serverVersion: null,
  }) === 10,
  "版が不明な 409 では現在版を維持する"
);

const payload = stateConflictPayload(12, { phase: "playing" }, 1);
assert(payload.version === 12, "409 本文に版を入れる");
assert(payload.gameState.version === 12, "409 本文の状態に版を入れる");
assert(payload.error === "State conflict", "競合エラー名");

assert(
  noticeAfterAuthoritativeSync(MOVE_CONFLICT_NOTICE, 12, 12) === null,
  "サーバー版を適用したら手の競合表示を消す"
);
assert(
  noticeAfterAuthoritativeSync(MOVE_CONFLICT_NOTICE, 11, 12) ===
    MOVE_CONFLICT_NOTICE,
  "未追従のあいだは手の競合表示を残す"
);
assert(
  noticeAfterAuthoritativeSync("非法手です", 12, 12) === "非法手です",
  "競合以外の通知は消さない"
);

assert(acceptMoveWhileSending(true) === false, "送信中の二重押しは拒否");
assert(acceptMoveWhileSending(false) === true, "空きなら送信できる");

console.log("move-sync.test.ts: ok");
