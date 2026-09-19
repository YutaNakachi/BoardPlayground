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
import { foxHoundsMoves, foxHoundsWinner, initialFoxHounds, FH_SIZE } from "./fox-hounds";
import { gomokuWinner } from "./gomoku";
import { initialKlondike } from "./klondike";
import { initialLudo, applyLudoMove, ludoMoves } from "./ludo";
import {
  initialMahjongSolitaire,
  isMahjongTileFree,
  removeMahjongPair,
} from "./mahjong-solitaire";
import { initialMancala, sowMancala } from "./mancala";
import { miniShogiMoves, initialMiniShogiState } from "./mini-shogi";
import {
  applyNebulaPlace,
  initialNebulaLink,
  NEBULA_CORE,
  nebulaLargestGroup,
  nebulaScorePlayer,
  nebulaTokensFor,
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
  shuffledSlide,
  slideMove,
  solvedSlide,
  isSlideSolvable,
  SLIDE_CELLS,
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
import { emptyTttBoard, tttBoardFull, tttWinner } from "./tic-tac-toe";

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
  const fox = initialFoxHounds();
  assert(foxHoundsMoves(fox, 0).length > 0, "fox opening moves");
  assert(foxHoundsWinner(fox, 0) === null, "fox-hounds no early winner");
  const rabbitStart = fox.indexOf(0);
  assert(rabbitStart === 7 * FH_SIZE + 3, `fox-hounds rabbit starts bottom center ${rabbitStart}`);

  const winBoard = initialFoxHounds();
  const foxIdx = winBoard.indexOf(0);
  winBoard[foxIdx] = null;
  winBoard[3] = 0;
  assert(foxHoundsWinner(winBoard, 1) === 0, "fox-hounds rabbit reaches top");

  const trapped = initialFoxHounds();
  const tIdx = trapped.indexOf(0);
  trapped[tIdx] = null;
  trapped[tIdx - FH_SIZE] = 0;
  for (const m of foxHoundsMoves(trapped, 0)) trapped[m] = 1;
  assert(foxHoundsWinner(trapped, 0) === 1, "fox-hounds rabbit trapped");
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
  const slide = shuffledSlide();
  assert(!isSlideSolved(slide), "slide puzzle starts unsolved");
  assert(isSlideSolvable(slide), "slide puzzle shuffled solvable");
  assert(isSlideSolved(solvedSlide()), "slide puzzle solved state");
  const board = solvedSlide();
  const moved = slideMove(board, SLIDE_CELLS - 2);
  assert(moved !== null && !isSlideSolved(moved), "slide puzzle move works");
  assert(slideMove(board, 0) === null, "slide puzzle rejects non-adjacent");
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
  assert(moves.some((m) => m.steps === 0), "ludo six starts token");
  const started = applyLudoMove(rolled, moves.find((m) => m.steps === 0)!);
  assert(started !== null && started.current === 0, "ludo extra turn after six start");

  const nearGoal = initialLudo(2);
  nearGoal.tokens[0].position = 57;
  nearGoal.lastRoll = 2;
  assert(ludoMoves(nearGoal).length === 0, "ludo overshoot home rejected");
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
  assert(
    !miniShogiMoves(mini).some(
      (m) => m.kind === "drop" && m.piece === "P" && m.to === 0
    ),
    "mini-shogi no pawn drop on last rank"
  );
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
  assert(nebulaLargestGroup(board, 0) === 1, "nebula diagonal not connected");
  assert(nebulaLargestGroup(board, 1) === 1, "nebula isolated piece");

  const adjBoard = Array<number | null>(25).fill(null);
  adjBoard[NEBULA_CORE] = -1;
  for (const n of [7, 11, 13, 17]) adjBoard[n] = 0;
  assert(nebulaScorePlayer(adjBoard, 0).adj === 4, "nebula core adjacency");

  let state = initialNebulaLink(2);
  assert(applyNebulaPlace(state, NEBULA_CORE) === null, "nebula cannot place on core");
  assert(applyNebulaPlace(state, 0) !== null, "nebula legal place");

  const tieBoard = Array<number | null>(25).fill(null);
  tieBoard[NEBULA_CORE] = -1;
  tieBoard[0] = 0;
  tieBoard[1] = 1;
  tieBoard[2] = 0;
  tieBoard[3] = 1;
  const tieState = { ...initialNebulaLink(2), board: tieBoard, remaining: [0, 0], gameOver: true };
  assert(nebulaWinners(tieState).length === 2, "nebula tie winners");
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
