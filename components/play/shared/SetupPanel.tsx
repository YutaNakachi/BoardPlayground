"use client";

import type { ReactNode } from "react";

type Props = {
  description: string;
  playerCount: number;
  onPlayerCount: (n: number) => void;
  onStart: () => void;
  extra?: ReactNode;
  playerOptions?: number[];
};

export function SetupPanel({
  description,
  playerCount,
  onPlayerCount,
  onStart,
  extra,
  playerOptions = [2, 3, 4],
}: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-surface-raised p-6 text-center sm:p-8">
      <p className="text-sm leading-relaxed text-[#a1a1a6]">{description}</p>
      <div className="mt-6 flex justify-center gap-2">
        {playerOptions.length === 1 ? (
          <p className="text-sm text-[#86868b]">{playerOptions[0]}人対戦</p>
        ) : (
          playerOptions.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onPlayerCount(n)}
              className={`min-h-11 min-w-14 rounded-full px-4 py-2 text-sm font-medium transition ${
                playerCount === n
                  ? "bg-[#f5f5f7] text-[#1d1d1f]"
                  : "bg-white/10 text-[#c7c7cc] ring-1 ring-white/10 hover:bg-white/15"
              }`}
            >
              {n}人
            </button>
          ))
        )}
      </div>
      {extra}
      <button type="button" onClick={onStart} className="btn-game mt-8">
        ゲーム開始
      </button>
    </div>
  );
}
