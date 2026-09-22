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
  HEX_SIZE,
  HEX_STONE_COLORS,
  hexCenter,
  hexCoord,
  hexEdgeCells,
  hexPolygonPoints,
  hexViewBox,
  initialHexState,
  placeHexStone,
  stoneForPlayer,
  type HexState,
  type HexWinResult,
  type Stone,
} from "@/lib/play/hex";

type Phase = "setup" | "playing" | "game-over";

const VIEW_BOX = hexViewBox(1.4);

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

  const edgeSets = useMemo(
    () => ({
      redStart: new Set(hexEdgeCells("red-start")),
      redGoal: new Set(hexEdgeCells("red-goal")),
      blueStart: new Set(hexEdgeCells("blue-start")),
      blueGoal: new Set(hexEdgeCells("blue-goal")),
    }),
    []
  );

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
        description="11×11の菱形グリッドに石を置き、北西—南東（赤）または南西—北東（青）の辺をつなげた方が勝ちです。"
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
                ? "北西—南東の辺をつなぐ"
                : "南西—北東の辺をつなぐ"
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

      <div className="relative mx-auto w-full max-w-3xl">
        <svg
          viewBox={`${VIEW_BOX.x} ${VIEW_BOX.y} ${VIEW_BOX.width} ${VIEW_BOX.height}`}
          className="block h-auto w-full touch-manipulation"
          aria-label="ヘックスの盤"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <filter id="hex-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="0.15" floodColor="#fbbf24" />
            </filter>
          </defs>

          {/* 背景 */}
          <rect
            x={VIEW_BOX.x}
            y={VIEW_BOX.y}
            width={VIEW_BOX.width}
            height={VIEW_BOX.height}
            fill="#0b1220"
            rx="0.6"
          />

          {/* 六角形マス */}
          {game.board.map((cell, index) => {
            const { row, col } = hexCoord(index);
            const points = hexPolygonPoints(row, col);
            const onRedEdge =
              edgeSets.redStart.has(index) || edgeSets.redGoal.has(index);
            const onBlueEdge =
              edgeSets.blueStart.has(index) || edgeSets.blueGoal.has(index);
            const isWinCell = winPathSet.has(index);
            const isHover =
              hoverIndex === index && cell === null && !isGameOver && !game.swapPending;
            const isLast = lastPlaced === index;
            const stone = cell;

            let stroke = "#334155";
            let strokeWidth = 0.06;
            if (onRedEdge && onBlueEdge) {
              stroke = "#c084fc";
              strokeWidth = 0.14;
            } else if (onRedEdge) {
              stroke = "#f87171";
              strokeWidth = 0.12;
            } else if (onBlueEdge) {
              stroke = "#60a5fa";
              strokeWidth = 0.12;
            }
            if (isWinCell) {
              stroke = "#fbbf24";
              strokeWidth = 0.16;
            }

            return (
              <g key={index}>
                <polygon
                  points={points}
                  fill={isWinCell ? "#292524" : "#1e293b"}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  className={
                    cell === null && !isGameOver && !game.swapPending
                      ? "cursor-pointer transition-[fill] duration-150"
                      : ""
                  }
                  style={
                    isLast
                      ? { filter: "drop-shadow(0 0 0.25rem rgba(255,255,255,0.45))" }
                      : undefined
                  }
                  onMouseEnter={() => {
                    if (cell === null && !isGameOver && !game.swapPending) {
                      setHoverIndex(index);
                    }
                  }}
                  onClick={() => handlePlace(index)}
                />
                {isHover && (
                  <polygon
                    points={points}
                    fill={HEX_STONE_COLORS[currentStone].fill}
                    opacity={0.35}
                    className="pointer-events-none"
                  />
                )}
                {stone !== null && (
                  <circle
                    cx={hexCenter(row, col).x}
                    cy={hexCenter(row, col).y}
                    r={0.42}
                    fill={HEX_STONE_COLORS[stone].fill}
                    stroke={HEX_STONE_COLORS[stone].stroke}
                    strokeWidth={0.06}
                    className="pointer-events-none"
                    filter={isWinCell ? "url(#hex-glow)" : undefined}
                  />
                )}
              </g>
            );
          })}

          {/* 外周の色付き境界帯（赤: NW / SE、青: SW / NE） */}
          {drawEdgeBand("red-start", edgeSets.redStart)}
          {drawEdgeBand("red-goal", edgeSets.redGoal)}
          {drawEdgeBand("blue-start", edgeSets.blueStart)}
          {drawEdgeBand("blue-goal", edgeSets.blueGoal)}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-500/80" />
          赤: 北西—南東
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-blue-500/80" />
          青: 南西—北東
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

function drawEdgeBand(
  kind: "red-start" | "red-goal" | "blue-start" | "blue-goal",
  cells: Set<number>
) {
  const color =
    kind.startsWith("red") ? "rgba(239,68,68,0.55)" : "rgba(59,130,246,0.55)";
  const indices = Array.from(cells).sort((a, b) => a - b);
  if (indices.length === 0) return null;

  const points = indices
    .map((index) => {
      const { row, col } = hexCoord(index);
      const { x, y } = hexCenter(row, col);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <polyline
      key={kind}
      points={points}
      fill="none"
      stroke={color}
      strokeWidth={0.22}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-none"
    />
  );
}
