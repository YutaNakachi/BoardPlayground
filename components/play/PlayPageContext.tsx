"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRecordPlay } from "@/hooks/useRecordPlay";
import type { PlayMode } from "@/lib/online/types";

type PlayModeInfo = {
  mode: PlayMode;
  roomCode?: string;
};

type PlayPageContextValue = {
  gameSlug: string;
  recordLocalPlay: () => void;
  recordOnlinePlay: () => void;
  playMode: PlayModeInfo;
  setPlayMode: (info: PlayModeInfo) => void;
};

const PlayPageContext = createContext<PlayPageContextValue | null>(null);

export function PlayPageProvider({
  gameSlug,
  children,
}: {
  gameSlug: string;
  children: React.ReactNode;
}) {
  const recordPlay = useRecordPlay(gameSlug);
  const [playMode, setPlayMode] = useState<PlayModeInfo>({ mode: "local" });

  const recordLocalPlay = useCallback(() => recordPlay("local"), [recordPlay]);
  const recordOnlinePlay = useCallback(() => recordPlay("online"), [recordPlay]);

  const value = useMemo(
    () => ({
      gameSlug,
      recordLocalPlay,
      recordOnlinePlay,
      playMode,
      setPlayMode,
    }),
    [gameSlug, recordLocalPlay, recordOnlinePlay, playMode]
  );

  return (
    <PlayPageContext.Provider value={value}>{children}</PlayPageContext.Provider>
  );
}

export function usePlayPage(): PlayPageContextValue {
  const ctx = useContext(PlayPageContext);
  if (!ctx) {
    return {
      gameSlug: "",
      recordLocalPlay: () => {},
      recordOnlinePlay: () => {},
      playMode: { mode: "local" },
      setPlayMode: () => {},
    };
  }
  return ctx;
}
