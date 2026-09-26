"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { OnlineFirstPlayerPicker } from "@/components/play/shared/OnlineFirstPlayerPicker";
import { OnlineSetupPanel } from "@/components/play/shared/OnlineSetupPanel";
import { PendingJoinConnecting } from "@/components/play/shared/PendingJoinConnecting";
import { setupPillClass } from "@/components/play/shared/PlaySetupCard";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { usePlayStats } from "@/components/PlayStatsProvider";
import { useOnlineDotsBoxesSize } from "@/hooks/useOnlineDotsBoxesSize";
import { useOnlineFirstPlayer } from "@/hooks/useOnlineFirstPlayer";
import { useOnlineRoom } from "@/hooks/useOnlineRoom";
import type { DotsBoxesOnlineState } from "@/lib/online/moves";
import { getOnlineResultReplayProps } from "@/lib/online/result-replay";
import {
  formatSeatLabel,
  formatWinnersWithNames,
  getSeatDisplayName,
} from "@/lib/online/player-labels";
import type { PlayMode } from "@/lib/online/types";
import { getPlayerFill } from "@/lib/player-colors";
import {
  DOTS_BOXES_SIZE_OPTIONS,
  drawDotsBoxesEdge,
  dotsBoxesWinners,
  edgeKey,
  initialDotsBoxes,
  type DotsBoxesSize,
  type DotsBoxesState,
  type Edge,
} from "@/lib/play/dots-and-boxes";

type LocalPhase = "setup" | "playing" | "game-over";

function edgeMidpoint(
  edge: Edge,
  rows: number,
  cols: number
): { x: number; y: number } {
  const unitX = 100 / cols;
  const unitY = 100 / rows;
  if (edge.kind === "h") {
    return {
      x: (edge.col + 0.5) * unitX,
      y: edge.row * unitY,
    };
  }
  return {
    x: edge.col * unitX,
    y: (edge.row + 0.5) * unitY,
  };
}

