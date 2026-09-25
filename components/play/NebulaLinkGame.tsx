"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { useCallback, useMemo, useRef, useState } from "react";
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

function cellIndexFromPointer(clientX: number, clientY: number): number | null {
  const el = document.elementFromPoint(clientX, clientY);
  const cell = el?.closest<HTMLElement>("[data-cell-index]");
  if (!cell) return null;
  const raw = cell.dataset.cellIndex;
  if (raw === undefined) return null;
  const index = Number(raw);
  return Number.isFinite(index) ? index : null;
}

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
  const [placingPointer, setPlacingPointer] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const startGame = useCallback(() => {
    recordLocalPlay();
    setGame(initialNebulaLink(playerCount));
    setNotice(null);
    setSelectedPieceId(null);
    setRotation(0);
    setSpinning(false);
    setHoverIndex(null);
    setPhase("playing");
  }, [recordLocalPlay, playerCount]);

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
      if (next) {
        setGame(next);
        setSelectedPieceId(null);
        setRotation(0);
      }
      setSpinning(false);
    }, 600);
  }, [game, spinning]);

  const placeAt = useCallback(
    (index: number) => {
      if (!game || phase !== "playing" || !selectedPieceId) return false;
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
        return false;
      }
      setNotice(null);
      setSelectedPieceId(null);
      setRotation(0);
      setHoverIndex(null);
      setGame(next);
      if (next.gameOver) setPhase("game-over");
      return true;
    },
    [phase, game, selectedPieceId, rotation]
  );

  const pass = useCallback(() => {
    if (!game || phase !== "playing") return;
    const next = applyNebulaPass(game);
    if (!next) return;
    setNotice(`プレイヤー ${game.currentPlayer + 1} がパス`);
    setSelectedPieceId(null);
    setRotation(0);
    setHoverIndex(null);
    setSpinning(false);
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
  const turnStyle = getPlayerTurnStyle(game.currentPlayer);

  const cellPlacementLegal = (index: number) =>
    Boolean(
      selectedPieceId &&
        isLegalNebulaPlacement(
          game.board,
          game.currentPlayer,
          game.playerCount,
          selectedPieceId,
          rotation,
          nebulaRowCol(index).row,
          nebulaRowCol(index).col
        )
    );

  const piecePickClass = (pieceId: string) =>
    selectedPieceId === pieceId
      ? `${turnStyle.sectionBorder} ${turnStyle.sectionBg} ring-2 ${turnStyle.sectionRing}`
      : "border-surface-border bg-surface-raised hover:border-white/20";

  const previewRotationFor = (pieceId: string) =>
    selectedPieceId === pieceId ? rotation : 0;

  const handleGridPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isGameOver || !selectedPieceId) return;
    const index = cellIndexFromPointer(e.clientX, e.clientY);
    if (index === null) return;
    setHoverIndex(index);
    setPlacingPointer(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleGridPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!selectedPieceId) return;
    const index = cellIndexFromPointer(e.clientX, e.clientY);
    if (index !== null) setHoverIndex(index);
  };

  const handleGridPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!placingPointer && !selectedPieceId) return;
    const index = cellIndexFromPointer(e.clientX, e.clientY) ?? hoverIndex;
    if (index !== null && selectedPieceId && cellPlacementLegal(index)) {
      placeAt(index);
    }
    setPlacingPointer(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

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
                ? "盤上でドラッグして位置を決め、指を離して配置"
                : rouletteReady
                  ? "ルーレットの形または単マスを選んでください"
                  : "ルーレットを回すか、単マスを選んでください")
          }
        />
      )}

      <div
        ref={gridRef}
        className={`mx-auto grid w-full max-w-2xl gap-px sm:gap-0.5 ${
          selectedPieceId && !isGameOver ? "touch-none select-none" : ""
        }`}
        style={{ gridTemplateColumns: `repeat(${NEBULA_SIZE}, minmax(0, 1fr))` }}
        onPointerDown={handleGridPointerDown}
        onPointerMove={handleGridPointerMove}
        onPointerUp={handleGridPointerUp}
        onPointerCancel={handleGridPointerUp}
      >
        {game.board.map((owner, index) => {
          const isCore = index === NEBULA_CORE;
          const empty = owner === null;
          const inPreview = previewCells.has(index);
          const legal = cellPlacementLegal(index);

          const edgeOwner = homeEdgeOwnerAt(index, game.playerCount);
          const edgeStyle =
            edgeOwner === "neutral"
              ? "ring-1 ring-inset ring-slate-500/50 bg-slate-700/20"
              : edgeOwner !== null
                ? `${getPlayerTurnStyle(edgeOwner).surface} ${getPlayerTurnStyle(edgeOwner).surfaceBorder} ring-1 ring-inset`
                : "";

          let emptyClass = edgeStyle || "bg-surface-raised/80 ring-1 ring-surface-border/80";
          if (inPreview) {
            emptyClass = legal
              ? `${turnStyle.piece} opacity-55 ring-2 ${turnStyle.pieceRing}`
              : "bg-red-500/25 ring-2 ring-red-400/70";
          }

          return (
            <div
              key={index}
              role="button"
              tabIndex={isCore || isGameOver ? -1 : 0}
              data-cell-index={index}
              className={`aspect-square min-h-[1.15rem] rounded-[2px] text-[9px] font-semibold transition sm:min-h-5 sm:text-[10px] ${
                isCore
                  ? "cursor-default bg-yellow-300/30 ring-1 ring-yellow-300/60"
                  : empty
                    ? emptyClass
                    : playerPieceClasses(owner)
              } flex items-center justify-center`}
              aria-label={isCore ? "星核" : empty ? "空マス" : `プレイヤー ${owner + 1}`}
            >
              {isCore ? "★" : empty ? "" : owner + 1}
            </div>
          );
        })}
      </div>

      {!isGameOver && (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              disabled={rouletteReady || spinning}
              onClick={spinRoulette}
              className={`rounded-xl border px-5 py-2.5 text-sm font-medium text-white transition disabled:opacity-40 ${turnStyle.surface} ${turnStyle.surfaceBorder} hover:brightness-110`}
            >
              {spinning ? "ルーレット回転中…" : rouletteReady ? "ルーレット済み" : "ルーレットを回す"}
            </button>
            {selectedPieceId ? (
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 1) % 4)}
                className="rounded-xl border border-surface-border bg-surface-raised px-4 py-2.5 text-sm text-white hover:border-white/30"
              >
                回転（{rotation * 90}°）
              </button>
            ) : null}
            {mustPass ? (
              <button
                type="button"
                onClick={pass}
                className="rounded-xl border border-surface-border bg-surface-raised px-4 py-2.5 text-sm font-medium text-white hover:border-white/30"
              >
                パスする
              </button>
            ) : null}
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
                  className={`flex min-w-[4.5rem] flex-col items-center gap-2 rounded-xl border px-3 py-2 ${piecePickClass(id)}`}
                >
                  <NebulaPiecePreview
                    pieceId={id}
                    rotation={previewRotationFor(id)}
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
              className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-2 ${piecePickClass(NEBULA_MONO_ID)}`}
            >
              <span className="text-xs text-slate-400">常時</span>
              <NebulaPiecePreview
                pieceId={NEBULA_MONO_ID}
                rotation={previewRotationFor(NEBULA_MONO_ID)}
                playerIndex={game.currentPlayer}
              />
              <span className="text-xs text-slate-300">単マス</span>
            </button>
          </div>
        </div>
      )}

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
