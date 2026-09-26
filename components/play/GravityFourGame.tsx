"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { OnlineFirstPlayerPicker } from "@/components/play/shared/OnlineFirstPlayerPicker";
import { OnlineSetupPanel } from "@/components/play/shared/OnlineSetupPanel";
import { PendingJoinConnecting } from "@/components/play/shared/PendingJoinConnecting";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { playerPieceClasses } from "@/lib/player-colors";
import { usePlayStats } from "@/components/PlayStatsProvider";
import { useOnlineFirstPlayer } from "@/hooks/useOnlineFirstPlayer";
import { useOnlineRoom } from "@/hooks/useOnlineRoom";
import type { GravityFourState } from "@/lib/online/moves";
import { getOnlineResultReplayProps } from "@/lib/online/result-replay";
import {
  formatSeatLabel,
  formatWinnersWithNames,
  getSeatDisplayName,
} from "@/lib/online/player-labels";
import type { PlayMode } from "@/lib/online/types";
import {
  dropGravityFour,
  emptyGravityFourBoard,
  GF_COLS,
  GF_ROWS,
  gfIndex,
  gfLegalColumns,
  gravityFourBoardFull,
  gravityFourWinner,
  type Board,
  type Player,
} from "@/lib/play/gravity-four";

type LocalPhase = "setup" | "playing" | "game-over";

export function GravityFourGame() {
  const { recordLocalPlay, setPlayMode } = usePlayPage();
  const { onlineEnabled } = usePlayStats();
  const online = useOnlineRoom("gravity-four");
  const { firstPlayer, onFirstPlayerChange } = useOnlineFirstPlayer(online);
  const [mode, setMode] = useState<PlayMode>("local");
  const [localPhase, setLocalPhase] = useState<LocalPhase>("setup");
  const [board, setBoard] = useState<Board>(emptyGravityFourBoard);
  const [current, setCurrent] = useState<Player>(0);
  const [winner, setWinner] = useState<Player | "draw" | null>(null);

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
    setBoard(emptyGravityFourBoard());
    setCurrent(0);
    setWinner(null);
    setLocalPhase("playing");
  }, [recordLocalPlay]);

  const isOnline =
    online.phase === "playing" || online.phase === "finished";
  const onlineState = online.gameState as GravityFourState | null;

  const activeBoard = isOnline && onlineState ? onlineState.board : board;
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

  const drop = useCallback(
    (col: number) => {
      if (isOnline) {
        if (!online.isMyTurn || activePhase !== "playing") return;
        void online.handleMove({ type: "drop", col });
        return;
      }
      if (localPhase !== "playing") return;
      const next = dropGravityFour(board, col, current);
      if (!next) return;
      setBoard(next);
      const won = gravityFourWinner(next);
      if (won !== null) {
        setWinner(won);
        setLocalPhase("game-over");
        return;
      }
      if (gravityFourBoardFull(next)) {
        setWinner("draw");
        setLocalPhase("game-over");
        return;
      }
      setCurrent(current === 0 ? 1 : 0);
    },
    [isOnline, online, activePhase, localPhase, board, current]
  );

  const winners = useMemo(() => {
    if (activePhase !== "game-over" || activeWinner === null) return null;
    if (activeWinner === "draw") return [0, 1];
    return [activeWinner];
  }, [activePhase, activeWinner]);

  const legal = useMemo(
    () => (activePhase === "playing" ? gfLegalColumns(activeBoard) : []),
    [activePhase, activeBoard]
  );

  const roomPlayers = isOnline ? online.players : [];

  const reset = useCallback(() => {
    online.reset();
    setLocalPhase("setup");
    setMode("local");
    setPlayMode({ mode: "local" });
  }, [online.reset, setPlayMode]);

  const isSetupScreen =
    (localPhase === "setup" && online.phase === "idle") || online.phase === "waiting";
  usePlaySetupNavigation(isSetupScreen, reset);

  if (online.completingPendingJoin) {
    return <PendingJoinConnecting />;
  }

  if (localPhase === "setup" && online.phase === "idle") {
    return (
      <OnlineSetupPanel
        title="重力四目"
        description="7列×6段の盤に、列を選んで石を落とします。縦・横・斜めで4つ以上並べた方が勝ちです。"
        mode={mode}
        onModeChange={setMode}
        onlineSupported={onlineEnabled}
        onCreateRoom={(displayName) => online.handleCreate(displayName)}
        onJoinRoom={online.handleJoin}
        onStartLocal={startLocal}
        loading={online.loading}
        initialJoinCode={online.joinCodeFromUrl}
        error={online.error}
      />
    );
  }

  if (online.phase === "waiting" && online.room) {
    return (
      <OnlineSetupPanel
        title="重力四目"
        description="7列×6段の盤に、列を選んで石を落とします。縦・横・斜めで4つ以上並べた方が勝ちです。"
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

  const isGameOver = activePhase === "game-over" && winners !== null;
  const canInteract = (isOnline ? online.isMyTurn : true) && !isGameOver;
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
          draw={activeWinner === "draw"}
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
              {activeWinner === "draw"
                ? "盤が埋まり、4つ並びはありませんでした。"
                : `${getSeatDisplayName(roomPlayers, Number(activeWinner))} が4つ以上並べました。`}
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
              : "列をタップして石を落とす"
          }
        />
      )}

      <div className="mx-auto max-w-md">
        <div className="mb-2 grid grid-cols-7 gap-1">
          {Array.from({ length: GF_COLS }, (_, col) => (
            <button
              key={col}
              type="button"
              disabled={!canInteract || !legal.includes(col)}
              onClick={() => drop(col)}
              className="min-h-9 rounded-md text-xs text-slate-500 transition enabled:hover:bg-white/10 enabled:hover:text-white disabled:cursor-default"
              aria-label={`${col + 1}列目に落とす`}
            >
              ↓
            </button>
          ))}
        </div>

        <div
          className="grid gap-1 rounded-xl bg-indigo-950/80 p-2"
          style={{ gridTemplateColumns: `repeat(${GF_COLS}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: GF_ROWS }, (_, row) =>
            Array.from({ length: GF_COLS }, (_, col) => {
              const cell = activeBoard[gfIndex(row, col)];
              return (
                <div
                  key={`${row}-${col}`}
                  className="flex aspect-square min-h-9 items-center justify-center rounded-full bg-indigo-900/60 sm:min-h-11"
                  aria-label={
                    cell === 0
                      ? "プレイヤー1の石"
                      : cell === 1
                        ? "プレイヤー2の石"
                        : "空き"
                  }
                >
                  {cell === null ? null : (
                    <span
                      className={`h-[78%] w-[78%] rounded-full ${playerPieceClasses(cell)}`}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
