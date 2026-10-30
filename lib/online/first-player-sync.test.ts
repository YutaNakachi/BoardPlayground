import {
  gameOptionsAfterRefresh,
  rematchOpeningSeat,
  resolveOpeningDisplay,
  shownOpeningSeat,
} from "./first-player-sync";

function assert(cond: boolean, message: string) {
  if (!cond) throw new Error(message);
}

const fourPlayer = { playerCount: 4, firstPlayer: 2 };

assert(
  shownOpeningSeat(fourPlayer, 2) === 2,
  "maxPlayers が 2 でも明示された先攻 2 をホスト席へ落とさない"
);
assert(
  resolveOpeningDisplay(fourPlayer, 2).seatCount === 3,
  "先攻席を含む席数にする"
);
assert(
  shownOpeningSeat({ playerCount: 4 }, 4) === 0,
  "未指定の先攻は 0"
);
assert(
  shownOpeningSeat({ playerCount: 4, firstPlayer: 3 }, 4) === 3,
  "4人部屋の先攻 3"
);
assert(rematchOpeningSeat(0, 4) === 1, "再戦の先攻は次席");
assert(rematchOpeningSeat(3, 4) === 0, "末席の次は 0");

const previous = { playerCount: 4, firstPlayer: 0 };
const incoming = { playerCount: 4, firstPlayer: 2 };
assert(
  gameOptionsAfterRefresh({
    previous: incoming,
    incoming: previous,
    revisionAtFetchStart: 1,
    currentRevision: 2,
  }).firstPlayer === 2,
  "取得中に進んだ先攻を古い GET で戻さない"
);
assert(
  gameOptionsAfterRefresh({
    previous,
    incoming,
    revisionAtFetchStart: 2,
    currentRevision: 2,
  }).firstPlayer === 2,
  "リビジョンが同じならサーバーの先攻を採用"
);

console.log("first-player-sync.test.ts: ok");
