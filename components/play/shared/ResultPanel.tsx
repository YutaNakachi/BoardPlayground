"use client";

import type { ReactNode } from "react";
import { formatWinners } from "@/lib/game-engine";

type Props = {
  winners: number[];
  details: ReactNode;
  onReplay: () => void;
};

export function ResultPanel({ winners, details, onReplay }: Props) {
  return (
    <div className="rounded-2xl border border-surface-border bg-surface-raised p-6 text-center sm:p-8">
      <h2 className="text-2xl font-bold">ゲーム終了</h2>
      <p className="mt-4 text-lg">勝者: {formatWinners(winners)}</p>
      <div className="mt-4">{details}</div>
      <button
        type="button"
        onClick={onReplay}
        className="mt-8 min-h-12 rounded-xl bg-accent px-8 py-3 font-semibold text-white transition hover:bg-accent-hover"
      >
        もう一度
      </button>
    </div>
  );
}
