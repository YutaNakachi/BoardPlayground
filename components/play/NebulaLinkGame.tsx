"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NebulaPiecePreview } from "@/components/play/shared/NebulaPiecePreview";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { getPlayerTurnStyle, playerPieceClasses } from "@/lib/player-colors";
import {
  applyNebulaPass,
  applyNebulaPlace,
  applyNebulaSpinRoulette,
  canNebulaPass,
  homeEdgeLabel,
  homeEdgeOwnerAt,
  initialNebulaLink,
  isLegalNebulaPlacement,
  legalNebulaPlacements,
  NEBULA_CORE,
  NEBULA_MONO_ID,
  NEBULA_SIZE,
  nebulaIndex,
  nebulaRowCol,
  nebulaWinners,
  pieceCellsAt,
  playerHomeEdge,
  type NebulaPlacement,
  type NebulaState,
} from "@/lib/play/nebula-link";

type Phase = "setup" | "playing" | "game-over";

export function NebulaLinkGame() {
  const { recordLocalPlay } = usePlayPage();
  const [playerCount, setPlayerCount] = useState(2);
  const [phase, setPhase] = useState<Phase>("setup");
  const [game, setGame] = useState<NebulaState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);

  const startGame = useCallback(() => {
    recordLocalPlay();
    setGame(initialNebulaLink(playerCount));
    setNotice(null);
    setSelectedPieceId(null);
    setRotation(0);
    setSpinning(false);
    setPhase("playing");
  }, [recordLocalPlay, playerCount]);

  useEffect(() => {
    setSelectedPieceId(null);
    setRotation(0);
    setHoverIndex(null);
    setSpinning(false);
  }, [game?.currentPlayer, game?.roulette.length]);

  const allowedPieces = useMemo(() => {
    if (!game) return [NEBULA_MONO_ID];
    return game.roulette.length > 0
      ? [...game.roulette, NEBULA_MONO_ID]
      : [NEBULA_MONO_ID];
  }, [game]);

  const legalMoves = useMemo(() => {
    if (!game || phase !== "playing") return [];
    return legalNebulaPlacements(
      game.board,
      game.currentPlayer,
      game.playerCount,
      allowedPieces
    );
  }, [game, phase, allowedPieces]);

  const previewCells = useMemo(() => {
    if (!game || !selectedPieceId || hoverIndex === null) return new Set<number>();
    const { row, col } = nebulaRowCol(hoverIndex);
    const cells = pieceCellsAt(selectedPieceId, rotation, row, col);
    const set = new Set<number>();
    for (const { row: r, col: c } of cells) {
      if (r >= 0 && r < NEBULA_SIZE && c >= 0 && c < NEBULA_SIZE) {
        set.add(nebulaIndex(r, c));
      }
    }
    return set;
  }, [game, selectedPieceId, rotation, hoverIndex]);

  const spinRoulette = useCallback(() => {
    if (!game || spinning || game.roulette.length > 0) return;
    setSpinning(true);
    setNotice(null);
    window.setTimeout(() => {
      const next = applyNebulaSpinRoulette(game);
      if (next) setGame(next);
      setSpinning(false);
    }, 600);
  }, [game, spinning]);

  const placeAt = useCallback(
    (index: number) => {
      if (!game || phase !== "playing" || !selectedPieceId) return;
      const { row, col } = nebulaRowCol(index);
      const placement: NebulaPlacement = {
        pieceId: selectedPieceId,
        rotation,
        anchorRow: row,
        anchorCol: col,
      };
      const next = applyNebulaPlace(game, placement);
      if (!next) {
        setNotice("ここには置けません");
        return;
      }
      setNotice(null);
      setSelectedPieceId(null);
      setGame(next);
      if (next.gameOver) setPhase("game-over");
    },
    [phase, game, selectedPieceId, rotation]
  );

  const pass = useCallback(() => {
    if (!game || phase !== "playing") return;
    const next = applyNebulaPass(game);
    if (!next) return;
    setNotice(`プレイヤー ${game.currentPlayer + 1} がパス`);
    setSelectedPieceId(null);
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
        description="15×15の星雲盤で、ルーレットの形状ブロックを置き、星核を自分のホーム辺側に閉じ込めたら勝ち。単マスは常に使えます。"
        playerCount={playerCount}
        onPlayerCount={setPlayerCount}
        onStart={startGame}
        extra={
          <p className="mt-4 text-xs text-slate-500">
            2人は北・南、3人は北・東・西（南は中立）、4人は四辺。自分のブロックは角だけでつなげます。
          </p>
        }
      />
    );
  }

  if (!game) return null;

  const isGameOver = phase === "game-over" && winner !== null;
  const mustPass = phase === "playing" && canNebulaPass(game);
  const home = playerHomeEdge(game.currentPlayer, game.playerCount);
  const rouletteReady = game.roulette.length === 3;

  const cellPlacementLegal = (index: number) =>
    selectedPieceId &&
    isLegalNebulaPlacement(
      game.board,
      game.currentPlayer,
      game.playerCount,
      selectedPieceId,
      rotation,
      nebulaRowCol(index).row,
      nebulaRowCol(index).col
    );

  return (
    <div className="space-y-6">
      {isGameOver && winner && (
        <ResultPanel
          variant="inline"
          winners={winner}
          draw={game.isDraw}
          onReplay={() => setPhase("setup")}
          details={
            <p className="text-slate-400">
              {game.isDraw
                ? "全員が連続パスし、引き分けになりました。"
                : "星核をホーム辺側に閉じ込め、ホーム辺につながったループが完成しました。"}
            </p>
          }
        />
      )}

      {!isGameOver && (
        <TurnBanner
          playerIndex={game.currentPlayer}
          playerLabel={`プレイヤー ${game.currentPlayer + 1}`}
          stats={`ホーム辺：${homeEdgeLabel(home)} · 合法手 ${legalMoves.length}`}
          action={
            notice ??
            (mustPass
              ? "置ける形がないためパスできます"
              : selectedPieceId
                ? "マスをタップして配置（回転ボタンで向き変更）"
                : rouletteReady
                  ? "ルーレットの形または単マスを選んでください"
                  : "ルーレットを回すか、単マスを選んでください")
          }
        />
      )}

      {!isGameOver && (
        <div className="space-y-3">
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              disabled={rouletteReady || spinning}
              onClick={spinRoulette}
              className="rounded-xl border border-accent/50 bg-accent/15 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent/25 disabled:opacity-40"
            >
              {spinning ? "ルーレット回転中…" : rouletteReady ? "ルーレット済み" : "ルーレットを回す"}
            </button>
          </div>

          {rouletteReady ? (
            <div className="flex flex-wrap justify-center gap-3">
              {game.roulette.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setSelectedPieceId(id);
                    setNotice(null);
                  }}
                  className={`flex min-w-[4.5rem] flex-col items-center gap-2 rounded-xl border px-3 py-2 ${
                    selectedPieceId === id
                      ? "border-accent bg-accent/20 ring-2 ring-accent/40"
                      : "border-surface-border bg-surface-raised hover:border-accent/40"
                  }`}
                >
                  <NebulaPiecePreview
                    pieceId={id}
                    playerIndex={game.currentPlayer}
                  />
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => {
                setSelectedPieceId(NEBULA_MONO_ID);
                setNotice(null);
              }}
              className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-2 ${
                selectedPieceId === NEBULA_MONO_ID
                  ? "border-accent bg-accent/20 ring-2 ring-accent/40"
                  : "border-surface-border bg-surface-raised hover:border-accent/40"
              }`}
            >
              <span className="text-xs text-slate-400">常時</span>
              <NebulaPiecePreview
                pieceId={NEBULA_MONO_ID}
                playerIndex={game.currentPlayer}
              />
              <span className="text-xs text-slate-300">単マス</span>
            </button>
          </div>

          {selectedPieceId ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 1) % 4)}
                className="rounded-lg border border-surface-border bg-surface-raised px-4 py-2 text-sm text-white hover:border-accent/50"
              >
                回転（{rotation * 90}°）
              </button>
            </div>
          ) : null}
        </div>
      )}

      <div
        className="mx-auto grid w-full max-w-2xl gap-px sm:gap-0.5"
        style={{ gridTemplateColumns: `repeat(${NEBULA_SIZE}, minmax(0, 1fr))` }}
      >
        {game.board.map((owner, index) => {
          const isCore = index === NEBULA_CORE;
          const empty = owner === null;
          const inPreview = previewCells.has(index);
          const legal = cellPlacementLegal(index);
          const canPlace = !isGameOver && selectedPieceId && empty && !isCore && legal;

          const edgeOwner = homeEdgeOwnerAt(index, game.playerCount);
          const edgeStyle =
            edgeOwner === "neutral"
              ? "ring-1 ring-inset ring-slate-500/50 bg-slate-700/20"
              : edgeOwner !== null
                ? `${getPlayerTurnStyle(edgeOwner).surface} ${getPlayerTurnStyle(edgeOwner).surfaceBorder} ring-1 ring-inset`
                : "";

          return (
            <button
              key={index}
              type="button"
              disabled={isCore || isGameOver}
              onPointerEnter={() => setHoverIndex(index)}
              onPointerLeave={() => setHoverIndex(null)}
              onClick={() => {
                if (canPlace) placeAt(index);
              }}
              className={`aspect-square min-h-[1.15rem] rounded-[2px] text-[9px] font-semibold transition sm:min-h-5 sm:text-[10px] ${
                isCore
                  ? "cursor-default bg-yellow-300/30 ring-1 ring-yellow-300/60"
                  : empty
                    ? inPreview
                      ? legal
                        ? "bg-accent/30 ring-1 ring-accent"
                        : "bg-red-500/20 ring-1 ring-red-400/60"
                      : edgeStyle || "bg-surface-raised/80 ring-1 ring-surface-border/80"
                    : playerPieceClasses(owner)
              }`}
              aria-label={isCore ? "星核" : empty ? "空マス" : `プレイヤー ${owner + 1}`}
            >
              {isCore ? "★" : empty ? "" : owner + 1}
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
        {Array.from({ length: game.playerCount }, (_, player) => {
          const style = getPlayerTurnStyle(player);
          const edge = playerHomeEdge(player, game.playerCount);
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
              <span className={style.surfaceText}>ホーム {homeEdgeLabel(edge)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
