"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { getPlayerTurnStyle, playerPieceClasses } from "@/lib/player-colors";
import {
  applyChineseCheckersMove,
  chineseCheckersCells,
  chineseCheckersMoves,
  coordKey,
  initialChineseCheckers,
  type ChineseCheckersState,
} from "@/lib/play/chinese-checkers";

type Phase = "setup" | "playing" | "game-over";

export function ChineseCheckersGame() {
  const { recordLocalPlay } = usePlayPage();
  const [phase, setPhase] = useState<Phase>("setup");
  const [playerCount, setPlayerCount] = useState(2);
  const [state, setState] = useState<ChineseCheckersState>(initialChineseCheckers(2));
  const [selected, setSelected] = useState<string | null>(null);

  const startGame = useCallback(() => {
    recordLocalPlay();
    setState(initialChineseCheckers(playerCount));
    setSelected(null);
    setPhase("playing");
  }, [recordLocalPlay, playerCount]);

  const destinations = useMemo(() => {
    if (!selected || phase !== "playing") return [];
    return chineseCheckersMoves(state, selected);
  }, [selected, phase, state]);

  const cells = chineseCheckersCells();

  const onCell = useCallback(
    (key: string) => {
      if (phase !== "playing") return;
      if (selected && destinations.includes(key)) {
        const next = applyChineseCheckersMove(state, selected, key);
        if (!next) return;
        setState(next);
        setSelected(null);
        if (next.winner != null) setPhase("game-over");
        return;
      }
      const piece = state.board.get(key);
      if (piece && piece.player === state.current) setSelected(key);
      else setSelected(null);
    },
    [phase, selected, destinations, state]
  );

  if (phase === "setup") {
    return (
      <SetupPanel
        title="チャイニーズチェッカー"
        description="六角格子の盤。隣へ進むか、駒を飛び越えて連続ジャンプ。すべての駒を向かい側のエリアへ移動させた方が勝ち。"
        playerCount={playerCount}
        playerOptions={[2, 3, 4]}
        onPlayerCount={setPlayerCount}
        onStart={startGame}
      />
    );
  }

  const isGameOver = phase === "game-over" && state.winner != null;
  const winners = isGameOver ? [state.winner!] : null;

  const minQ = Math.min(...cells.map((c) => c.q));
  const maxQ = Math.max(...cells.map((c) => c.q));

  return (
    <div className="space-y-6">
      {!isGameOver && (
      <TurnBanner
        playerIndex={state.current}
        playerLabel={`プレイヤー ${state.current + 1}`}
      />
      )}

      <div className="mx-auto max-w-lg overflow-x-auto">
        <div className="relative min-h-80">
          {cells.map((c) => {
            const key = coordKey(c);
            const piece = state.board.get(key);
            const isSel = selected === key;
            const isDest = destinations.includes(key);
            const x = ((c.q - minQ) / (maxQ - minQ)) * 100;
            const y = (c.r / 16) * 100;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onCell(key)}
                style={{ left: `${x}%`, top: `${y}%` }}
                className={`absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border ${
                  isDest ? "border-lime-300 ring-2 ring-lime-300" : "border-surface-border"
                } ${isSel ? "ring-2 ring-accent" : ""} ${
                  piece ? "" : "bg-white/5"
                }`}
                aria-label={piece ? `プレイヤー ${piece.player + 1}` : "空き"}
              >
                {piece ? (
                  <span
                    className={`block h-full w-full rounded-full ${playerPieceClasses(piece.player)}`}
                  />
                ) : isDest ? (
                  <span className="mx-auto block h-2 w-2 rounded-full bg-lime-300/80" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-center text-xs text-slate-500">
        駒をタップして選択し、移動先（緑）をタップ。ジャンプは連続可能。
      </p>

      {isGameOver && winners && (
        <ResultPanel
          variant="inline"
          winners={winners}
          onReplay={() => setPhase("setup")}
          details={<p className="text-slate-400">すべての駒を向かい側のエリアへ移動しました。</p>}
        />
      )}
    </div>
  );
}
