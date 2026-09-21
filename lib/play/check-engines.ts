import { winnerIndices } from "@/lib/game-engine";
import { rollBackgammon, initialBackgammon, backgammonMoves } from "./backgammon";
import { canPlaceKlondikeFoundation, canPlaceKlondikeTableau, type PlayingCard } from "./cards";
import {
  applyCheckersMove,
  checkersIndex,
  checkersMoves,
  checkersPieceCount,
  initialCheckersBoard,
  type Board as CheckersBoard,
} from "./checkers";
import { chessMoves, initialChessState } from "./chess";
import {
  initialChineseCheckers,
  chineseCheckersCells,
  chineseCheckersAreaSize,
  chineseCheckersPieceCount,
  coordKey,
} from "./chinese-checkers";
import {
  applyChronoTake,
  createChronoDeck,
  initialChronoSplit,
  scoreChronoTimeline,
  type Fragment,
} from "./chrono-split";
import { drawDomino, dominoPlays, initialDominoes } from "./dominoes";
import { drawDotsBoxesEdge, dotsBoxesWinners, initialDotsBoxes } from "./dots-and-boxes";
import {
  dropGravityFour,
  emptyGravityFourBoard,
  gravityFourBoardFull,
  gravityFourWinner,
  gfIndex,
  GF_COLS,
  GF_ROWS,
  type Board as GravityBoard,
} from "./gravity-four";
import { emptyHexBoard, HEX_SIZE, hexWinner } from "./hex";
import {
  applyFoxHoundsMove,
  FH_HARE_START,
  FH_HOUND_START,
  FH_LEFT_NODES,
  foxHoundsHoundDestinations,
  foxHoundsMoves,
  foxHoundsWinner,
  initialFoxHounds,
} from "./fox-hounds";
import { gomokuWinner } from "./gomoku";
import { initialKlondike } from "./klondike";
import {
  initialLudo,
  applyLudoMove,
  endLudoTurn,
  isLudoTokenFinished,
  ludoDeepestFinishSlot,
  ludoGoalCount,
  ludoMoveAnimationSteps,
  ludoMoves,
} from "./ludo";
import {
  initialMahjongSolitaire,
  isMahjongTileFree,
  removeMahjongPair,
} from "./mahjong-solitaire";
import { initialMancala, sowMancala } from "./mancala";
import {
  applyMiniShogiMove,
  canChoosePromotion,
  enemyBackRank,
  initialMiniShogiState,
  miniShogiIndex,
  miniShogiMoves,
  miniShogiPositionKey,
  miniShogiStatus,
  mustPromote,
  repetitionCount,
} from "./mini-shogi";
import {
  applyNebulaPass,
  applyNebulaPlace,
  initialNebulaLink,
  legalNebulaMoves,
  NEBULA_CORE,
  nebulaCoreRingProgress,
  nebulaTokensFor,
  nebulaVictoryPlayer,
  nebulaWinners,
} from "./nebula-link";
import {
  clickMorris,
  initialMorrisState,
  morrisCount,
  morrisFormsMill,
  morrisIsFlying,
  morrisRemovable,
} from "./nine-mens-morris";
import { initialNim, nimOver, takeNim, NIM_HEAPS } from "./nim";
import {
  initialReversiBoard,
  playReversiMove,
  reversiCounts,
  reversiLegalMoves,
  reversiNextPlayer,
} from "./reversi";
import { initialShogiState, shogiMoves } from "./shogi";
import {
  isSlideSolved,
  isSlideSolvable,
  shuffledSlide,
  slideCells,
  slideMove,
  solvedSlide,
  SLIDE_SIZE_OPTIONS,
} from "./slide-puzzle";
import {
  canDealSpider,
  dealSpider,
  initialSpider,
  removeCompletedSpider,
  spiderWon,
} from "./spider";
import {
  applyStarTradePlay,
  dealStarTradeRound,
  initialStarTrade,
  scoreStarTradeCards,
  scoreStarTradeRound,
} from "./star-trade";
import {
  applyTttPlace,
  emptyTttBoard,
  emptyTttHistories,
  tttBoardFull,
  tttRotatingOldest,
  tttWinner,
} from "./tic-tac-toe";

function assert(cond: boolean, message: string) {
  if (!cond) throw new Error(message);
}

function checkReversi() {
  const reversi = initialReversiBoard();
  const opening = reversiLegalMoves(reversi, 0);
  assert(opening.length === 4, `reversi opening moves ${opening.length}`);
  const after = playReversiMove(reversi, opening[0], 0);
  assert(after !== null, "reversi first move");
  assert(reversiCounts(after!)[0] > 2, "reversi flip increases black");
  assert(reversiNextPlayer(after!, 0) === 1, "reversi switches player");

  const fullBoard = Array<0 | 1 | null>(64).fill(null);
  for (let i = 0; i < 64; i++) fullBoard[i] = (i % 2) as 0 | 1;
  assert(reversiLegalMoves(fullBoard, 0).length === 0, "reversi full board no moves");
  assert(reversiLegalMoves(fullBoard, 1).length === 0, "reversi full board no moves p1");
  assert(reversiNextPlayer(fullBoard, 0) === null, "reversi both pass ends game");

  const tieBoard = initialReversiBoard();
  for (let i = 0; i < 64; i++) tieBoard[i] = i < 32 ? 0 : 1;
  const [dark, light] = reversiCounts(tieBoard);
  assert(dark === light, "reversi tie counts");
  assert(winnerIndices([dark, light]).length === 2, "reversi tie winners");
}

