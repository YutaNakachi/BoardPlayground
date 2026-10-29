"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DiceFace } from "@/components/play/shared/DiceFace";
import { OnlineFirstPlayerPicker } from "@/components/play/shared/OnlineFirstPlayerPicker";
import { OnlinePlayerCountPicker } from "@/components/play/shared/OnlinePlayerCountPicker";
import { OnlineSetupPanel } from "@/components/play/shared/OnlineSetupPanel";
import { PendingJoinConnecting } from "@/components/play/shared/PendingJoinConnecting";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { usePlayStats } from "@/components/PlayStatsProvider";
import { useOnlineFirstPlayer } from "@/hooks/useOnlineFirstPlayer";
import { useOnlineRoom } from "@/hooks/useOnlineRoom";
import {
  parsePlayerCount,
  type PlayerCountOption,
} from "@/lib/online/game-options";
import { getSeatDisplayName } from "@/lib/online/player-labels";
import type { LudoOnlineState } from "@/lib/online/moves";
import { getOnlineResultReplayProps } from "@/lib/online/result-replay";
import {
  formatSeatLabel,
  formatWinnersWithNames,
} from "@/lib/online/player-labels";
import type { PlayMode } from "@/lib/online/types";
import { getPlayerTurnStyle } from "@/lib/player-colors";
import {
  coordKey,
  LUDO_BASE_REGIONS,
  LUDO_DISPLAY_GRID,
  LUDO_DISPLAY_MARGIN,
  LUDO_GRID,
  LUDO_HOME,
  LUDO_HOME_ARROW,
  LUDO_HOME_ENTRY,
  LUDO_PATH,
  LUDO_START_ARROW,
  LUDO_STYLE_INDEX,
  LUDO_YARD,
  LUDO_YARD_BG,
  ludoStartCoord,
  type Coord,
} from "@/lib/play/ludo-board";
import {
  applyLudoMove,
  endLudoTurn,
  initialLudo,
  isLudoTokenFinished,
  ludoMoveAnimationSteps,
  ludoMoves,
  ludoTokenCoord,
  rollLudo,
  tryLudoTokenCoord,
  type LudoState,
  type LudoToken,
} from "@/lib/play/ludo";

const LUDO_STEP_MS = 130;

type Phase = "setup" | "playing" | "game-over";

type CellKind = "empty" | "base" | "path" | "home" | "center";

type CellInfo = {
  kind: CellKind;
  owner?: number;
  isStart?: boolean;
  isHomeEntry?: boolean;
  homeSlot?: number;
};

function ludoStyle(player: number) {
  const styleIndex = LUDO_STYLE_INDEX[player];
  return getPlayerTurnStyle(styleIndex ?? 0);
}

function buildCellMap(activePlayers: number[]) {
  const pathKeys = new Set(LUDO_PATH.map(coordKey));
  const homeMap = new Map<string, { player: number; slot: number }>();
  const startMap = new Map<string, number>();
  const homeEntryMap = new Map<string, number>();

  for (const p of activePlayers) {
    startMap.set(coordKey(ludoStartCoord(p)), p);
    homeEntryMap.set(coordKey(LUDO_HOME_ENTRY[p]), p);
    LUDO_HOME[p].forEach((coord, slot) => {
      homeMap.set(coordKey(coord), { player: p, slot });
    });
  }

  const baseMap = new Map<string, number>();
  for (const region of LUDO_BASE_REGIONS) {
    for (let r = region.rows[0]; r <= region.rows[1]; r++) {
      for (let c = region.cols[0]; c <= region.cols[1]; c++) {
        baseMap.set(coordKey({ r, c }), region.player);
      }
    }
  }

  return { pathKeys, homeMap, startMap, homeEntryMap, baseMap };
}

