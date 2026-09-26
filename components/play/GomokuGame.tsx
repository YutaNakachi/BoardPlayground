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
import { getOnlineResultReplayProps } from "@/lib/online/result-replay";
import type { GomokuState } from "@/lib/online/moves";
import {
  formatSeatLabel,
  formatWinnersWithNames,
  getSeatDisplayName,
} from "@/lib/online/player-labels";
import type { PlayMode } from "@/lib/online/types";
import {
  emptyGomokuBoard,
  GOMOKU_SIZE,
  gomokuBoardFull,
  gomokuWinner,
  type Board,
  type Player,
} from "@/lib/play/gomoku";

type LocalPhase = "setup" | "playing" | "game-over";

export function GomokuGame() {
  const { recordLocalPlay, setPlayMode } = usePlayPage();
  const { onlineEnabled } = usePlayStats();
  const online = useOnlineRoom("gomoku");
  const { firstPlayer, onFirstPlayerChange } = useOnlineFirstPlayer(online);
  const [mode, setMode] = useState<PlayMode>("local");
  const [localPhase, setLocalPhase] = useState<LocalPhase>("setup");
  const [board, setBoard] = useState<Board>(emptyGomokuBoard);
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
    setBoard(emptyGomokuBoard());
    setCurrent(0);
    setWinner(null);
    setLocalPhase("playing");
  }, [recordLocalPlay]);

  const isOnline =
    online.phase === "playing" || online.phase === "finished";
  const onlineState = online.gameState as GomokuState | null;

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

  const place = useCallback(
    (index: number) => {
      if (isOnline) {
        if (!online.isMyTurn || activePhase !== "playing") return;
        void online.handleMove({ type: "place", index });
        return;
      }
      if (localPhase !== "playing" || board[index] !== null) return;
      const next = board.map((cell, i) => (i === index ? current : cell));
      setBoard(next);
      const won = gomokuWinner(next);
      if (won !== null) {
        setWinner(won);
        setLocalPhase("game-over");
        return;
      }
      if (gomokuBoardFull(next)) {
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
        title="五目並べ"
        description="13×13のマスに交互に置き、縦・横・斜めのいずれかで5つ並べると勝ちです。禁じ手はありません。"
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
        title="五目並べ"
        description="13×13のマスに交互に置き、縦・横・斜めのいずれかで5つ並べると勝ちです。禁じ手はありません。"
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
                ? "盤が埋まり、5つ並びはありませんでした。"
                : `${getSeatDisplayName(roomPlayers, Number(activeWinner))} が5つ並べました。`}
            </p>
          }
        />
      )}

      {!isGameOver && (
      <TurnBanner
        playerIndex={activeCurrent}
        playerLabel={formatSeatLabel(roomPlayers, activeCurrent)}
        action={isOnline && !online.isMyTurn ? "相手の手番です" : undefined}
      />
      )}

      <div className="-mx-4 overflow-x-auto px-4">
        <div
          className="mx-auto grid min-w-[22rem] max-w-xl gap-px rounded-lg bg-amber-950/80 p-1"
          style={{ gridTemplateColumns: `repeat(${GOMOKU_SIZE}, minmax(0, 1fr))` }}
        >
          {activeBoard.map((cell, index) => (
            <button
              key={index}
              type="button"
              disabled={!canInteract || cell !== null}
              onClick={() => place(index)}
              className="flex aspect-square min-h-7 items-center justify-center bg-amber-100/10 sm:min-h-8"
              aria-label={
                cell === 0 ? "黒石" : cell === 1 ? "白石" : `空マス ${index + 1}`
              }
            >
              {cell === null ? null : (
                <span
                  className={`h-[72%] w-[72%] rounded-full ${playerPieceClasses(cell)}`}
                />
              )}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
