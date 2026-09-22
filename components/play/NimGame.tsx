"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { OnlineFirstPlayerPicker } from "@/components/play/shared/OnlineFirstPlayerPicker";
import { OnlineSetupPanel } from "@/components/play/shared/OnlineSetupPanel";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { usePlayStats } from "@/components/PlayStatsProvider";
import { useOnlineFirstPlayer } from "@/hooks/useOnlineFirstPlayer";
import { useOnlineRoom } from "@/hooks/useOnlineRoom";
import type { NimState } from "@/lib/online/moves";
import { getOnlineResultReplayProps } from "@/lib/online/result-replay";
import {
  formatSeatLabel,
  formatWinnersWithNames,
  getSeatDisplayName,
} from "@/lib/online/player-labels";
import type { PlayMode } from "@/lib/online/types";
import {
  initialNim,
  NIM_HEAPS,
  nimOver,
  takeNim,
  type Player,
} from "@/lib/play/nim";

type LocalPhase = "setup" | "playing" | "game-over";

export function NimGame() {
  const { recordLocalPlay, setPlayMode } = usePlayPage();
  const { onlineEnabled } = usePlayStats();
  const online = useOnlineRoom("nim");
  const { firstPlayer, onFirstPlayerChange } = useOnlineFirstPlayer(online);
  const [mode, setMode] = useState<PlayMode>("local");
  const [localPhase, setLocalPhase] = useState<LocalPhase>("setup");
  const [heaps, setHeaps] = useState<number[]>(initialNim);
  const [current, setCurrent] = useState<Player>(0);
  const [selectedHeap, setSelectedHeap] = useState<number | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);

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
    setHeaps(initialNim());
    setCurrent(0);
    setSelectedHeap(null);
    setWinner(null);
    setLocalPhase("playing");
  }, [recordLocalPlay]);

  const isOnline =
    online.phase === "playing" || online.phase === "finished";
  const onlineState = online.gameState as NimState | null;

  const activeHeaps = isOnline && onlineState ? onlineState.heaps : heaps;
  const activeCurrent = isOnline && onlineState ? onlineState.current : current;
  const activeWinner = isOnline && onlineState ? onlineState.winner : winner;
  const activePhase =
    isOnline && onlineState
      ? onlineState.phase
      : localPhase === "game-over"
        ? "game-over"
        : localPhase === "playing"
          ? "playing"
          : "setup";

  const take = useCallback(
    (heapIndex: number, count: number) => {
      if (isOnline) {
        if (!online.isMyTurn || activePhase !== "playing") return;
        void online.handleMove({ type: "nim", heapIndex, count });
        setSelectedHeap(null);
        return;
      }
      if (localPhase !== "playing") return;
      const next = takeNim(heaps, heapIndex, count);
      if (!next) return;
      setHeaps(next);
      setSelectedHeap(null);
      if (nimOver(next)) {
        setWinner(current);
        setLocalPhase("game-over");
        return;
      }
      setCurrent(current === 0 ? 1 : 0);
    },
    [isOnline, online, activePhase, localPhase, heaps, current]
  );

  const winners = useMemo(() => {
    if (activePhase !== "game-over" || activeWinner === null) return null;
    return [activeWinner];
  }, [activePhase, activeWinner]);

  const roomPlayers = isOnline ? online.players : [];

  const reset = useCallback(() => {
    online.reset();
    setLocalPhase("setup");
    setMode("local");
    setSelectedHeap(null);
    setPlayMode({ mode: "local" });
  }, [online.reset, setPlayMode]);

  const isSetupScreen =
    (localPhase === "setup" && online.phase === "idle") || online.phase === "waiting";
  usePlaySetupNavigation(isSetupScreen, reset);

  const isGameOver = activePhase === "game-over" && winners !== null;
  const canInteract = (isOnline ? online.isMyTurn : true) && !isGameOver;
  const selectedCount = selectedHeap === null ? 0 : activeHeaps[selectedHeap];

  if (localPhase === "setup" && online.phase === "idle") {
    return (
      <OnlineSetupPanel
        title="ニム"
        description="3つの山から石を取ります。1手で1つの山から1個以上。最後の石を取ったプレイヤーの勝ちです。"
        mode={mode}
        onModeChange={setMode}
        onlineSupported={onlineEnabled}
        onCreateRoom={(displayName) =>
          online.handleCreate(
            displayName,
            firstPlayer === 1 ? { firstPlayer: 1 } : undefined
          )
        }
        onJoinRoom={online.handleJoin}
        onStartLocal={startLocal}
        loading={online.loading}
        error={online.error}
        extra={
          mode === "online" ? (
            <OnlineFirstPlayerPicker
              players={online.players}
              value={firstPlayer}
              onChange={onFirstPlayerChange}
            />
          ) : undefined
        }
      />
    );
  }

  if (online.phase === "waiting" && online.room) {
    return (
      <OnlineSetupPanel
        title="ニム"
        description="3つの山から石を取ります。1手で1つの山から1個以上。最後の石を取ったプレイヤーの勝ちです。"
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
          onStart: () => online.handleStart(firstPlayer),
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
    () => online.handleRematch(firstPlayer),
    reset
  );

  return (
    <div className="space-y-6">
      {isGameOver && winners && (
        <ResultPanel
          variant="inline"
          winners={winners}
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
            <p className="text-slate-400">
              最後の石を取った {getSeatDisplayName(roomPlayers, Number(activeWinner))} の勝ちです。
            </p>
          }
        />
      )}

      {!isGameOver && (
        <TurnBanner
          playerIndex={activeCurrent}
          playerLabel={formatSeatLabel(roomPlayers, activeCurrent)}
          action={
            isOnline && !online.isMyTurn
              ? "相手の手番です"
              : selectedHeap === null
                ? "山を選ぶ"
                : `${selectedHeap + 1}番の山から何個取る？`
          }
        />
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {activeHeaps.map((count, index) => (
          <button
            key={index}
            type="button"
            disabled={!canInteract || count === 0}
            onClick={() => setSelectedHeap(index)}
            className={`rounded-2xl border p-4 text-left transition ${
              selectedHeap === index
                ? "border-accent bg-accent/10"
                : "border-white/10 bg-surface-raised hover:border-white/20"
            } disabled:cursor-default disabled:opacity-50`}
          >
            <p className="text-sm text-slate-400">山 {index + 1}</p>
            <p className="mt-2 text-3xl font-bold">{count}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {Array.from({ length: count }, (_, i) => (
                <span
                  key={i}
                  className="inline-block h-3 w-3 rounded-full bg-slate-300"
                  aria-hidden
                />
              ))}
            </div>
          </button>
        ))}
      </div>

      {selectedHeap !== null && selectedCount > 0 && canInteract ? (
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: selectedCount }, (_, i) => i + 1).map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => take(selectedHeap, count)}
              className="min-h-11 rounded-full border border-white/15 bg-white/5 px-4 text-sm font-medium transition hover:bg-white/10"
            >
              {count}個取る
            </button>
          ))}
        </div>
      ) : null}

      <p className="text-center text-xs text-slate-500">
        初期配置は {NIM_HEAPS.join("・")} 個の3山です。
      </p>
    </div>
  );
}