function checkMancala() {
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

  const noCapture = initialMancala();
  noCapture[0] = 1;
  noCapture[1] = 0;
  noCapture[11] = 0;
  const missed = sowMancala(noCapture, 0, 0);
  assert(missed !== null && !missed.captured, "mancala no capture when opposite empty");

  const endSide = initialMancala();
  for (let i = 0; i <= 5; i++) endSide[i] = 0;
  endSide[7] = 1;
  endSide[8] = 0;
  endSide[9] = 0;
  endSide[10] = 0;
  endSide[11] = 0;
  endSide[12] = 0;
  const ended = sowMancala(endSide, 1, 7);
  assert(ended !== null && ended.over, "mancala game ends when opponent side empty");
  assert(!ended!.extraTurn, "mancala extra turn cancelled on over");
  assert(
    ended!.pits.slice(0, 6).every((n) => n === 0) &&
      ended!.pits.slice(7, 13).every((n) => n === 0),
    "mancala pits cleared after game over"
  );

  assert(sowMancala(initialMancala(), 0, 6) === null, "mancala illegal opponent pit");
}

function checkGomoku() {
  const gomoku = Array(13 * 13).fill(null);
  for (let c = 0; c < 5; c++) gomoku[c] = 0;
  assert(gomokuWinner(gomoku) === 0, "gomoku row win");

  const g2 = Array(13 * 13).fill(null);
  for (let r = 0; r < 5; r++) g2[r * 13 + r] = 1;
  assert(gomokuWinner(g2) === 1, "gomoku diagonal win");

  const g3 = Array(13 * 13).fill(null);
  for (let c = 0; c < 4; c++) g3[c] = 0;
  assert(gomokuWinner(g3) === null, "gomoku four is not win");

  const g4 = Array(13 * 13).fill(null);
  for (let r = 0; r < 6; r++) g4[r * 13] = 0;
  assert(gomokuWinner(g4) === 0, "gomoku six in row wins");

  const almost = Array(13 * 13).fill(null);
  for (let c = 0; c < 4; c++) almost[c] = 0;
  assert(gomokuWinner(almost) === null, "gomoku four in row not win");
}

function checkCheckers() {
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

  const emptyBoard = Array(64).fill(null) as CheckersBoard;
  emptyBoard[checkersIndex(0, 1)] = { player: 0, king: false };
  assert(checkersPieceCount(emptyBoard, 1) === 0, "checkers zero pieces loses");
}

function checkMorris() {
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

  const millBoard = Array(24).fill(null);
  millBoard[0] = 0;
  millBoard[1] = 0;
  millBoard[2] = 0;
  millBoard[3] = 1;
  millBoard[4] = 1;
  millBoard[5] = 1;
  millBoard[10] = 1;
  const removable = morrisRemovable(millBoard, 1);
  assert(removable.includes(10) && !removable.includes(3), "morris prefer non-mill removal");

  const flyingState = initialMorrisState();
  flyingState.toPlace = [0, 0];
  flyingState.board = flyingState.board.map(() => null);
  flyingState.board[0] = 0;
  flyingState.board[1] = 0;
  flyingState.board[2] = 0;
  assert(morrisIsFlying(flyingState, 0), "morris flying at three pieces");
}

function checkTtt() {
  const ttt = emptyTttBoard();
  ttt[0] = 0;
  ttt[1] = 0;
  ttt[2] = 0;
  assert(tttWinner(ttt) === 0, "ttt row win");

  const col = emptyTttBoard();
  col[0] = 1;
  col[3] = 1;
  col[6] = 1;
  assert(tttWinner(col) === 1, "ttt column win");

  const draw = emptyTttBoard();
  const cat = [0, 0, 1, 1, 1, 0, 0, 1, 0];
  cat.forEach((p, i) => { draw[i] = p as 0 | 1; });
  assert(tttBoardFull(draw), "ttt board full");
  assert(tttWinner(draw) === null, "ttt draw");

  let rotatingBoard = emptyTttBoard();
  let rotatingHistories = emptyTttHistories();
  const r1 = applyTttPlace(rotatingBoard, rotatingHistories, 0, 0, "rotating");
  assert(r1 !== null, "ttt rotating place 1");
  rotatingBoard = r1!.board;
  rotatingHistories = r1!.histories;
  const r2 = applyTttPlace(rotatingBoard, rotatingHistories, 1, 0, "rotating");
  const r3 = applyTttPlace(r2!.board, r2!.histories, 2, 0, "rotating");
  const r4 = applyTttPlace(r3!.board, r3!.histories, 3, 0, "rotating");
  assert(r4!.board[0] === null && r4!.board[3] === 0, "ttt rotating drops oldest");
  assert(tttRotatingOldest(r3!.histories, 0) === 0, "ttt rotating oldest hint");
}

function checkGravityFour() {
  let gf: GravityBoard = emptyGravityFourBoard();
  for (let i = 0; i < 4; i++) {
    const next = dropGravityFour(gf, 0, 0);
    assert(next !== null, "gravity-four drop");
    gf = next!;
  }
  assert(gravityFourWinner(gf) === 0, "gravity-four vertical win");

  let horiz: GravityBoard = emptyGravityFourBoard();
  for (let c = 0; c < 4; c++) horiz = dropGravityFour(horiz, c, 0)!;
  assert(gravityFourWinner(horiz) === 0, "gravity-four horizontal win");

  const full: GravityBoard = emptyGravityFourBoard();
  for (let col = 0; col < GF_COLS; col++) {
    for (let row = 0; row < GF_ROWS; row++) {
      full[gfIndex(row, col)] = (col % 2) as 0 | 1;
    }
  }
  assert(dropGravityFour(full, 0, 0) === null, "gravity-four full column rejected");
  assert(gravityFourBoardFull(full), "gravity-four board full");
}

