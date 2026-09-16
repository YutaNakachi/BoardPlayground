"use client";

import type { ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  playerCount: number;
  onPlayerCount: (n: number) => void;
  onStart: () => void;
  extra?: ReactNode;
};

export function SetupPanel({
  title,
  description,
  playerCount,
  onPlayerCount,
  onStart,
  extra,
}: Props) {
  return (
    <div className="rounded-2xl border border-surface-border bg-surface-raised p-6 text-center sm:p-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
      <div className="mt-6 flex justify-center gap-2">
        {[2, 3, 4].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPlayerCount(n)}
            className={`min-h-11 min-w-14 rounded-lg px-4 py-2 text-sm font-medium transition ${
              playerCount === n
                ? "bg-accent text-white"
                : "bg-surface-border text-slate-300 hover:bg-surface-border/80"
            }`}
          >
            {n}人
          </button>
        ))}
      </div>
      {extra}
      <button
        type="button"
        onClick={onStart}
        className="mt-8 min-h-12 rounded-xl bg-accent px-8 py-3 font-semibold text-white transition hover:bg-accent-hover"
      >
        ゲーム開始
      </button>
    </div>
  );
}
