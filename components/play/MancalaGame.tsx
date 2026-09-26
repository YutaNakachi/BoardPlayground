"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { OnlineFirstPlayerPicker } from "@/components/play/shared/OnlineFirstPlayerPicker";
import { OnlineSetupPanel } from "@/components/play/shared/OnlineSetupPanel";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { usePlayStats } from "@/components/PlayStatsProvider";
import { useOnlineFirstPlayer } from "@/hooks/useOnlineFirstPlayer";
import { useOnlineRoom } from "@/hooks/useOnlineRoom";
import { winnerIndices } from "@/lib/game-engine";
import type { MancalaState } from "@/lib/online/moves";
import { getOnlineResultReplayProps } from "@/lib/online/result-replay";
import {
  formatSeatLabel,
  formatWinnersWithNames,
  localizePlayerNotice,
} from "@/lib/online/player-labels";
import type { PlayMode } from "@/lib/online/types";
import { getPlayerTurnStyle } from "@/lib/player-colors";
import {
  initialMancala,
  isMancalaPit,
  mancalaSowFrames,
  sowMancala,
  type Player,
} from "@/lib/play/mancala";

type LocalPhase = "setup" | "playing" | "game-over";

const P1_PITS = [0, 1, 2, 3, 4, 5];
const P2_PITS = [12, 11, 10, 9, 8, 7];
const SOW_STEP_MS = 280;

const SETUP_DESCRIPTION =
  "自分の穴の石を反時計回りにまきます。最後がゴールならもう一度、自分側の空き穴なら向かいの石も取れます。";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findIncreasedPit(prev: number[], curr: number[]): number {
  for (let i = 0; i < prev.length; i++) {
    if (curr[i] > prev[i]) return i;
  }
  return -1;
}

