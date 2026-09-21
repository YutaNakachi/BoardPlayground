"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { getPlayerFill } from "@/lib/player-colors";
import {
  DB_BOX_COLS,
  DB_BOX_ROWS,
  drawDotsBoxesEdge,
  dotsBoxesWinners,
  initialDotsBoxes,
  type DotsBoxesState,
  type Edge,
} from "@/lib/play/dots-and-boxes";

type Phase = "setup" | "playing" | "game-over";

function edgeMidpoint(edge: Edge): { x: number; y: number } {
  const unit = 100 / Math.max(DB_BOX_ROWS, DB_BOX_COLS);
  if (edge.kind === "h") {
    return {
      x: (edge.col + 0.5) * unit,
      y: edge.row * unit,
    };
  }
  return {
    x: edge.col * unit,
    y: (edge.row + 0.5) * unit,
  };
}

function edgeKey(edge: Edge): string {
  return `${edge.kind}:${edge.row}:${edge.col}`;
}

export function DotsAndBoxesGame() {
  const { recordLocalPlay } = usePlayPage();
  const [phase, setPhase] = useState<Phase>("setup");
  const [state, setState] = useState<DotsBoxesState>(initialDotsBoxes);

  const startGame = useCallback(() => {
    recordLocalPlay();
    setState(initialDotsBoxes());
    setPhase("playing");
  }, [recordLocalPlay]);

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

  const horizontalEdges = useMemo(() => {
    const edges: Edge[] = [];
    for (let row = 0; row <= DB_BOX_ROWS; row++) {
      for (let col = 0; col < DB_BOX_COLS; col++) {
        edges.push({ kind: "h", row, col });
      }
    }
    return edges;
  }, []);

  const verticalEdges = useMemo(() => {
    const edges: Edge[] = [];
    for (let row = 0; row < DB_BOX_ROWS; row++) {
      for (let col = 0; col <= DB_BOX_COLS; col++) {
        edges.push({ kind: "v", row, col });
      }
    }
    return edges;
  }, []);

  const backToSetup = useCallback(() => setPhase("setup"), []);
  usePlaySetupNavigation(phase === "setup", backToSetup);

  if (phase === "setup") {
    return (
      <SetupPanel
        title="ドッツ・アンド・ボックス"
        description="点を線でつないで箱を作ります。箱を完成させたプレイヤーが1点。箱が多い方が勝ちです。"
        playerCount={2}
        playerOptions={[2]}
        onPlayerCount={() => {}}
        onStart={startGame}
      />
    );
  }

  const isGameOver = phase === "game-over" && winners !== null;

  return (
    <div className="space-y-6">
      {!isGameOver && (
      <TurnBanner
        playerIndex={state.current}
        playerLabel={`プレイヤー ${state.current + 1}`}
        action="線を1本引く"
      />
      )}

      <div className="relative mx-auto aspect-square w-full max-w-md">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          {Array.from({ length: DB_BOX_ROWS + 1 }, (_, row) =>
            Array.from({ length: DB_BOX_COLS + 1 }, (_, col) => (
              <circle
                key={`dot-${row}-${col}`}
                cx={(col * 100) / DB_BOX_COLS}
                cy={(row * 100) / DB_BOX_ROWS}
                r="1.8"
                fill="#94a3b8"
              />
            ))
          )}

          {state.owners.map((owner, index) => {
            if (owner === null) return null;
            const row = Math.floor(index / DB_BOX_COLS);
            const col = index % DB_BOX_COLS;
            const x = ((col + 0.5) * 100) / DB_BOX_COLS;
            const y = ((row + 0.5) * 100) / DB_BOX_ROWS;
            return (
              <text
                key={`box-${index}`}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="7"
                fontWeight="700"
                fill={getPlayerFill(owner)}
              >
                {owner + 1}
              </text>
            );
          })}

          {horizontalEdges.map((edge) => {
            const { x, y } = edgeMidpoint(edge);
            const drawn = state.edges.has(edgeKey(edge));
            return (
              <g key={edgeKey(edge)}>
                <line
                  x1={(edge.col * 100) / DB_BOX_COLS}
                  y1={(edge.row * 100) / DB_BOX_ROWS}
                  x2={((edge.col + 1) * 100) / DB_BOX_COLS}
                  y2={(edge.row * 100) / DB_BOX_ROWS}
                  stroke={drawn ? "#e2e8f0" : "transparent"}
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
            const { x, y } = edgeMidpoint(edge);
            const drawn = state.edges.has(edgeKey(edge));
            return (
              <g key={edgeKey(edge)}>
                <line
                  x1={(edge.col * 100) / DB_BOX_COLS}
                  y1={(edge.row * 100) / DB_BOX_ROWS}
                  x2={(edge.col * 100) / DB_BOX_COLS}
                  y2={((edge.row + 1) * 100) / DB_BOX_ROWS}
                  stroke={drawn ? "#e2e8f0" : "transparent"}
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
        </svg>
      </div>

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
    </div>
  );
}
