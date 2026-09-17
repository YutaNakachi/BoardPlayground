"use client";

import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { winnerIndices } from "@/lib/game-engine";
import {
  initialReversiBoard,
  playReversiMove,
  reversiCounts,
  reversiLegalMoves,
  reversiNextPlayer,
  type Board,
  type Player,
} from "@/lib/play/reversi";

type Phase = "setup" | "playing" | "game-over";

export function ReversiGame() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [board, setBoard] = useState<Board>(initialReversiBoard);
  const [current, setCurrent] = useState<Player>(0);
  const [passNotice, setPassNotice] = useState<string | null>(null);

  const startGame = useCallback(() => {
    setBoard(initialReversiBoard());
    setCurrent(0);
    setPassNotice(null);
    setPhase("playing");
  }, []);

  const legal = useMemo(
    () => (phase === "playing" ? reversiLegalMoves(board, current) : []),
    [phase, board, current]
  );

  const counts = useMemo(() => reversiCounts(board), [board]);

  const place = useCallback(
    (index: number) => {
      if (phase !== "playing") return;
      const nextBoard = playReversiMove(board, index, current);
      if (!nextBoard) return;
      const nextPlayer = reversiNextPlayer(nextBoard, current);
      setBoard(nextBoard);
      if (nextPlayer === null) {
        setPhase("game-over");
        setPassNotice(null);
        return;
      }
      if (nextPlayer === current) {
        const passer = current === 0 ? 2 : 1;
        setPassNotice(`プレイヤー${passer}は置ける場所がないためパス`);
      } else {
        setPassNotice(null);
      }
      setCurrent(nextPlayer);
    },
    [phase, board, current]
  );

  const winners = useMemo(() => {
    if (phase !== "game-over") return null;
    return winnerIndices(counts);
  }, [phase, counts]);

  if (phase === "setup") {
    return (
      <SetupPanel
        title="リバーシ"
        description="挟んだ相手の石を裏返します。置ける場所がないときは自動でパスします。"
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
          <ul className="space-y-1 text-slate-400">
            <li>プレイヤー 1（黒）: {counts[0]} 個</li>
            <li>プレイヤー 2（白）: {counts[1]} 個</li>
          </ul>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <TurnBanner
        playerIndex={current}
        playerLabel={`プレイヤー ${current + 1}（${current === 0 ? "黒" : "白"}）`}
        stats={`黒 ${counts[0]} · 白 ${counts[1]}`}
      />
      {passNotice ? (
        <p className="text-center text-sm text-amber-200">{passNotice}</p>
      ) : null}

      <div className="mx-auto grid max-w-md grid-cols-8 gap-0.5 rounded-xl bg-emerald-950 p-1.5 sm:p-2">
        {board.map((cell, index) => {
          const canPlace = legal.includes(index);
          return (
            <button
              key={index}
              type="button"
              disabled={!canPlace}
              onClick={() => place(index)}
              className={`flex aspect-square min-h-9 items-center justify-center rounded-sm bg-emerald-800/80 sm:min-h-11 ${
                canPlace ? "ring-1 ring-lime-300/70" : ""
              }`}
              aria-label={
                cell === 0
                  ? "黒"
                  : cell === 1
                    ? "白"
                    : canPlace
                      ? "置けるマス"
                      : "空マス"
              }
            >
              {cell === null ? (
                canPlace ? (
                  <span className="h-2 w-2 rounded-full bg-lime-200/80" />
                ) : null
              ) : (
                <span
                  className={`h-[70%] w-[70%] rounded-full ${
                    cell === 0 ? "bg-zinc-900 ring-1 ring-black/40" : "bg-zinc-100 ring-1 ring-white/40"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

    </div>
  );
}
