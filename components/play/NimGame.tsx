"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { useCallback, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import {
  initialNim,
  NIM_HEAPS,
  nimOver,
  takeNim,
  type Player,
} from "@/lib/play/nim";

type Phase = "setup" | "playing" | "game-over";

export function NimGame() {
  const { recordLocalPlay } = usePlayPage();
  const [phase, setPhase] = useState<Phase>("setup");
  const [heaps, setHeaps] = useState<number[]>(initialNim);
  const [current, setCurrent] = useState<Player>(0);
  const [selectedHeap, setSelectedHeap] = useState<number | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);

  const startGame = useCallback(() => {
    recordLocalPlay();
    setHeaps(initialNim());
    setCurrent(0);
    setSelectedHeap(null);
    setWinner(null);
    setPhase("playing");
  }, [recordLocalPlay]);

  const take = useCallback(
    (heapIndex: number, count: number) => {
      if (phase !== "playing") return;
      const next = takeNim(heaps, heapIndex, count);
      if (!next) return;
      setHeaps(next);
      setSelectedHeap(null);
      if (nimOver(next)) {
        setWinner(current);
        setPhase("game-over");
        return;
      }
      setCurrent(current === 0 ? 1 : 0);
    },
    [phase, heaps, current]
  );

  if (phase === "setup") {
    return (
      <SetupPanel
        title="ニム"
        description="3つの山から石を取ります。1手で1つの山から1個以上。最後の石を取ったプレイヤーの勝ちです。"
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
            最後の石を取ったプレイヤー {winner + 1} の勝ちです。
          </p>
        }
      />
    );
  }

  const selectedCount = selectedHeap === null ? 0 : heaps[selectedHeap];

  return (
    <div className="space-y-6">
      <TurnBanner
        playerIndex={current}
        playerLabel={`プレイヤー ${current + 1}`}
        action={
          selectedHeap === null
            ? "山を選ぶ"
            : `${selectedHeap + 1}番の山から何個取る？`
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {heaps.map((count, index) => (
          <button
            key={index}
            type="button"
            disabled={count === 0}
            onClick={() => setSelectedHeap(index)}
            className={`rounded-2xl border p-4 text-left transition ${
              selectedHeap === index
                ? "border-accent bg-accent/10"
                : "border-white/10 bg-surface-raised hover:border-white/20"
            } disabled:cursor-default disabled:opacity-50`}
          >
            <p className="text-sm text-slate-400">山 {index + 1}</p>
            <p className="mt-2 text-3xl font-bold">{count}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {Array.from({ length: count }, (_, i) => (
                <span
                  key={i}
                  className="inline-block h-3 w-3 rounded-full bg-slate-300"
                  aria-hidden
                />
              ))}
            </div>
          </button>
        ))}
      </div>

      {selectedHeap !== null && selectedCount > 0 ? (
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: selectedCount }, (_, i) => i + 1).map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => take(selectedHeap, count)}
              className="min-h-11 rounded-full border border-white/15 bg-white/5 px-4 text-sm font-medium transition hover:bg-white/10"
            >
              {count}個取る
            </button>
          ))}
        </div>
      ) : null}

      <p className="text-center text-xs text-slate-500">
        初期配置は {NIM_HEAPS.join("・")} 個の3山です。
      </p>
    </div>
  );
}
