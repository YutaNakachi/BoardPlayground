"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { OnlineFirstPlayerPicker } from "@/components/play/shared/OnlineFirstPlayerPicker";
import { OnlineSetupPanel } from "@/components/play/shared/OnlineSetupPanel";
import { setupPillClass } from "@/components/play/shared/PlaySetupCard";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { getPlayerTurnStyle } from "@/lib/player-colors";
import { usePlayStats } from "@/components/PlayStatsProvider";
import { useOnlineFirstPlayer } from "@/hooks/useOnlineFirstPlayer";
import { useOnlineRoom } from "@/hooks/useOnlineRoom";
import { useOnlineTttMode } from "@/hooks/useOnlineTttMode";
import type { TttState } from "@/lib/online/moves";
import { getOnlineResultReplayProps } from "@/lib/online/result-replay";
import {
  formatSeatLabel,
  formatWinnersWithNames,
  getSeatDisplayName,
} from "@/lib/online/player-labels";
import type { PlayMode } from "@/lib/online/types";
import {
  applyTttPlace,
  emptyTttBoard,
  emptyTttHistories,
  TTT_SIZE,
  tttBoardFull,
  tttWinner,
  type Board,
  type Player,
  type TttHistories,
  type TttMode,
} from "@/lib/play/tic-tac-toe";

type LocalPhase = "setup" | "playing" | "game-over";

const TTT_MODE_OPTIONS: { value: TttMode; label: string; description: string }[] = [
  {
    value: "classic",
    label: "通常",
    description: "空きマスに置き、3つ並べたら勝ち。盤が埋まれば引き分け。",
  },
  {
    value: "rotating",
    label: "ローテ",
    description:
      "自分の駒は盤上に3つまで。4つ目を置くと一番古い駒が消えます。引き分けなし。",
  },
];

function modeSetupExtra(
  gameMode: TttMode,
  onGameModeChange: (mode: TttMode) => void,
  readOnly = false
) {
  const selected = TTT_MODE_OPTIONS.find((o) => o.value === gameMode)!;
  return (
    <div className="mt-6 space-y-2">
      <p className="text-center text-xs text-slate-400">ルール</p>
      {readOnly ? (
        <p className="text-center text-sm font-medium text-white">{selected.label}</p>
      ) : (
        <div className="flex flex-wrap justify-center gap-2">
          {TTT_MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onGameModeChange(option.value)}
              className={`min-w-20 px-4 py-2 ${setupPillClass(gameMode === option.value)}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
      <p className="text-center text-xs text-slate-500">{selected.description}</p>
    </div>
  );
}

export function TicTacToeGame() {
  const { recordLocalPlay, setPlayMode } = usePlayPage();
  const { onlineEnabled } = usePlayStats();
  const online = useOnlineRoom("tic-tac-toe");
  const { firstPlayer, onFirstPlayerChange } = useOnlineFirstPlayer(online);
  const { mode: onlineTttMode, onModeChange: onOnlineTttModeChange } =
    useOnlineTttMode(online);
  const [mode, setMode] = useState<PlayMode>("local");
  const [gameMode, setGameMode] = useState<TttMode>("classic");
  const [localPhase, setLocalPhase] = useState<LocalPhase>("setup");
  const [board, setBoard] = useState<Board>(emptyTttBoard);
  const [histories, setHistories] = useState<TttHistories>(emptyTttHistories);
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
    setHistories(emptyTttHistories());
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
      if (localPhase !== "playing") return;
      const result = applyTttPlace(board, histories, index, current, gameMode);
      if (!result) return;
      const { board: next, histories: nextHistories } = result;
      setBoard(next);
      setHistories(nextHistories);
      const won = tttWinner(next);
      if (won !== null) {
        setWinner(won);
        setLocalPhase("game-over");
        return;
      }
      if (gameMode === "classic" && tttBoardFull(next)) {
        setWinner("draw");
        setLocalPhase("game-over");
        return;
      }
      setCurrent(current === 0 ? 1 : 0);
    },
    [
      isOnline,
      online,
      activePhase,
      localPhase,
      board,
      histories,
      current,
      gameMode,
    ]
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

  const ruleExtra = modeSetupExtra(gameMode, setGameMode);
  const startParams = {
    firstPlayer,
    gameOptions: { mode: onlineTttMode },
  };

  const hostLobbyExtra = (
    <>
      {modeSetupExtra(
        onlineTttMode,
        onOnlineTttModeChange,
        !online.isHost
      )}
      <div className="mt-6">
        <OnlineFirstPlayerPicker
          players={online.players}
          value={firstPlayer}
          onChange={online.isHost ? onFirstPlayerChange : undefined}
          readOnly={!online.isHost}
        />
      </div>
    </>
  );

  if (localPhase === "setup" && online.phase === "idle") {
    return (
      <OnlineSetupPanel
        title="三目並べ"
        description="3×3のマスに交互に置き、縦・横・斜めで3つ並べた方が勝ちです。"
        mode={mode}
        onModeChange={setMode}
        onlineSupported={onlineEnabled}
        onCreateRoom={(displayName) => online.handleCreate(displayName)}
        onJoinRoom={online.handleJoin}
        onStartLocal={startLocal}
        loading={online.loading}
        initialJoinCode={online.joinCodeFromUrl}
        error={online.error}
        extra={mode === "local" ? ruleExtra : undefined}
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
          onStart: () => online.handleStart(startParams),
          canStart: online.players.length >= 2,
          extra: hostLobbyExtra,
        }}
      />
    );
  }

  const activeGameMode =
    isOnline && onlineState
      ? onlineState.mode ?? "classic"
      : gameMode;
  const isGameOver = activePhase === "game-over" && winners !== null;
  const canInteract = (isOnline ? online.isMyTurn : true) && !isGameOver;
  const replayProps = getOnlineResultReplayProps(
    isOnline,
    online.isHost,
    () => online.handleRematch(startParams),
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
          replayExtra={isOnline && online.isHost ? hostLobbyExtra : undefined}
          details={
            <p className="text-slate-400">
              {activeWinner === "draw"
                ? "盤が埋まり、3つ並びはありませんでした。"
                : `${getSeatDisplayName(roomPlayers, Number(activeWinner))} が3つ並べました。`}
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
              : activeGameMode === "rotating"
                ? "ローテモード"
                : undefined
          }
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
            className={`flex aspect-square min-h-20 items-center justify-center bg-surface-raised text-5xl font-bold leading-none disabled:cursor-default sm:min-h-24 sm:text-6xl ${
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
    </div>
  );
}