function DotsBoxesSizePicker({
  value,
  onChange,
  readOnly,
}: {
  value: DotsBoxesSize;
  onChange?: (size: DotsBoxesSize) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-center text-xs text-slate-400">盤面サイズ</p>
      {readOnly ? (
        <p className="text-center text-sm font-medium text-white">
          {value}×{value}
        </p>
      ) : (
        <div className="flex flex-wrap justify-center gap-2">
          {DOTS_BOXES_SIZE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onChange?.(option)}
              className={`min-w-14 px-4 py-2 ${setupPillClass(value === option)}`}
            >
              {option}×{option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const SETUP_DESCRIPTION =
  "点の辺に線を引き、完成した箱が多い方が勝ちです。箱を取れたらもう1本引けます。";

export function DotsAndBoxesGame() {
  const { recordLocalPlay, setPlayMode } = usePlayPage();
  const { onlineEnabled } = usePlayStats();
  const online = useOnlineRoom("dots-and-boxes");
  const { firstPlayer, onFirstPlayerChange } = useOnlineFirstPlayer(online);
  const { size: onlineSize, onSizeChange: onOnlineSizeChange } =
    useOnlineDotsBoxesSize(online);
  const [mode, setMode] = useState<PlayMode>("local");
  const [localPhase, setLocalPhase] = useState<LocalPhase>("setup");
  const [size, setSize] = useState<DotsBoxesSize>(4);
  const [state, setState] = useState<DotsBoxesState>(() => initialDotsBoxes(4));

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
    setState(initialDotsBoxes(size));
    setLocalPhase("playing");
  }, [recordLocalPlay, size]);

  const isOnline =
    online.phase === "playing" || online.phase === "finished";
  const onlineState = online.gameState as DotsBoxesOnlineState | null;

  const activeState: DotsBoxesState =
    isOnline && onlineState
      ? onlineState
      : state;
  const activePhase =
    isOnline && onlineState
      ? onlineState.phase
      : localPhase === "game-over"
        ? "game-over"
        : localPhase === "playing"
          ? "playing"
          : "setup";

  const draw = useCallback(
    (edge: Edge) => {
      if (isOnline) {
        if (!online.isMyTurn || activePhase !== "playing") return;
        void online.handleMove({
          type: "dots-boxes",
          kind: edge.kind,
          row: edge.row,
          col: edge.col,
        });
        return;
      }
      if (localPhase !== "playing" || state.over) return;
      const next = drawDotsBoxesEdge(state, edge);
      if (!next) return;
      setState(next);
      if (next.over) setLocalPhase("game-over");
    },
    [isOnline, online, activePhase, localPhase, state]
  );

  const winners = useMemo(() => {
    if (activePhase !== "game-over") return null;
    return dotsBoxesWinners(activeState.scores);
  }, [activePhase, activeState.scores]);

  const { rows, cols } = activeState;

  const horizontalEdges = useMemo(() => {
    const edges: Edge[] = [];
    for (let row = 0; row <= rows; row++) {
      for (let col = 0; col < cols; col++) {
        edges.push({ kind: "h", row, col });
      }
    }
    return edges;
  }, [rows, cols]);

  const verticalEdges = useMemo(() => {
    const edges: Edge[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col <= cols; col++) {
        edges.push({ kind: "v", row, col });
      }
    }
    return edges;
  }, [rows, cols]);

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

  const startParams = {
    firstPlayer,
    gameOptions: { size: onlineSize },
  };

  const hostLobbyExtra = (
    <>
      <DotsBoxesSizePicker
        value={onlineSize}
        onChange={online.isHost ? onOnlineSizeChange : undefined}
        readOnly={!online.isHost}
      />
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

  const sizeSelector = (
    <div className="mt-6">
      <DotsBoxesSizePicker value={size} onChange={setSize} />
    </div>
  );

  if (online.completingPendingJoin) {
    return <PendingJoinConnecting />;
  }

  if (localPhase === "setup" && online.phase === "idle") {
    return (
      <OnlineSetupPanel
        title="ドット・アンド・ボックス"
        description={`${size}×${size}の箱を囲みます。${SETUP_DESCRIPTION}`}
        mode={mode}
        onModeChange={setMode}
        onlineSupported={onlineEnabled}
        onCreateRoom={(displayName) =>
          online.handleCreate(displayName, { size })
        }
        onJoinRoom={online.handleJoin}
        onStartLocal={startLocal}
        loading={online.loading}
        initialJoinCode={online.joinCodeFromUrl}
        error={online.error}
        extra={sizeSelector}
        createExtra={sizeSelector}
      />
    );
  }

  if (online.phase === "waiting" && online.room) {
    return (
      <OnlineSetupPanel
        title="ドット・アンド・ボックス"
        description={`${onlineSize}×${onlineSize}の箱を囲みます。${SETUP_DESCRIPTION}`}
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

  const isGameOver = activePhase === "game-over" && winners !== null;
  const canInteract =
    (isOnline ? online.isMyTurn && !online.movePending : true) && !isGameOver;
  const totalBoxes = rows * cols;
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
          draw={winners.length > 1}
          winnersLabel={
            isOnline ? formatWinnersWithNames(roomPlayers, winners) : undefined
          }
          {...replayProps}
          replayExtra={
            isOnline && online.isHost ? (
              <>
                <DotsBoxesSizePicker
                  value={onlineSize}
                  onChange={onOnlineSizeChange}
                  readOnly={false}
                />
                <div className="mt-4">
                  <OnlineFirstPlayerPicker
                    players={online.players}
                    value={firstPlayer}
                    onChange={onFirstPlayerChange}
                  />
                </div>
              </>
            ) : undefined
          }
          onReplay={() => setLocalPhase("setup")}
          details={
            <ul className="space-y-1 text-slate-400">
              <li>
                {getSeatDisplayName(roomPlayers, 0)}: {activeState.scores[0]} 箱
              </li>
              <li>
                {getSeatDisplayName(roomPlayers, 1)}: {activeState.scores[1]} 箱
              </li>
            </ul>
          }
        />
      )}

      {!isGameOver && (
        <TurnBanner
          playerIndex={activeState.current}
          playerLabel={formatSeatLabel(roomPlayers, activeState.current)}
          action={
            isOnline && !online.isMyTurn
              ? "相手の手番です"
              : "線を1本引く"
          }
        />
      )}

      <p className="text-center text-xs text-slate-500">
        {rows}×{cols}（{totalBoxes}箱）
      </p>

      <div className="relative mx-auto aspect-square w-full max-w-md">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          {Array.from({ length: rows + 1 }, (_, row) =>
            Array.from({ length: cols + 1 }, (_, col) => (
              <circle
                key={`dot-${row}-${col}`}
                cx={(col * 100) / cols}
                cy={(row * 100) / rows}
                r="1.8"
                fill="#94a3b8"
              />
            ))
          )}

          {activeState.owners.map((owner, index) => {
            if (owner === null) return null;
            const row = Math.floor(index / cols);
            const col = index % cols;
            const x = ((col + 0.5) * 100) / cols;
            const y = ((row + 0.5) * 100) / rows;
            return (
              <text
                key={`box-${index}`}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={rows >= 5 ? "5" : "7"}
                fontWeight="700"
                fill={getPlayerFill(owner)}
              >
                {owner + 1}
              </text>
            );
          })}

          {horizontalEdges.map((edge) => {
            const { x, y } = edgeMidpoint(edge, rows, cols);
            const key = edgeKey(edge);
            const owner = activeState.edgeOwners[key];
            const drawn = owner !== undefined;
            return (
              <g key={key}>
                <line
                  x1={(edge.col * 100) / cols}
                  y1={(edge.row * 100) / rows}
                  x2={((edge.col + 1) * 100) / cols}
                  y2={(edge.row * 100) / rows}
                  stroke={drawn ? getPlayerFill(owner) : "transparent"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {!drawn ? (
                  <circle
                    cx={x}
                    cy={y}
                    r="6"
                    fill="transparent"
                    stroke="transparent"
                    className={canInteract ? "cursor-pointer" : ""}
                    onClick={() => canInteract && draw(edge)}
                  >
                    <title>横の線を引く</title>
                  </circle>
                ) : null}
              </g>
            );
          })}

          {verticalEdges.map((edge) => {
            const { x, y } = edgeMidpoint(edge, rows, cols);
            const key = edgeKey(edge);
            const owner = activeState.edgeOwners[key];
            const drawn = owner !== undefined;
            return (
              <g key={key}>
                <line
                  x1={(edge.col * 100) / cols}
                  y1={(edge.row * 100) / rows}
                  x2={(edge.col * 100) / cols}
                  y2={((edge.row + 1) * 100) / rows}
                  stroke={drawn ? getPlayerFill(owner) : "transparent"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {!drawn ? (
                  <circle
                    cx={x}
                    cy={y}
                    r="6"
                    fill="transparent"
                    stroke="transparent"
                    className={canInteract ? "cursor-pointer" : ""}
                    onClick={() => canInteract && draw(edge)}
                  >
                    <title>縦の線を引く</title>
                  </circle>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
