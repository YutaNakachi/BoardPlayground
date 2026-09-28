import {
  applySenkaiAction,
  legalActionsForPiece,
  shootTarget,
  ssCoord,
  type PieceType,
  type Player,
  type SenkaiAction,
  type SenkaiState,
} from "@/lib/play/senkai-senki";

export type CpuDifficulty = "easy" | "normal" | "hard";

export type SenkaiMoveChoice = {
  pieceId: number;
  action: SenkaiAction;
};

const WIN_SCORE = 1_000_000;

const PIECE_VALUE: Record<PieceType, number> = {
  command: 800,
  heavy: 70,
  light: 45,
  scout: 40,
};

function opponent(p: Player): Player {
  return p === 0 ? 1 : 0;
}

function findCommandCell(state: SenkaiState, owner: Player): number | null {
  for (const p of Object.values(state.pieces)) {
    if (p.owner === owner && p.type === "command") {
      const cell = state.cells.findIndex((c) => c === p.id);
      if (cell >= 0) return cell;
    }
  }
  return null;
}

function manhattan(cellA: number, cellB: number): number {
  const a = ssCoord(cellA);
  const b = ssCoord(cellB);
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

function minDistanceToCommand(
  state: SenkaiState,
  me: Player,
  commandCell: number
): number {
  let best = 99;
  for (const p of Object.values(state.pieces)) {
    if (p.owner !== me) continue;
    const from = state.cells.findIndex((c) => c === p.id);
    if (from < 0) continue;
    best = Math.min(best, manhattan(from, commandCell));
  }
  return best;
}

function materialBalance(state: SenkaiState, me: Player): number {
  let balance = 0;
  for (const p of Object.values(state.pieces)) {
    const v = PIECE_VALUE[p.type];
    balance += p.owner === me ? v : -v;
  }
  return balance;
}

function rotateTokenBalance(state: SenkaiState, me: Player): number {
  let balance = 0;
  for (const p of Object.values(state.pieces)) {
    if (p.type === "command" || !p.rotateToken) continue;
    balance += p.owner === me ? 14 : -14;
  }
  return balance;
}

/** 手番側が相手の指揮車を射撃できるか */
function canShootEnemyCommand(state: SenkaiState, shooter: Player): boolean {
  const targetCell = findCommandCell(state, opponent(shooter));
  if (targetCell === null) return false;
  if (state.current !== shooter) return false;
  for (const p of Object.values(state.pieces)) {
    if (p.owner !== shooter) continue;
    if (shootTarget(state, p.id) === targetCell) return true;
  }
  return false;
}

function evaluateState(state: SenkaiState, perspective: Player): number {
  if (state.gameOver) {
    if (state.winner === perspective) return WIN_SCORE;
    if (state.winner === opponent(perspective)) return -WIN_SCORE;
    return 0;
  }

  const enemyCmd = findCommandCell(state, opponent(perspective));
  const myCmd = findCommandCell(state, perspective);
  if (enemyCmd === null) return WIN_SCORE - 1;
  if (myCmd === null) return -WIN_SCORE + 1;

  let score = materialBalance(state, perspective) * 0.35;
  score += rotateTokenBalance(state, perspective);
  score -= minDistanceToCommand(state, perspective, enemyCmd) * 10;

  if (state.current === perspective && canShootEnemyCommand(state, perspective)) {
    score += 180;
  }
  if (
    state.current === opponent(perspective) &&
    canShootEnemyCommand(state, opponent(perspective))
  ) {
    score -= 220;
  }

  return score;
}

function captureBonus(
  state: SenkaiState,
  choice: SenkaiMoveChoice,
  perspective: Player
): number {
  const mover = state.pieces[choice.pieceId];
  if (!mover || mover.owner !== perspective) return 0;

  if (choice.action.kind === "shoot") {
    const targetIdx = shootTarget(state, choice.pieceId);
    if (targetIdx === null) return 0;
    const targetId = state.cells[targetIdx];
    if (targetId === null) return 0;
    const target = state.pieces[targetId];
    if (!target || target.owner === perspective) return 0;
    return target.type === "command" ? WIN_SCORE - 50 : PIECE_VALUE[target.type];
  }

  if (choice.action.kind === "move") {
    const targetId = state.cells[choice.action.to];
    if (targetId === null) return 0;
    const target = state.pieces[targetId];
    if (!target || target.owner === perspective) return 0;
    if (target.type === "command") return WIN_SCORE - 50;
    let bonus = PIECE_VALUE[target.type];
    if (mover.type === "scout") bonus -= 35;
    return bonus;
  }

  return 0;
}

function scoreMove(
  state: SenkaiState,
  choice: SenkaiMoveChoice,
  perspective: Player
): number | null {
  const next = applySenkaiAction(state, choice.pieceId, choice.action);
  if (!next) return null;

  if (next.gameOver) {
    if (next.winner === perspective) return WIN_SCORE;
    if (next.winner === opponent(perspective)) return -WIN_SCORE;
  }

  let score = evaluateState(next, perspective);
  score += captureBonus(state, choice, perspective);

  if (choice.action.kind === "rotate") {
    if (canShootEnemyCommand(next, perspective)) score += 55;
    else if (next.lockedAfterRotate !== null) score += 12;
  }

  if (choice.action.kind === "shoot") score += 25;

  return score;
}

function scoreAllMoves(
  state: SenkaiState,
  legal: SenkaiMoveChoice[],
  perspective: Player
): { choice: SenkaiMoveChoice; score: number }[] {
  const scored: { choice: SenkaiMoveChoice; score: number }[] = [];
  for (const choice of legal) {
    const score = scoreMove(state, choice, perspective);
    if (score !== null) scored.push({ choice, score });
  }
  return scored;
}

function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)] ?? null;
}