function checkDotsBoxes() {
  let db = initialDotsBoxes();
  db = drawDotsBoxesEdge(db, { kind: "h", row: 0, col: 0 })!;
  db = drawDotsBoxesEdge(db, { kind: "h", row: 0, col: 1 })!;
  db = drawDotsBoxesEdge(db, { kind: "v", row: 0, col: 0 })!;
  db = drawDotsBoxesEdge(db, { kind: "v", row: 0, col: 1 })!;
  const boxed = drawDotsBoxesEdge(db, { kind: "h", row: 1, col: 0 })!;
  assert(boxed !== null && boxed.scores[0] === 1, "dots-and-boxes capture");
  assert(boxed!.current === 0, "dots-and-boxes extra turn on capture");
  assert(dotsBoxesWinners([8, 8]).length === 2, "dots-and-boxes tie");
}

function checkNim() {
  let nim = initialNim();
  assert(nim.join(",") === NIM_HEAPS.join(","), "nim initial heaps");
  nim = takeNim(nim, 0, 3)!;
  nim = takeNim(nim, 1, 5)!;
  nim = takeNim(nim, 2, 6)!;
  nim = takeNim(nim, 2, 1)!;
  assert(nimOver(nim), "nim ends");
  assert(takeNim([1, 2, 3], 0, 0) === null, "nim reject zero take");
  assert(takeNim([1, 2, 3], 0, 2) === null, "nim reject over take");
}

function checkHex() {
  const hex = emptyHexBoard();
  for (let r = 0; r < HEX_SIZE; r++) hex[r * HEX_SIZE] = 0;
  assert(hexWinner(hex) === 0, "hex top-bottom win");

  const hex2 = emptyHexBoard().fill(1) as typeof hex;
  assert(hexWinner(hex2) === 1, "hex left-right win");
}

function checkFoxHounds() {
  const start = initialFoxHounds();
  assert(start.current === 0, "fox-hounds hounds move first");
  assert(start.board[FH_HARE_START] === 1, "fox-hounds hare at right tip");
  assert(
    FH_HOUND_START.every((node) => start.board[node] === 0),
    "fox-hounds hounds on left opening"
  );
  assert(start.board[2] === null, "fox-hounds left column center starts empty");
  assert(foxHoundsMoves(start, 0).length > 0, "fox-hounds opening hound moves");
  assert(foxHoundsWinner(start, 0) === null, "fox-hounds no early winner");

  assert(
    !foxHoundsHoundDestinations(start.board, 1).includes(0),
    "fox-hounds hounds cannot move backward to left tip"
  );

  const houndMove = foxHoundsMoves(start, 0)[0];
  const afterHound = applyFoxHoundsMove(start, houndMove.from, houndMove.to)!;
  assert(afterHound.current === 1, "fox-hounds hare turn after hound");

  const breakthrough = initialFoxHounds();
  breakthrough.board[FH_HARE_START] = null;
  breakthrough.board[FH_LEFT_NODES[1]] = 1;
  const won = foxHoundsWinner(breakthrough, 0);
  assert(won?.winner === 1 && won.reason === "hare-breakthrough", "fox-hounds hare breakthrough");

  const stalled = { ...initialFoxHounds(), stallTurns: 10 };
  assert(
    foxHoundsWinner(stalled, 0)?.reason === "hounds-stalling",
    "fox-hounds stalling limit"
  );
}

function checkMahjong() {
  const mj = initialMahjongSolitaire();
  assert(mj.tiles.length === 36, `mahjong solitaire has 36 tiles ${mj.tiles.length}`);
  assert(mj.tiles.every((t) => t.type != null), "mahjong solitaire all tiles typed");

  const blocked = mj.tiles.find((t) =>
    mj.tiles.some((u) => u.layer > t.layer && u.row === t.row && u.col === t.col)
  );
  if (blocked) assert(!isMahjongTileFree(mj, blocked), "mahjong blocked by upper tile");

  const free = mj.tiles.filter((t) => isMahjongTileFree(mj, t));
  if (free.length >= 2 && free[0].type === free[1].type) {
    const removed = removeMahjongPair(mj, free[0].id, free[1].id);
    assert(removed !== null && removed.removed.length === 2, "mahjong pair removed");
  }
}

function checkChess() {
  const chess = initialChessState();
  assert(chessMoves(chess).length === 20, `chess opening ${chessMoves(chess).length}`);
}

function checkKlondike() {
  const klondike = initialKlondike();
  assert(klondike.tableau.length === 7, "klondike tableau");

  const redHeart: PlayingCard = { id: "hA", suit: "heart", rank: "A" };
  const blackSpade: PlayingCard = { id: "s2", suit: "spade", rank: "2" };
  assert(canPlaceKlondikeFoundation(null, redHeart), "klondike foundation accepts ace");
  assert(!canPlaceKlondikeFoundation(null, blackSpade), "klondike foundation rejects non-ace");
  assert(canPlaceKlondikeTableau(null, { id: "sK", suit: "spade", rank: "K" }), "klondike empty column king");
  assert(!canPlaceKlondikeTableau(null, redHeart), "klondike empty column rejects non-king");
}

