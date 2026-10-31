import {
  NEBULA_CORE,
  NEBULA_MONO_ID,
  NEBULA_SIZE,
  applyNebulaPass,
  canNebulaPass,
  initialNebulaLink,
  isLegalNebulaPlacement,
  legalNebulaPlacements,
  nebulaIndex,
} from "./nebula-link";

function assert(cond: boolean, message: string) {
  if (!cond) throw new Error(message);
}

/** 自分の駒が市松で埋まり、角だけで接する空きは星核だけ。 */
function checkerboardExceptCore(player: number): (number | null)[] {
  const board = Array<number | null>(NEBULA_SIZE * NEBULA_SIZE).fill(null);
  for (let row = 0; row < NEBULA_SIZE; row++) {
    for (let col = 0; col < NEBULA_SIZE; col++) {
      const index = nebulaIndex(row, col);
      if (index === NEBULA_CORE) continue;
      if ((row + col) % 2 === 0) board[index] = player;
    }
  }
  return board;
}

const player = 2;
const board = checkerboardExceptCore(player);
const pieces = [NEBULA_MONO_ID, "tri", "domino", "L3"];
const moves = legalNebulaPlacements(board, player, 4, pieces);
assert(moves.length === 0, "星核しか角接触が残らない局面の合法手は0");

for (let row = 0; row < NEBULA_SIZE; row++) {
  for (let col = 0; col < NEBULA_SIZE; col++) {
    for (const pieceId of pieces) {
      assert(
        !isLegalNebulaPlacement(board, player, 4, pieceId, 0, row, col),
        `置けない ${pieceId} @ ${row},${col}`
      );
    }
  }
}

const state = {
  ...initialNebulaLink(4),
  board,
  currentPlayer: player,
  passesInRow: 2,
};
assert(canNebulaPass(state), "ルーレット前でもパスできる");
const passed = applyNebulaPass(state);
assert(passed !== null && passed.currentPlayer === 3, "パスで次の席へ進む");
assert(passed !== null && passed.passesInRow === 3, "連続パスが加算される");
assert(passed !== null && !passed.gameOver, "4人中3人のパスではまだ終わらない");

const allPassed = applyNebulaPass({ ...state, passesInRow: 3 });
assert(
  allPassed !== null && allPassed.gameOver && allPassed.isDraw,
  "全員連続パスで引き分け"
);

const one = Array<number | null>(NEBULA_SIZE * NEBULA_SIZE).fill(null);
one[nebulaIndex(10, 9)] = player;
const mono = legalNebulaPlacements(one, player, 4, [NEBULA_MONO_ID]);
const monoCells = new Set(mono.map((m) => `${m.anchorRow},${m.anchorCol}`));
assert(mono.length === monoCells.size, "単マスの回転違いは1手");
assert(monoCells.has("9,8") && monoCells.has("11,10"), "角で接する空きには置ける");
assert(!monoCells.has("10,8") && !monoCells.has("10,10"), "辺で接するマスと星核には置けない");

console.log("nebula-link.test.ts: ok");
