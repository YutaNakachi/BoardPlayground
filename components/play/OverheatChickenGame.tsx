"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { OverheatGlass } from "@/components/play/overheat-chicken/OverheatGlass";
import { OnlineFirstPlayerPicker } from "@/components/play/shared/OnlineFirstPlayerPicker";
import { OnlineSetupPanel } from "@/components/play/shared/OnlineSetupPanel";
import type { LocalMatchSetupKind } from "@/components/play/shared/PlayModeLocalMatchTabs";
import { PendingJoinConnecting } from "@/components/play/shared/PendingJoinConnecting";
import {
  PlaySetupSection,
  setupPillClass,
} from "@/components/play/shared/PlaySetupCard";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { usePlayStats } from "@/components/PlayStatsProvider";
import { useOnlineFirstPlayer } from "@/hooks/useOnlineFirstPlayer";
import { useOnlineRoom } from "@/hooks/useOnlineRoom";
import { getOnlineResultReplayProps } from "@/lib/online/result-replay";
import {
  formatSeatLabel,
  formatWinnersWithNames,
  getSeatDisplayName,
} from "@/lib/online/player-labels";
import type { OverheatOnlineState } from "@/lib/online/moves";
import type { PlayMode } from "@/lib/online/types";
import {
  CHIP_LABEL,
  CHIP_SIZES,
  createOverheat,
  endTurn,
  MAX_CHIPS_PER_TURN,
  placeChip,
  type ChipSize,
  type OverheatState,
  type PlayerId,
} from "@/lib/play/overheat-chicken";

type LocalPhase = "setup" | "playing" | "game-over";

const SETUP_DESCRIPTION =
  "漫画『ジョジョの奇妙な冒険』第3部に登場する杯の勝負を、ボドパッ！独自ルールで再現した非公式プレイ版です。縁まで満たした杯に小・中・大のチップを入れ、溢れさせた方が負け。1手番は最大3枚、終えるときはボタンを押します。";

function playerLabel(player: PlayerId): string {
  return `プレイヤー ${player + 1}`;
}