function checkSlidePuzzle() {
  for (const size of SLIDE_SIZE_OPTIONS) {
    const slide = shuffledSlide(size);
    assert(!isSlideSolved(slide, size), `slide ${size}x${size} starts unsolved`);
    assert(isSlideSolvable(slide, size), `slide ${size}x${size} shuffled solvable`);
    assert(isSlideSolvable(solvedSlide(size), size), `slide ${size}x${size} solved is solvable`);
    assert(isSlideSolved(solvedSlide(size), size), `slide ${size}x${size} solved state`);

    const swapped = solvedSlide(size);
    const cells = slideCells(size);
    swapped[cells - 3] = cells - 1;
    swapped[cells - 2] = cells - 2;
    assert(!isSlideSolvable(swapped, size), `slide ${size}x${size} rejects unsolvable swap`);

    const board = solvedSlide(size);
    const moved = slideMove(board, cells - 2, size);
    assert(moved !== null && !isSlideSolved(moved, size), `slide ${size}x${size} move works`);
    assert(isSlideSolvable(moved!, size), `slide ${size}x${size} one move stays solvable`);
    assert(slideMove(board, 0, size) === null, `slide ${size}x${size} rejects non-adjacent`);
  }
}

function checkDominoes() {
  const state = initialDominoes();
  assert(state.hands[0].length === 7 && state.hands[1].length === 7, "dominoes deal seven each");

  const blocked: typeof state = {
    hands: [[{ id: "x", high: 1, low: 2 }], []],
    boneyard: [],
    chain: [],
    ends: { left: 5, right: 6 },
    current: 0,
    winner: null,
  };
  assert(dominoPlays(blocked, 0).length === 0, "dominoes no play");
  const passed = drawDomino(blocked);
  assert(passed !== null && passed.current === 1, "dominoes pass when blocked");
}

