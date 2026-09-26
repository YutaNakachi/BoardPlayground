"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { releaseBodyScrollLock } from "@/lib/body-scroll-lock";
import { useRecordPlay } from "@/hooks/useRecordPlay";
import type { PlayMode } from "@/lib/online/types";

type PlayModeInfo = {
  mode: PlayMode;
  roomCode?: string;
};

type SetupNav = {
  isSetupScreen: boolean;
  backToSetup: (() => void) | null;
};

type PlayPageContextValue = {
  gameSlug: string;
  recordLocalPlay: () => void;
  recordOnlinePlay: () => void;
  playMode: PlayModeInfo;
  setPlayMode: (info: PlayModeInfo) => void;
  setupNav: SetupNav;
  setSetupNav: Dispatch<SetStateAction<SetupNav>>;
  registerPlayExit: (handler: () => void) => () => void;
  exitPlayPage: () => void;
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
  const [setupNav, setSetupNav] = useState<SetupNav>({
    isSetupScreen: true,
    backToSetup: null,
  });
  const exitHandlersRef = useRef(new Set<() => void>());

  const registerPlayExit = useCallback((handler: () => void) => {
    exitHandlersRef.current.add(handler);
    return () => {
      exitHandlersRef.current.delete(handler);
    };
  }, []);

  const exitPlayPage = useCallback(() => {
    exitHandlersRef.current.forEach((handler) => handler());
  }, []);

  const recordLocalPlay = useCallback(() => recordPlay("local"), [recordPlay]);
  const recordOnlinePlay = useCallback(() => recordPlay("online"), [recordPlay]);

  useEffect(() => {
    releaseBodyScrollLock();
    return () => releaseBodyScrollLock();
  }, []);

  const value = useMemo(
    () => ({
      gameSlug,
      recordLocalPlay,
      recordOnlinePlay,
      playMode,
      setPlayMode,
      setupNav,
      setSetupNav,
      registerPlayExit,
      exitPlayPage,
    }),
    [
      gameSlug,
      recordLocalPlay,
      recordOnlinePlay,
      playMode,
      setupNav,
      registerPlayExit,
      exitPlayPage,
    ]
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
      setupNav: { isSetupScreen: true, backToSetup: null },
      setSetupNav: () => {},
      registerPlayExit: () => () => {},
      exitPlayPage: () => {},
    };
  }
  return ctx;
}
