"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import {
  applyNebulaPlace,
  initialNebulaLink,
  NEBULA_CORE,
  NEBULA_SIZE,
  nebulaScorePlayer,
  nebulaTokensFor,
  nebulaWinners,
  type NebulaState,
} from "@/lib/play/nebula-link";

const PLAYER_STYLES = [
  "bg-indigo-500 text-white",
  "bg-rose-500 text-white",
  "bg-emerald-500 text-white",
  "bg-amber-500 text-black",
];

type Phase = "setup" | "playing" | "game-over";

export function NebulaLinkGame() {
  const { recordLocalPlay } = usePlayPage();
  const [playerCount, setPlayerCount] = useState(2);
  const [phase, setPhase] = useState<Phase>("setup");
  const [game, setGame] = useState<NebulaState | null>(null);

  const startGame = useCallback(() => {
    recordLocalPlay();
    setGame(initialNebulaLink(playerCount));
    setPhase("playing");
  }, [recordLocalPlay, playerCount]);

  const place = useCallback(
    (index: number) => {
      if (!game || phase !== "playing") return;
      const next = applyNebulaPlace(game, index);
      if (!next) return;
      setGame(next);
      if (next.gameOver) setPhase("game-over");
    },
    [phase, game]
  );

  const breakdown = useMemo(
    () =>
      game
        ? Array.from({ length: game.playerCount }, (_, i) =>
            nebulaScorePlayer(game.board, i)
          )
        : [],
    [game]
  );

  const winner = useMemo(() => {
    if (phase !== "game-over" || !game) return null;
    return nebulaWinners(game);
  }, [phase, game]);

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
            各 {nebulaTokensFor(playerCount)} 個のノード
          </p>
        }
      />
    );
  }

  if (!game) return null;

  const isGameOver = phase === "game-over" && winner !== null;

  return (
    <div className="space-y-6">
      {!isGameOver && (
      <TurnBanner
        playerIndex={game.currentPlayer}
        playerLabel={`プレイヤー ${game.currentPlayer + 1}`}
        stats={`残り ${game.remaining.reduce((a, b) => a + b, 0)} 個`}
      />
      )}

      <div className="mx-auto grid max-w-md grid-cols-5 gap-1.5 sm:gap-2">
        {game.board.map((owner, index) => {
          const isCore = index === NEBULA_CORE;
          const empty = owner === null;
          return (
            <button
              key={index}
              type="button"
              disabled={isCore || !empty || isGameOver}
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
        {game.remaining.map((n, i) => (
          <li
            key={i}
            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${
              game.currentPlayer === i
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

      {isGameOver && winner && (
        <ResultPanel
          variant="inline"
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
      )}
    </div>
  );
}
