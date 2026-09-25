"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { useCallback, useMemo, useRef, useState, type CSSProperties } from "react";
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
  homeEdgeOwnersAt,
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
  type NebulaEdge,
  type NebulaPlacement,
  type NebulaState,
  borderEdgesAt,
} from "@/lib/play/nebula-link";

type Phase = "setup" | "playing" | "game-over";

/** タッチ時は指の少し上・左をアンカーにする（指で隠れない） */
const TOUCH_PLACEMENT_OFFSET_Y = 56;
const TOUCH_PLACEMENT_OFFSET_X = 28;

function cellIndexFromClient(
  grid: HTMLDivElement,
  clientX: number,
  clientY: number,
  pointerType: string
): number | null {
  const rect = grid.getBoundingClientRect();
  const offsetY = pointerType === "touch" ? TOUCH_PLACEMENT_OFFSET_Y : 0;
  const offsetX = pointerType === "touch" ? TOUCH_PLACEMENT_OFFSET_X : 0;
  const x = clientX - rect.left - offsetX;
  const y = clientY - rect.top - offsetY;
  if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return null;
  const col = Math.min(NEBULA_SIZE - 1, Math.floor((x / rect.width) * NEBULA_SIZE));
  const row = Math.min(NEBULA_SIZE - 1, Math.floor((y / rect.height) * NEBULA_SIZE));
  return nebulaIndex(row, col);
}

const NEUTRAL_EDGE_FILL = "rgba(71,85,105,0.55)";

function edgeFillAt(
  row: number,
  col: number,
  playerCount: number
): Partial<Record<NebulaEdge, string>> {
  const edges = borderEdgesAt(row, col);
  const owners = homeEdgeOwnersAt(nebulaIndex(row, col), playerCount);
  const fills: Partial<Record<NebulaEdge, string>> = {};
  edges.forEach((edge, i) => {
    const owner = owners[i];
    fills[edge] =
      owner === "neutral"
        ? NEUTRAL_EDGE_FILL
        : getPlayerTurnStyle(owner).fill;
  });
  return fills;
}

type CornerBandLayer = { className: string; color: string };

type HomeEdgeLook = {
  className: string;
  style?: CSSProperties;
  cornerBands?: CornerBandLayer[];
};

const NEBULA_CORNER_BASE = "rgba(22, 18, 32, 0.88)";

