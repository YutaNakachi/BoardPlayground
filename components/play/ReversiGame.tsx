"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePlayPage } from "@/components/play/PlayPageContext";
import { OnlineSetupPanel } from "@/components/play/shared/OnlineSetupPanel";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { playerPieceClasses } from "@/lib/player-colors";
import { usePlayStats } from "@/components/PlayStatsProvider";
import { useOnlineRoom } from "@/hooks/useOnlineRoom";
import { winnerIndices } from "@/lib/game-engine";
import type { ReversiState } from "@/lib/online/moves";
import {
  formatSeatLabel,
  formatWinnersWithNames,
  localizePlayerNotice,
} from "@/lib/online/player-labels";
import type { PlayMode } from "@/lib/online/types";
import {
  initialReversiBoard,
  playReversiMove,
  reversiCounts,
  reversiLegalMoves,
  reversiNextPlayer,
  type Board,
  type Player,
} from "@/lib/play/reversi";

type LocalPhase = "setup" | "playing" | "game-over";

export function ReversiGame() {
  const { recordLocalPlay, setPlayMode } = usePlayPage();
  const { onlineEnabled } = usePlayStats();
  const online = useOnlineRoom("reversi");
  const [mode, setMode] = useState<PlayMode>("local");
  const [localPhase, setLocalPhase] = useState<LocalPhase>("setup");
  const [board, setBoard] = useState<Board>(initialReversiBoard);
  const [current, setCurrent] = useState<Player>(0);
  const [passNotice, setPassNotice] = useState<string | null>(null);

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
    setBoard(initialReversiBoard());
    setCurrent(0);
    setPassNotice(null);
    setLocalPhase("playing");
  }, [recordLocalPlay]);

  const isOnline =
    online.phase === "playing" || online.phase === "finished";
  const onlineState = online.gameState as ReversiState | null;

  const activeBoard = isOnline && onlineState ? onlineState.board : board;
  const activeCurrent = isOnline && onlineState ? onlineState.current : current;
  const activePassNotice =
    isOnline && onlineState ? onlineState.passNotice : passNotice;
  const activePhase =
    isOnline && onlineState
      ? onlineState.phase
      : localPhase === "game-over"
        ? "game-over"
        : localPhase === "playing"
          ? "playing"
          : "setup";

  const legal = useMemo(
    () =>
      activePhase === "playing"
        ? reversiLegalMoves(activeBoard, activeCurrent)
        : [],
    [activePhase, activeBoard, activeCurrent]
  );

  const counts = useMemo(() => {
    if (isOnline && onlineState?.counts) return onlineState.counts;
    return reversiCounts(activeBoard);
  }, [isOnline, onlineState, activeBoard]);

  const place = useCallback(
    (index: number) => {
      if (isOnline) {
        if (!online.isMyTurn || activePhase !== "playing") return;
        void online.handleMove({ type: "place", index });
        return;
      }
      if (localPhase !== "playing") return;
      const nextBoard = playReversiMove(board, index, current);
      if (!nextBoard) return;
      const nextPlayer = reversiNextPlayer(nextBoard, current);
      setBoard(nextBoard);
      if (nextPlayer === null) {
        setLocalPhase("game-over");
        setPassNotice(null);
        return;
      }
      if (nextPlayer === current) {
        const passer = current === 0 ? 2 : 1;
        setPassNotice(`プレイヤー${passer}は置ける場所がないためパス`);
      } else {
        setPassNotice(null);
      }
      setCurrent(nextPlayer);
    },
    [isOnline, online, activePhase, localPhase, board, current]
  );

  const winners = useMemo(() => {
    if (activePhase !== "game-over") return null;
    return winnerIndices(counts);
  }, [activePhase, counts]);

  const roomPlayers = isOnline ? online.players : [];
  const displayPassNotice = localizePlayerNotice(activePassNotice, roomPlayers);

  const reset = useCallback(() => {
    online.reset();
    setLocalPhase("setup");
    setMode("local");
    setPlayMode({ mode: "local" });
  }, [online, setPlayMode]);

  if (localPhase === "setup" && online.phase === "idle") {
    return (
      <OnlineSetupPanel
        title="リバーシ"
        description="挟んだ相手の石を裏返します。置ける場所がないときは自動でパスします。"
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
        title="リバーシ"
        description="挟んだ相手の石を裏返します。置ける場所がないときは自動でパスします。"
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
        playerLabel={formatSeatLabel(roomPlayers, activeCurrent)}
        action={isOnline && !online.isMyTurn ? "相手の手番です" : undefined}
      />
      )}
      {displayPassNotice ? (
        <p className="text-center text-sm text-amber-200">{displayPassNotice}</p>
      ) : null}

      <div className="mx-auto grid max-w-md grid-cols-8 gap-0.5 rounded-xl bg-emerald-950 p-1.5 sm:p-2">
        {activeBoard.map((cell, index) => {
          const canPlace = canInteract && legal.includes(index);
          return (
            <button
              key={index}
              type="button"
              disabled={!canPlace}
              onClick={() => place(index)}
              className={`flex aspect-square min-h-9 items-center justify-center rounded-sm bg-emerald-800/80 sm:min-h-11 ${
                canPlace ? "ring-1 ring-lime-300/70" : ""
              }`}
              aria-label={
                cell === 0
                  ? "黒"
                  : cell === 1
                    ? "白"
                    : canPlace
                      ? "置けるマス"
                      : "空マス"
              }
            >
              {cell === null ? (
                canPlace ? (
                  <span className="h-2 w-2 rounded-full bg-lime-200/80" />
                ) : null
              ) : (
                <span
                  className={`h-[70%] w-[70%] rounded-full ${playerPieceClasses(cell)}`}
                />
              )}
            </button>
          );
        })}
      </div>

      {isGameOver && winners && (
        <ResultPanel
          variant="inline"
          winners={winners}
          winnersLabel={
            isOnline ? formatWinnersWithNames(roomPlayers, winners) : undefined
          }
          onReplay={reset}
        />
      )}
    </div>
  );
}
