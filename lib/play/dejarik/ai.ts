import type { CreatureType, Player } from "./board";
import { placementHomeCells } from "./board";
import {
  applyDejarikAttack,
  applyDejarikMove,
  applyPlacement,
  countPiecesForOwner,
  endScoutTurn,
  legalAttackTargets,
  legalMoveTargets,
  placementPlayer,
  type DejarikState,
} from "./state";

import type { CpuDifficulty } from "@/lib/play/cpu/types";

export type { CpuDifficulty };

export type DejarikCpuMove =
  | { kind: "placement"; creatureType: CreatureType; cell: number }
  | { kind: "move"; pieceId: number; to: number }
  | { kind: "attack"; pieceId: number; to: number }
  | { kind: "endScoutTurn" };

const WIN_SCORE = 1_000_000;

const CREATURE_VALUE: Record<CreatureType, number> = {
  brute: 52,
  predator: 48,
  guardian: 44,
  scout: 58,
};

function opponent(p: Player): Player {
  return p === 0 ? 1 : 0;
}

function applyChoice(
  state: DejarikState,
  choice: DejarikCpuMove
): DejarikState | null {
  switch (choice.kind) {
    case "placement":
      return applyPlacement(state, choice.creatureType, choice.cell);
    case "move":
      return applyDejarikMove(state, choice.pieceId, choice.to);
    case "attack":
      return applyDejarikAttack(state, choice.pieceId, choice.to);
    case "endScoutTurn":
      return endScoutTurn(state);
    default:
      return null;
  }
}

function materialBalance(state: DejarikState, me: Player): number {
  let balance = 0;
  for (const p of Object.values(state.pieces)) {
    const v = CREATURE_VALUE[p.type];
    balance += p.owner === me ? v : -v;
  }
  return balance;
}

function evaluateState(state: DejarikState, perspective: Player): number {
  if (state.phase === "game-over" && state.winner !== null) {
    if (state.winner === perspective) return WIN_SCORE;
    if (state.winner === opponent(perspective)) return -WIN_SCORE;
    return 0;
  }

  let score = materialBalance(state, perspective);

  const opp = opponent(perspective);
  if (countPiecesForOwner(state, opp) === 1) {
    score += state.stallCounters[opp] * 35;
  }
  if (countPiecesForOwner(state, perspective) === 1) {
    score -= state.stallCounters[perspective] * 40;
  }

  return score;
}

function captureValue(state: DejarikState, cell: number, perspective: Player): number {
  const victimId = state.cells[cell];
  if (victimId === null) return 0;
  const victim = state.pieces[victimId];
  if (!victim || victim.owner === perspective) return 0;
  return CREATURE_VALUE[victim.type];
}

function scoreMove(
  state: DejarikState,
  choice: DejarikCpuMove,
  perspective: Player
): number | null {
  const next = applyChoice(state, choice);
  if (!next) return null;

  if (next.phase === "game-over" && next.winner !== null) {
    if (next.winner === perspective) return WIN_SCORE;
    if (next.winner === opponent(perspective)) return -WIN_SCORE;
  }

  let score = evaluateState(next, perspective);

  if (choice.kind === "attack") {
    score += captureValue(state, choice.to, perspective) * 1.2 + 12;
  }
  if (choice.kind === "placement") {
    score += 3;
  }
  if (choice.kind === "endScoutTurn") {
    score -= 4;
  }

  return score;
}

