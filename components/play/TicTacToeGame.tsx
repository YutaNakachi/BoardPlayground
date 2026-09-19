"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePlayPage } from "@/components/play/PlayPageContext";
import { OnlineSetupPanel } from "@/components/play/shared/OnlineSetupPanel";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { getPlayerTurnStyle } from "@/lib/player-colors";
import { usePlayStats } from "@/components/PlayStatsProvider";
import { useOnlineRoom } from "@/hooks/useOnlineRoom";
import type { TttState } from "@/lib/online/moves";
import {
  formatSeatLabel,
  formatWinnersWithNames,
  getSeatDisplayName,
} from "@/lib/online/player-labels";
import type { PlayMode } from "@/lib/online/types";
import {
  emptyTttBoard,
  TTT_SIZE,
  tttBoardFull,
  tttWinner,
  type Board,
  type Player,
} from "@/lib/play/tic-tac-toe";

type LocalPhase = "setup" | "playing" | "game-over";

export function TicTacToeGame() {
  const { recordLocalPlay, setPlayMode } = usePlayPage();
  const { onlineEnabled } = usePlayStats();
  const online = useOnlineRoom("tic-tac-toe");
  const [mode, setMode] = useState<PlayMode>("local");
  const [localPhase, setLocalPhase] = useState<LocalPhase>("setup");
  const [board, setBoard] = useState<Board>(emptyTttBoard);
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
    setBoard(emptyTttBoard());
    setCurrent(0);
    setWinner(null);
    setLocalPhase("playing");
  }, [recordLocalPlay]);

  const isOnline =
    online.phase === "playing" || online.phase === "finished";
  const onlineState = online.gameState as TttState | null;

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
      const won = tttWinner(next);
      if (won !== null) {
        setWinner(won);
        setLocalPhase("game-over");
        return;
      }
      if (tttBoardFull(next)) {
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
  }, [online, setPlayMode]);

  if (localPhase === "setup" && online.phase === "idle") {
    return (
      <OnlineSetupPanel
        title="三目並べ"
        description="3×3のマスに交互に置き、縦・横・斜めで3つ並べた方が勝ちです。"
        mode={mode}
        onModeChange={setMode}
        onlineSupported={onlineEnabled}
        onCreateRoom={online.handleCreate}
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
        title="三目並べ"
        description="3×3のマスに交互に置き、縦・横・斜めで3つ並べた方が勝ちです。"
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
          onStart: online.handleStart,
          canStart: online.players.length >= 2,
        }}
      />
    );
  }

  const isGameOver = activePhase === "game-over" && winners !== null;
  const canInteract = (isOnline ? online.isMyTurn : true) && !isGameOver;

  return (
    <div className="space-y-6">
      {!isGameOver && (
      <TurnBanner
        playerIndex={activeCurrent}
        playerLabel={formatSeatLabel(
          roomPlayers,
          activeCurrent,
          activeCurrent === 0 ? "×" : "○"
        )}
        action={isOnline && !online.isMyTurn ? "相手の手番です" : undefined}
      />
      )}

      <div
        className="mx-auto grid max-w-xs gap-px rounded-xl border-2 border-slate-500/80 bg-slate-500/80 p-px"
        style={{ gridTemplateColumns: `repeat(${TTT_SIZE}, minmax(0, 1fr))` }}
      >
        {activeBoard.map((cell, index) => (
          <button
            key={index}
            type="button"
            disabled={!canInteract || cell !== null}
            onClick={() => place(index)}
            className={`flex aspect-square min-h-20 items-center justify-center bg-surface-raised text-3xl font-bold disabled:cursor-default sm:min-h-24 sm:text-4xl ${
              cell === null ? "text-white" : getPlayerTurnStyle(cell).label
            }`}
            aria-label={
              cell === 0 ? "×" : cell === 1 ? "○" : `空マス ${index + 1}`
            }
          >
            {cell === 0 ? "×" : cell === 1 ? "○" : ""}
          </button>
        ))}
      </div>

      {isGameOver && winners && (
        <ResultPanel
          variant="inline"
          winners={winners}
          winnersLabel={
            isOnline ? formatWinnersWithNames(roomPlayers, winners) : undefined
          }
          onReplay={reset}
          details={
            <p className="text-slate-400">
              {activeWinner === "draw"
                ? "盤が埋まり、3つ並びはありませんでした。"
                : `${getSeatDisplayName(roomPlayers, Number(activeWinner))} が3つ並べました。`}
            </p>
          }
        />
      )}
    </div>
  );
}