function checkLudo() {
  const ludo = initialLudo(2);
  const rolled = { ...ludo, lastRoll: 6, extraTurn: true };
  const moves = ludoMoves(rolled);
  const yardMove = moves.find((m) => ludo.tokens[m.tokenIndex].zone === "yard");
  assert(yardMove != null, "ludo six starts token");
  const started = applyLudoMove(rolled, yardMove!);
  assert(started !== null && started.current === 0, "ludo extra turn after six start");

  const nearGoal = initialLudo(2);
  nearGoal.tokens[0] = { player: 0, index: 0, zone: "track", steps: 43 };
  for (let i = 1; i < 4; i++) {
    nearGoal.tokens[i] = { player: 0, index: i, zone: "home", steps: 3 };
  }
  for (let i = 4; i < 8; i++) {
    nearGoal.tokens[i] = { player: 2, index: i - 4, zone: "home", steps: 3 };
  }
  nearGoal.lastRoll = 6;
  assert(ludoMoves(nearGoal).length === 0, "ludo overshoot home rejected");

  const capture = initialLudo(2);
  capture.lastRoll = 3;
  capture.extraTurn = false;
  capture.tokens[0] = { player: 0, index: 0, zone: "track", steps: 5 };
  capture.tokens[4] = { player: 2, index: 0, zone: "track", steps: 30 };
  const capMove = ludoMoves(capture).find((m) => m.tokenIndex === 0);
  assert(capMove != null, "ludo capture move exists");
  const afterCap = applyLudoMove(capture, capMove!);
  assert(afterCap !== null && afterCap.tokens[4].zone === "yard", "ludo capture sends home");

  const startCapture = initialLudo(2);
  startCapture.lastRoll = 6;
  startCapture.extraTurn = true;
  startCapture.tokens[0] = { player: 0, index: 0, zone: "yard", steps: 0 };
  startCapture.tokens[4] = { player: 2, index: 0, zone: "track", steps: 22 };
  const startCapMove = ludoMoves(startCapture).find((m) => m.tokenIndex === 0);
  assert(startCapMove != null, "ludo can start onto occupied start square");
  const afterStartCap = applyLudoMove(startCapture, startCapMove!);
  assert(
    afterStartCap !== null && afterStartCap.tokens[4].zone === "yard",
    "ludo captures non-start enemy on start square"
  );

  const captureOnStart = initialLudo(2);
  captureOnStart.lastRoll = 1;
  captureOnStart.extraTurn = false;
  captureOnStart.tokens[0] = { player: 0, index: 0, zone: "track", steps: 21 };
  captureOnStart.tokens[4] = { player: 2, index: 0, zone: "track", steps: 0 };
  const captureOnStartMove = ludoMoves(captureOnStart).find((m) => m.tokenIndex === 0);
  assert(captureOnStartMove != null, "ludo can land on enemy start");
  const afterCaptureOnStart = applyLudoMove(captureOnStart, captureOnStartMove!);
  assert(
    afterCaptureOnStart !== null && afterCaptureOnStart.tokens[4].zone === "yard",
    "ludo captures enemy on start square"
  );

  const partialGoal = initialLudo(2);
  partialGoal.tokens[0] = { player: 0, index: 0, zone: "home", steps: 4 };
  assert(ludoGoalCount(partialGoal, 0) === 1, "ludo counts finished tokens as goal");
  partialGoal.tokens[1] = { player: 0, index: 1, zone: "home", steps: 1 };
  assert(ludoGoalCount(partialGoal, 0) === 1, "ludo mid-home token is not goal yet");

  const deepest = initialLudo(2);
  deepest.tokens[0] = { player: 0, index: 0, zone: "home", steps: 3 };
  deepest.lastRoll = 1;
  assert(ludoDeepestFinishSlot(deepest.tokens, 0) === 4, "ludo deepest slot defaults to 4");
  const deepestMove = ludoMoves(deepest).find((m) => m.tokenIndex === 0);
  assert(deepestMove != null, "ludo can reach deepest home slot");
  const atGoal = applyLudoMove(deepest, deepestMove!);
  assert(
    atGoal !== null && atGoal.tokens[0].zone === "home" && atGoal.tokens[0].steps === 4,
    "ludo deepest home slot reached"
  );
  assert(isLudoTokenFinished(atGoal!.tokens, 0), "ludo slot4 token is finished");

  const dynamicDeepest = initialLudo(2);
  dynamicDeepest.tokens[0] = { player: 0, index: 0, zone: "home", steps: 4 };
  dynamicDeepest.tokens[1] = { player: 0, index: 1, zone: "home", steps: 2 };
  dynamicDeepest.lastRoll = 1;
  assert(ludoDeepestFinishSlot(dynamicDeepest.tokens, 0) === 3, "ludo deepest retreats to slot3");
  const toSlot3 = ludoMoves(dynamicDeepest).find((m) => m.tokenIndex === 1);
  assert(toSlot3 != null, "ludo can finish at slot3 when slot4 taken");
  const atSlot3 = applyLudoMove(dynamicDeepest, toSlot3!);
  assert(
    atSlot3 !== null && isLudoTokenFinished(atSlot3.tokens, 1),
    "ludo slot3 finish when slot4 occupied"
  );

  const homeEntry = initialLudo(2);
  homeEntry.tokens[0] = { player: 0, index: 0, zone: "track", steps: 43 };
  homeEntry.lastRoll = 1;
  const homeEntryMove = ludoMoves(homeEntry).find((m) => m.tokenIndex === 0);
  assert(homeEntryMove != null, "ludo home entry roll 1 advances");
  const afterHomeEntry = applyLudoMove(homeEntry, homeEntryMove!);
  assert(
    afterHomeEntry !== null &&
      afterHomeEntry.tokens[0].zone === "home" &&
      afterHomeEntry.tokens[0].steps === 1,
    "ludo home entry roll 1 reaches slot1"
  );

  const homeFromApproach = initialLudo(2);
  homeFromApproach.tokens[0] = { player: 0, index: 0, zone: "track", steps: 42 };
  homeFromApproach.lastRoll = 2;
  const homeFromApproachMove = ludoMoves(homeFromApproach).find((m) => m.tokenIndex === 0);
  assert(homeFromApproachMove != null, "ludo approach roll 2 enters home");
  const afterApproach = applyLudoMove(homeFromApproach, homeFromApproachMove!);
  assert(
    afterApproach !== null &&
      afterApproach.tokens[0].zone === "home" &&
      afterApproach.tokens[0].steps === 1,
    "ludo approach roll 2 reaches slot1"
  );

  const homeEntryNoCapture = initialLudo(2);
  homeEntryNoCapture.lastRoll = 2;
  homeEntryNoCapture.tokens[0] = { player: 0, index: 0, zone: "track", steps: 42 };
  homeEntryNoCapture.tokens[4] = { player: 2, index: 0, zone: "track", steps: 21 };
  const homeEntryNoCaptureMove = ludoMoves(homeEntryNoCapture).find((m) => m.tokenIndex === 0);
  assert(homeEntryNoCaptureMove != null, "ludo can enter home past entry");
  const afterHomeEntryNoCapture = applyLudoMove(homeEntryNoCapture, homeEntryNoCaptureMove!);
  assert(
    afterHomeEntryNoCapture !== null && afterHomeEntryNoCapture.tokens[4].zone === "track",
    "ludo does not capture on home entry when overshooting past slot0"
  );

  const homeEntryCapture = initialLudo(2);
  homeEntryCapture.lastRoll = 1;
  homeEntryCapture.tokens[0] = { player: 0, index: 0, zone: "track", steps: 42 };
  homeEntryCapture.tokens[4] = { player: 2, index: 0, zone: "track", steps: 21 };
  const homeEntryCaptureMove = ludoMoves(homeEntryCapture).find((m) => m.tokenIndex === 0);
  assert(homeEntryCaptureMove != null, "ludo can land on home entry");
  const afterHomeEntryCapture = applyLudoMove(homeEntryCapture, homeEntryCaptureMove!);
  assert(
    afterHomeEntryCapture !== null && afterHomeEntryCapture.tokens[4].zone === "yard",
    "ludo captures enemy when stopping exactly on home entry"
  );

  const blockedHome = initialLudo(2);
  blockedHome.tokens[0] = { player: 0, index: 0, zone: "home", steps: 0 };
  blockedHome.tokens[1] = { player: 0, index: 1, zone: "home", steps: 1 };
  blockedHome.lastRoll = 1;
  assert(
    ludoMoves(blockedHome).find((m) => m.tokenIndex === 0) == null,
    "ludo cannot land on occupied inner home slot"
  );
  blockedHome.lastRoll = 2;
  const homeJump = ludoMoves(blockedHome).find((m) => m.tokenIndex === 0);
  assert(homeJump != null, "ludo can jump over own piece in home column");
  const afterHomeJump = applyLudoMove(blockedHome, homeJump!);
  assert(
    afterHomeJump !== null && afterHomeJump.tokens[0].zone === "home" && afterHomeJump.tokens[0].steps === 2,
    "ludo home jump lands on deepest empty slot"
  );

  const homeJumpFinish = initialLudo(4);
  homeJumpFinish.current = 1;
  homeJumpFinish.lastRoll = 2;
  homeJumpFinish.tokens[4] = { player: 1, index: 0, zone: "home", steps: 1 };
  homeJumpFinish.tokens[5] = { player: 1, index: 1, zone: "home", steps: 2 };
  homeJumpFinish.tokens[6] = { player: 1, index: 2, zone: "home", steps: 4 };
  for (const i of [0, 1, 2, 3]) {
    homeJumpFinish.tokens[i] = { player: 0, index: i, zone: "yard", steps: 0 };
  }
  homeJumpFinish.tokens[7] = { player: 1, index: 3, zone: "yard", steps: 0 };
  const jumpFinishMove = ludoMoves(homeJumpFinish).find((m) => m.tokenIndex === 4);
  assert(jumpFinishMove != null, "ludo slot1 jumps to slot3 with roll 2");
  const afterJumpFinish = applyLudoMove(homeJumpFinish, jumpFinishMove!);
  assert(
    afterJumpFinish !== null &&
      afterJumpFinish.tokens[4].steps === 3 &&
      isLudoTokenFinished(afterJumpFinish.tokens, 4) &&
      isLudoTokenFinished(afterJumpFinish.tokens, 5),
    "ludo jump finishes passed and inner tokens"
  );
  assert(ludoDeepestFinishSlot(afterJumpFinish!.tokens, 1) === 1, "ludo deepest retreats to slot1 after jump");

  const homeEntryJumpWin = initialLudo(4);
  homeEntryJumpWin.current = 1;
  homeEntryJumpWin.lastRoll = 4;
  homeEntryJumpWin.tokens[4] = { player: 1, index: 0, zone: "home", steps: 1 };
  homeEntryJumpWin.tokens[5] = { player: 1, index: 1, zone: "home", steps: 2 };
  homeEntryJumpWin.tokens[6] = { player: 1, index: 2, zone: "home", steps: 4 };
  homeEntryJumpWin.tokens[7] = { player: 1, index: 3, zone: "track", steps: 42 };
  for (const i of [0, 1, 2, 3]) {
    homeEntryJumpWin.tokens[i] = { player: 0, index: i, zone: "yard", steps: 0 };
  }
  for (const i of [8, 9, 10, 11]) {
    homeEntryJumpWin.tokens[i] = { player: 2, index: i - 8, zone: "yard", steps: 0 };
  }
  for (const i of [12, 13, 14, 15]) {
    homeEntryJumpWin.tokens[i] = { player: 3, index: i - 12, zone: "yard", steps: 0 };
  }
  const entryJumpMove = ludoMoves(homeEntryJumpWin).find((m) => m.tokenIndex === 7);
  assert(entryJumpMove != null, "ludo track piece jumps into deepest home slot");
  const afterEntryJumpWin = applyLudoMove(homeEntryJumpWin, entryJumpMove!);
  assert(
    afterEntryJumpWin !== null && afterEntryJumpWin.winner === 1,
    "ludo entry jump to slot3 can win when all tokens finish"
  );

  const entryStack = initialLudo(2);
  entryStack.tokens[0] = { player: 0, index: 0, zone: "home", steps: 0 };
  entryStack.tokens[1] = { player: 0, index: 1, zone: "track", steps: 43 };
  entryStack.lastRoll = 1;
  assert(
    ludoMoves(entryStack).find((m) => m.tokenIndex === 1) != null,
    "ludo home entry allows stacking"
  );

  const slot3Finished = initialLudo(2);
  slot3Finished.tokens[0] = { player: 0, index: 0, zone: "home", steps: 4 };
  slot3Finished.tokens[1] = { player: 0, index: 1, zone: "home", steps: 3 };
  slot3Finished.lastRoll = 1;
  assert(isLudoTokenFinished(slot3Finished.tokens, 1), "ludo slot3 finished when slot4 occupied");
  assert(ludoMoves(slot3Finished).length === 0, "ludo finished tokens cannot move");

  const yardSteps = ludoMoveAnimationSteps(ludo.tokens[0], 6);
  assert(yardSteps.length === 1 && yardSteps[0].zone === "track" && yardSteps[0].steps === 0, "ludo yard anim is one step to start");

  const trackSteps = ludoMoveAnimationSteps(
    { player: 0, index: 0, zone: "track", steps: 5 },
    3
  );
  assert(
    trackSteps.length === 3 &&
      trackSteps[0].steps === 6 &&
      trackSteps[2].steps === 8,
    "ludo track anim steps one pip at a time"
  );

  const sixNoMove = initialLudo(4);
  sixNoMove.current = 1;
  sixNoMove.lastRoll = 6;
  sixNoMove.extraTurn = true;
  for (let i = 4; i <= 7; i++) {
    sixNoMove.tokens[i] = { player: 1, index: i - 4, zone: "home", steps: 1 };
  }
  sixNoMove.tokens[5] = { player: 1, index: 1, zone: "home", steps: 2 };
  sixNoMove.tokens[6] = { player: 1, index: 2, zone: "home", steps: 4 };
  assert(ludoMoves(sixNoMove).length === 0, "ludo six with blocked home has no moves");
  const afterSixPass = endLudoTurn(sixNoMove);
  assert(
    afterSixPass.current === 1 && afterSixPass.lastRoll === null && !afterSixPass.extraTurn,
    "ludo six bonus allows reroll when no legal move"
  );

  const threeNoMove = initialLudo(2);
  threeNoMove.lastRoll = 3;
  threeNoMove.extraTurn = false;
  for (const i of [0, 1, 2, 3]) {
    threeNoMove.tokens[i] = { player: 0, index: i, zone: "yard", steps: 0 };
  }
  const afterThreePass = endLudoTurn(threeNoMove);
  assert(
    afterThreePass.current === 2 && afterThreePass.lastRoll === null,
    "ludo non-six pass advances turn"
  );
}

