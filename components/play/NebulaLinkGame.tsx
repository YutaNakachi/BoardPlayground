"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { winnerIndices } from "@/lib/game-engine";

const SIZE = 5;
const CORE = 12; // index of center cell
const PLAYER_STYLES = [
  "bg-indigo-500 text-white",
  "bg-rose-500 text-white",
  "bg-emerald-500 text-white",
  "bg-amber-500 text-black",
];

type Phase = "setup" | "playing" | "game-over";

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

function largestGroup(board: (number | null)[], player: number): number {
  const seen = new Set<number>();
  let best = 0;
  for (let i = 0; i < board.length; i++) {
    if (board[i] !== player || seen.has(i)) continue;
    let size = 0;
    const stack = [i];
    seen.add(i);
    while (stack.length) {
      const cur = stack.pop()!;
      size += 1;
      for (const n of neighbors(cur)) {
        if (board[n] === player && !seen.has(n)) {
          seen.add(n);
          stack.push(n);
        }
      }
    }
    best = Math.max(best, size);
  }
  return best;
}

function coreAdjacent(board: (number | null)[], player: number): number {
  return neighbors(CORE).filter((i) => board[i] === player).length;
}

function scorePlayer(board: (number | null)[], player: number) {
  const group = largestGroup(board, player);
  const adj = coreAdjacent(board, player);
  return { total: group * 2 + adj, group, adj };
}

export function NebulaLinkGame() {
  const { recordLocalPlay } = usePlayPage();
  const [playerCount, setPlayerCount] = useState(2);
  const [phase, setPhase] = useState<Phase>("setup");
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [board, setBoard] = useState<(number | null)[]>(Array(SIZE * SIZE).fill(null));
  const [remaining, setRemaining] = useState<number[]>([]);

  const startGame = useCallback(() => {
    recordLocalPlay();
    const cells = Array(SIZE * SIZE).fill(null);
    cells[CORE] = -1;
    setBoard(cells);
    setRemaining(Array.from({ length: playerCount }, () => tokensFor(playerCount)));
    setCurrentPlayer(0);
    setPhase("playing");
  }, [recordLocalPlay, playerCount]);

  const place = useCallback(
    (index: number) => {
      if (phase !== "playing") return;
      if (index === CORE || board[index] !== null) return;
      if (remaining[currentPlayer] <= 0) return;

      const nextBoard = board.map((v, i) => (i === index ? currentPlayer : v));
      const nextRemaining = remaining.map((n, i) =>
        i === currentPlayer ? n - 1 : n
      );
      setBoard(nextBoard);
      setRemaining(nextRemaining);

      if (nextRemaining.every((n) => n === 0)) {
        setPhase("game-over");
        return;
      }

      setCurrentPlayer((currentPlayer + 1) % playerCount);
    },
    [phase, board, remaining, currentPlayer, playerCount]
  );

  const breakdown = useMemo(
    () => Array.from({ length: playerCount }, (_, i) => scorePlayer(board, i)),
    [board, playerCount]
  );

  const winner = useMemo(() => {
    if (phase !== "game-over") return null;
    return winnerIndices(breakdown.map((b) => b.total));
  }, [phase, breakdown]);

  if (phase === "setup") {
    return (
      <SetupPanel
        title="ネビュラ・リンク"
        description="中央の星核には置けません。空マスをタップしてノードを置きます。"
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

  if (phase === "game-over" && winner) {
    return (
      <ResultPanel
        winners={winner}
        onReplay={() => setPhase("setup")}
        details={
          <ul className="space-y-1 text-slate-400">
            {breakdown.map((b, i) => (
              <li key={i}>
                プレイヤー {i + 1}: {b.total} 点（連結 {b.group}×2 + 星核隣接 {b.adj}）
              </li>
            ))}
          </ul>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <TurnBanner
        playerIndex={currentPlayer}
        playerLabel={`プレイヤー ${currentPlayer + 1}`}
        stats={`残り ${remaining.reduce((a, b) => a + b, 0)} 個`}
      />

      <div className="mx-auto grid max-w-md grid-cols-5 gap-1.5 sm:gap-2">
        {board.map((owner, index) => {
          const isCore = index === CORE;
          const empty = owner === null;
          return (
            <button
              key={index}
              type="button"
              disabled={isCore || !empty}
              onClick={() => place(index)}
              className={`aspect-square min-h-11 rounded-lg text-xs font-semibold transition sm:text-sm ${
                isCore
                  ? "cursor-default bg-yellow-300/20 text-yellow-200 ring-1 ring-yellow-300/40"
                  : empty
                    ? "bg-surface-raised ring-1 ring-surface-border hover:ring-accent"
                    : PLAYER_STYLES[owner]
              }`}
              aria-label={
                isCore
                  ? "星核"
                  : empty
                    ? `空マス ${index + 1}`
                    : `プレイヤー ${owner + 1} のノード`
              }
            >
              {isCore ? "核" : empty ? "" : owner + 1}
            </button>
          );
        })}
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {remaining.map((n, i) => (
          <li
            key={i}
            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${
              currentPlayer === i
                ? "border-accent/60 bg-accent/5"
                : "border-surface-border bg-surface-raised"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className={`inline-block h-3 w-3 rounded-full ${PLAYER_STYLES[i]}`} />
              プレイヤー {i + 1}
            </span>
            <span className="text-slate-400">残り {n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
