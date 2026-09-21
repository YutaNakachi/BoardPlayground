"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { setupPillClass } from "@/components/play/shared/PlaySetupCard";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { getPlayerFill } from "@/lib/player-colors";
import {
  DOTS_BOXES_SIZE_OPTIONS,
  drawDotsBoxesEdge,
  dotsBoxesWinners,
  edgeKey,
  initialDotsBoxes,
  type DotsBoxesSize,
  type DotsBoxesState,
  type Edge,
} from "@/lib/play/dots-and-boxes";

type Phase = "setup" | "playing" | "game-over";

function edgeMidpoint(
  edge: Edge,
  rows: number,
  cols: number
): { x: number; y: number } {
  const unitX = 100 / cols;
  const unitY = 100 / rows;
  if (edge.kind === "h") {
    return {
      x: (edge.col + 0.5) * unitX,
      y: edge.row * unitY,
    };
  }
  return {
    x: edge.col * unitX,
    y: (edge.row + 0.5) * unitY,
  };
}

export function DotsAndBoxesGame() {
  const { recordLocalPlay } = usePlayPage();
  const [phase, setPhase] = useState<Phase>("setup");
  const [size, setSize] = useState<DotsBoxesSize>(4);
  const [state, setState] = useState<DotsBoxesState>(() => initialDotsBoxes(4));

  const startGame = useCallback(() => {
    recordLocalPlay();
    setState(initialDotsBoxes(size));
    setPhase("playing");
  }, [recordLocalPlay, size]);

  const draw = useCallback(
    (edge: Edge) => {
      if (phase !== "playing" || state.over) return;
      const next = drawDotsBoxesEdge(state, edge);
      if (!next) return;
      setState(next);
      if (next.over) setPhase("game-over");
    },
    [phase, state]
  );

  const winners = useMemo(() => {
    if (phase !== "game-over") return null;
    return dotsBoxesWinners(state.scores);
  }, [phase, state.scores]);

  const { rows, cols } = state;

  const horizontalEdges = useMemo(() => {
    const edges: Edge[] = [];
    for (let row = 0; row <= rows; row++) {
      for (let col = 0; col < cols; col++) {
        edges.push({ kind: "h", row, col });
      }
    }
    return edges;
  }, [rows, cols]);

  const verticalEdges = useMemo(() => {
    const edges: Edge[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col <= cols; col++) {
        edges.push({ kind: "v", row, col });
      }
    }
    return edges;
  }, [rows, cols]);

  const backToSetup = useCallback(() => setPhase("setup"), []);
  usePlaySetupNavigation(phase === "setup", backToSetup);

  const sizeSelector = (
    <div className="space-y-2">
      <p className="text-center text-xs text-slate-400">盤面サイズ</p>
      <div className="flex flex-wrap justify-center gap-2">
        {DOTS_BOXES_SIZE_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setSize(option)}
            className={`min-w-14 px-4 py-2 ${setupPillClass(size === option)}`}
          >
            {option}×{option}
          </button>
        ))}
      </div>
    </div>
  );

  if (phase === "setup") {
    return (
      <SetupPanel
        title="ドット・アンド・ボックス"
        description={`${size}×${size}の箱を囲む点の辺に線を引き、完成した箱が多い方が勝ちです。`}
        playerCount={2}
        playerOptions={[2]}
        onPlayerCount={() => {}}
        onStart={startGame}
        extra={sizeSelector}
      />
    );
  }

  const isGameOver = phase === "game-over" && winners !== null;
  const totalBoxes = rows * cols;

  return (
    <div className="space-y-6">
      {isGameOver && winners && (
        <ResultPanel
          variant="inline"
          winners={winners}
          onReplay={() => setPhase("setup")}
          details={
            <ul className="space-y-1 text-slate-400">
              <li>プレイヤー 1: {state.scores[0]} 箱</li>
              <li>プレイヤー 2: {state.scores[1]} 箱</li>
            </ul>
          }
        />
      )}

      {!isGameOver && (
        <TurnBanner
          playerIndex={state.current}
          playerLabel={`プレイヤー ${state.current + 1}`}
          action="線を1本引く"
        />
      )}

      <p className="text-center text-xs text-slate-500">
        {rows}×{cols}（{totalBoxes}箱）
      </p>

      <div className="relative mx-auto aspect-square w-full max-w-md">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          {Array.from({ length: rows + 1 }, (_, row) =>
            Array.from({ length: cols + 1 }, (_, col) => (
              <circle
                key={`dot-${row}-${col}`}
                cx={(col * 100) / cols}
                cy={(row * 100) / rows}
                r="1.8"
                fill="#94a3b8"
              />
            ))
          )}

          {state.owners.map((owner, index) => {
            if (owner === null) return null;
            const row = Math.floor(index / cols);
            const col = index % cols;
            const x = ((col + 0.5) * 100) / cols;
            const y = ((row + 0.5) * 100) / rows;
            return (
              <text
                key={`box-${index}`}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={rows >= 5 ? "5" : "7"}
                fontWeight="700"
                fill={getPlayerFill(owner)}
              >
                {owner + 1}
              </text>
            );
          })}

          {horizontalEdges.map((edge) => {
            const { x, y } = edgeMidpoint(edge, rows, cols);
            const key = edgeKey(edge);
            const owner = state.edgeOwners[key];
            const drawn = owner !== undefined;
            return (
              <g key={key}>
                <line
                  x1={(edge.col * 100) / cols}
                  y1={(edge.row * 100) / rows}
                  x2={((edge.col + 1) * 100) / cols}
                  y2={(edge.row * 100) / rows}
                  stroke={drawn ? getPlayerFill(owner) : "transparent"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {!drawn ? (
                  <circle
                    cx={x}
                    cy={y}
                    r="6"
                    fill="transparent"
                    stroke="transparent"
                    className="cursor-pointer"
                    onClick={() => draw(edge)}
                  >
                    <title>横の線を引く</title>
                  </circle>
                ) : null}
              </g>
            );
          })}

          {verticalEdges.map((edge) => {
            const { x, y } = edgeMidpoint(edge, rows, cols);
            const key = edgeKey(edge);
            const owner = state.edgeOwners[key];
            const drawn = owner !== undefined;
            return (
              <g key={key}>
                <line
                  x1={(edge.col * 100) / cols}
                  y1={(edge.row * 100) / rows}
                  x2={(edge.col * 100) / cols}
                  y2={((edge.row + 1) * 100) / rows}
                  stroke={drawn ? getPlayerFill(owner) : "transparent"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {!drawn ? (
                  <circle
                    cx={x}
                    cy={y}
                    r="6"
                    fill="transparent"
                    stroke="transparent"
                    className="cursor-pointer"
                    onClick={() => draw(edge)}
                  >
                    <title>縦の線を引く</title>
                  </circle>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
