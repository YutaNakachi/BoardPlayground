"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { useCallback, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import {
  isSlideSolved,
  shuffledSlide,
  SLIDE_SIZE,
  slideMove,
} from "@/lib/play/slide-puzzle";

type Phase = "idle" | "playing" | "game-over";

export function SlidePuzzleGame() {
  const { recordLocalPlay } = usePlayPage();
  const [phase, setPhase] = useState<Phase>("idle");
  const [board, setBoard] = useState<number[]>(shuffledSlide());
  const [moves, setMoves] = useState(0);

  const startGame = useCallback(() => {
    recordLocalPlay();
    setBoard(shuffledSlide());
    setMoves(0);
    setPhase("playing");
  }, [recordLocalPlay]);

  const tap = useCallback(
    (index: number) => {
      if (phase !== "playing") return;
      const next = slideMove(board, index);
      if (!next) return;
      setBoard(next);
      setMoves((m) => m + 1);
      if (isSlideSolved(next)) setPhase("game-over");
    },
    [phase, board]
  );

  if (phase === "idle") {
    return (
      <div className="rounded-2xl border border-white/10 bg-surface-raised p-6 text-center sm:p-8">
        <h2 className="text-xl font-semibold">スライドパズル</h2>
        <p className="mt-2 text-sm text-[#a1a1a6]">
          1〜15の数字を順に並べます。空きマスに隣接するタイルをタップして動かします。
        </p>
        <button type="button" onClick={startGame} className="btn-game mt-8">
          ゲーム開始
        </button>
      </div>
    );
  }

  if (phase === "game-over") {
    return (
      <ResultPanel
        winners={[0]}
        onReplay={() => setPhase("idle")}
        details={<p className="text-slate-400">{moves} 手で完成しました。</p>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-center text-sm text-slate-400">手数: {moves}</p>
      <div
        className="mx-auto grid max-w-sm gap-1.5 rounded-xl bg-white/5 p-2"
        style={{ gridTemplateColumns: `repeat(${SLIDE_SIZE}, minmax(0, 1fr))` }}
      >
        {board.map((value, index) => (
          <button
            key={index}
            type="button"
            disabled={value === 0}
            onClick={() => tap(index)}
            className={`flex aspect-square min-h-14 items-center justify-center rounded-lg text-lg font-bold ${
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
