"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import {
  applyFoxHoundsMove,
  FH_BOARD_LINES,
  FH_NODE_POS,
  foxHoundsHareDestinations,
  foxHoundsHoundDestinations,
  foxHoundsWinMessage,
  foxHoundsWinner,
  initialFoxHounds,
  type FoxHoundsState,
  type FoxHoundsWinReason,
  type Player,
} from "@/lib/play/fox-hounds";

type Phase = "setup" | "playing" | "game-over";

const PLAYER_LABELS = ["猟犬", "ウサギ"] as const;

export function FoxHoundsGame() {
  const { recordLocalPlay } = usePlayPage();
  const [phase, setPhase] = useState<Phase>("setup");
  const [state, setState] = useState<FoxHoundsState>(() => initialFoxHounds());
  const [selected, setSelected] = useState<number | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);
  const [winReason, setWinReason] = useState<FoxHoundsWinReason | null>(null);

  const startGame = useCallback(() => {
    recordLocalPlay();
    setState(initialFoxHounds());
    setSelected(null);
    setWinner(null);
    setWinReason(null);
    setPhase("playing");
  }, [recordLocalPlay]);

  const { board, current, stallTurns } = state;

  const destinations = useMemo(() => {
    if (phase !== "playing") return [];
    if (current === 1) {
      return foxHoundsHareDestinations(board);
    }
    if (selected === null || board[selected] !== 0) return [];
    return foxHoundsHoundDestinations(board, selected);
  }, [phase, board, current, selected]);

  const onNode = useCallback(
    (index: number) => {
      if (phase !== "playing") return;

      const from = current === 1 ? board.indexOf(1) : selected;
      if (destinations.includes(index) && from !== null && from >= 0) {
        const next = applyFoxHoundsMove(state, from, index);
        if (!next) return;
        setState(next);
        setSelected(null);
        const outcome = foxHoundsWinner(next, next.current);
        if (outcome) {
          setWinner(outcome.winner);
          setWinReason(outcome.reason);
          setPhase("game-over");
        }
        return;
      }

      const piece = board[index];
      if (piece !== current) {
        setSelected(null);
        return;
      }
      setSelected(index);
    },
    [phase, destinations, selected, state, board, current]
  );

  const hareFrom = board.indexOf(1);

  const backToSetup = useCallback(() => setPhase("setup"), []);
  usePlaySetupNavigation(phase === "setup", backToSetup);

  if (phase === "setup") {
    return (
      <SetupPanel
        title="ウサギと猟犬"
        description="9点の専用盤で、猟犬3匹がウサギ1匹を囲い、ウサギは左端の列を目指します。猟犬が先手です。"
        playerCount={2}
        playerOptions={[2]}
        onPlayerCount={() => {}}
        onStart={startGame}
      />
    );
  }

  const isGameOver = phase === "game-over" && winner !== null;

  return (
    <div className="space-y-6">
      {isGameOver && winner !== null && (
        <ResultPanel
          variant="inline"
          winners={[winner]}
          onReplay={() => setPhase("setup")}
          details={
            <p className="text-slate-400">
              {winReason ? foxHoundsWinMessage(winReason) : null}
            </p>
          }
        />
      )}

      {!isGameOver && (
        <TurnBanner
          playerIndex={current}
          playerLabel={`プレイヤー ${current + 1}（${PLAYER_LABELS[current]}）`}
        />
      )}

      {!isGameOver && current === 0 && stallTurns > 0 && (
        <p className="text-center text-xs text-amber-300/90">
          猟犬の停滞 {stallTurns}/{10} 手（10手でウサギの勝ち）
        </p>
      )}

      <div className="relative mx-auto aspect-[5/3] w-full max-w-2xl px-2">
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-label="ウサギと猟犬の盤">
          <rect width="100" height="100" rx="8" fill="#0f172a" opacity="0.35" />

          {FH_BOARD_LINES.map(([from, to]) => {
            const a = FH_NODE_POS[from];
            const b = FH_NODE_POS[to];
            return (
              <line
                key={`${from}-${to}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#64748b"
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}

          {FH_NODE_POS.map((pos, index) => {
            const piece = board[index];
            const isDest = destinations.includes(index);
            const isSel =
              selected === index || (current === 1 && index === hareFrom);
            const isHare = piece === 1;
            const isHound = piece === 0;

            return (
              <g key={index}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isSel ? 7 : 6}
                  fill="#1e293b"
                  stroke={isSel ? "#a5b4fc" : isDest ? "#bef264" : "#94a3b8"}
                  strokeWidth={isSel || isDest ? 2 : 1.5}
                  className="cursor-pointer"
                  onClick={() => onNode(index)}
                />
                {isDest && piece === null ? (
                  <circle cx={pos.x} cy={pos.y} r="2" fill="#bef264" />
                ) : null}
                {isHare ? (
                  <text
                    x={pos.x}
                    y={pos.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="9"
                    className="pointer-events-none select-none"
                  >
                    🐇
                  </text>
                ) : null}
                {isHound ? (
                  <g transform={`translate(${pos.x} ${pos.y})`}>
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="8.5"
                      transform="scale(-1, 1)"
                      className="pointer-events-none select-none"
                    >
                      🐕
                    </text>
                  </g>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      <p className="text-center text-xs text-slate-500">
        プレイヤー1＝猟犬（先手）／プレイヤー2＝ウサギ
      </p>
    </div>
  );
}
