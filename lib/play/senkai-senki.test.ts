import {
  SS_COLS,
  SS_ROWS,
  applySenkaiAction,
  initialSenkaiSenki,
  isEdgeStuck,
  legalActionsForPiece,
  legalMovesForPiece,
  legalRotationFacings,
  legalRotations,
  shootTarget,
  ssCoord,
  ssIndex,
  type Facing,
  type PieceType,
  type Player,
  type SenkaiPiece,
  type SenkaiState,
} from "./senkai-senki";

export type AssertFn = (cond: boolean, message: string) => void;

function pieceAtCell(state: SenkaiState, row: number, col: number): SenkaiPiece | null {
  const id = state.cells[ssIndex(row, col)];
  if (id === null) return null;
  return state.pieces[id] ?? null;
}

function findPiece(
  state: SenkaiState,
  owner: Player,
  type: PieceType
): SenkaiPiece {
  const p = Object.values(state.pieces).find(
    (x) => x.owner === owner && x.type === type
  );
  if (!p) throw new Error(`missing piece ${owner} ${type}`);
  return p;
}

function cellOf(state: SenkaiState, pieceId: number): number {
  const idx = state.cells.findIndex((c) => c === pieceId);
  if (idx < 0) throw new Error(`piece ${pieceId} not on board`);
  return idx;
}

function withBoard(
  base: SenkaiState,
  setup: (
    cells: (number | null)[],
    pieces: Record<number, SenkaiPiece>
  ) => void,
  extra?: Partial<SenkaiState>
): SenkaiState {
  const cells = base.cells.slice();
  const pieces = { ...base.pieces };
  setup(cells, pieces);
  return { ...base, cells, pieces, ...extra };
}

function clearBoard(state: SenkaiState): SenkaiState {
  return {
    ...state,
    cells: Array(SS_COLS * SS_ROWS).fill(null),
    pieces: {},
  };
}

function addPiece(
  cells: (number | null)[],
  pieces: Record<number, SenkaiPiece>,
  id: number,
  row: number,
  col: number,
  owner: Player,
  type: PieceType,
  facing: Facing,
  rotateToken = false
) {
  pieces[id] = {
    id,
    owner,
    type,
    facing,
    rotateToken,
  };
  cells[ssIndex(row, col)] = id;
}

