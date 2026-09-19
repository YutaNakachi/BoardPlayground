"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import {
  applyFoxHoundsMove,
  FH_SIZE,
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
      const all = foxHoundsMoves(board, 1);
      const row = Math.floor(selected / FH_SIZE);
      const col = selected % FH_SIZE;
      return all.filter((to) => {
        const tr = Math.floor(to / FH_SIZE);
        const tc = to % FH_SIZE;
        return tr === row + 1 && Math.abs(tc - col) === 1;
      });
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

  if (phase === "setup") {
    return (
      <SetupPanel
        title="ウサギと猟犬"
        description="プレイヤー1はウサギ、プレイヤー2は猟犬4匹。ウサギは上の段へ、猟犬は囲めば勝ちです。"
        playerCount={2}
        playerOptions={[2]}
        onPlayerCount={() => {}}
        onStart={startGame}
      />
    );
  }

  if (phase === "game-over" && winner !== null) {
    return (
      <ResultPanel
        winners={[winner]}
        onReplay={() => setPhase("setup")}
        details={
          <p className="text-slate-400">
            {winner === 0 ? "ウサギが上の段に到達しました。" : "猟犬がウサギを囲みました。"}
          </p>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <TurnBanner
        playerIndex={current}
        playerLabel={`プレイヤー ${current + 1}（${current === 0 ? "ウサギ" : "猟犬"}）`}
      />

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
                <span className="text-xl" aria-hidden>🐇</span>
              ) : cell === 1 ? (
                <span className="text-lg" aria-hidden>🐕</span>
              ) : isDest ? (
                <span className="h-2 w-2 rounded-full bg-lime-300" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
