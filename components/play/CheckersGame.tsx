"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { OnlineFirstPlayerPicker } from "@/components/play/shared/OnlineFirstPlayerPicker";
import { OnlineSetupPanel } from "@/components/play/shared/OnlineSetupPanel";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { playerPieceClasses } from "@/lib/player-colors";
import { usePlayStats } from "@/components/PlayStatsProvider";
import { useOnlineFirstPlayer } from "@/hooks/useOnlineFirstPlayer";
import { useOnlineRoom } from "@/hooks/useOnlineRoom";
import { getOnlineResultReplayProps } from "@/lib/online/result-replay";
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
  const { firstPlayer, onFirstPlayerChange } = useOnlineFirstPlayer(online);
  const [mode, setMode] = useState<PlayMode>("local");
  const [localPhase, setLocalPhase] = useState<LocalPhase>("setup");
  const [board, setBoard] = useState<Board>(initialCheckersBoard);
  const [current, setCurrent] = useState<Player>(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [lockFrom, setLockFrom] = useState<number | null>(null);
  const [localSelected, setLocalSelected] = useState<number | null>(null);
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
    setLocalSelected(null);
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

  const activeSelected = isOnline
    ? onlineState?.lockFrom ?? selected
    : lockFrom ?? localSelected;

  const moves = useMemo(
    () =>
      activePhase === "playing"
        ? checkersMoves(activeBoard, activeCurrent, activeLockFrom)
        : [],
    [activePhase, activeBoard, activeCurrent, activeLockFrom]
  );

  const jumpFrom = activeLockFrom ?? activeSelected;

  const destinations = useMemo(() => {
    if (jumpFrom == null) return [];
    return moves.filter((m) => m.from === jumpFrom);
  }, [moves, jumpFrom]);

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
    setLocalSelected(null);
    setLockFrom(null);
    setNotice(null);
    setWinner(null);
    setPlayMode({ mode: "local" });
  }, [online.reset, setPlayMode]);

  const isSetupScreen =
    (localPhase === "setup" && online.phase === "idle") || online.phase === "waiting";
  usePlaySetupNavigation(isSetupScreen, reset);

  if (localPhase === "setup" && online.phase === "idle") {
    return (
      <OnlineSetupPanel
        title="チェッカー"
        description="黒マスだけを使います。斜めに進み、隣の相手を飛び越えて取ります。取れるときは必ず取ってください。"
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
        title="チェッカー"
        description="黒マスだけを使います。斜めに進み、隣の相手を飛び越えて取ります。取れるときは必ず取ってください。"
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

  const isGameOver = activePhase === "game-over" && activeWinner !== null;
  const winners = isGameOver ? [activeWinner] : null;
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
          winnersLabel={
            isOnline
              ? formatWinnersWithNames(roomPlayers, winners)
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
            <p className="text-slate-400">
              相手の駒がなくなったか、相手が動ける手がありませんでした。
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
            : activeLockFrom != null
              ? "ジャンプ継続"
              : mustCapture
                ? "ジャンプ必須"
                : undefined
        }
        notice={activeNotice ?? undefined}
      />
      )}

      <div className="mx-auto grid max-w-md grid-cols-8 overflow-hidden rounded-xl border border-surface-border">
        {activeBoard.map((piece, index) => {
          const dark = isDarkSquare(index);
          const isDest = destinations.some((m) => m.to === index);
          const isFrom = jumpFrom === index;
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
                      ? "黒マス"
                      : "白マス"
              }
            >
              {piece ? (
                <span
                  className={`flex h-[72%] w-[72%] items-center justify-center rounded-full ${playerPieceClasses(piece.player)}`}
                >
                  {piece.king ? (
                    <span className="flex size-full items-center justify-center" aria-hidden>
                      <span
                        className="select-none text-[1.45rem] leading-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] -translate-y-px sm:text-[1.8rem]"
                      >
                        👑
                      </span>
                    </span>
                  ) : null}
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
