"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SUIT_SYMBOL } from "@/lib/play/cards";
import {
  applySpiderMove,
  canDealSpider,
  dealSpider,
  initialSpider,
  movableSpiderStarts,
  spiderWon,
  type SpiderState,
} from "@/lib/play/spider";

type Phase = "idle" | "playing" | "game-over";

export function SpiderGame() {
  const { recordLocalPlay } = usePlayPage();
  const [phase, setPhase] = useState<Phase>("idle");
  const [state, setState] = useState<SpiderState>(initialSpider);
  const [fromCol, setFromCol] = useState<number | null>(null);
  const [fromIndex, setFromIndex] = useState<number | null>(null);

  const startGame = useCallback(() => {
    recordLocalPlay();
    setState(initialSpider());
    setFromCol(null);
    setFromIndex(null);
    setPhase("playing");
  }, [recordLocalPlay]);

  const validTargets = useMemo(() => {
    if (fromCol == null || fromIndex == null) return [];
    const targets: number[] = [];
    for (let col = 0; col < 10; col++) {
      if (applySpiderMove(state, fromCol, fromIndex, col)) targets.push(col);
    }
    return targets;
  }, [fromCol, fromIndex, state]);

  const onCard = useCallback(
    (col: number, index: number) => {
      if (phase !== "playing") return;
      if (fromCol != null && validTargets.includes(col)) {
        const next = applySpiderMove(state, fromCol, fromIndex!, col);
        if (next) {
          setState(next);
          if (spiderWon(next)) setPhase("game-over");
        }
        setFromCol(null);
        setFromIndex(null);
        return;
      }
      const starts = movableSpiderStarts(state, col);
      if (!starts.includes(index)) {
        setFromCol(null);
        setFromIndex(null);
        return;
      }
      setFromCol(col);
      setFromIndex(index);
    },
    [phase, fromCol, fromIndex, validTargets, state]
  );

  const onDeal = useCallback(() => {
    if (phase !== "playing") return;
    const next = dealSpider(state);
    if (next) {
      setState(next);
      if (spiderWon(next)) setPhase("game-over");
    }
    setFromCol(null);
    setFromIndex(null);
  }, [phase, state]);

  const backToSetup = useCallback(() => setPhase("idle"), []);
  usePlaySetupNavigation(phase === "idle", backToSetup);

  if (phase === "idle") {
    return (
      <div className="rounded-2xl border border-white/10 bg-surface-raised p-6 text-center sm:p-8">
        <h2 className="text-xl font-semibold">スパイダー</h2>
        <p className="mt-2 text-sm text-[#a1a1a6]">
          1スート版。降順の連続列を動かし、K→Aの13枚を揃えて除去。10列すべてにカードがあるとき配布できます。
        </p>
        <button type="button" onClick={startGame} className="btn-game mt-8">
          ゲーム開始
        </button>
      </div>
    );
  }

  const isGameOver = phase === "game-over";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-400">完成: {state.completed} / 8</p>
        <button
          type="button"
          onClick={onDeal}
          disabled={!canDealSpider(state) || isGameOver}
          className="rounded-lg border border-accent/50 px-3 py-1.5 text-sm text-accent disabled:opacity-40"
        >
          配布 ({state.stock.length})
        </button>
      </div>

      <div className="mx-auto flex max-w-5xl justify-center gap-1 overflow-x-auto pb-2">
        {state.columns.map((col, colIdx) => (
          <div key={colIdx} className="relative min-h-32 w-11 shrink-0">
            {col.length === 0 ? (
              <button
                type="button"
                className={`absolute inset-x-0 top-0 h-14 rounded-lg border border-dashed border-surface-border ${
                  validTargets.includes(colIdx) ? "ring-2 ring-lime-300" : ""
                }`}
                onClick={() => {
                  if (fromCol != null && fromIndex != null && validTargets.includes(colIdx)) {
                    const next = applySpiderMove(state, fromCol, fromIndex, colIdx);
                    if (next) {
                      setState(next);
                      if (spiderWon(next)) setPhase("game-over");
                    }
                    setFromCol(null);
                    setFromIndex(null);
                  }
                }}
              />
            ) : (
              col.map((cell, rowIdx) => (
                <button
                  key={cell.card.id}
                  type="button"
                  onClick={() => onCard(colIdx, rowIdx)}
                  style={{ top: rowIdx * 16 }}
                  className={`absolute inset-x-0 flex h-14 items-start justify-center rounded-lg border pt-1 text-xs ${
                    cell.faceUp ? "bg-white text-slate-900" : "bg-indigo-900"
                  } ${
                    fromCol === colIdx && fromIndex === rowIdx ? "ring-2 ring-accent" : "border-surface-border"
                  } ${validTargets.includes(colIdx) && rowIdx === col.length - 1 ? "ring-2 ring-lime-300" : ""}`}
                >
                  {cell.faceUp ? (
                    <span>
                      {cell.card.rank}
                      {SUIT_SYMBOL.spade}
                    </span>
                  ) : null}
                </button>
              ))
            )}
          </div>
        ))}
      </div>

      {isGameOver && (
        <ResultPanel
          variant="inline"
          winners={[0]}
          onReplay={() => setPhase("idle")}
          details={<p className="text-slate-400">8組の完成列をすべて除去しました。</p>}
        />
      )}
    </div>
  );
}
