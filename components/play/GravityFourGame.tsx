"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { getPlayerTurnStyle } from "@/lib/player-colors";
import {
  dropGravityFour,
  emptyGravityFourBoard,
  GF_COLS,
  GF_ROWS,
  gfIndex,
  gfLegalColumns,
  gravityFourBoardFull,
  gravityFourWinner,
  type Board,
  type Player,
} from "@/lib/play/gravity-four";

type Phase = "setup" | "playing" | "game-over";

export function GravityFourGame() {
  const { recordLocalPlay } = usePlayPage();
  const [phase, setPhase] = useState<Phase>("setup");
  const [board, setBoard] = useState<Board>(emptyGravityFourBoard);
  const [current, setCurrent] = useState<Player>(0);
  const [winner, setWinner] = useState<Player | "draw" | null>(null);

  const startGame = useCallback(() => {
    recordLocalPlay();
    setBoard(emptyGravityFourBoard());
    setCurrent(0);
    setWinner(null);
    setPhase("playing");
  }, [recordLocalPlay]);

  const drop = useCallback(
    (col: number) => {
      if (phase !== "playing") return;
      const next = dropGravityFour(board, col, current);
      if (!next) return;
      setBoard(next);
      const won = gravityFourWinner(next);
      if (won !== null) {
        setWinner(won);
        setPhase("game-over");
        return;
      }
      if (gravityFourBoardFull(next)) {
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

  const legal = useMemo(
    () => (phase === "playing" ? gfLegalColumns(board) : []),
    [phase, board]
  );

  if (phase === "setup") {
    return (
      <SetupPanel
        title="重力四目"
        description="7列×6段の盤に、列を選んで石を落とします。縦・横・斜めで4つ以上並べた方が勝ちです。"
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
        playerIndex={current}
        playerLabel={`プレイヤー ${current + 1}`}
        action="列をタップして石を落とす"
      />
      )}

      <div className="mx-auto max-w-md">
        <div className="mb-2 grid grid-cols-7 gap-1">
          {Array.from({ length: GF_COLS }, (_, col) => (
            <button
              key={col}
              type="button"
              disabled={!legal.includes(col)}
              onClick={() => drop(col)}
              className="min-h-9 rounded-md text-xs text-slate-500 transition enabled:hover:bg-white/10 enabled:hover:text-white disabled:cursor-default"
              aria-label={`${col + 1}列目に落とす`}
            >
              ↓
            </button>
          ))}
        </div>

        <div
          className="grid gap-1 rounded-xl bg-indigo-950/80 p-2"
          style={{ gridTemplateColumns: `repeat(${GF_COLS}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: GF_ROWS }, (_, row) =>
            Array.from({ length: GF_COLS }, (_, col) => {
              const cell = board[gfIndex(row, col)];
              return (
                <div
                  key={`${row}-${col}`}
                  className="flex aspect-square min-h-9 items-center justify-center rounded-full bg-indigo-900/60 sm:min-h-11"
                  aria-label={
                    cell === 0
                      ? "プレイヤー1の石"
                      : cell === 1
                        ? "プレイヤー2の石"
                        : "空き"
                  }
                >
                  {cell === null ? null : (
                    <span
                      className={`h-[78%] w-[78%] rounded-full ${getPlayerTurnStyle(cell).piece} ring-1 ${getPlayerTurnStyle(cell).pieceRing}`}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {isGameOver && winners && (
        <ResultPanel
          variant="inline"
          winners={winners}
          onReplay={() => setPhase("setup")}
          details={
            <p className="text-slate-400">
              {winner === "draw"
                ? "盤が埋まり、4つ並びはありませんでした。"
                : `プレイヤー ${Number(winner) + 1} が4つ以上並べました。`}
            </p>
          }
        />
      )}
    </div>
  );
}
