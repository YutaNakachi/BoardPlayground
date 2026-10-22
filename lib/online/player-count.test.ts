import {
  nextFreeSeatIndex,
  parseOpeningSeat,
  parsePlayerCount,
  resolveMaxPlayers,
} from "./player-count";

function assert(cond: boolean, message: string) {
  if (!cond) throw new Error(message);
}

assert(parsePlayerCount({ playerCount: 3 }) === 3, "parse 3");
assert(parsePlayerCount({ playerCount: 5 }) === undefined, "reject 5");
assert(nextFreeSeatIndex([0, 2], 4) === 1, "free seat 1");
assert(nextFreeSeatIndex([0, 1, 2, 3], 4) === null, "full room");
assert(parseOpeningSeat({}, 4) === 0, "default opening");
assert(parseOpeningSeat({ firstPlayer: 3 }, 4) === 3, "opening 3");
assert(parseOpeningSeat({ firstPlayer: 4 }, 4) === null, "invalid opening");
assert(resolveMaxPlayers("reversi", {}) === 2, "2p game");
assert(resolveMaxPlayers("ludo", { playerCount: 4 }) === 4, "ludo 4");
assert(resolveMaxPlayers("ludo", {}) === null, "ludo needs count");

console.log("player-count.test.ts: ok");
