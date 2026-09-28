"use client";

import type { ReactNode } from "react";
import { PlaySetupCard, setupPillClass } from "@/components/play/shared/PlaySetupCard";
import { PlayModeLocalOnlineTabs } from "@/components/play/shared/PlayModeLocalOnlineTabs";

type Props = {
  title: string;
  description: string;
  playerCount: number;
  onPlayerCount: (n: number) => void;
  onStart: () => void;
  extra?: ReactNode;
  playerOptions?: number[];
  /** オンライン部屋対応（未指定時は false＝オンライン pill はグレーアウト） */
  onlineSupported?: boolean;
};

export function SetupPanel({
  title,
  description,
  playerCount,
  onPlayerCount,
  onStart,
  extra,
  playerOptions = [2, 3, 4],
  onlineSupported = false,
}: Props) {
  const showPlayModeTabs = Math.max(...playerOptions) >= 2;

  return (
    <PlaySetupCard title={title} description={description}>
      {showPlayModeTabs ? (
        <PlayModeLocalOnlineTabs
          mode="local"
          onModeChange={() => {}}
          onlineSupported={onlineSupported}
        />
      ) : null}
      <div
        className={
          showPlayModeTabs
            ? "mt-8 flex justify-center gap-2"
            : "flex justify-center gap-2"
        }
      >
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
      {extra ? <div className="mt-8">{extra}</div> : null}
      <button type="button" onClick={onStart} className="btn-game mt-8">
        ゲーム開始
      </button>
    </PlaySetupCard>
  );
}
