import { shouldApplyRemoteGameVersion } from "./sync-game-state";

function assert(cond: boolean, message: string) {
  if (!cond) throw new Error(message);
}

const gameOver = { phase: "game-over" as const, winner: 0 };
const playing = { phase: "playing" as const, winner: null };

assert(
  shouldApplyRemoteGameVersion(1, 48, playing, gameOver),
  "rematch v1 from finished"
);
assert(
  shouldApplyRemoteGameVersion(8, 48, playing, gameOver),
  "missed rematch v1, catch up at v8"
);
assert(
  !shouldApplyRemoteGameVersion(1, 10, playing, playing),
  "ignore stale v1 while in progress"
);

console.log("sync-game-state.test.ts: ok");
