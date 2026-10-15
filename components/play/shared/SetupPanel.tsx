"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { usePlayPage } from "@/components/play/PlayPageContext";
import { getGameBySlug } from "@/lib/games";
import { PlaySetupCard, setupPillClass } from "@/components/play/shared/PlaySetupCard";
import {
  PlayModeLocalMatchTabs,
  type LocalMatchSetupKind,
} from "@/components/play/shared/PlayModeLocalMatchTabs";
import {
  PlayModeLocalOnlineTabs,
  type SetupLocalOnlineMode,
} from "@/components/play/shared/PlayModeLocalOnlineTabs";

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
  const { gameSlug } = usePlayPage();
  const cpuSupported = getGameBySlug(gameSlug)?.cpu ?? false;
  const showPlayModeTabs = Math.max(...playerOptions) >= 2;
  const [localOnlineMode, setLocalOnlineMode] =
    useState<SetupLocalOnlineMode>("local");
  const [localMatchKind, setLocalMatchKind] =
    useState<LocalMatchSetupKind>("pvp");

  const showLocalMatchTabs =
    showPlayModeTabs && localOnlineMode === "local";
  const showPlayerCountPicker = playerOptions.length > 1;

  return (
    <PlaySetupCard title={title} description={description}>
      {showPlayModeTabs ? (
        <PlayModeLocalOnlineTabs
          mode={localOnlineMode}
          onModeChange={setLocalOnlineMode}
          onlineSupported={onlineSupported}
        />
      ) : null}
      {showLocalMatchTabs ? (
        <PlayModeLocalMatchTabs
          kind={localMatchKind}
          onKindChange={setLocalMatchKind}
          cpuSupported={cpuSupported}
        />
      ) : null}
      {showPlayerCountPicker ? (
        <div className="flex justify-center gap-2">
          {playerOptions.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onPlayerCount(n)}
              className={`min-w-14 px-4 py-2 ${setupPillClass(playerCount === n)}`}
            >
              {n}人
            </button>
          ))}
        </div>
      ) : null}
      {extra ?? null}
      <button type="button" onClick={onStart} className="btn-game">
        ゲーム開始
      </button>
    </PlaySetupCard>
  );
}
