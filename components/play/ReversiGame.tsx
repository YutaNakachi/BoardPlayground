"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePlayPage } from "@/components/play/PlayPageContext";
import { OnlineSetupPanel } from "@/components/play/shared/OnlineSetupPanel";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { useOnlineRoom } from "@/hooks/useOnlineRoom";
import { winnerIndices } from "@/lib/game-engine";
import type { ReversiState } from "@/lib/online/moves";
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

  const reset = useCallback(() => {
    online.reset();
    setLocalPhase("setup");
    setMode("local");
    setPlayMode({ mode: "local" });
  }, [online, setPlayMode]);

  if (localPhase === "setup" && online.phase === "idle") {
    return (
      <div className="rounded-2xl border border-white/10 bg-surface-raised p-6 text-center sm:p-8">
        <h2 className="text-xl font-semibold">リバーシ</h2>
        <p className="mt-2 text-sm text-[#a1a1a6]">
          挟んだ相手の石を裏返します。置ける場所がないときは自動でパスします。
        </p>
        <div className="mt-6">
          <OnlineSetupPanel
            mode={mode}
            onModeChange={setMode}
            onlineSupported
            onCreateRoom={online.handleCreate}
            onJoinRoom={online.handleJoin}
            onStartLocal={startLocal}
            loading={online.loading}
            error={online.error}
          />
        </div>
      </div>
    );
  }

  if (online.phase === "waiting" && online.room) {
    return (
      <OnlineSetupPanel
        mode="online"
        onModeChange={() => {}}
        onlineSupported
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

  if (activePhase === "game-over" && winners) {
    return (
      <ResultPanel
        winners={winners}
        onReplay={reset}
        details={
          <ul className="space-y-1 text-slate-400">
            <li>プレイヤー 1（黒）: {counts[0]} 個</li>
            <li>プレイヤー 2（白）: {counts[1]} 個</li>
          </ul>
        }
      />
    );
  }

  const canInteract = isOnline ? online.isMyTurn : true;

  return (
    <div className="space-y-6">
      <TurnBanner
        playerIndex={activeCurrent}
        playerLabel={`プレイヤー ${activeCurrent + 1}（${activeCurrent === 0 ? "黒" : "白"}）`}
        stats={`黒 ${counts[0]} · 白 ${counts[1]}`}
        action={isOnline && !online.isMyTurn ? "相手の手番です" : undefined}
      />
      {activePassNotice ? (
        <p className="text-center text-sm text-amber-200">{activePassNotice}</p>
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
                  className={`h-[70%] w-[70%] rounded-full ${
                    cell === 0
                      ? "bg-zinc-900 ring-1 ring-black/40"
                      : "bg-zinc-100 ring-1 ring-white/40"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
