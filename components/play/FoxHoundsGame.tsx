"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { OnlineHoundsSeatPicker } from "@/components/play/shared/OnlineHoundsSeatPicker";
import { OnlineSetupPanel } from "@/components/play/shared/OnlineSetupPanel";
import { PendingJoinConnecting } from "@/components/play/shared/PendingJoinConnecting";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { usePlayStats } from "@/components/PlayStatsProvider";
import { useOnlineHoundsSeat } from "@/hooks/useOnlineHoundsSeat";
import { useOnlineRoom } from "@/hooks/useOnlineRoom";
import {
  parseHoundsSeat,
  roleForSeat,
  seatForRole,
} from "@/lib/online/game-options";
import type { FoxHoundsOnlineState } from "@/lib/online/moves";
import { getOnlineResultReplayProps } from "@/lib/online/result-replay";
import {
  formatSeatLabel,
  formatWinnersWithNames,
} from "@/lib/online/player-labels";
import type { PlayMode } from "@/lib/online/types";
import {
  applyFoxHoundsMove,
  FH_BOARD_LINES,
  FH_HIT_RADIUS,
  FH_NODE_POS,
  FH_VIEW_BOX,
  foxHoundsHareDestinations,
  foxHoundsHoundDestinations,
  foxHoundsWinMessage,
  foxHoundsWinner,
  initialFoxHounds,
  type FoxHoundsState,
  type FoxHoundsWinReason,
  type Player,
} from "@/lib/play/fox-hounds";
import { useCallback, useEffect, useMemo, useState } from "react";

type LocalPhase = "setup" | "playing" | "game-over";

const PLAYER_LABELS = ["猟犬", "ウサギ"] as const;

const GAME_DESCRIPTION =
  "11点の専用盤で、猟犬3匹がウサギ1匹を囲い、ウサギは左端の列を目指します。猟犬が先手です。";

