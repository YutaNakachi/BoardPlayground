"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";

const SIZE = 5;
const CORE = 12;
const CORE_RING = [7, 11, 13, 17];
const CORE_RING_WIN = 3;
const PLAYER_STYLES = [
  "bg-indigo-500 text-white",
  "bg-rose-500 text-white",
  "bg-emerald-500 text-white",
  "bg-amber-500 text-black",
];

type Phase = "setup" | "playing" | "game-over";
type Board = (number | null)[];

function tokensFor(playerCount: number): number {
  return 24 / playerCount;
}

function neighbors(index: number): number[] {
  const r = Math.floor(index / SIZE);
  const c = index % SIZE;
  const out: number[] = [];
  if (r > 0) out.push(index - SIZE);
  if (r < SIZE - 1) out.push(index + SIZE);
  if (c > 0) out.push(index - 1);
  if (c < SIZE - 1) out.push(index + 1);
  return out;
}

export function legalNebulaMoves(
  board: Board,
  player: number,
  tokensLeft: number,
  playerCount: number
): number[] {
  const moves: number[] = [];
  const isFirst = tokensLeft === tokensFor(playerCount);

  for (let i = 0; i < board.length; i++) {
    if (i === CORE || board[i] !== null) continue;
    if (isFirst) {
      moves.push(i);
      continue;
    }
    if (neighbors(i).some((n) => board[n] === player)) {
      moves.push(i);
    }
  }

  return moves;
}

function findNextPlayer(
  board: Board,
  remaining: number[],
  fromPlayer: number,
  playerCount: number
): number | null {
  for (let step = 1; step <= playerCount; step++) {
    const player = (fromPlayer + step) % playerCount;
    if (remaining[player] <= 0) continue;
    if (legalNebulaMoves(board, player, remaining[player], playerCount).length > 0) {
      return player;
    }
  }
  return null;
}

/** 星核隣接マスを CORE_RING_WIN 個以上含む連結グループがあれば勝ち */
export function nebulaVictoryPlayer(board: Board, playerCount: number): number | null {
  const seen = new Set<number>();

  for (let i = 0; i < board.length; i++) {
    const owner = board[i];
    if (owner === null || owner < 0 || owner >= playerCount || seen.has(i)) continue;

    let coreCount = 0;
    const stack = [i];
    seen.add(i);

    while (stack.length) {
      const cur = stack.pop()!;
      if (CORE_RING.includes(cur)) coreCount += 1;
      for (const n of neighbors(cur)) {
        if (board[n] === owner && !seen.has(n)) {
          seen.add(n);
          stack.push(n);
        }
      }
    }

    if (coreCount >= CORE_RING_WIN) return owner;
  }

  return null;
}

function coreRingProgress(board: Board, player: number): number {
  const seen = new Set<number>();
  let best = 0;

  for (let i = 0; i < board.length; i++) {
    if (board[i] !== player || seen.has(i)) continue;

    let coreCount = 0;
    const stack = [i];
    seen.add(i);

    while (stack.length) {
      const cur = stack.pop()!;
      if (CORE_RING.includes(cur)) coreCount += 1;
      for (const n of neighbors(cur)) {
        if (board[n] === player && !seen.has(n)) {
          seen.add(n);
          stack.push(n);
        }
      }
    }

    best = Math.max(best, coreCount);
  }

  return best;
}

