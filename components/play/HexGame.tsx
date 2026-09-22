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
import type { HexState as OnlineHexState } from "@/lib/online/moves";
import { getOnlineResultReplayProps } from "@/lib/online/result-replay";
import {
  formatSeatLabel,
  formatWinnersWithNames,
  getSeatDisplayName,
} from "@/lib/online/player-labels";
import type { PlayMode } from "@/lib/online/types";
import {
  applyHexSwap,
  declineHexSwap,
  HEX_GRID_STROKE,
  HEX_GRID_STROKE_WIDTH,
  HEX_STONE_COLORS,
  hexBoardEdges,
  hexCellFill,
  hexCenter,
  hexCoord,
  hexPolygonPoints,
  hexViewBox,
  hexWinPath,
  initialHexState,
  placeHexStone,
  stoneForPlayer,
  type Board,
  type HexState as LocalHexState,
  type HexWinResult,
  type Player,
  type Stone,
} from "@/lib/play/hex";

type LocalPhase = "setup" | "playing" | "game-over";

const VIEW_BOX = hexViewBox(1.6);

function stoneLabel(state: LocalHexState, player: Player): string {
  const stone = state.playerStone[player];
  return `プレイヤー ${player + 1}（${HEX_STONE_COLORS[stone].label}）`;
}

type HexBoardProps = {
  board: Board;
  winPath: number[];
  hoverIndex: number | null;
  lastPlaced: number | null;
  previewStone: Stone | null;
  canPlace: boolean;
  onHover: (index: number | null) => void;
  onPlace: (index: number) => void;
};