function pickFromTopTier(
  scored: { choice: SenkaiMoveChoice; score: number }[],
  slack: number
): SenkaiMoveChoice | null {
  if (scored.length === 0) return null;
  const max = Math.max(...scored.map((s) => s.score));
  const tier = scored.filter((s) => s.score >= max - slack);
  return pickRandom(tier)?.choice ?? null;
}

function pickFromBottomTier(
  scored: { choice: SenkaiMoveChoice; score: number }[],
  slack: number
): SenkaiMoveChoice | null {
  if (scored.length === 0) return null;
  const min = Math.min(...scored.map((s) => s.score));
  const tier = scored.filter((s) => s.score <= min + slack);
  return pickRandom(tier)?.choice ?? null;
}

/** 相手の最善応手を想定した評価（perspective 視点） */
function scoreAfterOpponentReplies(
  stateAfterMove: SenkaiState,
  perspective: Player,
  depth: "one" | "two"
): number {
  if (stateAfterMove.gameOver) {
    return evaluateState(stateAfterMove, perspective);
  }

  const opp = opponent(perspective);
  if (stateAfterMove.current !== opp) {
    return evaluateState(stateAfterMove, perspective);
  }

  const replies = enumerateLegalActions(stateAfterMove);
  if (replies.length === 0) {
    return evaluateState(stateAfterMove, perspective);
  }

  let worst = Infinity;
  for (const reply of replies) {
    const afterReply = applySenkaiAction(
      stateAfterMove,
      reply.pieceId,
      reply.action
    );
    if (!afterReply) continue;

    let val: number;
    if (afterReply.gameOver) {
      val = evaluateState(afterReply, perspective);
    } else if (depth === "two" && afterReply.current === perspective) {
      const counters = enumerateLegalActions(afterReply);
      if (counters.length === 0) {
        val = evaluateState(afterReply, perspective);
      } else {
        let bestCounter = -Infinity;
        for (const counter of counters) {
          const s = scoreMove(afterReply, counter, perspective);
          if (s !== null) bestCounter = Math.max(bestCounter, s);
        }
        val =
          bestCounter > -Infinity
            ? bestCounter * 0.55 + evaluateState(afterReply, perspective) * 0.45
            : evaluateState(afterReply, perspective);
      }
    } else {
      const replyScore = scoreMove(stateAfterMove, reply, perspective);
      val =
        replyScore !== null
          ? replyScore
          : evaluateState(afterReply, perspective);
    }

    worst = Math.min(worst, val);
  }

  return worst;
}

export function enumerateLegalActions(state: SenkaiState): SenkaiMoveChoice[] {
  if (state.gameOver) return [];
  const choices: SenkaiMoveChoice[] = [];
  for (const p of Object.values(state.pieces)) {
    if (p.owner !== state.current) continue;
    for (const action of legalActionsForPiece(state, p.id)) {
      choices.push({ pieceId: p.id, action });
    }
  }
  return choices;
}

function chooseHard(
  state: SenkaiState,
  legal: SenkaiMoveChoice[],
  perspective: Player
): SenkaiMoveChoice | null {
  let best: SenkaiMoveChoice | null = null;
  let bestScore = -Infinity;

  for (const choice of legal) {
    const next = applySenkaiAction(state, choice.pieceId, choice.action);
    if (!next) continue;

    let score = scoreMove(state, choice, perspective);
    if (score === null) continue;

    if (!next.gameOver && next.current === opponent(perspective)) {
      const replyVal = scoreAfterOpponentReplies(next, perspective, "two");
      score = score * 0.25 + replyVal * 0.75;
    } else if (!next.gameOver && next.current === perspective) {
      score = score * 0.4 + evaluateState(next, perspective) * 0.6;
    }

    if (score > bestScore) {
      bestScore = score;
      best = choice;
    }
  }

  return best;
}

function chooseEasy(
  state: SenkaiState,
  legal: SenkaiMoveChoice[],
  perspective: Player
): SenkaiMoveChoice | null {
  const scored = scoreAllMoves(state, legal, perspective);
  if (scored.length === 0) return pickRandom(legal);

  const wins = scored.filter((s) => s.score >= WIN_SCORE - 1000);
  if (wins.length > 0) return pickRandom(wins)?.choice ?? null;

  const notBlunder = scored.filter((s) => s.score > -WIN_SCORE / 2);
  const pool = notBlunder.length > 0 ? notBlunder : scored;

  const top = pickFromTopTier(pool, 90);
  if (top && Math.random() < 0.35) return top;

  return pickFromBottomTier(pool, 55)?.choice ?? pickRandom(legal);
}

export function chooseMove(
  state: SenkaiState,
  difficulty: CpuDifficulty
): SenkaiMoveChoice | null {
  const legal = enumerateLegalActions(state);
  if (legal.length === 0) return null;

  const perspective = state.current;

  if (difficulty === "easy") {
    return chooseEasy(state, legal, perspective);
  }

  const scored = scoreAllMoves(state, legal, perspective);
  if (scored.length === 0) return pickRandom(legal);

  if (difficulty === "normal") {
    const wins = scored.filter((s) => s.score >= WIN_SCORE - 1000);
    if (wins.length === 1) return wins[0]!.choice;
    if (wins.length > 1) return pickRandom(wins)?.choice ?? wins[0]!.choice;

    return pickFromTopTier(scored, 22) ?? pickRandom(legal);
  }

  return (
    chooseHard(state, legal, perspective) ??
    pickFromTopTier(scored, 8)?.choice ??
    pickRandom(legal)
  );
}
