import {
  applyCheckersMove,
  checkersIndex,
  checkersMoves,
  initialCheckersBoard,
  type Board,
} from "./checkers";
import { chessMoves, initialChessState } from "./chess";
import { drawDotsBoxesEdge, initialDotsBoxes } from "./dots-and-boxes";
import {
  dropGravityFour,
  emptyGravityFourBoard,
  gravityFourWinner,
  type Board as GravityBoard,
} from "./gravity-four";
import { emptyHexBoard, HEX_SIZE, hexWinner } from "./hex";
import { foxHoundsMoves, foxHoundsWinner, initialFoxHounds } from "./fox-hounds";
import { initialKlondike } from "./klondike";
import { initialMahjongSolitaire } from "./mahjong-solitaire";
import { gomokuWinner } from "./gomoku";
import { isSlideSolved, shuffledSlide } from "./slide-puzzle";
import { initialMancala, sowMancala } from "./mancala";
import { initialNim, nimOver, takeNim } from "./nim";
import { emptyTttBoard, tttWinner } from "./tic-tac-toe";
import {
  clickMorris,
  initialMorrisState,
  morrisCount,
  morrisFormsMill,
} from "./nine-mens-morris";
import {
  initialReversiBoard,
  playReversiMove,
  reversiCounts,
  reversiLegalMoves,
  reversiNextPlayer,
} from "./reversi";

function assert(cond: boolean, message: string) {
  if (!cond) throw new Error(message);
}

