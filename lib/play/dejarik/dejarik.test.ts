import {
  bruteWarpTarget,
  centerIndex,
  DEJARIK_CELL_COUNT,
  homeOuterIndices,
  middleIndex,
  outerIndex,
  placementHomeCells,
  type CreatureType,
  type Player,
} from "./board";
import {
  bruteMoveTargets,
  guardianAttackTargets,
  predatorMoveTargets,
} from "./moves";
import {
  applyDejarikAttack,
  applyDejarikMove,
  applyPlacement,
  endScoutTurn,
  initialDejarik,
  legalAttackTargets,
  legalMoveTargets,
  placementPlayer,
  scoutCanContinue,
  secondPlayer,
  stallLabelForPlayer,
  STALL_LIMIT,
  type DejarikPiece,
  type DejarikState,
} from "./state";

export type AssertFn = (cond: boolean, message: string) => void;

function withPlaying(
  current: Player,
  setup: (
    cells: (number | null)[],
    pieces: Record<number, DejarikPiece>
  ) => void,
  extra?: Partial<DejarikState>
): DejarikState {
  const cells: (number | null)[] = Array.from({ length: DEJARIK_CELL_COUNT }, () => null);
  const pieces: Record<number, DejarikPiece> = {};
  setup(cells, pieces);
  return {
    phase: "playing",
    firstPlayer: 0,
    current,
    cells,
    pieces,
    nextPieceId: 100,
    placementStep: 8,
    unplaced: { 0: [], 1: [] },
    winner: null,
    winReason: null,
    stallCounters: [0, 0],
    scoutPartial: null,
    ...extra,
  };
}

function addPiece(
  cells: (number | null)[],
  pieces: Record<number, DejarikPiece>,
  id: number,
  cell: number,
  owner: Player,
  type: CreatureType
) {
  pieces[id] = { id, owner, type };
  cells[cell] = id;
}

function sortedCells(cells: number[]): string {
  return [...cells].sort((a, b) => a - b).join(",");
}

function completePlacement(firstPlayer: Player = 0): DejarikState {
  let state = initialDejarik(firstPlayer);
  const types: CreatureType[] = ["brute", "predator", "guardian", "scout"];
  for (let step = 0; step < 8; step++) {
    const player = placementPlayer(step);
    const homes = placementHomeCells(player);
    const type = state.unplaced[player][0];
    const cell = homes.find((c) => state.cells[c] === null)!;
    const next = applyPlacement(state, type, cell);
    if (!next) throw new Error(`placement failed step ${step}`);
    state = next;
  }
  return state;
}