function checkBackgammon() {
  const bg = initialBackgammon();
  assert(bg.points.length === 24, "backgammon 24 points");

  const barState = initialBackgammon();
  barState.bar[0] = 1;
  barState.dice = [3, 4];
  barState.movesLeft = [3, 4];
  const barMoves = backgammonMoves(barState);
  assert(barMoves.every((m) => m.from === "bar"), "backgammon bar moves only when on bar");

  const doubles = rollBackgammon({ ...initialBackgammon(), dice: null, movesLeft: [] });
  if (doubles.dice && doubles.dice[0] === doubles.dice[1]) {
    assert(doubles.movesLeft.length === 4, "backgammon doubles four moves");
  }
}

function checkShogi() {
  const shogi = initialShogiState();
  assert(shogiMoves(shogi).length > 0, "shogi opening moves");
  const mini = initialMiniShogiState();
  assert(miniShogiMoves(mini).length > 0, "mini-shogi opening moves");
  assert(mini.board[miniShogiIndex(0, 0)]?.type === "R", "mini-shogi gote rook at 5一");
  assert(mini.board[miniShogiIndex(4, 4)]?.type === "R", "mini-shogi sente rook at 1五");
  assert(mini.hands[0].G === 0 && mini.hands[1].G === 0, "mini-shogi no initial hand");
  assert(
    !miniShogiMoves(mini).some(
      (m) => m.kind === "drop" && m.piece === "P" && m.to === enemyBackRank(0)
    ),
    "mini-shogi no pawn drop on last rank"
  );

  const sentePawn = mini.board[miniShogiIndex(3, 0)]!;
  assert(
    mustPromote(sentePawn, miniShogiIndex(0, 0)),
    "mini-shogi pawn must promote on enemy back rank"
  );
  const senteSilver = mini.board[miniShogiIndex(4, 2)]!;
  assert(
    canChoosePromotion(senteSilver, miniShogiIndex(1, 2), miniShogiIndex(0, 2)),
    "mini-shogi silver can promote when entering enemy back rank"
  );
  assert(
    !canChoosePromotion(senteSilver, miniShogiIndex(4, 2), miniShogiIndex(3, 2)),
    "mini-shogi silver no promotion on own territory"
  );

  const promoState: ReturnType<typeof initialMiniShogiState> = {
    board: Array(25).fill(null),
    hands: [
      { G: 0, S: 0, B: 0, R: 0, P: 0 },
      { G: 0, S: 0, B: 0, R: 0, P: 0 },
    ],
    current: 0,
    positionCounts: {},
  };
  promoState.board[miniShogiIndex(1, 2)] = { type: "S", player: 0, promoted: false };
  promoState.board[miniShogiIndex(4, 0)] = { type: "K", player: 0, promoted: false };
  promoState.positionCounts[miniShogiPositionKey(promoState)] = 1;
  const promoChoice = miniShogiMoves(promoState).filter(
    (m) =>
      m.kind === "move" &&
      m.from === miniShogiIndex(1, 2) &&
      m.to === miniShogiIndex(0, 2)
  );
  assert(promoChoice.length === 2, "mini-shogi promotion choice when entering enemy back rank");

  const kingCapture: ReturnType<typeof initialMiniShogiState> = {
    board: Array(25).fill(null),
    hands: [
      { G: 0, S: 0, B: 0, R: 0, P: 0 },
      { G: 0, S: 0, B: 0, R: 0, P: 0 },
    ],
    current: 0,
    positionCounts: {},
  };
  kingCapture.board[miniShogiIndex(0, 2)] = { type: "K", player: 1, promoted: false };
  kingCapture.board[miniShogiIndex(4, 2)] = { type: "R", player: 0, promoted: false };
  kingCapture.positionCounts[miniShogiPositionKey(kingCapture)] = 1;
  const capturedKing = applyMiniShogiMove(kingCapture, {
    kind: "move",
    from: miniShogiIndex(4, 2),
    to: miniShogiIndex(0, 2),
    promote: false,
  });
  assert(
    miniShogiStatus(capturedKing).kind === "king-captured",
    "mini-shogi king capture wins"
  );

  const rep = initialMiniShogiState();
  assert(repetitionCount(rep) === 1, "mini-shogi initial position counted once");
  const repKey = miniShogiPositionKey(rep);
  rep.positionCounts[repKey] = 4;
  assert(miniShogiStatus(rep).kind === "repetition", "mini-shogi repetition gote wins");
}