export function enumerateLegalMoves(
  state: DejarikState,
  actor: Player
): DejarikCpuMove[] {
  if (state.phase === "game-over") return [];

  if (state.phase === "placement") {
    if (placementPlayer(state.placementStep, state.firstPlayer) !== actor) {
      return [];
    }
    const moves: DejarikCpuMove[] = [];
    const pool = state.unplaced[actor];
    const homes = placementHomeCells(actor);
    for (const creatureType of pool) {
      for (const cell of homes) {
        if (state.cells[cell] !== null) continue;
        if (applyPlacement(state, creatureType, cell)) {
          moves.push({ kind: "placement", creatureType, cell });
        }
      }
    }
    return moves;
  }

  if (state.phase !== "playing" || state.current !== actor) return [];

  const moves: DejarikCpuMove[] = [];
  const partial = state.scoutPartial;

  if (partial) {
    const pieceId = partial.pieceId;
    for (const to of legalMoveTargets(state, pieceId)) {
      moves.push({ kind: "move", pieceId, to });
    }
    for (const to of legalAttackTargets(state, pieceId)) {
      moves.push({ kind: "attack", pieceId, to });
    }
    if ((partial.didMove || partial.didAttack) && endScoutTurn(state)) {
      moves.push({ kind: "endScoutTurn" });
    }
    return moves;
  }

  for (const piece of Object.values(state.pieces)) {
    if (piece.owner !== actor) continue;
    for (const to of legalMoveTargets(state, piece.id)) {
      moves.push({ kind: "move", pieceId: piece.id, to });
    }
    for (const to of legalAttackTargets(state, piece.id)) {
      moves.push({ kind: "attack", pieceId: piece.id, to });
    }
  }

  return moves;
}

function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)] ?? null;
}

function pickFromTopTier(
  scored: { choice: DejarikCpuMove; score: number }[],
  slack: number
): DejarikCpuMove | null {
  if (scored.length === 0) return null;
  const max = Math.max(...scored.map((s) => s.score));
  const tier = scored.filter((s) => s.score >= max - slack);
  return pickRandom(tier)?.choice ?? null;
}

function pickFromBottomTier(
  scored: { choice: DejarikCpuMove; score: number }[],
  slack: number
): DejarikCpuMove | null {
  if (scored.length === 0) return null;
  const min = Math.min(...scored.map((s) => s.score));
  const tier = scored.filter((s) => s.score <= min + slack);
  return pickRandom(tier)?.choice ?? null;
}

function scoreAll(
  state: DejarikState,
  legal: DejarikCpuMove[],
  perspective: Player
): { choice: DejarikCpuMove; score: number }[] {
  const scored: { choice: DejarikCpuMove; score: number }[] = [];
  for (const choice of legal) {
    const score = scoreMove(state, choice, perspective);
    if (score !== null) scored.push({ choice, score });
  }
  return scored;
}

function chooseEasy(
  state: DejarikState,
  legal: DejarikCpuMove[],
  perspective: Player
): DejarikCpuMove | null {
  const scored = scoreAll(state, legal, perspective);
  if (scored.length === 0) return pickRandom(legal);

  const wins = scored.filter((s) => s.score >= WIN_SCORE - 1000);
  if (wins.length > 0) return pickRandom(wins)?.choice ?? null;

  const pool = scored.filter((s) => s.score > -WIN_SCORE / 2);
  const usePool = pool.length > 0 ? pool : scored;

  if (Math.random() < 0.38) {
    return pickFromTopTier(usePool, 85) ?? pickRandom(legal);
  }
  return pickFromBottomTier(usePool, 50) ?? pickRandom(legal);
}

export function chooseMove(
  state: DejarikState,
  difficulty: CpuDifficulty,
  cpuPlayer: Player
): DejarikCpuMove | null {
  const actor =
    state.phase === "placement"
      ? placementPlayer(state.placementStep, state.firstPlayer)
      : state.current;
  if (actor !== cpuPlayer) return null;

  const legal = enumerateLegalMoves(state, cpuPlayer);
  if (legal.length === 0) return null;

  const perspective = cpuPlayer;

  if (difficulty === "easy") {
    return chooseEasy(state, legal, perspective);
  }

  const scored = scoreAll(state, legal, perspective);
  if (scored.length === 0) return pickRandom(legal);

  if (difficulty === "normal") {
    const wins = scored.filter((s) => s.score >= WIN_SCORE - 1000);
    if (wins.length === 1) return wins[0]!.choice;
    if (wins.length > 1) return pickRandom(wins)?.choice ?? wins[0]!.choice;
    return pickFromTopTier(scored, 24) ?? pickRandom(legal);
  }

  let best: DejarikCpuMove | null = null;
  let bestScore = -Infinity;
  for (const { choice, score } of scored) {
    if (score > bestScore) {
      bestScore = score;
      best = choice;
    }
  }
  return best ?? pickFromTopTier(scored, 10) ?? pickRandom(legal);
}
