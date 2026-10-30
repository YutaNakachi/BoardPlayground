import { followUpAfterJoin, shouldResumeFromRoomUrl } from "./rejoin-room";

function assert(cond: boolean, message: string) {
  if (!cond) throw new Error(message);
}

assert(
  followUpAfterJoin({
    pageSlug: "ludo",
    joinedSlug: "ludo",
    seatIndex: 2,
    status: "playing",
  }) === "enter-room",
  "対局中の join 成功は同じ席で部屋へ入る"
);
assert(
  followUpAfterJoin({
    pageSlug: "ludo",
    joinedSlug: "ludo",
    seatIndex: 0,
    status: "finished",
  }) === "enter-room",
  "終局後の再入室も部屋へ入る"
);
assert(
  followUpAfterJoin({
    pageSlug: "ludo",
    joinedSlug: "nebula-link",
    seatIndex: 1,
    status: "playing",
  }) === "redirect",
  "別ゲームならそのプレイ画面へ移る"
);
assert(
  followUpAfterJoin({
    pageSlug: "ludo",
    joinedSlug: "ludo",
    seatIndex: -1,
    status: "playing",
  }) === "stay-on-form",
  "席が無いときだけ参加フォームに残る"
);

assert(
  shouldResumeFromRoomUrl({
    roomCode: "ABCDEF",
    phase: "idle",
    hasRoom: false,
    displayName: "ホストA",
  }),
  "?room= と名前があれば自動復帰する"
);
assert(
  !shouldResumeFromRoomUrl({
    roomCode: "ABCDEF",
    phase: "playing",
    hasRoom: true,
    displayName: "ホストA",
  }),
  "すでに部屋にいるときは再参加しない"
);
assert(
  !shouldResumeFromRoomUrl({
    roomCode: "ABCDEF",
    phase: "idle",
    hasRoom: false,
    displayName: null,
  }),
  "名前が無ければフォームを出す"
);

console.log("rejoin-room.test.ts: ok");