export function runDejarikChecks(assert: AssertFn) {
  assert(DEJARIK_CELL_COUNT === 28, "dejarik 28 cells");

  const first0 = initialDejarik(0);
  assert(first0.phase === "placement", "dejarik starts placement");
  assert(first0.current === 1, "dejarik placement current is second player");
  assert(placementPlayer(0) === 1, "dejarik step0 is second player");
  assert(placementPlayer(1) === 0, "dejarik step1 alternates to first");
  assert(
    JSON.stringify(homeOuterIndices(0)) === JSON.stringify([9, 10, 11, 0, 1, 2]),
    "dejarik P0 home semicircle top"
  );
  assert(
    JSON.stringify(homeOuterIndices(1)) === JSON.stringify([3, 4, 5, 6, 7, 8]),
    "dejarik P1 home semicircle bottom"
  );

  const wrongHome = applyPlacement(first0, "brute", middleIndex(4));
  assert(wrongHome === null, "dejarik rejects non-home placement");

  const placed = completePlacement(0);
  assert(placed.phase === "playing", "dejarik enters playing after 8 placements");
  assert(placed.current === 0, "dejarik first player moves after setup");
  assert(placed.placementStep === 8, "dejarik placement step 8");

  let placementOrder: Player[] = [];
  let s = initialDejarik(0);
  for (let step = 0; step < 8; step++) {
    placementOrder.push(placementPlayer(step));
    const player = placementPlayer(step);
    const cell = placementHomeCells(player).find((c) => s.cells[c] === null)!;
    s = applyPlacement(s, s.unplaced[player][0], cell)!;
  }
  assert(
    placementOrder.join("") === "10101010",
    "dejarik 8-step placement alternates from second"
  );
  assert(s.current === 0, "dejarik after placement current is first player");

  const p1Second = initialDejarik(1);
  assert(p1Second.current === 0, "dejarik when P1 first, second is P0 for placement");
  assert(secondPlayer(1) === 0, "dejarik secondPlayer helper");

  const moveAttackBoard = withPlaying(0, (cells, pieces) => {
    addPiece(cells, pieces, 1, outerIndex(4), 0, "brute");
    addPiece(cells, pieces, 2, outerIndex(5), 1, "scout");
    addPiece(cells, pieces, 3, outerIndex(10), 1, "guardian");
  });

  const moves = legalMoveTargets(moveAttackBoard, 1);
  const attacks = legalAttackTargets(moveAttackBoard, 1);
  assert(moves.includes(outerIndex(3)) && !attacks.includes(outerIndex(3)), "dejarik empty cell is move not attack");
  assert(!moves.includes(outerIndex(5)) && attacks.includes(outerIndex(5)), "dejarik enemy cell is attack not move");
  assert(!moves.includes(outerIndex(4)), "dejarik cannot move onto self");

  const moved = applyDejarikMove(moveAttackBoard, 1, outerIndex(3));
  assert(moved !== null && moved.current === 1, "dejarik brute move ends turn to opponent");
  assert(moved!.cells[outerIndex(3)] === 1, "dejarik brute moved");

  const attacked = applyDejarikAttack(moveAttackBoard, 1, outerIndex(5));
  assert(attacked !== null && attacked.pieces[2] === undefined, "dejarik attack removes victim");
  assert(attacked!.cells[outerIndex(5)] === 1, "dejarik attacker occupies target");

  const scoutBoard = withPlaying(0, (cells, pieces) => {
    addPiece(cells, pieces, 10, outerIndex(4), 0, "scout");
    addPiece(cells, pieces, 11, outerIndex(6), 1, "scout");
  });

  const scoutMoveOnly = applyDejarikMove(scoutBoard, 10, outerIndex(2));
  assert(
    scoutMoveOnly?.scoutPartial?.didMove && !scoutMoveOnly.scoutPartial.didAttack,
    "dejarik scout move-only sets partial"
  );
  assert(scoutMoveOnly?.current === 0, "dejarik scout partial keeps turn");

  const endedEarly = endScoutTurn(scoutMoveOnly!);
  assert(endedEarly?.current === 1 && endedEarly.scoutPartial === null, "dejarik endScoutTurn after partial");

  const scoutAttackFirst = withPlaying(0, (cells, pieces) => {
    addPiece(cells, pieces, 20, outerIndex(4), 0, "scout");
    addPiece(cells, pieces, 21, outerIndex(5), 1, "brute");
    addPiece(cells, pieces, 22, outerIndex(2), 0, "guardian");
    addPiece(cells, pieces, 23, outerIndex(6), 1, "predator");
  });
  const afterAtk = applyDejarikAttack(scoutAttackFirst, 20, outerIndex(5));
  assert(
    afterAtk?.phase === "playing" &&
      afterAtk.scoutPartial?.didAttack &&
      !afterAtk.scoutPartial.didMove,
    "dejarik scout attack-first partial"
  );
  const afterBoth = applyDejarikMove(afterAtk!, 20, outerIndex(3));
  assert(afterBoth?.current === 1 && afterBoth.scoutPartial === null, "dejarik scout both ops auto end turn");

  const scoutBlockedSecondMove = withPlaying(0, (cells, pieces) => {
    addPiece(cells, pieces, 30, outerIndex(4), 0, "scout");
    addPiece(cells, pieces, 31, outerIndex(7), 1, "brute");
    addPiece(cells, pieces, 32, outerIndex(8), 1, "predator");
  });
  const partialMove = applyDejarikMove(scoutBlockedSecondMove, 30, outerIndex(6))!;
  assert(legalMoveTargets(partialMove, 30).length === 0, "dejarik scout cannot move twice");
  assert(
    legalAttackTargets(partialMove, 30).includes(outerIndex(7)),
    "dejarik scout can still attack after move"
  );

  assert(endScoutTurn(initialDejarik(0)) === null, "dejarik endScoutTurn rejected outside playing");

  const elimination = withPlaying(0, (cells, pieces) => {
    addPiece(cells, pieces, 40, outerIndex(0), 0, "brute");
    addPiece(cells, pieces, 41, outerIndex(1), 1, "scout");
  });
  const win = applyDejarikAttack(elimination, 40, outerIndex(1));
  assert(
    win?.phase === "game-over" && win.winner === 0 && win.winReason === "elimination",
    "dejarik elimination win"
  );

  const stallStart = withPlaying(0, (cells, pieces) => {
    addPiece(cells, pieces, 50, outerIndex(0), 0, "scout");
    addPiece(cells, pieces, 51, outerIndex(6), 1, "brute");
    addPiece(cells, pieces, 52, outerIndex(7), 1, "predator");
    addPiece(cells, pieces, 53, outerIndex(8), 1, "guardian");
    addPiece(cells, pieces, 54, outerIndex(9), 1, "scout");
  });
  let stall = applyDejarikMove(stallStart, 50, outerIndex(2))!;
  assert(stall.stallCounters[0] === 0, "dejarik stall not counted with >1 piece");

  const loneScout = withPlaying(0, (cells, pieces) => {
    addPiece(cells, pieces, 60, outerIndex(0), 0, "scout");
    addPiece(cells, pieces, 61, outerIndex(6), 1, "brute");
  });
  let t1 = applyDejarikMove(loneScout, 60, outerIndex(2))!;
  t1 = endScoutTurn(t1)!;
  assert(t1.stallCounters[0] === 1, "dejarik stall +1 after turn without capture");

  let t2 = applyDejarikMove({ ...t1, current: 0 }, 60, outerIndex(4))!;
  t2 = endScoutTurn(t2)!;
  assert(t2.stallCounters[0] === 2, "dejarik stall +2");

  let t3 = applyDejarikMove({ ...t2, current: 0 }, 60, outerIndex(2))!;
  t3 = endScoutTurn(t3)!;
  assert(
    t3.phase === "game-over" && t3.winner === 1 && t3.winReason === "stall",
    "dejarik stall loss after 3 turns"
  );
  assert(STALL_LIMIT === 3, "dejarik stall limit matches rules");

  const stallReset = withPlaying(0, (cells, pieces) => {
    addPiece(cells, pieces, 70, outerIndex(0), 0, "scout");
    addPiece(cells, pieces, 71, outerIndex(1), 1, "brute");
    addPiece(cells, pieces, 72, outerIndex(6), 1, "predator");
    addPiece(cells, pieces, 73, outerIndex(7), 1, "guardian");
    addPiece(cells, pieces, 74, outerIndex(8), 1, "scout");
  }, { stallCounters: [2, 0] });
  const captureTurn = applyDejarikAttack(stallReset, 70, outerIndex(1))!;
  const afterCaptureEnd = endScoutTurn(captureTurn)!;
  assert(afterCaptureEnd.stallCounters[0] === 0, "dejarik stall resets on capture");

  const enemyTurn = applyDejarikMove(stallStart, 51, outerIndex(5));
  assert(enemyTurn === null, "dejarik rejects opponent piece");

  const blockedScout = withPlaying(0, (cells, pieces) => {
    addPiece(cells, pieces, 80, outerIndex(4), 0, "scout");
    addPiece(cells, pieces, 81, outerIndex(5), 1, "brute");
  });
  assert(
    !legalMoveTargets(blockedScout, 80).includes(middleIndex(4)),
    "dejarik scout outer ray2 blocked by enemy on path"
  );

  const fullGame = completePlacement(0);
  assert(fullGame.pieces && Object.keys(fullGame.pieces).length === 8, "dejarik 4v4 after setup");

  const o4 = outerIndex(4);
  const bruteWarpBoard = withPlaying(0, (cells, pieces) => {
    addPiece(cells, pieces, 90, o4, 0, "brute");
    addPiece(cells, pieces, 91, outerIndex(8), 1, "scout");
  });
  const warpDest = bruteWarpTarget(o4);
  assert(warpDest === outerIndex(10), "dejarik brute warp half orbit");
  assert(
    legalMoveTargets(bruteWarpBoard, 90).includes(warpDest),
    "dejarik brute can warp to opposite outer"
  );
  const bruteCenterBack = withPlaying(0, (cells, pieces) => {
    addPiece(cells, pieces, 92, centerIndex(1), 0, "brute");
    addPiece(cells, pieces, 93, outerIndex(0), 1, "scout");
  });
  assert(
    sortedCells(legalMoveTargets(bruteCenterBack, 92)) ===
      sortedCells([middleIndex(2), middleIndex(6), centerIndex(0), centerIndex(2), middleIndex(3), middleIndex(4), middleIndex(5)]),
    "dejarik brute on C1 moves include diagonal back M2 M6"
  );
  const bruteFriendly = withPlaying(0, (cells, pieces) => {
    addPiece(cells, pieces, 94, o4, 0, "brute");
    addPiece(cells, pieces, 95, middleIndex(4), 0, "guardian");
    addPiece(cells, pieces, 96, outerIndex(0), 1, "scout");
  });
  assert(
    !legalMoveTargets(bruteFriendly, 94).includes(middleIndex(4)),
    "dejarik brute cannot move onto friendly"
  );

  const predOuter = withPlaying(0, (cells, pieces) => {
    addPiece(cells, pieces, 100, o4, 0, "predator");
    addPiece(cells, pieces, 101, middleIndex(4), 1, "brute");
    addPiece(cells, pieces, 102, outerIndex(0), 1, "scout");
  });
  assert(
    sortedCells(legalMoveTargets(predOuter, 100)) ===
      sortedCells([middleIndex(2), middleIndex(6)]),
    "dejarik predator outer jump to two middles"
  );
  assert(
    !legalMoveTargets(predOuter, 100).includes(outerIndex(2)),
    "dejarik predator outer no backward outer targets"
  );
  const predMiddle = withPlaying(0, (cells, pieces) => {
    addPiece(cells, pieces, 110, middleIndex(4), 0, "predator");
    addPiece(cells, pieces, 111, outerIndex(0), 1, "scout");
  });
  assert(
    sortedCells(legalMoveTargets(predMiddle, 110)) ===
      sortedCells([centerIndex(3), outerIndex(2), outerIndex(6)]),
    "dejarik predator middle three jump targets"
  );
  const predCenter = withPlaying(0, (cells, pieces) => {
    addPiece(cells, pieces, 120, centerIndex(1), 0, "predator");
    addPiece(cells, pieces, 121, outerIndex(0), 1, "scout");
  });
  assert(
    sortedCells(legalMoveTargets(predCenter, 120)) ===
      sortedCells([
        middleIndex(1),
        middleIndex(2),
        middleIndex(3),
        middleIndex(5),
        middleIndex(6),
        middleIndex(7),
      ]),
    "dejarik predator C1 six middle targets"
  );
  const cellsPred = predOuter.cells;
  const piecesPred = predOuter.pieces;
  assert(
    sortedCells(
      predatorMoveTargets(cellsPred, piecesPred, 0, 100, o4)
    ) === sortedCells([middleIndex(2), middleIndex(6)]),
    "dejarik predator ignores blocker on skipped middle ray"
  );

  const guardOuter = withPlaying(0, (cells, pieces) => {
    addPiece(cells, pieces, 130, o4, 0, "guardian");
    addPiece(cells, pieces, 131, outerIndex(0), 1, "scout");
  });
  assert(
    legalMoveTargets(guardOuter, 130).includes(middleIndex(4)),
    "dejarik guardian outer forward"
  );
  assert(
    !legalMoveTargets(guardOuter, 130).includes(warpDest),
    "dejarik guardian no warp"
  );
  const guardAtkNear = withPlaying(0, (cells, pieces) => {
    addPiece(cells, pieces, 132, o4, 0, "guardian");
    addPiece(cells, pieces, 133, outerIndex(5), 1, "brute");
    addPiece(cells, pieces, 134, outerIndex(0), 1, "scout");
  });
  assert(
    !legalAttackTargets(guardAtkNear, 132).includes(outerIndex(5)),
    "dejarik guardian cannot attack adjacent"
  );
  const guardAtkFar = withPlaying(0, (cells, pieces) => {
    addPiece(cells, pieces, 135, o4, 0, "guardian");
    addPiece(cells, pieces, 136, outerIndex(6), 1, "brute");
    addPiece(cells, pieces, 137, outerIndex(0), 1, "scout");
  });
  assert(
    legalAttackTargets(guardAtkFar, 135).includes(outerIndex(6)),
    "dejarik guardian attacks orbit 2"
  );
  const guardBlocked = withPlaying(0, (cells, pieces) => {
    addPiece(cells, pieces, 138, o4, 0, "guardian");
    addPiece(cells, pieces, 139, outerIndex(5), 1, "brute");
    addPiece(cells, pieces, 140, outerIndex(6), 1, "predator");
    addPiece(cells, pieces, 141, outerIndex(0), 1, "scout");
  });
  const gCells = guardBlocked.cells;
  const gPieces = guardBlocked.pieces;
  assert(
    !guardianAttackTargets(gCells, gPieces, 0, 138, o4).includes(outerIndex(6)),
    "dejarik guardian attack blocked on path"
  );
  const guardCenterAtk = withPlaying(0, (cells, pieces) => {
    addPiece(cells, pieces, 142, centerIndex(1), 0, "guardian");
    addPiece(cells, pieces, 143, centerIndex(3), 1, "brute");
    addPiece(cells, pieces, 144, outerIndex(0), 1, "scout");
  });
  assert(
    legalAttackTargets(guardCenterAtk, 142).includes(centerIndex(3)),
    "dejarik guardian center ring attack"
  );

  const scoutMiddleOnly = withPlaying(0, (cells, pieces) => {
    addPiece(cells, pieces, 150, middleIndex(4), 0, "scout");
    addPiece(cells, pieces, 151, outerIndex(0), 1, "brute");
  });
  assert(
    sortedCells(legalMoveTargets(scoutMiddleOnly, 150)) ===
      sortedCells([middleIndex(2), middleIndex(6)]),
    "dejarik scout middle only orbit 2"
  );
  assert(
    !legalMoveTargets(scoutMiddleOnly, 150).includes(outerIndex(4)),
    "dejarik scout middle no single-step to outer"
  );
  const scoutCenter = withPlaying(0, (cells, pieces) => {
    addPiece(cells, pieces, 152, centerIndex(1), 0, "scout");
    addPiece(cells, pieces, 153, outerIndex(0), 1, "brute");
  });
  assert(
    legalMoveTargets(scoutCenter, 152).includes(centerIndex(3)),
    "dejarik scout center inner orbit 2"
  );
  assert(
    legalMoveTargets(scoutCenter, 152).includes(outerIndex(4)),
    "dejarik scout center ray2 to outer via M4"
  );

  const dualStall = withPlaying(0, (cells, pieces) => {
    addPiece(cells, pieces, 160, outerIndex(0), 0, "brute");
    addPiece(cells, pieces, 161, outerIndex(6), 1, "brute");
  });
  let ds = applyDejarikMove(dualStall, 160, outerIndex(1))!;
  assert(ds.stallCounters[0] === 1 && ds.stallCounters[1] === 0, "dejarik dual 1v1 P0 stall only");
  ds = applyDejarikMove({ ...ds, current: 1 }, 161, outerIndex(7))!;
  assert(ds.stallCounters[1] === 1, "dejarik dual 1v1 P1 stall independent");
  ds = applyDejarikMove({ ...ds, current: 0 }, 160, outerIndex(2))!;
  ds = applyDejarikMove({ ...ds, current: 1 }, 161, outerIndex(8))!;
  ds = applyDejarikMove({ ...ds, current: 0 }, 160, outerIndex(3))!;
  assert(
    ds.phase === "game-over" && ds.winner === 1 && ds.winReason === "stall",
    "dejarik dual 1v1 first to exhaust stall loses"
  );

  const loneLabel = withPlaying(0, (cells, pieces) => {
    addPiece(cells, pieces, 170, outerIndex(0), 0, "brute");
    addPiece(cells, pieces, 171, outerIndex(6), 1, "brute");
    addPiece(cells, pieces, 172, outerIndex(7), 1, "predator");
    addPiece(cells, pieces, 173, outerIndex(8), 1, "guardian");
    addPiece(cells, pieces, 174, outerIndex(9), 1, "scout");
  }, { stallCounters: [1, 0] });
  assert(
    stallLabelForPlayer(loneLabel, 0)?.includes("あと2手"),
    "dejarik stall label shows remaining turns"
  );

  const scoutDone = withPlaying(0, (cells, pieces) => {
    addPiece(cells, pieces, 180, outerIndex(4), 0, "scout");
    addPiece(cells, pieces, 181, outerIndex(8), 1, "brute");
  }, {
    scoutPartial: { pieceId: 180, didMove: true, didAttack: true },
  });
  assert(!scoutCanContinue(scoutDone, 180), "dejarik scout cannot continue after both");

  const occupied = applyPlacement(first0, "brute", placementHomeCells(1)[0]);
  assert(occupied !== null, "dejarik first placement ok");
  const dupType = applyPlacement(occupied!, "brute", placementHomeCells(1)[1]);
  assert(dupType === null, "dejarik rejects placing same type twice");

  assert(
    applyDejarikAttack(moveAttackBoard, 1, outerIndex(3)) === null,
    "dejarik attack on empty rejected"
  );
  assert(
    applyDejarikMove(moveAttackBoard, 1, outerIndex(5)) === null,
    "dejarik move onto enemy rejected"
  );
}

if (typeof process !== "undefined" && process.argv[1]?.includes("dejarik.test")) {
  runDejarikChecks((cond, msg) => {
    if (!cond) throw new Error(msg);
  });
  console.log("dejarik tests ok");
}
