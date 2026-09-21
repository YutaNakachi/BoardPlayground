"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { useCallback, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { PlaySetupCard, setupPillClass } from "@/components/play/shared/PlaySetupCard";
import {
  isSlideSolved,
  shuffledSlide,
  SLIDE_SIZE_OPTIONS,
  slideMove,
  type SlideSize,
} from "@/lib/play/slide-puzzle";

type Phase = "idle" | "playing" | "game-over";

function tileLabelClass(size: SlideSize): string {
  if (size === 3) return "min-h-14 text-2xl";
  if (size === 4) return "min-h-14 text-xl";
  if (size === 5) return "min-h-12 text-lg";
  return "min-h-10 text-base";
}

function boardMaxWidth(size: SlideSize): string {
  if (size <= 4) return "max-w-sm";
  if (size === 5) return "max-w-md";
  return "max-w-lg";
}

export function SlidePuzzleGame() {
  const { recordLocalPlay } = usePlayPage();
  const [phase, setPhase] = useState<Phase>("idle");
  const [size, setSize] = useState<SlideSize>(4);
  const [board, setBoard] = useState<number[]>(() => shuffledSlide(4));
  const [moves, setMoves] = useState(0);

  const startGame = useCallback(() => {
    recordLocalPlay();
    setBoard(shuffledSlide(size));
    setMoves(0);
    setPhase("playing");
  }, [recordLocalPlay, size]);

  const tap = useCallback(
    (index: number) => {
      if (phase !== "playing") return;
      const next = slideMove(board, index, size);
      if (!next) return;
      setBoard(next);
      setMoves((m) => m + 1);
      if (isSlideSolved(next, size)) setPhase("game-over");
    },
    [phase, board, size]
  );

  const backToSetup = useCallback(() => setPhase("idle"), []);
  usePlaySetupNavigation(phase === "idle", backToSetup);

  if (phase === "idle") {
    const lastTile = size * size - 1;
    return (
      <PlaySetupCard
        title="スライドパズル"
        description={`${size}×${size}の盤で、1〜${lastTile}の数字を順に並べます。空きマスに隣接するタイルをタップして動かします。`}
      >
        <div className="space-y-2">
          <p className="text-center text-xs text-slate-400">盤面サイズ</p>
          <div className="flex flex-wrap justify-center gap-2">
            {SLIDE_SIZE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSize(option)}
                className={`min-w-14 px-4 py-2 ${setupPillClass(size === option)}`}
              >
                {option}×{option}
              </button>
            ))}
          </div>
        </div>
        <button type="button" onClick={startGame} className="btn-game mt-8">
          ゲーム開始
        </button>
      </PlaySetupCard>
    );
  }

  const isGameOver = phase === "game-over";

  return (
    <div className="space-y-6">
      {isGameOver && (
        <ResultPanel
          variant="inline"
          solo
          winners={[0]}
          onReplay={() => setPhase("idle")}
          details={
            <p className="text-slate-400">
              {size}×{size} を {moves} 手で完成しました。
            </p>
          }
        />
      )}

      <p className="text-center text-sm text-slate-400">
        {size}×{size} · 手数: {moves}
      </p>
      <div
        className={`mx-auto grid gap-1.5 rounded-xl bg-white/5 p-2 ${boardMaxWidth(size)}`}
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {board.map((value, index) => (
          <button
            key={index}
            type="button"
            disabled={value === 0}
            onClick={() => tap(index)}
            className={`flex aspect-square items-center justify-center rounded-lg font-bold ${tileLabelClass(size)} ${
              value === 0
                ? "bg-transparent"
                : "bg-surface-raised ring-1 ring-white/10 hover:ring-accent/50"
            }`}
          >
            {value === 0 ? "" : value}
          </button>
        ))}
      </div>

    </div>
  );
}