export function MancalaGame() {
  const { recordLocalPlay, setPlayMode } = usePlayPage();
  const { onlineEnabled } = usePlayStats();
  const online = useOnlineRoom("mancala");
  const { firstPlayer, onFirstPlayerChange } = useOnlineFirstPlayer(online);
  const [mode, setMode] = useState<PlayMode>("local");
  const [localPhase, setLocalPhase] = useState<LocalPhase>("setup");
  const [pits, setPits] = useState<number[]>(initialMancala);
  const [animatedPits, setAnimatedPits] = useState<number[]>(initialMancala);
  const [current, setCurrent] = useState<Player>(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [pulseIndex, setPulseIndex] = useState<number | null>(null);

  useEffect(() => {
    if (
      online.room?.code &&
      (online.phase === "waiting" || online.phase === "playing")
    ) {
      setPlayMode({ mode: "online", roomCode: online.room.code });
    } else if (mode === "local") {
      setPlayMode({ mode: "local" });
    }
  }, [online.room?.code, online.phase, mode, setPlayMode]);

  const startLocal = useCallback(() => {
    recordLocalPlay();
    const initial = initialMancala();
    setPits(initial);
    setAnimatedPits(initial);
    setCurrent(0);
    setNotice(null);
    setPulseIndex(null);
    setIsAnimating(false);
    setLocalPhase("playing");
  }, [recordLocalPlay]);

  const isOnline =
    online.phase === "playing" || online.phase === "finished";
  const onlineState = online.gameState as MancalaState | null;

  const activePits =
    isOnline && onlineState ? onlineState.pits : isAnimating ? animatedPits : pits;
  const activeCurrent =
    isOnline && onlineState ? (onlineState.current as Player) : current;
  const activeNotice =
    isOnline && onlineState
      ? localizePlayerNotice(onlineState.notice, online.players)
      : notice;
  const activePhase =
    isOnline && onlineState
      ? onlineState.phase
      : localPhase === "game-over"
        ? "game-over"
        : localPhase === "playing"
          ? "playing"
          : "setup";

  const playPit = useCallback(
    async (index: number) => {
      if (isOnline) {
        if (!online.isMyTurn || activePhase !== "playing") return;
        void online.handleMove({ type: "mancala", pit: index });
        return;
      }
      if (localPhase !== "playing" || isAnimating) return;

      const frames = mancalaSowFrames(pits, current, index);
      const result = sowMancala(pits, current, index);
      if (!frames || !result) return;

      setIsAnimating(true);
      setNotice(null);
      setAnimatedPits(frames[0]);

      for (let i = 1; i < frames.length; i++) {
        await sleep(SOW_STEP_MS);
        setAnimatedPits(frames[i]);
        setPulseIndex(findIncreasedPit(frames[i - 1], frames[i]));
      }

      await sleep(120);
      setPulseIndex(null);
      setPits(result.pits);

      if (result.over) {
        setLocalPhase("game-over");
        setNotice(null);
        setIsAnimating(false);
        return;
      }

      if (result.extraTurn) {
        setNotice("最後の石が自分のゴールに入ったので、もう一度");
        setIsAnimating(false);
        return;
      }

      setNotice(result.captured ? "向かいの石を取りました" : null);
      setCurrent(current === 0 ? 1 : 0);
      setIsAnimating(false);
    },
    [
      isOnline,
      online,
      activePhase,
      localPhase,
      pits,
      current,
      isAnimating,
    ]
  );

  const winners = useMemo(() => {
    if (activePhase !== "game-over") return null;
    if (isOnline && onlineState) {
      if (onlineState.winner === "draw") return [0, 1];
      if (onlineState.winner !== null) return [onlineState.winner];
      return null;
    }
    return winnerIndices([pits[6], pits[13]]);
  }, [activePhase, isOnline, onlineState, pits]);

  const roomPlayers = isOnline ? online.players : [];

  const reset = useCallback(() => {
    online.reset();
    setLocalPhase("setup");
    setMode("local");
    setPlayMode({ mode: "local" });
  }, [online.reset, setPlayMode]);

  const isSetupScreen =
    (localPhase === "setup" && online.phase === "idle") ||
    online.phase === "waiting";
  usePlaySetupNavigation(isSetupScreen, reset);

  const isGameOver = activePhase === "game-over" && winners !== null;
  const canPlayLocal = localPhase === "playing" && !isAnimating;
  const canPlayOnline =
    isOnline && online.isMyTurn && activePhase === "playing";
  const canPlay = isOnline ? canPlayOnline : canPlayLocal;
  const displayPits = isOnline ? activePits : isAnimating ? animatedPits : pits;
  const logicPits = isOnline ? activePits : pits;

  if (localPhase === "setup" && online.phase === "idle") {
    return (
      <OnlineSetupPanel
        title="マンカラ・カラハ"
        description={SETUP_DESCRIPTION}
        mode={mode}
        onModeChange={setMode}
        onlineSupported={onlineEnabled}
        onCreateRoom={(displayName) => online.handleCreate(displayName)}
        onJoinRoom={online.handleJoin}
        onStartLocal={startLocal}
        loading={online.loading}
        error={online.error}
      />
    );
  }

  if (online.phase === "waiting" && online.room) {
    return (
      <OnlineSetupPanel
        title="マンカラ・カラハ"
        description={SETUP_DESCRIPTION}
        mode="online"
        onModeChange={() => {}}
        onlineSupported={onlineEnabled}
        onCreateRoom={() => {}}
        onJoinRoom={() => {}}
        onStartLocal={() => {}}
        loading={online.loading}
        error={online.error}
        waiting={{
          code: online.room.code,
          players: online.players,
          isHost: online.isHost,
          onStart: () => online.handleStart({ firstPlayer }),
          canStart: online.players.length >= 2,
          extra: (
            <OnlineFirstPlayerPicker
              players={online.players}
              value={firstPlayer}
              onChange={online.isHost ? onFirstPlayerChange : undefined}
              readOnly={!online.isHost}
            />
          ),
        }}
      />
    );
  }

  const replayProps = getOnlineResultReplayProps(
    isOnline,
    online.isHost,
    () => online.handleRematch({ firstPlayer }),
    reset
  );

  return (
    <div className="space-y-6">
      {isGameOver && winners && (
        <ResultPanel
          variant="inline"
          winners={winners}
          draw={winners.length > 1}
          winnersLabel={
            isOnline ? formatWinnersWithNames(roomPlayers, winners) : undefined
          }
          {...replayProps}
          replayExtra={
            isOnline && online.isHost ? (
              <OnlineFirstPlayerPicker
                players={online.players}
                value={firstPlayer}
                onChange={onFirstPlayerChange}
              />
            ) : undefined
          }
          details={
            <ul className="space-y-1 text-slate-400">
              <li>
                {isOnline
                  ? formatSeatLabel(roomPlayers, 0)
                  : "プレイヤー 1"}
                のゴール: {displayPits[6]} 個
              </li>
              <li>
                {isOnline
                  ? formatSeatLabel(roomPlayers, 1)
                  : "プレイヤー 2"}
                のゴール: {displayPits[13]} 個
              </li>
            </ul>
          }
        />
      )}

      {!isGameOver && (
        <TurnBanner
          playerIndex={activeCurrent}
          playerLabel={formatSeatLabel(roomPlayers, activeCurrent)}
          notice={activeNotice ?? undefined}
          action={
            isOnline && !online.isMyTurn ? "相手の手番です" : undefined
          }
        />
      )}

      <div className="mx-auto grid max-w-xl grid-cols-8 gap-1.5 sm:gap-2">
        <Store
          count={displayPits[13]}
          label={
            isOnline ? `${formatSeatLabel(roomPlayers, 1)} ゴール` : "P2 ゴール"
          }
          playerIndex={1}
          active={activeCurrent === 1}
          pulsing={!isOnline && pulseIndex === 13}
        />
        {P2_PITS.map((pitIndex) => (
          <PitButton
            key={pitIndex}
            count={displayPits[pitIndex]}
            label="P2 穴"
            playerIndex={1}
            playable={
              canPlay &&
              activeCurrent === 1 &&
              isMancalaPit(1, pitIndex) &&
              logicPits[pitIndex] > 0
            }
            pulsing={!isOnline && pulseIndex === pitIndex}
            onClick={() => playPit(pitIndex)}
          />
        ))}
        <Store
          count={displayPits[6]}
          label={
            isOnline ? `${formatSeatLabel(roomPlayers, 0)} ゴール` : "P1 ゴール"
          }
          playerIndex={0}
          active={activeCurrent === 0}
          pulsing={!isOnline && pulseIndex === 6}
        />
        {P1_PITS.map((pitIndex) => (
          <PitButton
            key={pitIndex}
            count={displayPits[pitIndex]}
            label="P1 穴"
            playerIndex={0}
            playable={
              canPlay &&
              activeCurrent === 0 &&
              isMancalaPit(0, pitIndex) &&
              logicPits[pitIndex] > 0
            }
            pulsing={!isOnline && pulseIndex === pitIndex}
            onClick={() => playPit(pitIndex)}
          />
        ))}
      </div>
    </div>
  );
}

function Store({
  count,
  label,
  playerIndex,
  active,
  pulsing,
}: {
  count: number;
  label: string;
  playerIndex: number;
  active: boolean;
  pulsing: boolean;
}) {
  const style = getPlayerTurnStyle(playerIndex);
  return (
    <div
      className={`row-span-2 flex min-h-28 flex-col items-center justify-center rounded-2xl border text-lg font-semibold transition-transform duration-150 sm:min-h-32 ${
        pulsing ? "scale-105 ring-2 ring-amber-300/90" : ""
      } ${
        active
          ? `${style.sectionBorder} ${style.sectionBg}`
          : "border-surface-border bg-surface-raised"
      }`}
    >
      <span className="text-center text-[10px] font-medium text-slate-500">
        {label}
      </span>
      <span className="text-2xl tabular-nums">{count}</span>
    </div>
  );
}

function PitButton({
  count,
  label,
  playerIndex,
  playable,
  pulsing,
  onClick,
}: {
  count: number;
  label: string;
  playerIndex: number;
  playable: boolean;
  pulsing: boolean;
  onClick: () => void;
}) {
  const style = getPlayerTurnStyle(playerIndex);
  return (
    <button
      type="button"
      disabled={!playable}
      onClick={onClick}
      aria-label={`${label} ${count}個`}
      className={`flex min-h-16 flex-col items-center justify-center rounded-2xl border text-lg font-semibold transition duration-150 sm:min-h-20 ${
        pulsing ? "scale-105 ring-2 ring-amber-300/90" : ""
      } ${
        playable
          ? `${style.sectionBorder} ${style.bg} text-white hover:brightness-110`
          : `${style.surfaceBorder} ${style.surface} ${style.surfaceText}`
      } disabled:cursor-default`}
    >
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
