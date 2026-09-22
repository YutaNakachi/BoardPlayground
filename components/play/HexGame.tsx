"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import {
  applyHexSwap,
  declineHexSwap,
  HEX_GRID_STROKE,
  HEX_GRID_STROKE_WIDTH,
  HEX_STONE_COLORS,
  hexBoardEdges,
  hexCellFill,
  hexCenter,
  hexCoord,
  hexPolygonPoints,
  hexViewBox,
  initialHexState,
  placeHexStone,
  stoneForPlayer,
  type HexState,
  type HexWinResult,
} from "@/lib/play/hex";

type Phase = "setup" | "playing" | "game-over";

const VIEW_BOX = hexViewBox(2.2);

function stoneLabel(state: HexState, player: 0 | 1): string {
  const stone = state.playerStone[player];
  return `プレイヤー ${player + 1}（${HEX_STONE_COLORS[stone].label}）`;
}

export function HexGame() {
  const { recordLocalPlay } = usePlayPage();
  const [phase, setPhase] = useState<Phase>("setup");
  const [game, setGame] = useState<HexState>(() => initialHexState());
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [lastPlaced, setLastPlaced] = useState<number | null>(null);
  const [winResult, setWinResult] = useState<HexWinResult | null>(null);

  const startGame = useCallback(() => {
    recordLocalPlay();
    setGame(initialHexState());
    setHoverIndex(null);
    setLastPlaced(null);
    setWinResult(null);
    setPhase("playing");
  }, [recordLocalPlay]);

  const resetGame = useCallback(() => {
    setGame(initialHexState());
    setHoverIndex(null);
    setLastPlaced(null);
    setWinResult(null);
    setPhase("playing");
  }, []);

  const handlePlace = useCallback(
    (index: number) => {
      if (phase !== "playing" || game.swapPending) return;
      const result = placeHexStone(game, index);
      if (!result) return;
      setLastPlaced(index);
      setGame(result.next);
      if (result.win) {
        setWinResult(result.win);
        setPhase("game-over");
      }
    },
    [phase, game]
  );

  const handleSwap = useCallback(() => {
    if (phase !== "playing" || !game.swapPending) return;
    setGame(applyHexSwap(game));
    setLastPlaced(null);
  }, [phase, game]);

  const handleDeclineSwap = useCallback(() => {
    if (phase !== "playing" || !game.swapPending) return;
    setGame(declineHexSwap(game));
  }, [phase, game]);

  const backToSetup = useCallback(() => setPhase("setup"), []);
  usePlaySetupNavigation(phase === "setup", backToSetup);

  const boardEdges = useMemo(() => hexBoardEdges(), []);

  const winPathSet = useMemo(
    () => new Set(winResult?.path ?? []),
    [winResult]
  );

  const currentStone = stoneForPlayer(game, game.current);
  const winners = winResult ? [game.playerStone.indexOf(winResult.winner)] : null;

  if (phase === "setup") {
    return (
      <SetupPanel
        title="ヘックス"
        description="11×11の菱形グリッドに石を置き、南北（赤）または東西（青）の辺をつなげた方が勝ちです。"
        playerCount={2}
        playerOptions={[2]}
        onPlayerCount={() => {}}
        onStart={startGame}
      />
    );
  }

  const isGameOver = phase === "game-over" && winResult !== null;

  return (
    <div className="space-y-5">
      {isGameOver && winners && winResult && (
        <ResultPanel
          variant="inline"
          winners={winners}
          onReplay={() => setPhase("setup")}
          details={
            <p className="text-slate-400">
              {HEX_STONE_COLORS[winResult.winner].label}が両端をつなぎました。
            </p>
          }
        />
      )}

      {!isGameOver && (
        <TurnBanner
          playerIndex={game.current}
          playerLabel={stoneLabel(game, game.current)}
          action={
            game.swapPending
              ? "スワップするか、そのまま打ってください"
              : currentStone === 0
                ? "南北の辺をつなぐ"
                : "東西の辺をつなぐ"
          }
        />
      )}

      {game.swapPending && !isGameOver && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleSwap}
            className="rounded-full border border-sky-400/50 bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-200 transition hover:bg-sky-500/25"
          >
            スワップ（先手の石を自分の色にする）
          </button>
          <button
            type="button"
            onClick={handleDeclineSwap}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            そのまま打る
          </button>
        </div>
      )}

      <div className="relative mx-auto w-full max-w-4xl">
        <svg
          viewBox={`${VIEW_BOX.x} ${VIEW_BOX.y} ${VIEW_BOX.width} ${VIEW_BOX.height}`}
          className="block h-auto w-full touch-manipulation"
          aria-label="ヘックスの盤"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <filter id="hex-win-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feDropShadow dx="0" dy="0" stdDeviation="0.1" floodColor="#fbbf24" />
            </filter>
          </defs>

          <rect
            x={VIEW_BOX.x}
            y={VIEW_BOX.y}
            width={VIEW_BOX.width}
            height={VIEW_BOX.height}
            fill="#111827"
            rx="0.4"
          />

          {game.board.map((cell, index) => {
            const { row, col } = hexCoord(index);
            const points = hexPolygonPoints(row, col);

            return (
              <polygon
                key={`fill-${index}`}
                points={points}
                fill={hexCellFill(row, col, winPathSet.has(index))}
                className={
                  cell === null && !isGameOver && !game.swapPending
                    ? "cursor-pointer"
                    : ""
                }
                onMouseEnter={() => {
                  if (cell === null && !isGameOver && !game.swapPending) {
                    setHoverIndex(index);
                  }
                }}
                onClick={() => handlePlace(index)}
              />
            );
          })}

          {boardEdges.map((edge, i) => (
            <line
              key={i}
              x1={edge.a.x}
              y1={edge.a.y}
              x2={edge.b.x}
              y2={edge.b.y}
              stroke={HEX_GRID_STROKE}
              strokeWidth={HEX_GRID_STROKE_WIDTH}
              strokeLinecap="round"
              className="pointer-events-none"
            />
          ))}

          {game.board.map((cell, index) => {
            const { row, col } = hexCoord(index);
            const points = hexPolygonPoints(row, col);
            const isWinCell = winPathSet.has(index);
            const isHover =
              hoverIndex === index && cell === null && !isGameOver && !game.swapPending;
            const isLast = lastPlaced === index;

            return (
              <g key={`piece-${index}`} className="pointer-events-none">
                {isHover && (
                  <polygon
                    points={points}
                    fill={HEX_STONE_COLORS[currentStone].fill}
                    opacity={0.32}
                  />
                )}
                {isWinCell && (
                  <polygon
                    points={points}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth={0.09}
                    opacity={0.9}
                    filter="url(#hex-win-glow)"
                  />
                )}
                {cell !== null && (
                  <circle
                    cx={hexCenter(row, col).x}
                    cy={hexCenter(row, col).y}
                    r={isLast ? 0.44 : 0.4}
                    fill={HEX_STONE_COLORS[cell].fill}
                    stroke={HEX_STONE_COLORS[cell].stroke}
                    strokeWidth={0.05}
                    className="transition-all duration-200"
                    filter={isWinCell ? "url(#hex-win-glow)" : undefined}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#ff7d9e]" />
          赤: 南北
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#62b4ff]" />
          青: 東西
        </span>
        {!isGameOver && (
          <button
            type="button"
            onClick={resetGame}
            className="rounded-full border border-white/10 px-3 py-1 text-slate-400 transition hover:border-white/20 hover:text-slate-200"
          >
            リセット
          </button>
        )}
      </div>
    </div>
  );
}