export function FoxHoundsGame() {
  const { recordLocalPlay, setPlayMode } = usePlayPage();
  const { onlineEnabled } = usePlayStats();
  const online = useOnlineRoom("fox-hounds");
  const { houndsSeat, onHoundsSeatChange } = useOnlineHoundsSeat(online);
  const [mode, setMode] = useState<PlayMode>("local");
  const [localPhase, setLocalPhase] = useState<LocalPhase>("setup");
  const [state, setState] = useState<FoxHoundsState>(() => initialFoxHounds());
  const [selected, setSelected] = useState<number | null>(null);
  const [localWinner, setLocalWinner] = useState<Player | null>(null);
  const [localWinReason, setLocalWinReason] = useState<FoxHoundsWinReason | null>(
    null
  );

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
    setState(initialFoxHounds());
    setSelected(null);
    setLocalWinner(null);
    setLocalWinReason(null);
    setLocalPhase("playing");
  }, [recordLocalPlay]);

  const isOnline =
    online.phase === "playing" || online.phase === "finished";
  const onlineState = online.gameState as FoxHoundsOnlineState | null;
  const activeHoundsSeat = isOnline
    ? parseHoundsSeat(online.room?.gameOptions)
    : 0;

  const activeBoard = isOnline && onlineState ? onlineState.board : state.board;
  const activeCurrent = isOnline && onlineState ? onlineState.current : state.current;
  const activeStallTurns =
    isOnline && onlineState ? onlineState.stallTurns : state.stallTurns;
  const activeWinner = isOnline && onlineState ? onlineState.winner : localWinner;
  const activeWinReason =
    isOnline && onlineState ? onlineState.winReason : localWinReason;
  const activePhase =
    isOnline && onlineState
      ? onlineState.phase
      : localPhase === "game-over"
        ? "game-over"
        : localPhase === "playing"
          ? "playing"
          : "setup";

  const activeSelected =
    isOnline && !online.isMyTurn ? null : selected;

  const myRole =
    isOnline && online.mySeat !== null
      ? roleForSeat(online.mySeat, activeHoundsSeat)
      : null;

  const destinations = useMemo(() => {
    if (activePhase !== "playing") return [];
    if (activeCurrent === 1) {
      return foxHoundsHareDestinations(activeBoard);
    }
    if (activeSelected === null || activeBoard[activeSelected] !== 0) return [];
    return foxHoundsHoundDestinations(activeBoard, activeSelected);
  }, [activePhase, activeBoard, activeCurrent, activeSelected]);

  const onNode = useCallback(
    (index: number) => {
      if (activePhase !== "playing") return;
      if (isOnline && !online.isMyTurn) return;

      const from =
        activeCurrent === 1 ? activeBoard.indexOf(1) : activeSelected;
      if (destinations.includes(index) && from !== null && from >= 0) {
        if (isOnline) {
          void online.handleMove({ type: "fox-hounds", from, to: index });
          setSelected(null);
          return;
        }
        const next = applyFoxHoundsMove(state, from, index);
        if (!next) return;
        setState(next);
        setSelected(null);
        const outcome = foxHoundsWinner(next, next.current);
        if (outcome) {
          setLocalWinner(outcome.winner);
          setLocalWinReason(outcome.reason);
          setLocalPhase("game-over");
        }
        return;
      }

      const piece = activeBoard[index];
      if (piece !== activeCurrent) {
        setSelected(null);
        return;
      }
      setSelected(index);
    },
    [
      activePhase,
      isOnline,
      online,
      destinations,
      activeSelected,
      state,
      activeBoard,
      activeCurrent,
    ]
  );

  const onBoardPointer = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (activePhase !== "playing") return;
      const svg = event.currentTarget;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;

      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const { x, y } = point.matrixTransform(ctm.inverse());

      let nearest = -1;
      let nearestDist = FH_HIT_RADIUS * FH_HIT_RADIUS;
      for (let node = 0; node < FH_NODE_POS.length; node++) {
        const pos = FH_NODE_POS[node];
        const dx = pos.x - x;
        const dy = pos.y - y;
        const dist = dx * dx + dy * dy;
        if (dist <= nearestDist) {
          nearestDist = dist;
          nearest = node;
        }
      }
      if (nearest >= 0) onNode(nearest);
    },
    [activePhase, onNode]
  );

  const hareFrom = activeBoard.indexOf(1);
  const roomPlayers = isOnline ? online.players : [];

  const reset = useCallback(() => {
    online.reset();
    setLocalPhase("setup");
    setMode("local");
    setSelected(null);
    setLocalWinner(null);
    setLocalWinReason(null);
    setPlayMode({ mode: "local" });
  }, [online.reset, setPlayMode]);

  const isSetupScreen =
    (localPhase === "setup" && online.phase === "idle") ||
    online.phase === "waiting";
  usePlaySetupNavigation(isSetupScreen, reset);

  if (online.completingPendingJoin) {
    return <PendingJoinConnecting />;
  }

  if (localPhase === "setup" && online.phase === "idle") {
    return (
      <OnlineSetupPanel
        title="ウサギと猟犬"
        description={GAME_DESCRIPTION}
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
        title="ウサギと猟犬"
        description={GAME_DESCRIPTION}
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
          onStart: () => online.handleStart({ gameOptions: { houndsSeat } }),
          canStart: online.players.length >= 2,
          extra: (
            <OnlineHoundsSeatPicker
              players={online.players}
              value={houndsSeat}
              onChange={online.isHost ? onHoundsSeatChange : undefined}
              readOnly={!online.isHost}
            />
          ),
        }}
      />
    );
  }

  const isGameOver = activePhase === "game-over" && activeWinner !== null;
  const winnerSeats =
    isGameOver && activeWinner !== null
      ? isOnline
        ? [seatForRole(activeWinner, activeHoundsSeat)]
        : [activeWinner]
      : null;

  const replayProps = getOnlineResultReplayProps(
    isOnline,
    online.isHost,
    () => online.handleRematch({ gameOptions: { houndsSeat } }),
    reset
  );

  const turnSeat =
    isOnline ? seatForRole(activeCurrent, activeHoundsSeat) : activeCurrent;

  return (
    <div className="space-y-6">
      {isGameOver && winnerSeats && activeWinner !== null && (
        <ResultPanel
          variant="inline"
          winners={winnerSeats}
          winnersLabel={
            isOnline
              ? formatWinnersWithNames(roomPlayers, winnerSeats)
              : undefined
          }
          {...replayProps}
          replayExtra={
            isOnline && online.isHost ? (
              <OnlineHoundsSeatPicker
                players={online.players}
                value={houndsSeat}
                onChange={onHoundsSeatChange}
              />
            ) : undefined
          }
          details={
            <p className="text-slate-400">
              {activeWinReason ? foxHoundsWinMessage(activeWinReason) : null}
            </p>
          }
        />
      )}

      {!isGameOver && (
        <TurnBanner
          playerIndex={turnSeat}
          playerLabel={
            isOnline
              ? formatSeatLabel(
                  roomPlayers,
                  turnSeat,
                  PLAYER_LABELS[activeCurrent]
                )
              : `プレイヤー ${activeCurrent + 1}（${PLAYER_LABELS[activeCurrent]}）`
          }
          stats={[
            isOnline && myRole !== null
              ? `あなたは${PLAYER_LABELS[myRole]}`
              : null,
            activeCurrent === 0 && activeStallTurns > 0
              ? `猟犬の停滞 ${activeStallTurns}/10 手（10手でウサギの勝ち）`
              : null,
          ]
            .filter(Boolean)
            .join(" · ") || undefined}
          action={
            isOnline && !online.isMyTurn ? "相手の手番です" : undefined
          }
        />
      )}

      <div
        className="relative mx-auto w-full max-w-xl sm:max-w-2xl"
        aria-label="ウサギと猟犬の盤面"
      >
        <svg
          viewBox={`${FH_VIEW_BOX.x} ${FH_VIEW_BOX.y} ${FH_VIEW_BOX.width} ${FH_VIEW_BOX.height}`}
          className="block h-auto w-full cursor-pointer touch-manipulation"
          aria-label="ウサギと猟犬の盤"
          onPointerDown={onBoardPointer}
        >
          <rect
            x={FH_VIEW_BOX.x}
            y={FH_VIEW_BOX.y}
            width={FH_VIEW_BOX.width}
            height={FH_VIEW_BOX.height}
            rx="8"
            fill="#0f172a"
            opacity="0.35"
          />

          {FH_BOARD_LINES.map(([from, to]) => {
            const a = FH_NODE_POS[from];
            const b = FH_NODE_POS[to];
            return (
              <line
                key={`${from}-${to}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#64748b"
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}

          {FH_NODE_POS.map((pos, index) => {
            const piece = activeBoard[index];
            const isDest = destinations.includes(index);
            const isSel =
              activeSelected === index ||
              (activeCurrent === 1 && index === hareFrom);
            const isHare = piece === 1;
            const isHound = piece === 0;

            return (
              <g key={index} className="pointer-events-none">
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isSel ? 7 : 6}
                  fill="#1e293b"
                  stroke={isSel ? "#a5b4fc" : isDest ? "#bef264" : "#94a3b8"}
                  strokeWidth={isSel || isDest ? 2 : 1.5}
                />
                {isDest && piece === null ? (
                  <circle cx={pos.x} cy={pos.y} r="2" fill="#bef264" />
                ) : null}
                {isHare ? (
                  <text
                    x={pos.x}
                    y={pos.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="9"
                    className="select-none"
                  >
                    🐇
                  </text>
                ) : null}
                {isHound ? (
                  <g transform={`translate(${pos.x} ${pos.y})`}>
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="8.5"
                      transform="scale(-1, 1)"
                      className="select-none"
                    >
                      🐕
                    </text>
                  </g>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      <p className="text-center text-xs text-slate-500">
        {isOnline
          ? "猟犬が先手（部屋で役割を決めます）"
          : "プレイヤー1＝猟犬（先手）／プレイヤー2＝ウサギ"}
      </p>
    </div>
  );
}
