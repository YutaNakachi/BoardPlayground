"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { playerPieceClasses } from "@/lib/player-colors";
import {
  emptyHexBoard,
  HEX_SIZE,
  hexWinner,
  type Board,
  type Player,
} from "@/lib/play/hex";

type Phase = "setup" | "playing" | "game-over";

export function HexGame() {
  const { recordLocalPlay } = usePlayPage();
  const [phase, setPhase] = useState<Phase>("setup");
  const [board, setBoard] = useState<Board>(emptyHexBoard);
  const [current, setCurrent] = useState<Player>(0);
  const [winner, setWinner] = useState<Player | null>(null);

  const startGame = useCallback(() => {
    recordLocalPlay();
    setBoard(emptyHexBoard());
    setCurrent(0);
    setWinner(null);
    setPhase("playing");
  }, [recordLocalPlay]);

  const place = useCallback(
    (index: number) => {
      if (phase !== "playing" || board[index] !== null) return;
      const next = board.map((cell, i) => (i === index ? current : cell));
      setBoard(next);
      const won = hexWinner(next);
      if (won !== null) {
        setWinner(won);
        setPhase("game-over");
        return;
      }
      setCurrent(current === 0 ? 1 : 0);
    },
    [phase, board, current]
  );

  const winners = useMemo(() => (winner === null ? null : [winner]), [winner]);

  const backToSetup = useCallback(() => setPhase("setup"), []);
  usePlaySetupNavigation(phase === "setup", backToSetup);

  if (phase === "setup") {
    return (
      <SetupPanel
        title="ヘックス"
        description="11×11の六角マスに石を置き、向かい側の辺を自分の色でつなげた方が勝ちです。"
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
        action={current === 0 ? "上下の辺をつなぐ" : "左右の辺をつなぐ"}
      />
      )}

      <div className="-mx-4 overflow-x-auto px-4">
        <div
          className="mx-auto grid min-w-[20rem] max-w-xl gap-0.5"
          style={{ gridTemplateColumns: `repeat(${HEX_SIZE}, minmax(0, 1fr))` }}
        >
          {board.map((cell, index) => {
            const row = Math.floor(index / HEX_SIZE);
            const col = index % HEX_SIZE;
            const offset = row % 2 === 1 ? "translate-x-1/4" : "";
            return (
              <button
                key={index}
                type="button"
                disabled={cell !== null || isGameOver}
                onClick={() => place(index)}
                className={`flex aspect-[1.15] min-h-7 items-center justify-center ${offset}`}
                aria-label={cell === null ? "空マス" : `プレイヤー ${cell + 1}`}
              >
                <span
                  className={`h-[70%] w-[70%] rounded-md ${
                    cell === null
                      ? "bg-emerald-900/50 ring-1 ring-emerald-700/50"
                      : playerPieceClasses(cell)
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-center text-xs text-slate-500">
        プレイヤー1は上と下、プレイヤー2は左と右をつなぎます。
      </p>

      {isGameOver && winners && (
        <ResultPanel
          variant="inline"
          winners={winners}
          onReplay={() => setPhase("setup")}
          details={
            <p className="text-slate-400">
              プレイヤー {winner! + 1} が両端をつなぎました。
            </p>
          }
        />
      )}
    </div>
  );
}