function fillAlpha(color: string, alpha = 0.55): string {
  if (color.startsWith("rgba")) return color;
  const hex = color.replace("#", "");
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** 角マス：辺側の帯を DOM レイヤーで描画（グラデ多重は端末で消えることがある） */
function cornerBandLayers(
  row: number,
  col: number,
  fills: Partial<Record<NebulaEdge, string>>
): CornerBandLayer[] | null {
  const last = NEBULA_SIZE - 1;
  const n = fills.north;
  const s = fills.south;
  const e = fills.east;
  const w = fills.west;

  if (row === 0 && col === 0 && n && w) {
    return [
      { className: "absolute inset-y-0 left-0 w-1/2", color: fillAlpha(w) },
      { className: "absolute inset-x-0 top-0 z-[1] h-1/2", color: fillAlpha(n) },
    ];
  }
  if (row === 0 && col === last && n && e) {
    return [
      { className: "absolute inset-y-0 right-0 w-1/2", color: fillAlpha(e) },
      { className: "absolute inset-x-0 top-0 z-[1] h-1/2", color: fillAlpha(n) },
    ];
  }
  if (row === last && col === 0 && s && w) {
    return [
      { className: "absolute inset-y-0 left-0 w-1/2", color: fillAlpha(w) },
      { className: "absolute inset-x-0 bottom-0 z-[1] h-1/2", color: fillAlpha(s) },
    ];
  }
  if (row === last && col === last && s && e) {
    return [
      { className: "absolute inset-y-0 right-0 w-1/2", color: fillAlpha(e) },
      { className: "absolute inset-x-0 bottom-0 z-[1] h-1/2", color: fillAlpha(s) },
    ];
  }
  return null;
}

function nebulaHomeEdgeCellLook(
  row: number,
  col: number,
  playerCount: number
): HomeEdgeLook {
  const ring = "ring-1 ring-inset";
  const owners = homeEdgeOwnersAt(nebulaIndex(row, col), playerCount);
  if (owners.length === 0) return { className: "" };

  if (owners.length === 1) {
    const only = owners[0];
    if (only === "neutral") {
      return { className: `${ring} bg-slate-600/40 ring-slate-500/70` };
    }
    const s = getPlayerTurnStyle(only);
    return {
      className: `${ring} ${s.pieceRing}`,
      style: { backgroundColor: `${s.fill}73` },
    };
  }

  const fills = edgeFillAt(row, col, playerCount);
  const bands = cornerBandLayers(row, col, fills);
  if (bands) {
    return {
      className: `${ring} relative overflow-hidden ring-white/25`,
      style: { backgroundColor: NEBULA_CORNER_BASE },
      cornerBands: bands,
    };
  }

  return { className: `${ring} bg-slate-600/40 ring-slate-500/70` };
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
        description="21×21の星雲盤で、ルーレットの形状ブロックを置き、星核を自分のホーム辺側に閉じ込めたら勝ち。単マスは常に使えます。"
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

  const piecePickButtonClass = (pieceId: string) =>
    `flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border p-0.5 sm:h-12 sm:w-12 ${
      selectedPieceId === pieceId
        ? `${turnStyle.sectionBorder} ${turnStyle.sectionBg} ring-2 ${turnStyle.sectionRing}`
        : "border-surface-border bg-surface-raised hover:border-white/20"
    }`;

  const previewRotationFor = (pieceId: string) =>
    selectedPieceId === pieceId ? rotation : 0;

  const pickPiece = (pieceId: string) => {
    setNotice(null);
    if (selectedPieceId === pieceId) {
      setRotation((r) => (r + 1) % 4);
    } else {
      setSelectedPieceId(pieceId);
      setRotation(0);
    }
  };

  const placementLegal =
    hoverIndex !== null &&
    Boolean(selectedPieceId && cellPlacementLegal(hoverIndex));

  const handleGridPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isGameOver || !selectedPieceId) return;
    const index = cellIndexFromClient(e.currentTarget, e.clientX, e.clientY, e.pointerType);
    if (index === null) return;
    setHoverIndex(index);
    setPlacingPointer(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleGridPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!selectedPieceId) return;
    const index = cellIndexFromClient(e.currentTarget, e.clientX, e.clientY, e.pointerType);
    if (index !== null) setHoverIndex(index);
  };

  const handleGridPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!placingPointer && !selectedPieceId) return;
    const index =
      cellIndexFromClient(e.currentTarget, e.clientX, e.clientY, e.pointerType) ?? hoverIndex;
    if (index !== null && selectedPieceId && cellPlacementLegal(index)) {
      placeAt(index);
    }
    setPlacingPointer(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div className="space-y-2 sm:space-y-3">
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
                ? "盤上でドラッグして離して配置・同じ形をもう一度押すと回転"
                : rouletteReady
                  ? "ルーレットの形または単マスを選んでください"
                  : "ルーレットを回すか、単マスを選んでください")
          }
        />
      )}

      <div
        ref={gridRef}
        className={`mx-auto grid w-fit max-w-full gap-px sm:gap-0.5 ${
          selectedPieceId && !isGameOver ? "touch-none select-none" : ""
        }`}
        style={{
          gridTemplateColumns: `repeat(${NEBULA_SIZE}, clamp(0.95rem, 4vmin, 1.3rem))`,
          gridTemplateRows: `repeat(${NEBULA_SIZE}, clamp(0.95rem, 4vmin, 1.3rem))`,
        }}
        onPointerDown={handleGridPointerDown}
        onPointerMove={handleGridPointerMove}
        onPointerUp={handleGridPointerUp}
        onPointerCancel={handleGridPointerUp}
      >
        {game.board.map((owner, index) => {
          const isCore = index === NEBULA_CORE;
          const empty = owner === null;
          const inPreview = previewCells.has(index);

          const { row: cellRow, col: cellCol } = nebulaRowCol(index);
          const edgeLook = nebulaHomeEdgeCellLook(
            cellRow,
            cellCol,
            game.playerCount
          );

          let emptyClass =
            edgeLook.className || "bg-surface-raised/80 ring-1 ring-surface-border/80";
          const emptyStyle = edgeLook.style;
          const cornerBandLayers = edgeLook.cornerBands;
          if (inPreview) {
            emptyClass = placementLegal
              ? `${turnStyle.piece} opacity-90 ring-2 ring-white/80 brightness-110`
              : "bg-slate-500/35 ring-2 ring-slate-400/50";
          }

          return (
            <div
              key={index}
              role="button"
              tabIndex={isCore || isGameOver ? -1 : 0}
              data-cell-index={index}
              style={empty && !inPreview && !isCore ? emptyStyle : undefined}
              className={`size-full rounded-[1px] transition ${
                isCore
                  ? "cursor-default bg-yellow-300/30 ring-1 ring-yellow-300/60"
                  : empty
                    ? emptyClass
                    : playerPieceClasses(owner)
              } flex items-center justify-center`}
              aria-label={isCore ? "星核" : empty ? "空マス" : `プレイヤー ${owner + 1}`}
            >
              {isCore ? "★" : null}
              {empty && !inPreview && cornerBandLayers
                ? cornerBandLayers.map((band, bandIndex) => (
                    <span
                      key={bandIndex}
                      aria-hidden
                      className={`pointer-events-none ${band.className}`}
                      style={{ backgroundColor: band.color }}
                    />
                  ))
                : null}
            </div>
          );
        })}
      </div>

      {!isGameOver && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex max-w-full flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              disabled={rouletteReady || spinning}
              onClick={spinRoulette}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium text-white transition disabled:opacity-40 sm:text-sm sm:px-4 sm:py-2 ${turnStyle.surface} ${turnStyle.surfaceBorder} hover:brightness-110`}
            >
              {spinning ? "回転中…" : rouletteReady ? "ルーレット済" : "ルーレット"}
            </button>
            {mustPass ? (
              <button
                type="button"
                onClick={pass}
                className="rounded-lg border border-surface-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-white hover:border-white/30 sm:text-sm sm:px-4 sm:py-2"
              >
                パス
              </button>
            ) : null}
            {rouletteReady
              ? game.roulette.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => pickPiece(id)}
                    className={piecePickButtonClass(id)}
                    aria-label={`形状 ${id}。選択中に再押下で回転`}
                  >
                    <NebulaPiecePreview
                      pieceId={id}
                      rotation={previewRotationFor(id)}
                      playerIndex={game.currentPlayer}
                    />
                  </button>
                ))
              : null}
            <button
              type="button"
              onClick={() => pickPiece(NEBULA_MONO_ID)}
              className={piecePickButtonClass(NEBULA_MONO_ID)}
              aria-label="単マス（常時利用可）。選択中に再押下で回転"
            >
              <NebulaPiecePreview
                pieceId={NEBULA_MONO_ID}
                rotation={previewRotationFor(NEBULA_MONO_ID)}
                playerIndex={game.currentPlayer}
              />
            </button>
          </div>

          <ul className="flex max-w-full flex-wrap justify-center gap-1.5">
            {Array.from({ length: game.playerCount }, (_, player) => {
              const style = getPlayerTurnStyle(player);
              const edge = playerHomeEdge(player, game.playerCount);
              return (
                <li
                  key={player}
                  className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] sm:text-xs ${
                    game.currentPlayer === player
                      ? `${style.sectionBorder} ${style.sectionBg}`
                      : "border-surface-border bg-surface-raised/80"
                  }`}
                >
                  <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
                  <span className="text-slate-200">P{player + 1}</span>
                  <span className={style.surfaceText}>{homeEdgeLabel(edge)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {isGameOver && (
        <ul className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: game.playerCount }, (_, player) => {
            const style = getPlayerTurnStyle(player);
            const edge = playerHomeEdge(player, game.playerCount);
            return (
              <li
                key={player}
                className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface-raised px-2 py-1 text-xs"
              >
                <span className={`inline-block h-2 w-2 rounded-full ${style.dot}`} />
                P{player + 1} · {homeEdgeLabel(edge)}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