function checkSpider() {
  const spider = initialSpider();
  const colCounts = spider.columns.map((c) => c.length);
  assert(colCounts.join(",") === "6,6,6,6,5,5,5,5,5,5", `spider deal ${colCounts}`);
  assert(spider.stock.length === 50, `spider stock ${spider.stock.length}`);

  const emptyCol = initialSpider();
  emptyCol.columns[0] = [];
  assert(!canDealSpider(emptyCol), "spider cannot deal with empty column");
  assert(dealSpider(emptyCol) === null, "spider deal returns null");

  assert(!spiderWon(spider), "spider not won initially");
}

function checkChineseCheckers() {
  for (let players = 2; players <= 3; players++) {
    const state = initialChineseCheckers(players);
    for (let p = 0; p < players; p++) {
      const pieces = chineseCheckersPieceCount(state, p);
      const startSize = chineseCheckersAreaSize(p, players, "start");
      const goalSize = chineseCheckersAreaSize(p, players, "goal");
      assert(startSize === goalSize, `chinese-checkers ${players}p P${p} start ${startSize} vs goal ${goalSize}`);
      assert(pieces === startSize, `chinese-checkers ${players}p P${p} pieces ${pieces} vs start ${startSize}`);
    }
  }
  assert(chineseCheckersCells().length === 81, "chinese-checkers 81 cells");
  assert(coordKey({ q: 0, r: 0 }) === "0,0", "chinese-checkers coord key");
}