function cellInfo(
  r: number,
  c: number,
  pathKeys: Set<string>,
  homeMap: Map<string, { player: number; slot: number }>,
  startMap: Map<string, number>,
  homeEntryMap: Map<string, number>,
  baseMap: Map<string, number>
): CellInfo {
  const key = coordKey({ r, c });
  if (r >= 6 && r <= 8 && c >= 6 && c <= 8) return { kind: "center" };
  if (homeMap.has(key)) {
    const home = homeMap.get(key)!;
    return {
      kind: "home",
      owner: home.player,
      homeSlot: home.slot,
      isHomeEntry: homeEntryMap.has(key),
    };
  }
  if (startMap.has(key)) {
    return { kind: "path", owner: startMap.get(key), isStart: true };
  }
  if (pathKeys.has(key)) return { kind: "path" };
  if (baseMap.has(key)) return { kind: "base", owner: baseMap.get(key) };
  if (r >= 6 && r <= 8) return { kind: "path" };
  if (c >= 6 && c <= 8) return { kind: "path" };
  return { kind: "empty" };
}

function ArrowIcon({
  direction,
  className = "",
}: {
  direction: "right" | "down" | "left" | "up";
  className?: string;
}) {
  const rotation =
    direction === "right"
      ? "rotate-0"
      : direction === "down"
        ? "rotate-90"
        : direction === "left"
          ? "rotate-180"
          : "-rotate-90";
  return (
    <svg
      viewBox="0 0 12 12"
      className={`h-2.5 w-2.5 text-white ${rotation} ${className}`}
      aria-hidden
    >
      <path
        d="M2 6h6M6 3l3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function cellAppearance(info: CellInfo): string {
  if (info.kind === "center") return "bg-slate-800";
  if (info.owner == null) {
    if (info.kind === "path") return "bg-transparent";
    return "bg-transparent";
  }
  const style = ludoStyle(info.owner);
  if (info.isStart) {
    return `${style.surface} ring-2 ring-inset ${style.pieceRing}`;
  }
  if (info.kind === "home") {
    if (info.homeSlot === 4) return `${style.bg} ring-1 ring-inset ${style.pieceRing}`;
    if (info.homeSlot === 3) return `${style.surface}`;
    if (info.homeSlot === 2) return `${style.sectionBg}`;
    return `${style.sectionBg}/90`;
  }
  if (info.kind === "base") return LUDO_YARD_BG[info.owner];
  return "bg-transparent";
}

function tokensAt(tokens: LudoToken[], coord: Coord): LudoToken[] {
  const key = coordKey(coord);
  return tokens.filter((t) => {
    const c = tryLudoTokenCoord(t);
    return c != null && coordKey(c) === key;
  });
}

function tokenIndexIn(tokens: LudoToken[], token: LudoToken): number {
  return tokens.findIndex((t) => t.player === token.player && t.index === token.index);
}

function tokensByPlayer(tokens: LudoToken[]): [number, LudoToken[]][] {
  const map = new Map<number, LudoToken[]>();
  for (const t of tokens) {
    const group = map.get(t.player) ?? [];
    group.push(t);
    map.set(t.player, group);
  }
  return Array.from(map.entries());
}

function baseCornerRadius(player: number, r: number, c: number): string {
  if (player === 0 && r === 1 && c === 1) return "rounded-tl-[0.65rem]";
  if (player === 1 && r === 1 && c === 13) return "rounded-tr-[0.65rem]";
  if (player === 2 && r === 13 && c === 13) return "rounded-br-[0.65rem]";
  if (player === 3 && r === 13 && c === 1) return "rounded-bl-[0.65rem]";
  return "";
}

function centerTriangleClass(r: number, c: number): string | null {
  if (r === 6 && c === 6) return `${ludoStyle(0).piece} clip-triangle-tl`;
  if (r === 6 && c === 8) return `${ludoStyle(1).piece} clip-triangle-tr`;
  if (r === 8 && c === 8) return `${ludoStyle(2).piece} clip-triangle-br`;
  if (r === 8 && c === 6) return `${ludoStyle(3).piece} clip-triangle-bl`;
  return null;
}

export function LudoGame() {
  const { recordLocalPlay, setPlayMode } = usePlayPage();
  const { onlineEnabled } = usePlayStats();
  const online = useOnlineRoom("ludo");
  const { firstPlayer, onFirstPlayerChange, seatCount } =
    useOnlineFirstPlayer(online);
  const [mode, setMode] = useState<PlayMode>("local");
  const [onlinePlayerCount, setOnlinePlayerCount] =
    useState<PlayerCountOption>(2);
  const [localPhase, setLocalPhase] = useState<Phase>("setup");
  const [playerCount, setPlayerCount] = useState(2);
  const [localState, setLocalState] = useState<LudoState>(initialLudo(2));

  const isOnlinePlay =
    online.phase === "playing" || online.phase === "finished";
  const onlineState = online.gameState as LudoOnlineState | null;
  const isOnline = isOnlinePlay;
  const state: LudoState =
    isOnline && onlineState ? onlineState : localState;
  const phase: Phase =
    isOnline && onlineState
      ? onlineState.phase === "game-over" || online.phase === "finished"
        ? "game-over"
        : "playing"
      : localPhase;

  useEffect(() => {
    if (
      online.room?.code &&
      (online.phase === "waiting" || online.phase === "playing")
    ) {
      setPlayMode({ mode: "online", roomCode: online.room.code });
    }
  }, [online.room?.code, online.phase, setPlayMode]);

  const startGame = useCallback(() => {
    recordLocalPlay();
    setLocalState(initialLudo(playerCount));
    setLocalPhase("playing");
  }, [recordLocalPlay, playerCount]);

  const moves = useMemo(
    () =>
      phase === "playing" && (!isOnline || online.isMyTurn)
        ? ludoMoves(state)
        : [],
    [phase, state, isOnline, online.isMyTurn]
  );

  const cellMap = useMemo(
    () => buildCellMap(state.activePlayers),
    [state.activePlayers]
  );

  const [diceFace, setDiceFace] = useState(1);
  const [rollCycling, setRollCycling] = useState(false);
  const rollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const serverLastRollRef = useRef<number | null>(null);
  const [rollResultPending, setRollResultPending] = useState(false);
  const localMoveAnimRef = useRef(false);
  const ludoAnimVersionRef = useRef(online.version);
  const ludoSnapshotRef = useRef({
    tokens: state.tokens,
    current: state.current,
    lastRoll: state.lastRoll,
    turnDice: null as number | null,
  });
  const [animatingTokenIndex, setAnimatingTokenIndex] = useState<number | null>(null);
  const [animatingToken, setAnimatingToken] = useState<LudoToken | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAnimating = animatingTokenIndex !== null;

  const displayTokens = useMemo(() => {
    if (animatingTokenIndex === null || animatingToken === null) {
      return state.tokens;
    }
    if (
      animatingTokenIndex < 0 ||
      animatingTokenIndex >= state.tokens.length
    ) {
      return state.tokens;
    }
    return state.tokens.map((t, i) =>
      i === animatingTokenIndex ? animatingToken : t
    );
  }, [state.tokens, animatingTokenIndex, animatingToken]);

  useEffect(() => {
    return () => {
      if (rollTimerRef.current) clearInterval(rollTimerRef.current);
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, []);

  const currentSeat = state.activePlayers.indexOf(state.current);
  const onlineLudo = isOnline && onlineState ? onlineState : null;
  const syncedTurnDice =
    onlineLudo?.lastRoll ?? onlineLudo?.turnDice ?? null;

  const noMovesAfterRoll =
    state.lastRoll != null && moves.length === 0 && phase === "playing";

  const syncLudoSnapshot = useCallback(() => {
    ludoSnapshotRef.current = {
      tokens: state.tokens,
      current: state.current,
      lastRoll: state.lastRoll,
      turnDice: syncedTurnDice,
    };
  }, [state.tokens, state.current, state.lastRoll, syncedTurnDice]);

  const animateTokenMove = useCallback(
    (
      tokenIndex: number,
      fromToken: LudoToken,
      roll: number,
      onDone: () => void
    ) => {
      const steps = ludoMoveAnimationSteps(fromToken, roll);
      if (steps.length === 0) {
        onDone();
        return;
      }
      setAnimatingTokenIndex(tokenIndex);
      const showStep = (stepIndex: number) => {
        setAnimatingToken(steps[stepIndex]);
        if (stepIndex < steps.length - 1) {
          animTimerRef.current = setTimeout(
            () => showStep(stepIndex + 1),
            LUDO_STEP_MS
          );
        } else {
          animTimerRef.current = setTimeout(() => {
            setAnimatingTokenIndex(null);
            setAnimatingToken(null);
            onDone();
          }, LUDO_STEP_MS);
        }
      };
      showStep(0);
    },
    []
  );

  const clearRollInterval = useCallback(() => {
    if (rollTimerRef.current) {
      clearInterval(rollTimerRef.current);
      rollTimerRef.current = null;
    }
  }, []);

  const resetLudoVisualState = useCallback(() => {
    clearRollInterval();
    if (animTimerRef.current) {
      clearTimeout(animTimerRef.current);
      animTimerRef.current = null;
    }
    setAnimatingTokenIndex(null);
    setAnimatingToken(null);
    setRollCycling(false);
    setRollResultPending(false);
    localMoveAnimRef.current = false;
  }, [clearRollInterval]);

  const prevOnlineVersionRef = useRef(online.version);

  useEffect(() => {
    if (!isOnline) return;
    const prev = prevOnlineVersionRef.current;
    const next = online.version;
    prevOnlineVersionRef.current = next;
    const rematchReset = next === 1 && prev > 1;
    const tokenCountChanged =
      ludoSnapshotRef.current.tokens.length !== state.tokens.length;
    if (rematchReset || tokenCountChanged) {
      resetLudoVisualState();
      ludoAnimVersionRef.current = next;
      ludoSnapshotRef.current = {
        tokens: state.tokens,
        current: state.current,
        lastRoll: state.lastRoll,
        turnDice: syncedTurnDice,
      };
    }
  }, [
    isOnline,
    online.version,
    state.tokens,
    state.current,
    state.lastRoll,
    syncedTurnDice,
    resetLudoVisualState,
  ]);

  useEffect(() => {
    if (!isOnline || phase !== "playing") return;
    if (online.version === ludoAnimVersionRef.current) return;
    if (online.version === 1 && ludoAnimVersionRef.current > 1) {
      ludoAnimVersionRef.current = online.version;
      syncLudoSnapshot();
      return;
    }
    ludoAnimVersionRef.current = online.version;

    if (localMoveAnimRef.current || animatingTokenIndex !== null) {
      if (localMoveAnimRef.current) {
        localMoveAnimRef.current = false;
      }
      syncLudoSnapshot();
      return;
    }

    const snap = ludoSnapshotRef.current;
    const roll = snap.lastRoll ?? snap.turnDice;
    if (roll == null) {
      syncLudoSnapshot();
      return;
    }

    const mover = snap.current;
    let changedIndex = -1;
    for (let i = 0; i < state.tokens.length; i++) {
      const token = state.tokens[i];
      if (token.player !== mover) continue;
      const prev = snap.tokens[i];
      if (
        prev.zone !== token.zone ||
        prev.steps !== token.steps ||
        prev.index !== token.index
      ) {
        changedIndex = i;
        break;
      }
    }

    if (changedIndex < 0) {
      syncLudoSnapshot();
      return;
    }

    const fromToken = snap.tokens[changedIndex];
    if (!fromToken || !tryLudoTokenCoord(fromToken)) {
      syncLudoSnapshot();
      return;
    }
    localMoveAnimRef.current = true;
    animateTokenMove(changedIndex, fromToken, roll, () => {
      localMoveAnimRef.current = false;
      syncLudoSnapshot();
    });
  }, [
    isOnline,
    phase,
    online.version,
    state.tokens,
    animatingTokenIndex,
    animateTokenMove,
    syncLudoSnapshot,
  ]);

  const opponentAwaitingDice =
    isOnline &&
    !online.isMyTurn &&
    phase === "playing" &&
    state.lastRoll == null &&
    syncedTurnDice == null &&
    !rollCycling &&
    !rollResultPending;

  useEffect(() => {
    serverLastRollRef.current = state.lastRoll;
  }, [state.lastRoll]);

  const confirmedRoll = isOnline
    ? (state.lastRoll ?? syncedTurnDice)
    : state.lastRoll;
  const waitingRollResult =
    isOnline && rollResultPending && state.lastRoll == null;
  const diceAnimating = rollCycling || waitingRollResult;
  const rollInFlight = diceAnimating;
  const selfRolling = diceAnimating && (!isOnline || online.isMyTurn);
  const rolledDiceReady =
    !rollCycling && !rollResultPending && !diceAnimating;

  const movableTokenIds = useMemo(
    () =>
      rolledDiceReady
        ? new Set(moves.map((m) => m.tokenIndex))
        : new Set<number>(),
    [moves, rolledDiceReady]
  );

  const finishOnlineRollAnimation = useCallback(
    (face: number) => {
      clearRollInterval();
      setDiceFace(face);
      setRollCycling(false);
      setRollResultPending(false);
    },
    [clearRollInterval]
  );

  const onRoll = useCallback(() => {
    if (
      isAnimating ||
      rollInFlight ||
      state.lastRoll != null ||
      state.winner != null
    ) {
      return;
    }
    if (isOnline) {
      if (!online.isMyTurn || online.movePending) return;
      clearRollInterval();
      setRollCycling(true);
      setRollResultPending(false);
      let ticks = 0;
      let sent = false;
      rollTimerRef.current = setInterval(() => {
        const serverRoll = serverLastRollRef.current;
        if (sent && serverRoll != null) {
          finishOnlineRollAnimation(serverRoll);
          return;
        }
        ticks += 1;
        setDiceFace(Math.floor(Math.random() * 6) + 1);
        if (!sent && ticks >= 10) {
          sent = true;
          setRollResultPending(true);
          void online.handleMove({ type: "ludo-roll" });
        }
      }, 70);
      return;
    }

    setRollCycling(true);
    let ticks = 0;
    rollTimerRef.current = setInterval(() => {
      ticks += 1;
      setDiceFace(Math.floor(Math.random() * 6) + 1);
      if (ticks >= 10) {
        if (rollTimerRef.current) clearInterval(rollTimerRef.current);
        rollTimerRef.current = null;
        setRollCycling(false);
        setLocalState((s) => {
          const next = rollLudo(s);
          setDiceFace(next.lastRoll ?? 1);
          return next;
        });
      }
    }, 70);
  }, [
    isAnimating,
    rollInFlight,
    state.lastRoll,
    state.winner,
    isOnline,
    online,
    clearRollInterval,
    finishOnlineRollAnimation,
  ]);

  useEffect(() => {
    if (!isOnline || phase !== "playing") return;
    ludoAnimVersionRef.current = online.version;
    syncLudoSnapshot();
  }, [isOnline, phase, online.room?.id, syncLudoSnapshot]);

  const onToken = useCallback(
    (tokenIndex: number) => {
      if (isAnimating || rollCycling || rollResultPending) return;
      if (!moves.some((m) => m.tokenIndex === tokenIndex)) return;
      const roll = state.lastRoll;
      if (roll == null) return;

      const fromToken = state.tokens[tokenIndex];
      const finishLocal = () => {
        const next = applyLudoMove(state, { tokenIndex });
        if (next) setLocalState(next);
        if (next?.winner != null) setLocalPhase("game-over");
      };

      if (isOnline) {
        if (!online.isMyTurn || online.movePending) return;
        clearRollInterval();
        setRollCycling(false);
        setRollResultPending(false);
        localMoveAnimRef.current = true;
        animateTokenMove(tokenIndex, fromToken, roll, () => {
          syncLudoSnapshot();
          void online.handleMove({ type: "ludo-move", tokenIndex });
        });
        return;
      }

      animateTokenMove(tokenIndex, fromToken, roll, finishLocal);
    },
    [
      isAnimating,
      rollCycling,
      rollResultPending,
      moves,
      state,
      isOnline,
      online,
      animateTokenMove,
      syncLudoSnapshot,
      clearRollInterval,
    ]
  );

  const passTurn = useCallback(() => {
    if (isAnimating) return;
    if (isOnline) {
      if (!online.isMyTurn || online.movePending) return;
      clearRollInterval();
      setRollCycling(false);
      setRollResultPending(false);
      void online.handleMove({ type: "ludo-end-turn" });
      return;
    }
    setLocalState((s) => endLudoTurn(s));
  }, [isAnimating, isOnline, online, clearRollInterval]);

  const reset = useCallback(() => {
    online.reset();
    setLocalPhase("setup");
    setMode("local");
    setPlayMode({ mode: "local" });
  }, [online, setPlayMode]);

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
        title="ルドー"
        description="サイコロで6が出たらコマを出す。ぴったり止まって相手を戻し、4つすべてをゴールへ。"
        mode={mode}
        onModeChange={setMode}
        onlineSupported={onlineEnabled}
        onCreateRoom={(displayName) =>
          online.handleCreate(displayName, {
            playerCount: onlinePlayerCount,
            firstPlayer,
          })
        }
        onJoinRoom={online.handleJoin}
        onStartLocal={() => {
          setMode("local");
          startGame();
        }}
        loading={online.loading}
        error={online.error}
        initialJoinCode={online.joinCodeFromUrl}
        createExtra={
          <OnlinePlayerCountPicker
            value={onlinePlayerCount}
            options={[2, 3, 4]}
            onChange={setOnlinePlayerCount}
          />
        }
        extra={
          <OnlinePlayerCountPicker
            value={playerCount as PlayerCountOption}
            options={[2, 3, 4]}
            onChange={setPlayerCount}
          />
        }
      />
    );
  }

  if (online.phase === "waiting" && online.room) {
    const waitPlayerCount =
      parsePlayerCount(online.room.gameOptions) ?? online.maxPlayers;
    const waitActivePlayers = initialLudo(waitPlayerCount).activePlayers;
    const myWaitSeat = online.mySeat;
    const myWaitPlayer =
      myWaitSeat >= 0 ? waitActivePlayers[myWaitSeat] : undefined;
    const myWaitStyle =
      myWaitPlayer != null ? ludoStyle(myWaitPlayer) : null;

    return (
      <OnlineSetupPanel
        title="ルドー"
        description="サイコロで6が出たらコマを出す。ぴったり止まって相手を戻し、4つすべてをゴールへ。"
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
          maxPlayers: online.maxPlayers,
          isHost: online.isHost,
          onStart: () => online.handleStart({ firstPlayer }),
          canStart: online.canStart,
          extra: (
            <>
              {myWaitSeat >= 0 && myWaitStyle ? (
                <p className="flex items-center justify-center gap-2 text-sm text-slate-300">
                  <span
                    className={`inline-block h-5 w-5 shrink-0 rounded-full ring-2 ring-white/40 ${myWaitStyle.piece}`}
                    aria-hidden
                  />
                  あなた: 席 {myWaitSeat + 1}（
                  {formatSeatLabel(online.players, myWaitSeat)}）
                </p>
              ) : null}
              <OnlineFirstPlayerPicker
                key={`${online.room?.id ?? "room"}-${firstPlayer}`}
                players={online.players}
                value={firstPlayer}
                seatCount={seatCount}
                onChange={online.isHost ? onFirstPlayerChange : undefined}
                readOnly={!online.isHost}
              />
            </>
          ),
        }}
      />
    );
  }

  const displayDiceFace =
    diceAnimating ? diceFace : (confirmedRoll ?? diceFace);

  const tokenAriaLabel = (player: number, count: number) => {
    const seat = state.activePlayers.indexOf(player);
    const name = isOnline
      ? getSeatDisplayName(online.players, seat)
      : `プレイヤー ${seat + 1}`;
    return count > 1 ? `${name}のコマ ${count}個` : `${name}のコマ`;
  };

  const noMovablePiecesMessage = state.extraTurn
    ? "動かせるコマがありません（もう一度振れます）"
    : "動かせるコマがありません";

  const canShowRollButton =
    state.lastRoll == null &&
    !diceAnimating &&
    !isAnimating &&
    !noMovesAfterRoll &&
    (!isOnline || online.isMyTurn) &&
    !(isOnline && (online.movePending || waitingRollResult));

  const showDiceArea =
    diceAnimating ||
    confirmedRoll != null ||
    state.lastRoll != null;

  const isGameOver = phase === "game-over" && state.winner != null;
  const winners = isGameOver ? [state.winner!] : null;
  const winnerLabels =
    isOnline && isGameOver && winners
      ? formatWinnersWithNames(
          online.players,
          winners.map((w) => state.activePlayers.indexOf(w))
        )
      : null;
  const replayProps = getOnlineResultReplayProps(
    isOnline,
    online.isHost,
    () => online.handleRematch({ firstPlayer }),
    reset,
    online.rematchLoading
  );

  return (
    <div className="space-y-6">
      {isGameOver && winners && (
        <ResultPanel
          variant="inline"
          winners={winners}
          winnersLabel={winnerLabels ?? undefined}
          {...replayProps}
          replayExtra={
            isOnline ? (
              <OnlineFirstPlayerPicker
                key={`${online.room?.id ?? "room"}-${firstPlayer}`}
                players={online.players}
                value={firstPlayer}
                seatCount={seatCount}
                onChange={online.isHost ? onFirstPlayerChange : undefined}
                readOnly={!online.isHost}
              />
            ) : undefined
          }
          details={<p className="text-slate-400">4つのコマをすべてゴールしました。</p>}
        />
      )}

      {!isGameOver && (
        <TurnBanner
          playerIndex={
            isOnline && !online.roomSyncReady
              ? 0
              : LUDO_STYLE_INDEX[state.current]
          }
          playerLabel={
            isOnline && !online.roomSyncReady
              ? "…"
              : isOnline
                ? formatSeatLabel(
                    online.players,
                    state.activePlayers.indexOf(state.current)
                  )
                : `プレイヤー ${state.activePlayers.indexOf(state.current) + 1}`
          }
          action={
            isOnline && !online.roomSyncReady
              ? "盤面を同期しています…"
              : isOnline && online.moveError
                ? online.moveError
                : isOnline && !online.isMyTurn
              ? opponentAwaitingDice
                ? `${formatSeatLabel(online.players, currentSeat)}の番です（ダイス待ち）`
                : "相手の手番です"
              : selfRolling
                ? "サイコロを振っています"
                : !rolledDiceReady || state.lastRoll == null
                  ? "サイコロを振る"
                  : moves.length === 0
                    ? noMovablePiecesMessage
                    : "コマを選ぶ"
          }
        />
      )}

      {isOnline && online.mySeat >= 0 && !isGameOver ? (
        <p className="flex items-center justify-center gap-2 text-sm text-slate-400">
          <span
            className={`inline-block h-4 w-4 shrink-0 rounded-full ring-2 ring-white/30 ${ludoStyle(state.activePlayers[online.mySeat]).piece}`}
            aria-hidden
          />
          あなた: 席 {online.mySeat + 1}（
          {formatSeatLabel(online.players, online.mySeat)}）
        </p>
      ) : null}

      <div className="mx-auto w-full max-w-[min(100%,22rem)]">
        <div
          className="grid gap-0 rounded-2xl border border-amber-900/30 bg-amber-100/10 p-1.5 shadow-inner"
          style={{
            gridTemplateColumns: `repeat(${LUDO_DISPLAY_GRID}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: LUDO_DISPLAY_GRID * LUDO_DISPLAY_GRID }, (_, i) => {
            const r = Math.floor(i / LUDO_DISPLAY_GRID) + LUDO_DISPLAY_MARGIN;
            const c = (i % LUDO_DISPLAY_GRID) + LUDO_DISPLAY_MARGIN;
            const info = cellInfo(
              r,
              c,
              cellMap.pathKeys,
              cellMap.homeMap,
              cellMap.startMap,
              cellMap.homeEntryMap,
              cellMap.baseMap
            );
            const here = tokensAt(displayTokens, { r, c });
            const markerStyle =
              info.owner != null ? ludoStyle(info.owner) : null;
            const triangle = info.kind === "center" ? centerTriangleClass(r, c) : null;
            const isPathCircle =
              info.kind === "path" && !info.isStart && info.owner == null;
            const isHomeCircle = info.kind === "home";
            const yardKey = coordKey({ r, c });
            const isYardSpot = LUDO_YARD.some((yard) =>
              yard.some((spot) => coordKey(spot) === yardKey)
            );

            const baseRadius =
              info.kind === "base" && info.owner != null
                ? baseCornerRadius(info.owner, r, c)
                : "";

            return (
              <div
                key={`${r}-${c}`}
                className={`relative aspect-square ${cellAppearance(info)} ${baseRadius}`}
              >
                {triangle ? (
                  <div className={`absolute inset-0 ${triangle}`} />
                ) : null}

                {isPathCircle ? (
                  <span
                    className="pointer-events-none absolute inset-[18%] rounded-full border border-slate-400/40 bg-white/90 shadow-sm"
                    aria-hidden
                  />
                ) : null}

                {isHomeCircle && !here.length && markerStyle ? (
                  <span
                    className={`pointer-events-none absolute inset-[12%] rounded-full border border-white/25 ${cellAppearance(info)}`}
                    aria-hidden
                  />
                ) : null}

                {info.isStart && info.owner != null ? (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <ArrowIcon direction={LUDO_START_ARROW[info.owner]} />
                  </span>
                ) : null}

                {info.isHomeEntry && info.owner != null ? (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <ArrowIcon direction={LUDO_HOME_ARROW[info.owner]} />
                  </span>
                ) : null}

                {isYardSpot && !here.length ? (
                  <span
                    className="pointer-events-none absolute inset-[22%] rounded-full border border-white/30 bg-white/20"
                    aria-hidden
                  />
                ) : null}

                {tokensByPlayer(here).flatMap(([player, group]) => {
                  const tokenStyle = ludoStyle(player);
                  const onColoredCell = info.isStart || info.kind === "home";
                  const finished = group.filter((t) => {
                    const i = tokenIndexIn(state.tokens, t);
                    return i >= 0 && isLudoTokenFinished(state.tokens, i);
                  });
                  const active = group.filter((t) => {
                    const i = tokenIndexIn(state.tokens, t);
                    return i >= 0 && !isLudoTokenFinished(state.tokens, i);
                  });
                  const pieces: ReactNode[] = [];

                  for (const token of finished) {
                    pieces.push(
                      <span
                        key={`${player}-done-${token.index}`}
                        className={`pointer-events-none absolute inset-[14%] z-10 rounded-full opacity-90 ${tokenStyle.piece} ${
                          onColoredCell
                            ? "ring-2 ring-white/70 ring-offset-1 ring-offset-slate-950"
                            : tokenStyle.dotShadow
                        }`}
                        aria-label={`${tokenAriaLabel(player, 1)}（ゴール済み）`}
                      />
                    );
                  }

                  if (active.length === 0) return pieces;

                  const indices = active.map((t) => tokenIndexIn(state.tokens, t));
                  const tokenIndex =
                    indices.find((i) => movableTokenIds.has(i)) ?? indices[0];
                  const canMove = !isAnimating && movableTokenIds.has(tokenIndex);
                  const isMoving = tokenIndex === animatingTokenIndex;

                  pieces.push(
                    <button
                      key={`${player}-active-${active.map((t) => t.index).join("-")}`}
                      type="button"
                      onClick={() => onToken(tokenIndex)}
                      disabled={!canMove}
                      className={`absolute inset-[14%] z-10 rounded-full transition-transform duration-75 ${tokenStyle.piece} ${
                        isMoving
                          ? "z-20 scale-110 ring-2 ring-white ring-offset-1 ring-offset-slate-950"
                          : canMove
                            ? "ring-2 ring-lime-300 ring-offset-1 ring-offset-slate-950"
                            : onColoredCell
                              ? "ring-2 ring-white ring-offset-1 ring-offset-slate-950 shadow-[0_1px_4px_rgba(0,0,0,0.6)]"
                              : tokenStyle.dotShadow
                      }`}
                      aria-label={tokenAriaLabel(player, active.length)}
                    >
                      {active.length >= 2 ? (
                        <span
                          className="pointer-events-none flex h-full items-center justify-center text-[9px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                          aria-hidden
                        >
                          {active.length}
                        </span>
                      ) : null}
                    </button>
                  );

                  return pieces;
                })}
              </div>
            );
          })}
        </div>
      </div>

      {!isGameOver ? (
        <div className="flex flex-col items-center gap-3">
          {showDiceArea ? (
            <div className="flex flex-col items-center gap-2">
              <DiceFace
                value={displayDiceFace}
                size="lg"
                rolling={selfRolling}
              />
              {selfRolling ? (
                <p className="text-sm text-slate-400">振っています…</p>
              ) : null}
            </div>
          ) : null}

          {canShowRollButton ? (
            <button
              type="button"
              onClick={onRoll}
              disabled={isOnline && online.movePending}
              className="btn-game"
            >
              サイコロを振る
            </button>
          ) : null}

        </div>
      ) : null}

      {rolledDiceReady &&
      state.lastRoll != null &&
      moves.length === 0 &&
      !isGameOver &&
      !isAnimating &&
      (!isOnline || online.isMyTurn) ? (
        <div className="text-center">
          <button
            type="button"
            onClick={passTurn}
            disabled={isOnline && online.movePending}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm"
          >
            {state.extraTurn ? "もう一度振る" : "手番を終える"}
          </button>
        </div>
      ) : null}

    </div>
  );
}