function HexBoard({
  board,
  winPath,
  hoverIndex,
  lastPlaced,
  previewStone,
  canPlace,
  onHover,
  onPlace,
}: HexBoardProps) {
  const boardEdges = useMemo(() => hexBoardEdges(), []);
  const winPathSet = useMemo(() => new Set(winPath), [winPath]);

  return (
    <div className="relative -mx-4 w-[calc(100%+2rem)] sm:mx-auto sm:w-full sm:max-w-4xl">
      <svg
        viewBox={`${VIEW_BOX.x} ${VIEW_BOX.y} ${VIEW_BOX.width} ${VIEW_BOX.height}`}
        className="block h-auto w-full touch-manipulation"
        aria-label="ヘックスの盤"
        onMouseLeave={() => onHover(null)}
      >
        <defs>
          <filter id="hex-win-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feDropShadow dx="0" dy="0" stdDeviation="0.1" floodColor="#fbbf24" />
          </filter>
        </defs>

        <rect
          x={VIEW_BOX.x}
          y={VIEW_BOX.y}
          width={VIEW_BOX.width}
          height={VIEW_BOX.height}
          fill="#111827"
          rx="0.4"
        />

        {board.map((cell, index) => {
          const { row, col } = hexCoord(index);
          const points = hexPolygonPoints(row, col);

          return (
            <polygon
              key={`fill-${index}`}
              points={points}
              fill={hexCellFill(row, col, winPathSet.has(index))}
              className={cell === null && canPlace ? "cursor-pointer" : ""}
              onMouseEnter={() => {
                if (cell === null && canPlace) onHover(index);
              }}
              onClick={() => onPlace(index)}
            />
          );
        })}

        {boardEdges.map((edge, i) => (
          <line
            key={i}
            x1={edge.a.x}
            y1={edge.a.y}
            x2={edge.b.x}
            y2={edge.b.y}
            stroke={HEX_GRID_STROKE}
            strokeWidth={HEX_GRID_STROKE_WIDTH}
            strokeLinecap="round"
            className="pointer-events-none"
          />
        ))}

        {board.map((cell, index) => {
          const { row, col } = hexCoord(index);
          const points = hexPolygonPoints(row, col);
          const isWinCell = winPathSet.has(index);
          const isHover = hoverIndex === index && cell === null && canPlace;
          const isLast = lastPlaced === index;

          return (
            <g key={`piece-${index}`} className="pointer-events-none">
              {isHover && previewStone !== null && (
                <polygon
                  points={points}
                  fill={HEX_STONE_COLORS[previewStone].fill}
                  opacity={0.32}
                />
              )}
              {isWinCell && (
                <polygon
                  points={points}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth={0.09}
                  opacity={0.9}
                  filter="url(#hex-win-glow)"
                />
              )}
              {cell !== null && (
                <circle
                  cx={hexCenter(row, col).x}
                  cy={hexCenter(row, col).y}
                  r={isLast ? 0.44 : 0.4}
                  fill={HEX_STONE_COLORS[cell].fill}
                  stroke={HEX_STONE_COLORS[cell].stroke}
                  strokeWidth={0.05}
                  className="transition-all duration-200"
                  filter={isWinCell ? "url(#hex-win-glow)" : undefined}
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function HexGame() {
  const { recordLocalPlay, setPlayMode } = usePlayPage();
  const { onlineEnabled } = usePlayStats();
  const online = useOnlineRoom("hex");
  const { firstPlayer, onFirstPlayerChange } = useOnlineFirstPlayer(online);
  const [mode, setMode] = useState<PlayMode>("local");
  const [localPhase, setLocalPhase] = useState<LocalPhase>("setup");
  const [game, setGame] = useState<LocalHexState>(() => initialHexState());
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [lastPlaced, setLastPlaced] = useState<number | null>(null);
  const [winResult, setWinResult] = useState<HexWinResult | null>(null);

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
    setGame(initialHexState());
    setHoverIndex(null);
    setLastPlaced(null);
    setWinResult(null);
    setLocalPhase("playing");
  }, [recordLocalPlay]);

  const resetLocal = useCallback(() => {
    setGame(initialHexState());
    setHoverIndex(null);
    setLastPlaced(null);
    setWinResult(null);
    setLocalPhase("playing");
  }, []);

  const isOnline =
    online.phase === "playing" || online.phase === "finished";
  const onlineState = online.gameState as OnlineHexState | null;

  const activeBoard = isOnline && onlineState ? onlineState.board : game.board;
  const activeCurrent = isOnline && onlineState ? onlineState.current : game.current;
  const activePhase =
    isOnline && onlineState
      ? onlineState.phase
      : localPhase === "game-over"
        ? "game-over"
        : localPhase === "playing"
          ? "playing"
          : "setup";

  const localWinners =
    winResult ? [game.playerStone.indexOf(winResult.winner)] : null;
  const onlineWinners =
    isOnline && onlineState?.winner !== null ? [onlineState!.winner!] : null;
  const winners = isOnline ? onlineWinners : localWinners;

  const winPath = useMemo(() => {
    if (isOnline && onlineState?.winner !== null && onlineState?.winner !== undefined) {
      return hexWinPath(onlineState.board, onlineState.winner) ?? [];
    }
    return winResult?.path ?? [];
  }, [isOnline, onlineState, winResult]);

  const handleLocalPlace = useCallback(
    (index: number) => {
      if (localPhase !== "playing" || game.swapPending) return;
      const result = placeHexStone(game, index);
      if (!result) return;
      setLastPlaced(index);
      setGame(result.next);
      if (result.win) {
        setWinResult(result.win);
        setLocalPhase("game-over");
      }
    },
    [localPhase, game]
  );

  const handleSwap = useCallback(() => {
    if (localPhase !== "playing" || !game.swapPending) return;
    setGame(applyHexSwap(game));
    setLastPlaced(null);
  }, [localPhase, game]);

  const handleDeclineSwap = useCallback(() => {
    if (localPhase !== "playing" || !game.swapPending) return;
    setGame(declineHexSwap(game));
  }, [localPhase, game]);

  const place = useCallback(
    (index: number) => {
      if (isOnline) {
        if (!online.isMyTurn || activePhase !== "playing") return;
        void online.handleMove({ type: "place", index });
        return;
      }
      handleLocalPlace(index);
    },
    [isOnline, online, activePhase, handleLocalPlace]
  );

  const reset = useCallback(() => {
    online.reset();
    setLocalPhase("setup");
    setMode("local");
    setPlayMode({ mode: "local" });
  }, [online.reset, setPlayMode]);

  const isSetupScreen =
    (localPhase === "setup" && online.phase === "idle") || online.phase === "waiting";
  usePlaySetupNavigation(isSetupScreen, reset);

  const isGameOver = activePhase === "game-over" && winners !== null;
  const canPlace = (isOnline ? online.isMyTurn : true) && !isGameOver && !game.swapPending;
  const previewStone = isOnline
    ? (activeCurrent as Stone)
    : stoneForPlayer(game, game.current);
  const roomPlayers = isOnline ? online.players : [];

  if (localPhase === "setup" && online.phase === "idle") {
    return (
      <OnlineSetupPanel
        title="ヘックス"
        description="11×11の菱形グリッドに石を置き、南北（赤）または東西（青）の辺をつなげた方が勝ちです。"
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
        description="11×11の菱形グリッドに石を置き、南北（赤）または東西（青）の辺をつなげた方が勝ちです。"
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

  const turnAction = isOnline
    ? !online.isMyTurn
      ? "相手の手番です"
      : activeCurrent === 0
        ? "南北の辺をつなぐ"
        : "東西の辺をつなぐ"
    : game.swapPending
      ? "スワップするか、そのまま打ってください"
      : previewStone === 0
        ? "南北の辺をつなぐ"
        : "東西の辺をつなぐ";

  const winDetails = isOnline && onlineState?.winner !== null
    ? `${getSeatDisplayName(roomPlayers, onlineState!.winner!)} が両端をつなぎました。`
    : winResult
      ? `${HEX_STONE_COLORS[winResult.winner].label}が両端をつなぎました。`
      : null;

  return (
    <div className="space-y-5">
      {isGameOver && winners && (
        <ResultPanel
          variant="inline"
          winners={winners}
          winnersLabel={
            isOnline ? formatWinnersWithNames(roomPlayers, winners) : undefined
          }
          onReplay={isOnline ? undefined : () => setLocalPhase("setup")}
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
            winDetails ? <p className="text-slate-400">{winDetails}</p> : undefined
          }
        />
      )}

      {!isGameOver && (
        <TurnBanner
          playerIndex={activeCurrent}
          playerLabel={
            isOnline
              ? formatSeatLabel(roomPlayers, activeCurrent)
              : stoneLabel(game, game.current)
          }
          action={turnAction}
        />
      )}

      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#ff7d9e]" />
          赤: 南北
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#62b4ff]" />
          青: 東西
        </span>
        {!isOnline && !isGameOver && (
          <button
            type="button"
            onClick={resetLocal}
            className="rounded-full border border-white/10 px-3 py-1 text-slate-400 transition hover:border-white/20 hover:text-slate-200"
          >
            リセット
          </button>
        )}
      </div>

      <HexBoard
        board={activeBoard}
        winPath={winPath}
        hoverIndex={hoverIndex}
        lastPlaced={isOnline ? null : lastPlaced}
        previewStone={previewStone}
        canPlace={canPlace}
        onHover={setHoverIndex}
        onPlace={place}
      />

      {!isOnline && game.swapPending && !isGameOver && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleSwap}
            className="rounded-full border border-sky-400/50 bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-200 transition hover:bg-sky-500/25"
          >
            スワップ（先手の石を自分の色にする）
          </button>
          <button
            type="button"
            onClick={handleDeclineSwap}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            そのまま打る
          </button>
        </div>
      )}
    </div>
  );
}
