"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { playerPieceClasses } from "@/lib/player-colors";
import {
  applyFoxHoundsMove,
  FH_SIZE,
  foxHoundsHoundDestinations,
  foxHoundsMoves,
  foxHoundsWinner,
  initialFoxHounds,
  type Board,
  type Player,
} from "@/lib/play/fox-hounds";

type Phase = "setup" | "playing" | "game-over";

export function FoxHoundsGame() {
  const { recordLocalPlay } = usePlayPage();
  const [phase, setPhase] = useState<Phase>("setup");
  const [board, setBoard] = useState<Board>(initialFoxHounds);
  const [current, setCurrent] = useState<Player>(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);

  const startGame = useCallback(() => {
    recordLocalPlay();
    setBoard(initialFoxHounds());
    setCurrent(0);
    setSelected(null);
    setWinner(null);
    setPhase("playing");
  }, [recordLocalPlay]);

  const moves = useMemo(
    () => (phase === "playing" ? foxHoundsMoves(board, current) : []),
    [phase, board, current]
  );

  const destinations = useMemo(() => {
    if (selected === null) return [];
    if (current === 0 && selected === board.indexOf(0)) {
      return foxHoundsMoves(board, 0);
    }
    if (current === 1 && board[selected] === 1) {
      return foxHoundsHoundDestinations(board, selected);
    }
    return [];
  }, [selected, board, current]);

  const onCell = useCallback(
    (index: number) => {
      if (phase !== "playing") return;
      if (destinations.includes(index) && selected !== null) {
        const next = applyFoxHoundsMove(board, current, selected, index);
        if (!next) return;
        setBoard(next);
        setSelected(null);
        const won = foxHoundsWinner(next, current === 0 ? 1 : 0);
        if (won !== null) {
          setWinner(won);
          setPhase("game-over");
          return;
        }
        setCurrent(current === 0 ? 1 : 0);
        return;
      }
      const piece = board[index];
      if (piece !== current) {
        setSelected(null);
        return;
      }
      setSelected(index);
    },
    [phase, destinations, selected, board, current]
  );

  const backToSetup = useCallback(() => setPhase("setup"), []);
  usePlaySetupNavigation(phase === "setup", backToSetup);

  if (phase === "setup") {
    return (
      <SetupPanel
        title="ウサギと猟犬"
        description="プレイヤー1はウサギ、プレイヤー2は猟犬4匹。ウサギは最上段へ到達すれば勝ち、猟犬は囲めば勝ちです。"
        playerCount={2}
        playerOptions={[2]}
        onPlayerCount={() => {}}
        onStart={startGame}
      />
    );
  }

  const isGameOver = phase === "game-over" && winner !== null;
  const winners = isGameOver ? [winner!] : null;

  return (
    <div className="space-y-6">
      {!isGameOver && (
      <TurnBanner
        playerIndex={current}
        playerLabel={`プレイヤー ${current + 1}`}
      />
      )}

      <div className="mx-auto grid max-w-md grid-cols-8 gap-0.5">
        {board.map((cell, index) => {
          const isDest = destinations.includes(index);
          const isSel = selected === index;
          return (
            <button
              key={index}
              type="button"
              onClick={() => onCell(index)}
              className={`flex aspect-square min-h-10 items-center justify-center rounded-md bg-emerald-950/80 ${
                isSel ? "ring-2 ring-accent" : ""
              } ${isDest ? "ring-2 ring-lime-300" : ""}`}
            >
              {cell === 0 ? (
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xl ${playerPieceClasses(0)}`}
                  aria-hidden
                >
                  🐇
                </span>
              ) : cell === 1 ? (
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-lg ${playerPieceClasses(1)}`}
                  aria-hidden
                >
                  🐕
                </span>
              ) : isDest ? (
                <span className="h-2 w-2 rounded-full bg-lime-300" />
              ) : null}
            </button>
          );
        })}
      </div>

      {isGameOver && winners && (
        <ResultPanel
          variant="inline"
          winners={winners}
          onReplay={() => setPhase("setup")}
          details={
            <p className="text-slate-400">
              {winner === 0
                ? "ウサギが最上段に着いたか、猟犬が動けなくなりました。"
                : "猟犬がウサギを囲みました。"}
            </p>
          }
        />
      )}
    </div>
  );
}
