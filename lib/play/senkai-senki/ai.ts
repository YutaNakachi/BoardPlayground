import {
  applySenkaiAction,
  legalActionsForPiece,
  shootTarget,
  ssCoord,
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

function opponent(p: Player): Player {
  return p === 0 ? 1 : 0;
}

function findCommandCell(
  state: SenkaiState,
  owner: Player
): number | null {
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

function evaluateState(state: SenkaiState, me: Player): number {
  if (state.gameOver) {
    if (state.winner === me) return WIN_SCORE;
    if (state.winner === opponent(me)) return -WIN_SCORE;
    return 0;
  }

  const enemyCmd = findCommandCell(state, opponent(me));
  const myCmd = findCommandCell(state, me);
  if (enemyCmd === null) return WIN_SCORE - 1;
  if (myCmd === null) return -WIN_SCORE + 1;

  let score = 0;
  score -= minDistanceToCommand(state, me, enemyCmd) * 8;

  if (state.current === me && canShootEnemyCommand(state, me)) {
    score += 120;
  }
  if (state.current === opponent(me) && canShootEnemyCommand(state, opponent(me))) {
    score -= 150;
  }

  return score;
}

function scoreMove(state: SenkaiState, choice: SenkaiMoveChoice): number | null {
  const me = state.current;
  const next = applySenkaiAction(state, choice.pieceId, choice.action);
  if (!next) return null;

  if (next.gameOver) {
    if (next.winner === me) return WIN_SCORE;
    if (next.winner === opponent(me)) return -WIN_SCORE;
  }

  let score = evaluateState(next, me);

  if (choice.action.kind === "shoot") score += 40;
  if (choice.action.kind === "move") {
    const targetIdx =
      choice.action.kind === "move" ? choice.action.to : null;
    if (targetIdx !== null) {
      const targetId = state.cells[targetIdx];
      if (targetId !== null) {
        const target = state.pieces[targetId];
        if (target && target.owner === opponent(me)) {
          score += target.type === "command" ? WIN_SCORE - 100 : 60;
        }
      }
    }
  }

  return score;
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

function chooseHard(state: SenkaiState, legal: SenkaiMoveChoice[]): SenkaiMoveChoice | null {
  let best: SenkaiMoveChoice | null = null;
  let bestScore = -Infinity;

  for (const choice of legal) {
    const next = applySenkaiAction(state, choice.pieceId, choice.action);
    if (!next) continue;

    let score = scoreMove(state, choice);
    if (score === null) continue;

    if (!next.gameOver && next.current === opponent(state.current)) {
      const replies = enumerateLegalActions(next);
      let bestOpponentReply = evaluateState(next, state.current);
      for (const reply of replies) {
        const afterReply = applySenkaiAction(next, reply.pieceId, reply.action);
        if (!afterReply) continue;
        const replyScore = evaluateState(afterReply, state.current);
        bestOpponentReply = Math.min(bestOpponentReply, replyScore);
      }
      score = (score ?? 0) * 0.35 + bestOpponentReply * 0.65;
    }

    if (score > bestScore) {
      bestScore = score;
      best = choice;
    } else if (score === bestScore && Math.random() > 0.5) {
      best = choice;
    }
  }

  return best;
}

export function chooseMove(
  state: SenkaiState,
  difficulty: CpuDifficulty
): SenkaiMoveChoice | null {
  const legal = enumerateLegalActions(state);
  if (legal.length === 0) return null;

  if (difficulty === "easy") {
    return pickRandom(legal);
  }

  const scored: { choice: SenkaiMoveChoice; score: number }[] = [];
  for (const choice of legal) {
    const score = scoreMove(state, choice);
    if (score !== null) scored.push({ choice, score });
  }
  if (scored.length === 0) return pickRandom(legal);

  if (difficulty === "normal") {
    return pickFromTopTier(scored, 45) ?? pickRandom(legal);
  }

  return chooseHard(state, legal) ?? pickRandom(legal);
}
