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
import type { HexState } from "@/lib/online/moves";
import { getOnlineResultReplayProps } from "@/lib/online/result-replay";
import {
  formatSeatLabel,
  formatWinnersWithNames,
  getSeatDisplayName,
} from "@/lib/online/player-labels";
import type { PlayMode } from "@/lib/online/types";
import {
  emptyHexBoard,
  HEX_SIZE,
  hexWinner,
  type Board,
  type Player,
} from "@/lib/play/hex";

type LocalPhase = "setup" | "playing" | "game-over";

export function HexGame() {
  const { recordLocalPlay, setPlayMode } = usePlayPage();
  const { onlineEnabled } = usePlayStats();
  const online = useOnlineRoom("hex");
  const { firstPlayer, onFirstPlayerChange } = useOnlineFirstPlayer(online);
  const [mode, setMode] = useState<PlayMode>("local");
  const [localPhase, setLocalPhase] = useState<LocalPhase>("setup");
  const [board, setBoard] = useState<Board>(emptyHexBoard);
  const [current, setCurrent] = useState<Player>(0);
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
    setBoard(emptyHexBoard());
    setCurrent(0);
    setWinner(null);
    setLocalPhase("playing");
  }, [recordLocalPlay]);

  const isOnline =
    online.phase === "playing" || online.phase === "finished";
  const onlineState = online.gameState as HexState | null;

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
      const won = hexWinner(next);
      if (won !== null) {
        setWinner(won);
        setLocalPhase("game-over");
        return;
      }
      setCurrent(current === 0 ? 1 : 0);
    },
    [isOnline, online, activePhase, localPhase, board, current]
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
    setPlayMode({ mode: "local" });
  }, [online.reset, setPlayMode]);

  const isSetupScreen =
    (localPhase === "setup" && online.phase === "idle") || online.phase === "waiting";
  usePlaySetupNavigation(isSetupScreen, reset);

  if (localPhase === "setup" && online.phase === "idle") {
    return (
      <OnlineSetupPanel
        title="ヘックス"
        description="11×11の六角マスに石を置き、向かい側の辺を自分の色でつなげた方が勝ちです。"
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
        title="ヘックス"
        description="11×11の六角マスに石を置き、向かい側の辺を自分の色でつなげた方が勝ちです。"
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

  const isGameOver = activePhase === "game-over" && winners !== null;
  const canInteract = (isOnline ? online.isMyTurn : true) && !isGameOver;
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
              {getSeatDisplayName(roomPlayers, Number(activeWinner))} が両端をつなぎました。
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
              : activeCurrent === 0
                ? "上下の辺をつなぐ"
                : "左右の辺をつなぐ"
          }
        />
      )}

      <div className="-mx-4 overflow-x-auto px-4">
        <div
          className="mx-auto grid min-w-[20rem] max-w-xl gap-0.5"
          style={{ gridTemplateColumns: `repeat(${HEX_SIZE}, minmax(0, 1fr))` }}
        >
          {activeBoard.map((cell, index) => {
            const row = Math.floor(index / HEX_SIZE);
            const offset = row % 2 === 1 ? "translate-x-1/4" : "";
            return (
              <button
                key={index}
                type="button"
                disabled={!canInteract || cell !== null}
                onClick={() => place(index)}
                className={`flex aspect-[1.15] min-h-7 items-center justify-center ${offset}`}
                aria-label={cell === null ? "空マス" : `プレイヤー ${cell + 1}`}
              >
                <span
                  className={`h-[70%] w-[70%] rounded-md ${
                    cell === null
                      ? "bg-emerald-900/50 ring-1 ring-emerald-700/50"
                      : playerPieceClasses(cell)
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-center text-xs text-slate-500">
        プレイヤー1は上と下、プレイヤー2は左と右をつなぎます。
      </p>
    </div>
  );
}
