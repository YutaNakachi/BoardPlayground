"use client";

import type { ReactNode } from "react";
import { formatWinners } from "@/lib/game-engine";

type Props = {
  winners: number[];
  details: ReactNode;
  onReplay: () => void;
  /** オンライン対局など、席番号以外の勝者表示名を使う場合 */
  winnersLabel?: string;
  /** 盤面の下に結果を表示するコンパクト版 */
  variant?: "default" | "inline";
};

export function ResultPanel({
  winners,
  details,
  onReplay,
  winnersLabel,
  variant = "default",
}: Props) {
  const inline = variant === "inline";

  return (
    <div
      className={
        inline
          ? "rounded-xl border border-surface-border bg-surface-raised p-4 text-center sm:p-5"
          : "rounded-2xl border border-surface-border bg-surface-raised p-6 text-center sm:p-8"
      }
    >
      <h2 className={inline ? "text-lg font-bold" : "text-2xl font-bold"}>
        ゲーム終了
      </h2>
      <p className={inline ? "mt-2 text-base" : "mt-4 text-lg"}>
        勝者: {winnersLabel ?? formatWinners(winners)}
      </p>
      <div className={inline ? "mt-2" : "mt-4"}>{details}</div>
      <button
        type="button"
        onClick={onReplay}
        className={inline ? "btn-game mt-4" : "btn-game mt-8"}
      >
        もう一度
      </button>
    </div>
  );
}