export function OverheatChickenGame() {
  const { recordLocalPlay, setPlayMode } = usePlayPage();
  const { onlineEnabled } = usePlayStats();
  const online = useOnlineRoom("overheat-chicken");
  const { firstPlayer, onFirstPlayerChange } = useOnlineFirstPlayer(online);
  const [mode, setMode] = useState<PlayMode>("local");
  const [localPhase, setLocalPhase] = useState<LocalPhase>("setup");
  const [localFirst, setLocalFirst] = useState<PlayerId>(0);
  const [localState, setLocalState] = useState<OverheatState | null>(null);

  const isOnline = online.phase === "playing" || online.phase === "finished";
  const onlineState = isOnline
    ? (online.gameState as OverheatOnlineState | null)
    : null;

  useEffect(() => {
    if (
      online.room?.code &&
      (online.phase === "waiting" || online.phase === "playing")
    ) {
      setPlayMode({ mode: "online", roomCode: online.room.code });
    }
  }, [online.room?.code, online.phase, setPlayMode]);

  const backToSetup = useCallback(() => {
    online.reset();
    setLocalPhase("setup");
    setLocalState(null);
    setMode("local");
    setPlayMode({ mode: "local" });
  }, [online, setPlayMode]);

  const isSetupScreen =
    (localPhase === "setup" && online.phase === "idle") ||
    online.phase === "waiting";
  usePlaySetupNavigation(isSetupScreen, backToSetup);

  const startLocal = useCallback(
    (_kind: LocalMatchSetupKind) => {
      recordLocalPlay();
      setPlayMode({ mode: "local" });
      setLocalState(createOverheat(localFirst));
      setLocalPhase("playing");
    },
    [localFirst, recordLocalPlay, setPlayMode]
  );

  const place = useCallback(
    (size: ChipSize) => {
      if (isOnline) {
        if (!online.isMyTurn || onlineState?.phase !== "playing") return;
        void online.handleMove({ type: "overheat-place", size });
        return;
      }
      if (!localState || localPhase !== "playing") return;
      const next = placeChip(localState, size);
      if (!next) return;
      setLocalState(next);
      if (next.winner !== null) setLocalPhase("game-over");
    },
    [isOnline, online, onlineState?.phase, localPhase, localState]
  );

  const finishTurn = useCallback(() => {
    if (isOnline) {
      if (!online.isMyTurn || onlineState?.phase !== "playing") return;
      void online.handleMove({ type: "overheat-end" });
      return;
    }
    if (!localState || localPhase !== "playing") return;
    const next = endTurn(localState);
    if (!next) return;
    setLocalState(next);
  }, [isOnline, online, onlineState?.phase, localPhase, localState]);

  if (online.completingPendingJoin) {
    return <PendingJoinConnecting />;
  }

  if (localPhase === "setup" && online.phase === "idle") {
    return (
      <OnlineSetupPanel
        title="オーバーヒート・チキンレース"
        description={SETUP_DESCRIPTION}
        mode={mode}
        onModeChange={setMode}
        onlineSupported={onlineEnabled}
        onCreateRoom={(displayName) => online.handleCreate(displayName)}
        onJoinRoom={online.handleJoin}
        onStartLocal={startLocal}
        extra={() => (
          <PlaySetupSection label="先手">
            <div className="flex justify-center gap-2">
              {([0, 1] as const).map((player) => (
                <button
                  key={player}
                  type="button"
                  onClick={() => setLocalFirst(player)}
                  className={setupPillClass(localFirst === player)}
                >
                  {playerLabel(player)}
                </button>
              ))}
            </div>
          </PlaySetupSection>
        )}
        loading={online.loading}
        initialJoinCode={online.joinCodeFromUrl}
        error={online.error}
      />
    );
  }

  if (online.phase === "waiting" && online.room) {
    return (
      <OnlineSetupPanel
        title="オーバーヒート・チキンレース"
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

  const state = isOnline ? onlineState : localState;
  if (!state) return null;

  const over = isOnline
    ? state.winner !== null
    : localPhase === "game-over" && state.winner !== null;
  const myTurn = isOnline ? online.isMyTurn : true;
  const glassLabel = over
    ? "杯。水が溢れています。"
    : "杯。チップを入れています。";
  const action = !myTurn
    ? "相手の手番です"
    : state.placed <= 0
      ? "チップの大きさを選んでください。"
      : state.placed >= MAX_CHIPS_PER_TURN
        ? "手番を終えてください。"
        : "続けて入れるか、手番を終えてください。";
  const turnLabel = isOnline
    ? formatSeatLabel(online.players, state.current)
    : playerLabel(state.current);
  const replayProps = getOnlineResultReplayProps(
    isOnline,
    online.isHost,
    () => online.handleRematch({ firstPlayer }),
    backToSetup
  );

  return (
    <div className="space-y-6">
      {over && state.winner !== null ? (
        <ResultPanel
          variant="inline"
          winners={[state.winner]}
          winnersLabel={
            isOnline
              ? formatWinnersWithNames(online.players, [state.winner])
              : undefined
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
            <p className="text-sm text-slate-400">
              水が溢れました。溢れさせた側の負けです。
            </p>
          }
        />
      ) : null}

      {!over ? (
        <TurnBanner
          playerIndex={state.current}
          playerLabel={turnLabel}
          action={action}
        />
      ) : null}

      <div className="mx-auto flex max-w-md flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-400">
        {([0, 1] as const).map((seat) => (
          <span key={seat} className="inline-flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${seat === 0 ? "bg-accent" : "bg-sky-400"}`}
              aria-hidden
            />
            {isOnline
              ? getSeatDisplayName(online.players, seat)
              : playerLabel(seat)}
          </span>
        ))}
      </div>

      <OverheatGlass state={state} label={glassLabel} />

      {!over ? (
        <div className="flex flex-wrap items-end justify-center gap-3">
          {CHIP_SIZES.map((size) => {
            const px = size === "s" ? 46 : size === "m" ? 60 : 76;
            return (
              <button
                key={size}
                type="button"
                aria-label={`${CHIP_LABEL[size]}のチップ`}
                disabled={!myTurn || state.placed >= MAX_CHIPS_PER_TURN}
                onClick={() => place(size)}
                className="rounded-full p-0.5 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <img
                  src={`/games/overheat-chicken/chip-${state.current}.png`}
                  alt=""
                  width={px}
                  height={px}
                  draggable={false}
                  className="pointer-events-none block select-none"
                />
              </button>
            );
          })}
          <button
            type="button"
            disabled={!myTurn || state.placed < 1}
            onClick={finishTurn}
            className="min-h-12 min-w-[7.5rem] rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-base font-bold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/10"
          >
            手番を終える
          </button>
        </div>
      ) : null}
    </div>
  );
}
