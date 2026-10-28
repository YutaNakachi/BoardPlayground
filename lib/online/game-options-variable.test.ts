import { mergeGameOptions, validateGameOptions } from "./game-options";

function assert(cond: boolean, message: string) {
  if (!cond) throw new Error(message);
}

const base = { playerCount: 4 as const };

assert(
  validateGameOptions("ludo", { ...base, firstPlayer: 2 })?.firstPlayer === 2,
  "ludo stores firstPlayer 2"
);
assert(
  validateGameOptions("ludo", { ...base, firstPlayer: 5 }) === null,
  "ludo rejects firstPlayer 5"
);
assert(
  mergeGameOptions("ludo", base, { firstPlayer: 3 })?.firstPlayer === 3,
  "rematch merge firstPlayer 3"
);

console.log("game-options-variable.test.ts: ok");
