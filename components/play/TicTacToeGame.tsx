"use client";

import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import {
  emptyTttBoard,
  TTT_SIZE,
  tttBoardFull,
  tttWinner,
  type Board,
  type Player,
} from "@/lib/play/tic-tac-toe";

type Phase = "setup" | "playing" | "game-over";

export function TicTacToeGame() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [board, setBoard] = useState<Board>(emptyTttBoard);
  const [current, setCurrent] = useState<Player>(0);
  const [winner, setWinner] = useState<Player | "draw" | null>(null);

  const startGame = useCallback(() => {
    setBoard(emptyTttBoard());
    setCurrent(0);
    setWinner(null);
    setPhase("playing");
  }, []);

  const place = useCallback(
    (index: number) => {
      if (phase !== "playing" || board[index] !== null) return;
      const next = board.map((cell, i) => (i === index ? current : cell));
      setBoard(next);
      const won = tttWinner(next);
      if (won !== null) {
        setWinner(won);
        setPhase("game-over");
        return;
      }
      if (tttBoardFull(next)) {
        setWinner("draw");
        setPhase("game-over");
        return;
      }
      setCurrent(current === 0 ? 1 : 0);
    },
    [phase, board, current]
  );

  const winners = useMemo(() => {
    if (phase !== "game-over" || winner === null) return null;
    if (winner === "draw") return [0, 1];
    return [winner];
  }, [phase, winner]);

  if (phase === "setup") {
    return (
      <SetupPanel
        title="三目並べ"
        description="3×3のマスに交互に置き、縦・横・斜めで3つ並べた方が勝ちです。"
        playerCount={2}
        playerOptions={[2]}
        onPlayerCount={() => {}}
        onStart={startGame}
      />
    );
  }

  if (phase === "game-over" && winners) {
    return (
      <ResultPanel
        winners={winners}
        onReplay={() => setPhase("setup")}
        details={
          <p className="text-slate-400">
            {winner === "draw"
              ? "引き分けです。"
              : `プレイヤー ${Number(winner) + 1} が3つ並べました。`}
          </p>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <TurnBanner
        playerIndex={current}
        playerLabel={`プレイヤー ${current + 1}（${current === 0 ? "×" : "○"}）`}
      />

      <div
        className="mx-auto grid max-w-xs gap-1.5 rounded-xl bg-white/5 p-2"
        style={{ gridTemplateColumns: `repeat(${TTT_SIZE}, minmax(0, 1fr))` }}
      >
        {board.map((cell, index) => (
          <button
            key={index}
            type="button"
            disabled={cell !== null}
            onClick={() => place(index)}
            className="flex aspect-square min-h-20 items-center justify-center rounded-lg bg-surface-raised text-3xl font-bold text-white disabled:cursor-default sm:min-h-24 sm:text-4xl"
            aria-label={
              cell === 0 ? "×" : cell === 1 ? "○" : `空マス ${index + 1}`
            }
          >
            {cell === 0 ? "×" : cell === 1 ? "○" : ""}
          </button>
        ))}
      </div>
    </div>
  );
}
