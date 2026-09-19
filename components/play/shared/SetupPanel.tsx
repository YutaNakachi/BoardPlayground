"use client";

import type { ReactNode } from "react";
import { PlaySetupCard, setupPillClass } from "@/components/play/shared/PlaySetupCard";

type Props = {
  title: string;
  description: string;
  playerCount: number;
  onPlayerCount: (n: number) => void;
  onStart: () => void;
  extra?: ReactNode;
  playerOptions?: number[];
};

export function SetupPanel({
  title,
  description,
  playerCount,
  onPlayerCount,
  onStart,
  extra,
  playerOptions = [2, 3, 4],
}: Props) {
  return (
    <PlaySetupCard title={title} description={description}>
      <div className="flex justify-center gap-2">
        {playerOptions.length === 1 ? (
          <p className="badge-muted inline-flex min-h-11 items-center px-4 text-sm">
            {playerOptions[0]}人対戦
          </p>
        ) : (
          playerOptions.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onPlayerCount(n)}
              className={`min-w-14 px-4 py-2 ${setupPillClass(playerCount === n)}`}
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
    </PlaySetupCard>
  );
}