export function runPlayEngineChecks() {
  const reversi = initialReversiBoard();
  const opening = reversiLegalMoves(reversi, 0);
  assert(opening.length === 4, `reversi opening moves ${opening.length}`);
  const after = playReversiMove(reversi, opening[0], 0);
  assert(after !== null, "reversi first move");
  assert(reversiCounts(after!)[0] > 2, "reversi flip increases black");
  assert(reversiNextPlayer(after!, 0) === 1, "reversi switches player");

  const mancala = initialMancala();
  const extra = sowMancala(mancala, 0, 2);
  assert(extra !== null && extra.extraTurn, "mancala pit 2 extra turn");
  const captureSetup = initialMancala();
  captureSetup[0] = 1;
  captureSetup[1] = 0;
  captureSetup[11] = 3;
  const captured = sowMancala(captureSetup, 0, 0);
  assert(captured !== null && captured.captured, "mancala capture");
  assert(captured!.pits[1] === 0 && captured!.pits[11] === 0, "mancala capture empties");
  assert(captured!.pits[6] >= 4, "mancala capture to store");

  const gomoku = Array(13 * 13).fill(null);
  for (let c = 0; c < 5; c++) gomoku[c] = 0;
  assert(gomokuWinner(gomoku) === 0, "gomoku row win");
  const g2 = Array(13 * 13).fill(null);
  for (let r = 0; r < 5; r++) g2[r * 13 + r] = 1;
  assert(gomokuWinner(g2) === 1, "gomoku diagonal win");
  const g3 = Array(13 * 13).fill(null);
  for (let c = 0; c < 4; c++) g3[c] = 0;
  assert(gomokuWinner(g3) === null, "gomoku four is not win");

  const checkers = initialCheckersBoard();
  const moves = checkersMoves(checkers, 0);
  assert(moves.length === 7, `checkers opening ${moves.length}`);
  assert(moves.every((m) => m.capture == null), "checkers opening no capture");
  const capBoard = initialCheckersBoard();
  capBoard[35] = { player: 1, king: false };
  const caps = checkersMoves(capBoard, 0);
  assert(caps.some((m) => m.capture === 35), "checkers forced capture");
  assert(caps.every((m) => m.capture != null), "quiet moves forbidden");
  const jumped = caps.find((m) => m.capture === 35)!;
  const applied = applyCheckersMove(capBoard, jumped);
  assert(applied.board[jumped.to]?.player === 0, "checkers jumper lands");
  assert(applied.board[35] === null, "checkers captured removed");

  const chainBoard = Array(64).fill(null) as Board;
  const place = (row: number, col: number, player: 0 | 1, king = false) => {
    chainBoard[checkersIndex(row, col)] = { player, king };
  };
  place(5, 2, 0);
  place(4, 1, 1);
  place(2, 1, 1);
  const firstJump = checkersMoves(chainBoard, 0).find((m) => m.capture === checkersIndex(4, 1));
  assert(firstJump != null, "checkers chain first jump exists");
  const afterFirst = applyCheckersMove(chainBoard, firstJump!);
  assert(afterFirst.continueFrom === firstJump!.to, "checkers chain continues");
  const secondJump = checkersMoves(afterFirst.board, 0, afterFirst.continueFrom);
  assert(
    secondJump.some((m) => m.capture === checkersIndex(2, 1)),
    "checkers chain second jump offered"
  );
  const afterSecond = applyCheckersMove(afterFirst.board, secondJump[0]);
  assert(afterSecond.continueFrom === null, "checkers chain ends after second jump");

  const kingStop = Array(64).fill(null) as Board;
  kingStop[checkersIndex(2, 2)] = { player: 0, king: false };
  kingStop[checkersIndex(1, 1)] = { player: 1, king: false };
  const kingJump = checkersMoves(kingStop, 0)[0];
  assert(kingJump != null, "checkers king promotion jump exists");
  const kinged = applyCheckersMove(kingStop, kingJump);
  assert(kinged.board[kingJump.to]?.king === true, "checkers promotes on jump");
  assert(kinged.continueFrom === null, "checkers promotion ends jump chain");

  let morris = initialMorrisState();
  morris = clickMorris(morris, 0);
  morris = clickMorris(morris, 3);
  morris = clickMorris(morris, 1);
  morris = clickMorris(morris, 4);
  morris = clickMorris(morris, 2);
  assert(morris.removing, "morris mill triggers remove");
  assert(morrisFormsMill(morris.board, 2, 0), "morris mill on 0-1-2");
  morris = clickMorris(morris, 3);
  assert(morrisCount(morris.board, 1) === 1, "morris removed opponent");
  assert(!morris.removing && morris.current === 1, "morris turn passes after remove");

  const ttt = emptyTttBoard();
  ttt[0] = 0;
  ttt[1] = 0;
  ttt[2] = 0;
  assert(tttWinner(ttt) === 0, "ttt row win");

  let gf: GravityBoard = emptyGravityFourBoard();
  for (let i = 0; i < 4; i++) {
    const next = dropGravityFour(gf, 0, 0);
    assert(next !== null, "gravity-four drop");
    gf = next!;
  }
  assert(gravityFourWinner(gf) === 0, "gravity-four vertical win");

  let db = initialDotsBoxes();
  db = drawDotsBoxesEdge(db, { kind: "h", row: 0, col: 0 })!;
  db = drawDotsBoxesEdge(db, { kind: "h", row: 0, col: 1 })!;
  db = drawDotsBoxesEdge(db, { kind: "v", row: 0, col: 0 })!;
  db = drawDotsBoxesEdge(db, { kind: "v", row: 0, col: 1 })!;
  const boxed = drawDotsBoxesEdge(db, { kind: "h", row: 1, col: 0 })!;
  assert(boxed !== null && boxed.scores[0] === 1, "dots-and-boxes capture");

  let nim = initialNim();
  nim = takeNim(nim, 0, 3)!;
  nim = takeNim(nim, 1, 5)!;
  nim = takeNim(nim, 2, 6)!;
  nim = takeNim(nim, 2, 1)!;
  assert(nimOver(nim), "nim ends");

  const hex = emptyHexBoard();
  for (let r = 0; r < HEX_SIZE; r++) hex[r * HEX_SIZE] = 0;
  assert(hexWinner(hex) === 0, "hex top-bottom win");
  const fox = initialFoxHounds();
  assert(foxHoundsMoves(fox, 0).length > 0, "fox opening moves");
  assert(foxHoundsWinner(fox, 0) === null, "fox-hounds no early winner");
  const rabbitStart = fox.indexOf(0);
  assert(
    rabbitStart === 7 * 8 + 3,
    `fox-hounds rabbit starts bottom center ${rabbitStart}`
  );
  assert(foxHoundsMoves(fox, 1).length > 0, "fox-hounds hounds can move from opening");
  const afterRabbit = fox.slice();
  const rabbitMove = foxHoundsMoves(afterRabbit, 0)[0];
  afterRabbit[rabbitStart] = null;
  afterRabbit[rabbitMove] = 0;
  assert(
    foxHoundsWinner(afterRabbit, 1) === null,
    "fox-hounds no false rabbit win after one move"
  );

  const reportedBoard = initialCheckersBoard();
  let rb = applyCheckersMove(reportedBoard, {
    from: checkersIndex(5, 0),
    to: checkersIndex(4, 1),
  }).board;
  rb = applyCheckersMove(rb, {
    from: checkersIndex(2, 3),
    to: checkersIndex(3, 2),
  }).board;
  const reportedCap = checkersMoves(rb, 0).find(
    (m) => m.from === checkersIndex(4, 1) && m.capture === checkersIndex(3, 2)
  );
  assert(reportedCap != null, "checkers reported first capture exists");
  const reportedApplied = applyCheckersMove(rb, reportedCap!);
  assert(
    reportedApplied.continueFrom === null,
    "checkers reported chain blocked by occupied landing square"
  );
  assert(
    reportedApplied.board[checkersIndex(0, 5)] != null,
    "checkers reported landing square occupied"
  );

  const mj = initialMahjongSolitaire();
  assert(mj.tiles.length === 36, `mahjong solitaire has 36 tiles ${mj.tiles.length}`);
  assert(mj.tiles.every((t) => t.type != null), "mahjong solitaire all tiles typed");

  const chess = initialChessState();
  assert(chessMoves(chess).length === 20, `chess opening ${chessMoves(chess).length}`);

  const klondike = initialKlondike();
  assert(klondike.tableau.length === 7, "klondike tableau");

  const slide = shuffledSlide();
  assert(!isSlideSolved(slide), "slide puzzle starts unsolved");
}

if (typeof process !== "undefined" && process.argv[1]?.includes("check-engines")) {
  runPlayEngineChecks();
  console.log("play engine checks ok");
}