export function NebulaLinkGame() {
  const { recordLocalPlay } = usePlayPage();
  const [playerCount, setPlayerCount] = useState(2);
  const [phase, setPhase] = useState<Phase>("setup");
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [board, setBoard] = useState<Board>(Array(SIZE * SIZE).fill(null));
  const [remaining, setRemaining] = useState<number[]>([]);
  const [passNotice, setPassNotice] = useState<string | null>(null);
  const [winners, setWinners] = useState<number[] | null>(null);
  const [isDraw, setIsDraw] = useState(false);

  const startGame = useCallback(() => {
    recordLocalPlay();
    const cells: Board = Array(SIZE * SIZE).fill(null);
    cells[CORE] = -1;
    setBoard(cells);
    setRemaining(Array.from({ length: playerCount }, () => tokensFor(playerCount)));
    setCurrentPlayer(0);
    setPassNotice(null);
    setWinners(null);
    setIsDraw(false);
    setPhase("playing");
  }, [recordLocalPlay, playerCount]);

  const legalMoves = useMemo(() => {
    if (phase !== "playing" || remaining[currentPlayer] <= 0) return [];
    return legalNebulaMoves(
      board,
      currentPlayer,
      remaining[currentPlayer],
      playerCount
    );
  }, [phase, board, currentPlayer, remaining, playerCount]);

  const place = useCallback(
    (index: number) => {
      if (phase !== "playing") return;
      if (!legalMoves.includes(index)) return;

      const nextBoard = board.map((v, i) => (i === index ? currentPlayer : v));
      const nextRemaining = remaining.map((n, i) =>
        i === currentPlayer ? n - 1 : n
      );

      const victor = nebulaVictoryPlayer(nextBoard, playerCount);
      if (victor !== null) {
        setBoard(nextBoard);
        setRemaining(nextRemaining);
        setWinners([victor]);
        setIsDraw(false);
        setPhase("game-over");
        return;
      }

      const nextPlayer = findNextPlayer(
        nextBoard,
        nextRemaining,
        currentPlayer,
        playerCount
      );

      setBoard(nextBoard);
      setRemaining(nextRemaining);
      setPassNotice(null);

      if (nextPlayer === null) {
        setWinners([]);
        setIsDraw(true);
        setPhase("game-over");
        return;
      }

      setCurrentPlayer(nextPlayer);
    },
    [phase, legalMoves, board, remaining, currentPlayer, playerCount]
  );

  const progress = useMemo(
    () =>
      Array.from({ length: playerCount }, (_, i) => ({
        player: i,
        core: coreRingProgress(board, i),
      })),
    [board, playerCount]
  );

  if (phase === "setup") {
    return (
      <SetupPanel
        title="ネビュラ・リンク"
        description="星核の周り4マスのうち3つを、自分の連結したノードで占めたら勝ち。最初の1個はどこでも、2個目以降は自分のノードに隣接して置きます。"
        playerCount={playerCount}
        onPlayerCount={setPlayerCount}
        onStart={startGame}
        extra={
          <p className="mt-4 text-xs text-slate-500">
            各 {tokensFor(playerCount)} 個のノード
          </p>
        }
      />
    );
  }

  const isGameOver = phase === "game-over";

  const mustPass =
    phase === "playing" &&
    remaining[currentPlayer] > 0 &&
    legalMoves.length === 0;

  return (
    <div className="space-y-6">
      {!isGameOver && (
        <TurnBanner
          playerIndex={currentPlayer}
          playerLabel={`プレイヤー ${currentPlayer + 1}`}
          stats={`残り ${remaining[currentPlayer]} 個 · 星核隣接 ${progress[currentPlayer].core}/${CORE_RING_WIN}`}
          action={
            passNotice ??
            (mustPass
              ? "置ける場所がないためパスします"
              : legalMoves.length > 0
                ? `置けるマス ${legalMoves.length} か所`
                : undefined)
          }
        />
      )}

      <div className="mx-auto grid max-w-md grid-cols-5 gap-1.5 sm:gap-2">
        {board.map((owner, index) => {
          const isCore = index === CORE;
          const isCoreRing = CORE_RING.includes(index);
          const empty = owner === null;
          const canPlace = !isGameOver && legalMoves.includes(index);
          return (
            <button
              key={index}
              type="button"
              disabled={isCore || !empty || isGameOver || !canPlace}
              onClick={() => place(index)}
              className={`aspect-square min-h-11 rounded-lg text-xs font-semibold transition sm:text-sm ${
                isCore
                  ? "cursor-default bg-yellow-300/20 text-yellow-200 ring-1 ring-yellow-300/40"
                  : empty
                    ? canPlace
                      ? isCoreRing
                        ? "bg-accent/15 ring-2 ring-accent hover:bg-accent/25"
                        : "bg-surface-raised ring-2 ring-accent hover:bg-accent/10"
                      : isCoreRing
                        ? "cursor-default bg-yellow-300/10 ring-1 ring-yellow-300/30 text-yellow-200/60"
                        : "cursor-default bg-surface-raised/60 ring-1 ring-surface-border text-slate-600"
                    : PLAYER_STYLES[owner]
              }`}
              aria-label={
                isCore
                  ? "星核"
                  : isCoreRing && empty
                    ? "星核に隣接するマス"
                    : empty
                      ? canPlace
                        ? `置ける空マス ${index + 1}`
                        : `置けない空マス ${index + 1}`
                      : `プレイヤー ${owner + 1} のノード`
              }
            >
              {isCore ? "核" : empty ? (isCoreRing ? "★" : "") : owner + 1}
            </button>
          );
        })}
      </div>

      {mustPass ? (
        <button
          type="button"
          onClick={() => {
            const nextPlayer = findNextPlayer(
              board,
              remaining,
              currentPlayer,
              playerCount
            );
            if (nextPlayer === null) {
              setWinners([]);
              setIsDraw(true);
              setPhase("game-over");
              setPassNotice(null);
              return;
            }
            setPassNotice(`プレイヤー ${currentPlayer + 1} がパス`);
            setCurrentPlayer(nextPlayer);
          }}
          className="w-full rounded-xl border border-surface-border bg-surface-raised px-4 py-3 text-sm font-medium text-white transition hover:border-accent/50"
        >
          パスする
        </button>
      ) : null}

      <ul className="grid gap-2 sm:grid-cols-2">
        {progress.map(({ player, core }) => (
          <li
            key={player}
            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${
              currentPlayer === player && !isGameOver
                ? "border-accent/60 bg-accent/5"
                : "border-surface-border bg-surface-raised"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className={`inline-block h-3 w-3 rounded-full ${PLAYER_STYLES[player]}`} />
              プレイヤー {player + 1}
            </span>
            <span className="text-slate-400">
              星核隣接 {core}/{CORE_RING_WIN} · 残り {remaining[player]}
            </span>
          </li>
        ))}
      </ul>

      {isGameOver && winners && (
        <ResultPanel
          variant="inline"
          winners={isDraw ? Array.from({ length: playerCount }, (_, i) => i) : winners}
          winnersLabel={isDraw ? "引き分け" : undefined}
          onReplay={() => setPhase("setup")}
          details={
            <p className="text-slate-400">
              {isDraw
                ? "誰も勝利条件を満たさず、置ける手がなくなりました。"
                : `星核に隣接するマスを ${CORE_RING_WIN} つ、1つの連結グループで占めました。`}
            </p>
          }
        />
      )}
    </div>
  );
}
