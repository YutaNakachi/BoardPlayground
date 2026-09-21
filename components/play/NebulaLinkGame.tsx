"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { getPlayerTurnStyle, playerPieceClasses } from "@/lib/player-colors";
import {
  applyNebulaPass,
  applyNebulaPlace,
  initialNebulaLink,
  legalNebulaMoves,
  NEBULA_CORE,
  NEBULA_CORE_RING,
  NEBULA_CORE_RING_WIN,
  nebulaCoreRingProgress,
  nebulaTokensFor,
  nebulaWinners,
  type NebulaState,
} from "@/lib/play/nebula-link";

type Phase = "setup" | "playing" | "game-over";

export function NebulaLinkGame() {
  const { recordLocalPlay } = usePlayPage();
  const [playerCount, setPlayerCount] = useState(2);
  const [phase, setPhase] = useState<Phase>("setup");
  const [game, setGame] = useState<NebulaState | null>(null);
  const [passNotice, setPassNotice] = useState<string | null>(null);

  const startGame = useCallback(() => {
    recordLocalPlay();
    setGame(initialNebulaLink(playerCount));
    setPassNotice(null);
    setPhase("playing");
  }, [recordLocalPlay, playerCount]);

  const legalMoves = useMemo(() => {
    if (!game || phase !== "playing") return [];
    const player = game.currentPlayer;
    return legalNebulaMoves(
      game.board,
      player,
      game.remaining[player],
      game.playerCount
    );
  }, [game, phase]);

  const progress = useMemo(() => {
    if (!game) return [];
    return Array.from({ length: game.playerCount }, (_, i) => ({
      player: i,
      core: nebulaCoreRingProgress(game.board, i),
    }));
  }, [game]);

  const place = useCallback(
    (index: number) => {
      if (!game || phase !== "playing") return;
      const next = applyNebulaPlace(game, index);
      if (!next) return;
      setPassNotice(null);
      setGame(next);
      if (next.gameOver) setPhase("game-over");
    },
    [phase, game]
  );

  const pass = useCallback(() => {
    if (!game || phase !== "playing") return;
    const next = applyNebulaPass(game);
    if (!next) return;
    setPassNotice(`プレイヤー ${game.currentPlayer + 1} がパス`);
    setGame(next);
    if (next.gameOver) setPhase("game-over");
  }, [phase, game]);

  const winner = useMemo(() => {
    if (phase !== "game-over" || !game) return null;
    return nebulaWinners(game);
  }, [phase, game]);

  const backToSetup = useCallback(() => setPhase("setup"), []);
  usePlaySetupNavigation(phase === "setup", backToSetup);

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
            各 {nebulaTokensFor(playerCount)} 個のノード
          </p>
        }
      />
    );
  }

  if (!game) return null;

  const isGameOver = phase === "game-over" && winner !== null;
  const mustPass = phase === "playing" && legalMoves.length === 0;

  return (
    <div className="space-y-6">
      {!isGameOver && (
        <TurnBanner
          playerIndex={game.currentPlayer}
          playerLabel={`プレイヤー ${game.currentPlayer + 1}`}
          stats={`残り ${game.remaining[game.currentPlayer]} 個 · 星核隣接 ${progress[game.currentPlayer]?.core ?? 0}/${NEBULA_CORE_RING_WIN}`}
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
        {game.board.map((owner, index) => {
          const isCore = index === NEBULA_CORE;
          const isCoreRing = NEBULA_CORE_RING.includes(index);
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
                    : playerPieceClasses(owner)
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
          onClick={pass}
          className="w-full rounded-xl border border-surface-border bg-surface-raised px-4 py-3 text-sm font-medium text-white transition hover:border-accent/50"
        >
          パスする
        </button>
      ) : null}

      <ul className="grid gap-2 sm:grid-cols-2">
        {progress.map(({ player, core }) => {
          const style = getPlayerTurnStyle(player);
          return (
            <li
              key={player}
              className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                game.currentPlayer === player && !isGameOver
                  ? `${style.sectionBorder} ${style.sectionBg}`
                  : "border-surface-border bg-surface-raised"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`inline-block h-3 w-3 rounded-full ${style.dot}`} />
                プレイヤー {player + 1}
              </span>
              <span className="text-slate-400">
                星核隣接 {core}/{NEBULA_CORE_RING_WIN} · 残り {game.remaining[player]}
              </span>
            </li>
          );
        })}
      </ul>

      {isGameOver && winner && (
        <ResultPanel
          variant="inline"
          winners={winner}
          winnersLabel={game.isDraw ? "引き分け" : undefined}
          onReplay={() => setPhase("setup")}
          details={
            <p className="text-slate-400">
              {game.isDraw
                ? "誰も勝利条件を満たさず、置ける手がなくなりました。"
                : `星核に隣接するマスを ${NEBULA_CORE_RING_WIN} つ、1つの連結グループで占めました。`}
            </p>
          }
        />
      )}
    </div>
  );
}
