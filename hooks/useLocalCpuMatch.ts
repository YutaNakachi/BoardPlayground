"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LocalMatchSetupKind } from "@/components/play/shared/PlayModeLocalMatchTabs";
import type { PlayMode } from "@/lib/online/types";
import { cpuThinkDelayMs } from "@/lib/play/cpu/difficulty";
import type { BinaryPlayer, CpuDifficulty } from "@/lib/play/cpu/types";

type PlayModeSetter = (mode:
  | { mode: "local" }
  | { mode: "cpu"; humanSeat: BinaryPlayer }
  | { mode: "online"; roomCode: string }) => void;

type UseLocalCpuMatchOptions = {
  mode: PlayMode;
  setPlayMode: PlayModeSetter;
  isOnline: boolean;
  /** ローカル対局中（setup 以外） */
  localActive: boolean;
  gameOver: boolean;
  turnPlayer: BinaryPlayer;
  humanSeat?: BinaryPlayer;
};

export function useLocalCpuMatch({
  mode,
  setPlayMode,
  isOnline,
  localActive,
  gameOver,
  turnPlayer,
  humanSeat: humanSeatProp = 0,
}: UseLocalCpuMatchOptions) {
  const [matchKind, setMatchKind] = useState<LocalMatchSetupKind>("pvp");
  const [cpuDifficulty, setCpuDifficulty] = useState<CpuDifficulty>("normal");
  const humanSeat = humanSeatProp;
  const cpuSeat: BinaryPlayer = humanSeat === 0 ? 1 : 0;

  const prepareLocalStart = useCallback(
    (kind: LocalMatchSetupKind) => {
      setMatchKind(kind);
      setPlayMode(
        kind === "cpu" ? { mode: "cpu", humanSeat } : { mode: "local" }
      );
    },
    [humanSeat, setPlayMode]
  );

  useEffect(() => {
    if (isOnline || mode !== "local" || !localActive) return;
    if (matchKind === "cpu") {
      setPlayMode({ mode: "cpu", humanSeat });
    } else {
      setPlayMode({ mode: "local" });
    }
  }, [isOnline, mode, localActive, matchKind, humanSeat, setPlayMode]);

  const humanTurn =
    isOnline || matchKind !== "cpu" || turnPlayer === humanSeat;
  const cpuThinking =
    !isOnline &&
    matchKind === "cpu" &&
    localActive &&
    !gameOver &&
    turnPlayer === cpuSeat;

  return {
    matchKind,
    cpuDifficulty,
    setCpuDifficulty,
    humanSeat,
    cpuSeat,
    humanTurn,
    cpuThinking,
    prepareLocalStart,
    isCpuMatch: matchKind === "cpu",
  };
}

type UseCpuTurnSchedulerOptions<TState, TMove> = {
  enabled: boolean;
  difficulty: CpuDifficulty;
  /** state 変更でタイマーをリセットするための依存 */
  state: TState;
  stateRef: React.RefObject<TState | null>;
  chooseMove: (snapshot: TState, difficulty: CpuDifficulty) => TMove | null;
  applyMove: (snapshot: TState, move: TMove) => void;
  /** false のとき手を指さない（終局・手番不一致など） */
  canActOnSnapshot?: (snapshot: TState) => boolean;
};

export function useCpuTurnScheduler<TState, TMove>({
  enabled,
  difficulty,
  state,
  stateRef,
  chooseMove,
  applyMove,
  canActOnSnapshot,
}: UseCpuTurnSchedulerOptions<TState, TMove>) {
  useEffect(() => {
    if (!enabled) return;

    const delayMs = cpuThinkDelayMs(difficulty);
    const timer = window.setTimeout(() => {
      const snapshot = stateRef.current;
      if (!snapshot) return;
      if (canActOnSnapshot && !canActOnSnapshot(snapshot)) return;
      const choice = chooseMove(snapshot, difficulty);
      if (choice === null) return;
      applyMove(snapshot, choice);
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [enabled, difficulty, state, chooseMove, applyMove, canActOnSnapshot]);
}

export function useStateRef<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

export function localCpuTurnLabel(
  matchKind: LocalMatchSetupKind,
  turnPlayer: BinaryPlayer,
  humanSeat: BinaryPlayer,
  pvpLabel: string
): string {
  if (matchKind !== "cpu") return pvpLabel;
  return turnPlayer === humanSeat ? "あなた" : "CPU";
}
