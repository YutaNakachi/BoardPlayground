"use client";

import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import {
  emptyGomokuBoard,
  GOMOKU_SIZE,
  gomokuBoardFull,
  gomokuWinner,
  type Board,
  type Player,
} from "@/lib/play/gomoku";

type Phase = "setup" | "playing" | "game-over";

export function GomokuGame() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [board, setBoard] = useState<Board>(emptyGomokuBoard);
  const [current, setCurrent] = useState<Player>(0);
  const [winner, setWinner] = useState<Player | "draw" | null>(null);

  const startGame = useCallback(() => {
    setBoard(emptyGomokuBoard());
    setCurrent(0);
    setWinner(null);
    setPhase("playing");
  }, []);

  const place = useCallback(
    (index: number) => {
      if (phase !== "playing" || board[index] !== null) return;
      const next = board.map((cell, i) => (i === index ? current : cell));
      setBoard(next);
      const won = gomokuWinner(next);
      if (won !== null) {
        setWinner(won);
        setPhase("game-over");
        return;
      }
      if (gomokuBoardFull(next)) {
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

  const stones = useMemo(() => {
    let black = 0;
    let white = 0;
    for (const cell of board) {
      if (cell === 0) black += 1;
      else if (cell === 1) white += 1;
    }
    return { black, white };
  }, [board]);

  if (phase === "setup") {
    return (
      <SetupPanel
        title="五目並べ"
        description="13×13のマスに交互に置き、縦・横・斜めのいずれかで5つ並べると勝ちです。禁じ手はありません。"
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
              ? "盤が埋まり、5つ並びはありませんでした。"
              : `プレイヤー ${Number(winner) + 1} が5つ並べました。`}
          </p>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <TurnBanner
        playerLabel={`プレイヤー ${current + 1}（${current === 0 ? "黒" : "白"}）`}
        stats={`黒 ${stones.black} · 白 ${stones.white}`}
      />

      <div className="-mx-4 overflow-x-auto px-4">
        <div
          className="mx-auto grid min-w-[22rem] max-w-xl gap-px rounded-lg bg-amber-950/80 p-1"
          style={{ gridTemplateColumns: `repeat(${GOMOKU_SIZE}, minmax(0, 1fr))` }}
        >
        {board.map((cell, index) => (
          <button
            key={index}
            type="button"
            disabled={cell !== null}
            onClick={() => place(index)}
            className="flex aspect-square min-h-7 items-center justify-center bg-amber-100/10 sm:min-h-8"
            aria-label={
              cell === 0 ? "黒石" : cell === 1 ? "白石" : `空マス ${index + 1}`
            }
          >
            {cell === null ? null : (
              <span
                className={`h-[72%] w-[72%] rounded-full ${
                  cell === 0
                    ? "bg-zinc-900 ring-1 ring-black/50"
                    : "bg-zinc-100 ring-1 ring-white/50"
                }`}
              />
            )}
          </button>
        ))}
        </div>
      </div>

    </div>
  );
}
