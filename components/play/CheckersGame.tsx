"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePlayPage } from "@/components/play/PlayPageContext";
import { OnlineSetupPanel } from "@/components/play/shared/OnlineSetupPanel";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { usePlayStats } from "@/components/PlayStatsProvider";
import { useOnlineRoom } from "@/hooks/useOnlineRoom";
import type { CheckersState } from "@/lib/online/moves";
import {
  formatSeatLabel,
  formatWinnersWithNames,
  getSeatDisplayName,
} from "@/lib/online/player-labels";
import type { PlayMode } from "@/lib/online/types";
import {
  applyCheckersMove,
  checkersMoves,
  checkersPieceCount,
  initialCheckersBoard,
  isDarkSquare,
  type Board,
  type CheckersMove,
  type Player,
} from "@/lib/play/checkers";

type LocalPhase = "setup" | "playing" | "game-over";

export function CheckersGame() {
  const { recordLocalPlay, setPlayMode } = usePlayPage();
  const { onlineEnabled } = usePlayStats();
  const online = useOnlineRoom("checkers");
  const [mode, setMode] = useState<PlayMode>("local");
  const [localPhase, setLocalPhase] = useState<LocalPhase>("setup");
  const [board, setBoard] = useState<Board>(initialCheckersBoard);
  const [current, setCurrent] = useState<Player>(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [lockFrom, setLockFrom] = useState<number | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
    setBoard(initialCheckersBoard());
    setCurrent(0);
    setSelected(null);
    setLockFrom(null);
    setWinner(null);
    setNotice(null);
    setLocalPhase("playing");
  }, [recordLocalPlay]);

  const isOnline =
    online.phase === "playing" || online.phase === "finished";
  const onlineState = online.gameState as CheckersState | null;

  const activeBoard = isOnline && onlineState ? onlineState.board : board;
  const activeCurrent = isOnline && onlineState ? onlineState.current : current;
  const activeLockFrom = isOnline && onlineState ? onlineState.lockFrom : lockFrom;
  const activeWinner = isOnline && onlineState ? onlineState.winner : winner;
  const activeNotice = isOnline && onlineState ? onlineState.notice : notice;
  const activePhase =
    isOnline && onlineState
      ? onlineState.phase
      : localPhase === "game-over"
        ? "game-over"
        : localPhase === "playing"
          ? "playing"
          : "setup";

  const [localSelected, setLocalSelected] = useState<number | null>(null);
  const activeSelected = isOnline
    ? onlineState?.lockFrom ?? selected
    : localSelected;

  const moves = useMemo(
    () =>
      activePhase === "playing"
        ? checkersMoves(activeBoard, activeCurrent, activeLockFrom)
        : [],
    [activePhase, activeBoard, activeCurrent, activeLockFrom]
  );

  const destinations = useMemo(() => {
    if (activeSelected == null) return [];
    return moves.filter((m) => m.from === activeSelected);
  }, [moves, activeSelected]);

  const mustCapture = moves.some((m) => m.capture != null);

  const finishIfNeeded = useCallback(
    (nextBoard: Board, nextPlayer: Player) => {
      if (
        checkersPieceCount(nextBoard, nextPlayer) === 0 ||
        checkersMoves(nextBoard, nextPlayer).length === 0
      ) {
        setWinner(nextPlayer === 0 ? 1 : 0);
        setLocalPhase("game-over");
        return true;
      }
      return false;
    },
    []
  );

  const applyLocal = useCallback(
    (move: CheckersMove) => {
      const { board: nextBoard, continueFrom } = applyCheckersMove(board, move);
      setBoard(nextBoard);
      if (continueFrom != null) {
        setLockFrom(continueFrom);
        setLocalSelected(continueFrom);
        setNotice("同じ駒でジャンプを続けてください");
        return;
      }
      const nextPlayer: Player = current === 0 ? 1 : 0;
      setLockFrom(null);
      setLocalSelected(null);
      setNotice(null);
      if (!finishIfNeeded(nextBoard, nextPlayer)) {
        setCurrent(nextPlayer);
      }
    },
    [board, current, finishIfNeeded]
  );

  const onSquare = useCallback(
    (index: number) => {
      if (activePhase !== "playing") return;
      if (isOnline && !online.isMyTurn) return;

      const dest = destinations.find((m) => m.to === index);
      if (dest) {
        if (isOnline) {
          void online.handleMove({ type: "checkers", move: dest });
          setSelected(null);
        } else {
          applyLocal(dest);
        }
        return;
      }
      if (activeLockFrom != null) return;
      const piece = activeBoard[index];
      if (!piece || piece.player !== activeCurrent) {
        if (isOnline) setSelected(null);
        else setLocalSelected(null);
        return;
      }
      if (!moves.some((m) => m.from === index)) return;
      if (isOnline) setSelected(index);
      else setLocalSelected(index);
    },
    [
      activePhase,
      isOnline,
      online,
      destinations,
      activeLockFrom,
      activeBoard,
      activeCurrent,
      moves,
      applyLocal,
    ]
  );

  const roomPlayers = isOnline ? online.players : [];

  const reset = useCallback(() => {
    online.reset();
    setLocalPhase("setup");
    setMode("local");
    setSelected(null);
    setPlayMode({ mode: "local" });
  }, [online, setPlayMode]);

  if (localPhase === "setup" && online.phase === "idle") {
    return (
      <div className="rounded-2xl border border-white/10 bg-surface-raised p-6 text-center sm:p-8">
        <h2 className="text-xl font-semibold">チェッカー</h2>
        <p className="mt-2 text-sm text-[#a1a1a6]">
          暗いマスだけを使います。斜めに進み、隣の相手を飛び越えて取ります。取れるときは必ず取ってください。
        </p>
        <div className="mt-6">
          <OnlineSetupPanel
            mode={mode}
            onModeChange={setMode}
            onlineSupported={onlineEnabled}
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

  if (activePhase === "game-over" && activeWinner !== null) {
    return (
      <ResultPanel
        winners={[activeWinner]}
        winnersLabel={
          isOnline
            ? formatWinnersWithNames(roomPlayers, [activeWinner])
            : undefined
        }
        onReplay={reset}
        details={
          <p className="text-slate-400">
            相手の駒がなくなったか、相手が動ける手がありませんでした。
          </p>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <TurnBanner
        playerIndex={activeCurrent}
        playerLabel={formatSeatLabel(roomPlayers, activeCurrent)}
        stats={
          isOnline
            ? `${getSeatDisplayName(roomPlayers, 0)} ${checkersPieceCount(activeBoard, 0)} · ${getSeatDisplayName(roomPlayers, 1)} ${checkersPieceCount(activeBoard, 1)}`
            : `P1 ${checkersPieceCount(activeBoard, 0)} · P2 ${checkersPieceCount(activeBoard, 1)}`
        }
        action={
          isOnline && !online.isMyTurn
            ? "相手の手番です"
            : mustCapture
              ? "ジャンプ必須"
              : undefined
        }
      />
      {activeNotice ? (
        <p className="text-center text-sm text-amber-200">{activeNotice}</p>
      ) : null}

      <div className="mx-auto grid max-w-md grid-cols-8 overflow-hidden rounded-xl border border-surface-border">
        {activeBoard.map((piece, index) => {
          const dark = isDarkSquare(index);
          const isDest = destinations.some((m) => m.to === index);
          const isFrom = activeSelected === index;
          return (
            <button
              key={index}
              type="button"
              onClick={() => onSquare(index)}
              className={`relative flex aspect-square min-h-9 items-center justify-center sm:min-h-11 ${
                dark ? "bg-emerald-950" : "bg-amber-100/80"
              } ${isFrom ? "ring-2 ring-inset ring-accent" : ""} ${
                isDest ? "ring-2 ring-inset ring-lime-300" : ""
              }`}
              aria-label={
                piece
                  ? `${getSeatDisplayName(roomPlayers, piece.player)}${piece.king ? " キング" : ""}`
                  : isDest
                    ? "移動先"
                    : dark
                      ? "暗いマス"
                      : "明るいマス"
              }
            >
              {piece ? (
                <span
                  className={`flex h-[72%] w-[72%] items-center justify-center rounded-full text-[10px] font-bold sm:text-xs ${
                    piece.player === 0
                      ? "bg-indigo-500 text-white"
                      : "bg-rose-200 text-rose-950"
                  }`}
                >
                  {piece.king ? "K" : ""}
                </span>
              ) : isDest ? (
                <span className="h-2.5 w-2.5 rounded-full bg-lime-300/90" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