function checkNebulaLink() {
  assert(nebulaTokensFor(2) === 12, "nebula 2p tokens");
  assert(nebulaTokensFor(3) === 8, "nebula 3p tokens");
  assert(nebulaTokensFor(4) === 6, "nebula 4p tokens");

  const board = Array<number | null>(25).fill(null);
  board[NEBULA_CORE] = -1;
  board[0] = 0;
  board[6] = 0;
  board[1] = 1;
  assert(nebulaCoreRingProgress(board, 0) === 0, "nebula no core ring yet");
  assert(nebulaCoreRingProgress(board, 1) === 0, "nebula isolated piece");

  const winBoard = Array<number | null>(25).fill(null);
  winBoard[NEBULA_CORE] = -1;
  winBoard[7] = 0;
  winBoard[6] = 0;
  winBoard[11] = 0;
  winBoard[8] = 0;
  winBoard[13] = 0;
  assert(nebulaVictoryPlayer(winBoard, 2) === 0, "nebula core ring win");
  assert(nebulaCoreRingProgress(winBoard, 0) === 3, "nebula core ring progress");

  let state = initialNebulaLink(2);
  assert(applyNebulaPlace(state, NEBULA_CORE) === null, "nebula cannot place on core");
  assert(applyNebulaPlace(state, 0) !== null, "nebula legal first place");
  state = applyNebulaPlace(state, 0)!;
  state = applyNebulaPlace(state, 24)!;
  assert(legalNebulaMoves(state.board, 0, 11, 2).includes(1), "nebula grows from own node");
  assert(
    !legalNebulaMoves(state.board, 0, 11, 2).includes(20),
    "nebula cannot place away from own group"
  );

  assert(applyNebulaPass(initialNebulaLink(2)) === null, "nebula cannot pass with legal move");
}

function checkChronoSplit() {
  const deck = createChronoDeck();
  assert(deck.length === 24, "chrono deck size");

  const line: (Fragment | null)[] = [
    { id: "a", era: "past", value: 1 },
    { id: "b", era: "past", value: 2 },
    { id: "c", era: "past", value: 3 },
    { id: "d", era: "past", value: 4 },
    null,
  ];
  assert(scoreChronoTimeline(line).adjacent === 6, "chrono resonance pairs");

  const eras: (Fragment | null)[] = [
    { id: "a", era: "past", value: 1 },
    { id: "b", era: "present", value: 2 },
    { id: "c", era: "future", value: 3 },
    { id: "d", era: "past", value: 1 },
    { id: "e", era: "present", value: 2 },
  ];
  assert(scoreChronoTimeline(eras).eraBonus === 3, "chrono three eras bonus");

  const inc: (Fragment | null)[] = [1, 2, 3, 4, 5].map((v, i) => ({
    id: `i${i}`,
    era: "past" as const,
    value: v,
  }));
  assert(scoreChronoTimeline(inc).increaseBonus === 7, "chrono strict increase bonus");

  let game = initialChronoSplit(2, deck);
  const cardId = game.offer[0].id;
  const taken = applyChronoTake(game, cardId, 0);
  assert(taken !== null && taken.currentPlayer === 1, "chrono turn passes");
  assert(applyChronoTake(game, cardId, 0) !== null, "chrono legal take");
}

function checkStarTrade() {
  const twoKind = scoreStarTradeCards([
    { id: "a", suit: "star", value: 3 },
    { id: "b", suit: "moon", value: 4 },
  ]);
  assert(twoKind.bonus === 2 && twoKind.total === 9, "star-trade two suits bonus");

  const threeKind = scoreStarTradeCards([
    { id: "a", suit: "star", value: 1 },
    { id: "b", suit: "moon", value: 2 },
    { id: "c", suit: "sun", value: 3 },
  ]);
  assert(threeKind.bonus === 5, "star-trade three suits bonus");

  const dealt = dealStarTradeRound(2);
  assert(dealt.hands[0].length === 3 && dealt.hands[1].length === 3, "star-trade deal three each");
  assert(dealt.deck.length === 14, "star-trade deck remainder");

  let state = initialStarTrade(2);
  const drawn = applyStarTradePlay(state, state.hands[0][0].id);
  assert(drawn === null, "star-trade must draw before play");

  const roundScores = scoreStarTradeRound(
    [[{ id: "a", suit: "star", value: 5 }], []],
    [[], [{ id: "b", suit: "moon", value: 5 }]]
  );
  assert(roundScores[0] === 5 && roundScores[1] === 5, "star-trade round scoring");
}

export function runPlayEngineChecks() {
  checkReversi();
  checkMancala();
  checkGomoku();
  checkCheckers();
  checkMorris();
  checkTtt();
  checkGravityFour();
  checkDotsBoxes();
  checkNim();
  checkHex();
  checkFoxHounds();
  checkMahjong();
  checkChess();
  checkKlondike();
  checkSlidePuzzle();
  checkDominoes();
  checkLudo();
  checkBackgammon();
  checkShogi();
  checkSpider();
  checkChineseCheckers();
  checkNebulaLink();
  checkChronoSplit();
  checkStarTrade();
}

if (typeof process !== "undefined" && process.argv[1]?.includes("check-engines")) {
  runPlayEngineChecks();
  console.log("play engine checks ok");
}