export function runSenkaiSenkiChecks(assert: AssertFn) {
  assert(SS_COLS === 5 && SS_ROWS === 5, "senkai 5x5 board");

  const start = initialSenkaiSenki();
  assert(start.current === 0, "senkai P1 first");
  assert(!start.gameOver && start.winner === null, "senkai not over at start");
  assert(start.lockedAfterRotate === null, "senkai no rotate lock at start");

  const p1Types: PieceType[] = ["light", "heavy", "command", "scout", "light"];
  for (let col = 0; col < 5; col++) {
    const p = pieceAtCell(start, 4, col)!;
    assert(p.owner === 0 && p.type === p1Types[col], `senkai P1 row4 col${col}`);
    if (p.type !== "command") assert(p.facing === 0, "senkai P1 faces up");
  }
  const p2Types: PieceType[] = ["light", "scout", "command", "heavy", "light"];
  for (let col = 0; col < 5; col++) {
    const p = pieceAtCell(start, 0, col)!;
    assert(p.owner === 1 && p.type === p2Types[col], `senkai P2 row0 col${col}`);
    if (p.type !== "command") assert(p.facing === 2, "senkai P2 faces down");
  }

  const p1Light = findPiece(start, 0, "light");
  const forwardIdx = cellOf(start, p1Light.id) - SS_COLS;
  const moved = applySenkaiAction(start, p1Light.id, { kind: "move", to: forwardIdx });
  assert(moved !== null && moved.current === 1, "senkai move ends turn");
  assert(moved!.pieces[p1Light.id].rotateToken, "senkai move grants rotate token");

  const p1Heavy = findPiece(start, 0, "heavy");
  const heavyFrom = cellOf(start, p1Heavy.id);
  const heavyFwd = heavyFrom - SS_COLS;
  assert(
    legalMovesForPiece(start, p1Heavy.id).includes(heavyFwd),
    "senkai heavy forward empty"
  );
  const p2ScoutStart = findPiece(start, 1, "scout");
  const scoutCell = cellOf(start, p2ScoutStart.id);
  const blockedHeavy = withBoard(start, (cells, pieces) => {
    cells[heavyFwd] = null;
    addPiece(cells, pieces, 99, ssCoord(heavyFwd).row, ssCoord(heavyFwd).col, 1, "light", 2);
  });
  assert(
    !legalMovesForPiece(blockedHeavy, p1Heavy.id).includes(heavyFwd),
    "senkai heavy cannot ram"
  );

  const scoutDiag = withBoard(clearBoard(start), (cells, pieces) => {
    addPiece(cells, pieces, 1, 2, 2, 0, "scout", 0);
    addPiece(cells, pieces, 2, 0, 0, 1, "light", 2);
    addPiece(cells, pieces, 3, 4, 4, 0, "command", 0);
    addPiece(cells, pieces, 4, 4, 0, 1, "command", 2);
  });
  const scoutId = 1;
  const ramTarget = ssIndex(0, 0);
  assert(
    legalMovesForPiece(scoutDiag, scoutId).includes(ramTarget),
    "senkai scout diagonal ram"
  );
  const scoutRamTrade = applySenkaiAction(
    { ...scoutDiag, current: 0 },
    scoutId,
    { kind: "move", to: ramTarget }
  );
  assert(
    scoutRamTrade !== null &&
      !scoutRamTrade.gameOver &&
      scoutRamTrade.pieces[scoutId] === undefined &&
      scoutRamTrade.pieces[2] === undefined,
    "senkai scout ram non-command mutual removal"
  );

  const scoutVsCommand = withBoard(clearBoard(start), (cells, pieces) => {
    addPiece(cells, pieces, 10, 2, 2, 0, "scout", 0);
    addPiece(cells, pieces, 11, 0, 0, 1, "command", 0);
  });
  const scoutWin = applySenkaiAction(
    { ...scoutVsCommand, current: 0 },
    10,
    { kind: "move", to: ssIndex(0, 0) }
  );
  assert(
    scoutWin?.gameOver && scoutWin.winner === 0 && scoutWin.winReason === "ram",
    "senkai scout ram command wins"
  );

  const cmdRam = withBoard(clearBoard(start), (cells, pieces) => {
    addPiece(cells, pieces, 20, 2, 2, 0, "command", 0);
    addPiece(cells, pieces, 21, 1, 2, 1, "light", 2);
  });
  const afterCmdRam = applySenkaiAction(
    { ...cmdRam, current: 0 },
    20,
    { kind: "move", to: ssIndex(1, 2) }
  );
  assert(afterCmdRam?.pieces[20] !== undefined, "senkai command survives ram");
  assert(afterCmdRam?.pieces[21] === undefined, "senkai command removes enemy");
  assert(!afterCmdRam?.pieces[20].rotateToken, "senkai command no rotate token");

  const shooter = withBoard(clearBoard(start), (cells, pieces) => {
    addPiece(cells, pieces, 30, 4, 2, 0, "light", 0);
    addPiece(cells, pieces, 31, 2, 2, 1, "command", 2);
  });
  assert(shootTarget({ ...shooter, current: 0 }, 30) === ssIndex(2, 2), "senkai shoot in range");

  const blockedShot = withBoard(clearBoard(start), (cells, pieces) => {
    addPiece(cells, pieces, 32, 4, 2, 0, "light", 0);
    addPiece(cells, pieces, 33, 3, 2, 0, "heavy", 0);
    addPiece(cells, pieces, 34, 1, 2, 1, "command", 2);
  });
  assert(shootTarget(blockedShot, 32) === null, "senkai friendly blocks shot");

  const shootWin = applySenkaiAction(
    { ...shooter, current: 0 },
    30,
    { kind: "shoot" }
  );
  assert(
    shootWin?.gameOver && shootWin.winner === 0 && shootWin.winReason === "shoot",
    "senkai shoot command wins"
  );

  const tokenPiece = withBoard(clearBoard(start), (cells, pieces) => {
    addPiece(cells, pieces, 40, 2, 2, 0, "light", 0, true);
    addPiece(cells, pieces, 45, 4, 4, 0, "command", 0);
    addPiece(cells, pieces, 46, 0, 0, 1, "command", 2);
  });
  const facings = legalRotationFacings({ ...tokenPiece, current: 0 }, 40);
  assert(facings.length === 3, "senkai light 90 and 180 rotations");
  const heavyToken = withBoard(clearBoard(start), (cells, pieces) => {
    addPiece(cells, pieces, 41, 2, 2, 0, "heavy", 0, true);
  });
  assert(legalRotations(heavyToken.pieces[41]).length === 2, "senkai heavy 90 only");

  const rotated = applySenkaiAction(
    { ...tokenPiece, current: 0 },
    40,
    { kind: "rotate", facing: 1 }
  );
  assert(rotated?.lockedAfterRotate === 40, "senkai rotate locks same piece");
  assert(rotated?.skipRotateGrant, "senkai rotate sets skip grant");
  assert(rotated?.current === 0, "senkai rotate keeps turn");
  assert(!rotated?.pieces[40].rotateToken, "senkai rotate consumes token");

  const afterCombo = applySenkaiAction(rotated!, 40, {
    kind: "move",
    to: ssIndex(2, 3),
  });
  assert(afterCombo?.current === 1, "senkai combo ends turn");
  assert(!afterCombo?.pieces[40].rotateToken, "senkai combo move no new token");

  const otherLocked = applySenkaiAction(
    rotated!,
    41,
    { kind: "rotate", facing: 1 }
  );
  assert(otherLocked === null, "senkai cannot act other piece when locked");

  const reliefBoard = withBoard(clearBoard(start), (cells, pieces) => {
    addPiece(cells, pieces, 50, 0, 0, 0, "heavy", 0);
    addPiece(cells, pieces, 51, 4, 4, 0, "command", 0);
    addPiece(cells, pieces, 52, 4, 0, 1, "command", 2);
  });
  assert(isEdgeStuck({ ...reliefBoard, current: 0 }, 50), "senkai edge stuck heavy");
  const reliefOnly = legalRotationFacings({ ...reliefBoard, current: 0 }, 50);
  assert(reliefOnly.length === 1 && reliefOnly[0] === 2, "senkai relief 180 only");
  const afterRelief = applySenkaiAction(
    { ...reliefBoard, current: 0 },
    50,
    { kind: "rotate", facing: 2 }
  );
  assert(afterRelief?.current === 1, "senkai relief ends turn");
  assert(afterRelief?.lockedAfterRotate === null, "senkai relief no combo");

  const badRelief = applySenkaiAction(
    { ...reliefBoard, current: 0 },
    50,
    { kind: "rotate", facing: 1 }
  );
  assert(badRelief === null, "senkai relief rejects 90");

  const noTokenRotate = applySenkaiAction(
    { ...reliefBoard, current: 0, pieces: { ...reliefBoard.pieces, 50: { ...reliefBoard.pieces[50], facing: 2 } } },
    50,
    { kind: "rotate", facing: 1 }
  );
  assert(noTokenRotate === null, "senkai rotate without token rejected");

  const enemyTurn = applySenkaiAction(start, p2ScoutStart.id, {
    kind: "move",
    to: scoutCell + SS_COLS,
  });
  assert(enemyTurn === null, "senkai rejects opponent piece");

  const scoutPath = withBoard(clearBoard(start), (cells, pieces) => {
    addPiece(cells, pieces, 60, 3, 2, 0, "scout", 0);
    addPiece(cells, pieces, 61, 1, 1, 1, "light", 2);
  });
  const scoutMoves = legalMovesForPiece(scoutPath, 60);
  assert(!scoutMoves.includes(ssIndex(1, 3)), "senkai scout blocked before max range");
  assert(!scoutMoves.includes(ssIndex(2, 2)), "senkai scout no straight 2");

  assert(
    legalActionsForPiece(start, findPiece(start, 0, "command").id).length > 0,
    "senkai command has opening moves"
  );
  assert(
    legalActionsForPiece(start, findPiece(start, 0, "scout").id).some((a) => a.kind === "move"),
    "senkai scout can move initially"
  );
  assert(
    !legalActionsForPiece(start, findPiece(start, 0, "scout").id).some((a) => a.kind === "shoot"),
    "senkai scout cannot shoot"
  );
}

if (typeof process !== "undefined" && process.argv[1]?.includes("senkai-senki.test")) {
  runSenkaiSenkiChecks((cond, msg) => {
    if (!cond) throw new Error(msg);
  });
  console.log("senkai-senki tests ok");
}
