"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { OnlineFirstPlayerPicker } from "@/components/play/shared/OnlineFirstPlayerPicker";
import { OnlineSetupPanel } from "@/components/play/shared/OnlineSetupPanel";
import { PendingJoinConnecting } from "@/components/play/shared/PendingJoinConnecting";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { CpuDifficultyPicker } from "@/components/play/shared/CpuDifficultyPicker";
import { LocalCpuHumanSeatPicker } from "@/components/play/shared/LocalCpuHumanSeatPicker";
import {
  PlaySetupSection,
  setupPillClass,
} from "@/components/play/shared/PlaySetupCard";
import type { LocalMatchSetupKind } from "@/components/play/shared/PlayModeLocalMatchTabs";
import { usePlayStats } from "@/components/PlayStatsProvider";
import { useOnlineFirstPlayer } from "@/hooks/useOnlineFirstPlayer";
import { useOnlineRoom } from "@/hooks/useOnlineRoom";
import type { DejarikOnlineState } from "@/lib/online/moves";
import { getOnlineResultReplayProps } from "@/lib/online/result-replay";
import {
  formatSeatLabel,
  formatWinnersWithNames,
  getSeatDisplayName,
} from "@/lib/online/player-labels";
import type { PlayMode } from "@/lib/online/types";
import { DejarikBoard } from "@/components/play/dejarik/DejarikBoard";
import {
  CREATURE_LABEL,
  placementHomeCells,
  type CreatureType,
} from "@/lib/play/dejarik/board";
import { dejarikCellAtPoint } from "@/lib/play/dejarik/board-visual";
import {
  chooseMove,
  type CpuDifficulty,
  type DejarikCpuMove,
} from "@/lib/play/dejarik/ai";
import {
  applyDejarikAttack,
  applyDejarikMove,
  applyPlacement,
  endScoutTurn,
  initialDejarik,
  legalAttackTargets,
  legalMoveTargets,
  placementPlayer,
  secondPlayer,
  stallLabelForPlayer,
  type DejarikState,
  type Player,
} from "@/lib/play/dejarik/state";

type LocalPhase = "setup" | "active";
type MatchKind = "pvp" | "cpu";

const DESCRIPTION =
  "STAR WARSに登場するデジャリック（ホロチェス）を、ボドパッ！独自のルールで再現した2人用ゲーム。円形のホロ盤で4タイプのクリーチャーを動かし、相手をすべて除去します。";

function applyCpuMove(
  state: DejarikState,
  choice: DejarikCpuMove
): DejarikState | null {
  switch (choice.kind) {
    case "placement":
      return applyPlacement(state, choice.creatureType, choice.cell);
    case "move":
      return applyDejarikMove(state, choice.pieceId, choice.to);
    case "attack":
      return applyDejarikAttack(state, choice.pieceId, choice.to);
    case "endScoutTurn":
      return endScoutTurn(state);
    default:
      return null;
  }
}

function scoutContinuesTurn(state: DejarikState): boolean {
  const partial = state.scoutPartial;
  if (!partial) return false;
  return (
    (partial.didMove || partial.didAttack) &&
    !(partial.didMove && partial.didAttack)
  );
}

export function DejarikGame() {
  const { recordLocalPlay, setPlayMode } = usePlayPage();
  const { onlineEnabled } = usePlayStats();
  const online = useOnlineRoom("dejarik");
  const { firstPlayer, onFirstPlayerChange } = useOnlineFirstPlayer(online);
  const [mode, setMode] = useState<PlayMode>("local");
  const [localPhase, setLocalPhase] = useState<LocalPhase>("setup");
  const [matchKind, setMatchKind] = useState<MatchKind>("pvp");
  const [cpuDifficulty, setCpuDifficulty] = useState<CpuDifficulty>("normal");
  const [humanSeat, setHumanSeat] = useState<Player>(0);
  const [state, setState] = useState<DejarikState | null>(null);
  const [pieceSelection, setPieceSelection] = useState<{
    turnPlayer: number;
    pieceId: number;
  } | null>(null);
  const [placementType, setPlacementType] = useState<CreatureType | null>(null);
  const [placementHint, setPlacementHint] = useState<string | null>(null);
  const stateRef = useRef(state);

  const cpuSeat: Player = humanSeat === 0 ? 1 : 0;

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (
      online.room?.code &&
      (online.phase === "waiting" ||
        online.phase === "playing" ||
        online.phase === "finished")
    ) {
      setPlayMode({ mode: "online", roomCode: online.room.code });
    } else if (mode === "local" && localPhase === "active" && matchKind === "cpu") {
      setPlayMode({ mode: "cpu", humanSeat });
    } else if (mode === "local") {
      setPlayMode({ mode: "local" });
    }
  }, [
    online.room?.code,
    online.phase,
    mode,
    localPhase,
    matchKind,
    humanSeat,
    setPlayMode,
  ]);

  const startMatch = useCallback(
    (kind: LocalMatchSetupKind) => {
      recordLocalPlay();
      setMatchKind(kind);
      setPlayMode(
        kind === "cpu" ? { mode: "cpu", humanSeat } : { mode: "local" }
      );
      setState(initialDejarik());
      setPieceSelection(null);
      setPlacementType(null);
      setPlacementHint(null);
      setLocalPhase("active");
    },
    [recordLocalPlay, setPlayMode, humanSeat]
  );

  const isOnline =
    online.phase === "playing" || online.phase === "finished";
  const onlineState = online.gameState as DejarikOnlineState | null;
  const activeState = isOnline && onlineState ? onlineState : state;

  const placement = activeState?.phase === "placement";
  const playing = activeState?.phase === "playing";
  const gameOver = activeState?.phase === "game-over";

  const turnPlayer = activeState
    ? placement
      ? placementPlayer(activeState.placementStep, activeState.firstPlayer)
      : activeState.current
    : 0;

  const selectedPieceId =
    pieceSelection !== null && pieceSelection.turnPlayer === turnPlayer
      ? pieceSelection.pieceId
      : null;

  const scoutContinues = activeState ? scoutContinuesTurn(activeState) : false;

  const actingPieceId = useMemo(() => {
    if (!activeState) return null;
    if (scoutContinues && activeState.scoutPartial) {
      return selectedPieceId ?? activeState.scoutPartial.pieceId;
    }
    return selectedPieceId;
  }, [activeState, scoutContinues, selectedPieceId]);

  const humanTurn =
    isOnline || matchKind !== "cpu" || turnPlayer === humanSeat;

  const cpuThinking =
    !isOnline &&
    matchKind === "cpu" &&
    localPhase === "active" &&
    !gameOver &&
    turnPlayer === cpuSeat;

  const canInteract = !gameOver && (isOnline ? online.isMyTurn : humanTurn);

  useEffect(() => {
    if (isOnline || !cpuThinking) return;

    const delayMs =
      cpuDifficulty === "hard"
        ? 550 + Math.random() * 250
        : cpuDifficulty === "normal"
          ? 400 + Math.random() * 250
          : 300 + Math.random() * 200;

    const timer = window.setTimeout(() => {
      const snapshot = stateRef.current;
      if (!snapshot || snapshot.phase === "game-over") return;
      const actor =
        snapshot.phase === "placement"
          ? placementPlayer(snapshot.placementStep, snapshot.firstPlayer)
          : snapshot.current;
      if (actor !== cpuSeat) return;

      const choice = chooseMove(snapshot, cpuDifficulty, cpuSeat);
      if (!choice) return;
      const next = applyCpuMove(snapshot, choice);
      if (!next) return;
      setState(next);
      setPieceSelection(null);
      setPlacementType(null);
      setPlacementHint(null);
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [cpuThinking, cpuSeat, cpuDifficulty, state, isOnline]);

  const placementSecond = activeState
    ? secondPlayer(activeState.firstPlayer)
    : 1;

  const scoutEndVisible = useMemo(() => {
    if (!activeState?.scoutPartial || !playing || !canInteract) return false;
    return scoutContinuesTurn(activeState);
  }, [activeState, playing, canInteract]);

  const onCell = useCallback(
    (cell: number) => {
      if (!activeState || !canInteract) return;

      if (placement) {
        const player = placementPlayer(
          activeState.placementStep,
          activeState.firstPlayer
        );
        const homes = placementHomeCells(player);
        if (!placementType) {
          setPlacementHint("先に盤下で置く型を選んでください。");
          return;
        }
        if (!homes.includes(cell) || activeState.cells[cell] !== null) {
          setPlacementHint(
            "自分のホーム半円（光った外輪）の空きマスをタップしてください。"
          );
          return;
        }
        if (isOnline) {
          void online.handleMove({
            type: "dejarik-place",
            creature: placementType,
            cell,
          });
          setPlacementType(null);
          setPlacementHint(null);
          return;
        }
        const next = applyPlacement(activeState, placementType, cell);
        if (next) {
          setState(next);
          setPlacementType(null);
          setPlacementHint(null);
        }
        return;
      }

      if (!playing) return;

      const occupantId = activeState.cells[cell];

      if (actingPieceId !== null) {
        const attacks = legalAttackTargets(activeState, actingPieceId);
        const moves = legalMoveTargets(activeState, actingPieceId);
        if (attacks.includes(cell)) {
          if (isOnline) {
            void online.handleMove({
              type: "dejarik-attack",
              pieceId: actingPieceId,
              to: cell,
            });
            return;
          }
          const next = applyDejarikAttack(activeState, actingPieceId, cell);
          if (next) {
            setState(next);
            setPieceSelection(
              next.scoutPartial?.pieceId === actingPieceId
                ? { turnPlayer, pieceId: actingPieceId }
                : null
            );
          }
          return;
        }
        if (moves.includes(cell)) {
          if (isOnline) {
            void online.handleMove({
              type: "dejarik-move",
              pieceId: actingPieceId,
              to: cell,
            });
            return;
          }
          const next = applyDejarikMove(activeState, actingPieceId, cell);
          if (next) {
            setState(next);
            setPieceSelection(
              next.scoutPartial?.pieceId === actingPieceId
                ? { turnPlayer, pieceId: actingPieceId }
                : null
            );
          }
          return;
        }
      }

      if (occupantId === null) {
        setPieceSelection(null);
        return;
      }
      const piece = activeState.pieces[occupantId];
      if (!piece || piece.owner !== activeState.current) {
        setPieceSelection(null);
        return;
      }
      if (activeState.scoutPartial && activeState.scoutPartial.pieceId !== occupantId) {
        return;
      }
      setPieceSelection({ turnPlayer, pieceId: occupantId });
    },
    [
      activeState,
      canInteract,
      placement,
      playing,
      placementType,
      actingPieceId,
      turnPlayer,
      isOnline,
      online,
    ]
  );

  const onBoardPointer = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (!canInteract) return;
      const svg = event.currentTarget;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const { x, y } = point.matrixTransform(ctm.inverse());
      const cell = dejarikCellAtPoint(x, y);
      if (cell !== null) onCell(cell);
    },
    [onCell, canInteract]
  );

  const reset = useCallback(() => {
    online.reset();
    setLocalPhase("setup");
    setState(null);
    setPieceSelection(null);
    setPlacementType(null);
    setPlacementHint(null);
    setMode("local");
    setMatchKind("pvp");
    setPlayMode({ mode: "local" });
  }, [online.reset, setPlayMode]);

  const isSetupScreen =
    (localPhase === "setup" && online.phase === "idle") || online.phase === "waiting";
  usePlaySetupNavigation(isSetupScreen, reset);

  const highlightCells = new Set<number>();
  if (activeState) {
    if (placement && canInteract) {
      for (const c of placementHomeCells(turnPlayer)) {
        if (activeState.cells[c] === null) highlightCells.add(c);
      }
    } else if (playing && actingPieceId !== null && canInteract) {
      for (let c = 0; c < activeState.cells.length; c++) {
        if (activeState.cells[c] === actingPieceId) highlightCells.add(c);
      }
      for (const d of legalMoveTargets(activeState, actingPieceId)) {
        highlightCells.add(d);
      }
      for (const d of legalAttackTargets(activeState, actingPieceId)) {
        highlightCells.add(d);
      }
    }
  }

  const roomPlayers = isOnline ? online.players : [];

  const replayProps = getOnlineResultReplayProps(
    isOnline,
    online.isHost,
    () => online.handleRematch({ firstPlayer }),
    reset
  );

  const winDetails =
    gameOver && activeState?.winner !== null
      ? isOnline
        ? activeState!.winReason === "stall"
          ? `${getSeatDisplayName(roomPlayers, activeState!.winner!)} の勝ち（相手が残り1体のまま3手以内に取れませんでした）。`
          : `${getSeatDisplayName(roomPlayers, activeState!.winner!)} が相手のクリーチャーをすべて除去しました。`
        : activeState!.winReason === "stall"
          ? matchKind === "cpu" && activeState!.winner === humanSeat
            ? "あなたの勝ち（相手が残り1体のまま3手以内に取れませんでした）。"
            : matchKind === "cpu" && activeState!.winner === cpuSeat
              ? "CPUの勝ち（相手が残り1体のまま3手以内に取れませんでした）。"
              : `プレイヤー ${activeState!.winner! + 1} の勝ち（相手が残り1体のまま3手以内に取れませんでした）。`
          : matchKind === "cpu" && activeState!.winner === humanSeat
            ? "あなたが相手のクリーチャーをすべて除去しました。"
            : matchKind === "cpu" && activeState!.winner === cpuSeat
              ? "CPUがあなたのクリーチャーをすべて除去しました。"
              : `プレイヤー ${activeState!.winner! + 1} が相手のクリーチャーをすべて除去しました。`
      : null;

  if (online.completingPendingJoin) {
    return <PendingJoinConnecting />;
  }

  if (localPhase === "setup" && online.phase === "idle") {
    return (
      <OnlineSetupPanel
        title="デジャリック"
        description={DESCRIPTION}
        mode={mode}
        onModeChange={setMode}
        onlineSupported={onlineEnabled}
        onCreateRoom={(displayName) => online.handleCreate(displayName)}
        onJoinRoom={online.handleJoin}
        onStartLocal={startMatch}
        loading={online.loading}
        initialJoinCode={online.joinCodeFromUrl}
        error={online.error}
        extra={(kind) =>
          kind === "cpu" ? (
            <>
              <PlaySetupSection label="CPUの強さ">
                <CpuDifficultyPicker
                  value={cpuDifficulty}
                  onChange={setCpuDifficulty}
                />
              </PlaySetupSection>
              <LocalCpuHumanSeatPicker
                humanSeat={humanSeat}
                onHumanSeatChange={setHumanSeat}
              />
            </>
          ) : null
        }
      />
    );
  }

  if (online.phase === "waiting" && online.room) {
    return (
      <OnlineSetupPanel
        title="デジャリック"
        description={DESCRIPTION}
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

  if (!activeState) return null;

  const localPlayerLabel =
    matchKind === "cpu" && turnPlayer === cpuSeat
      ? "CPU"
      : matchKind === "cpu" && turnPlayer === humanSeat
        ? "あなた"
        : `プレイヤー ${turnPlayer + 1}`;

  const defaultPlayingAction =
    scoutEndVisible && selectedPieceId === null
      ? "スカウトをタップするか、光ったマスで続けて操作してください。"
      : actingPieceId === null
        ? "自分のクリーチャーをタップしてください。"
        : "光った空マスで移動、光った敵マスで攻撃してください。";

  const turnAction = isOnline
    ? !online.isMyTurn
      ? "相手の手番です"
      : placement
        ? "盤下で型を選び、光ったホーム半円の空きマスをタップしてください。"
        : defaultPlayingAction
    : cpuThinking
      ? "CPUの手番…"
      : undefined;

  return (
    <div className="space-y-6">
      {gameOver && activeState.winner !== null && (
        <ResultPanel
          variant="inline"
          winners={[activeState.winner]}
          winnersLabel={
            isOnline
              ? formatWinnersWithNames(roomPlayers, [activeState.winner])
              : undefined
          }
          details={
            winDetails ? <p className="text-slate-400">{winDetails}</p> : undefined
          }
          onReplay={isOnline ? undefined : () => startMatch(matchKind)}
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
        />
      )}

      {!gameOver && (
        <TurnBanner
          playerIndex={turnPlayer}
          playerLabel={
            isOnline
              ? formatSeatLabel(roomPlayers, turnPlayer)
              : localPlayerLabel
          }
          stats={
            placement
              ? `配置 ${activeState.placementStep + 1}/8 · 先攻は${
                  isOnline
                    ? formatSeatLabel(roomPlayers, activeState.firstPlayer)
                    : `プレイヤー ${activeState.firstPlayer + 1}`
                }`
              : [
                  isOnline
                    ? `先攻: ${formatSeatLabel(roomPlayers, activeState.firstPlayer)}`
                    : `先攻: プレイヤー ${activeState.firstPlayer + 1}`,
                  stallLabelForPlayer(activeState, turnPlayer),
                ]
                  .filter(Boolean)
                  .join(" · ")
          }
          action={
            turnAction ??
            (placement
              ? "盤下で型を選び、光ったホーム半円の空きマスをタップしてください。"
              : defaultPlayingAction)
          }
          notice={
            placement
              ? placementHint ??
                (activeState.placementStep === 0
                  ? isOnline
                    ? `配置は後攻の${formatSeatLabel(roomPlayers, placementSecond)} からです。`
                    : `配置は後攻のプレイヤー ${placementSecond + 1} からです。`
                  : undefined)
              : scoutEndVisible
                ? "スカウト：もう1操作できるか、盤下の「手番終了」を押してください。"
                : undefined
          }
        />
      )}

      <div
        className={[
          "mx-auto max-w-md rounded-full bg-gradient-to-b from-amber-950/40 to-black/60 p-3",
          !canInteract ? "pointer-events-none opacity-95" : "",
        ].join(" ")}
      >
        <DejarikBoard
          state={activeState}
          highlightCells={highlightCells}
          highlightPlayer={turnPlayer}
          selectedPieceId={canInteract ? actingPieceId : null}
          onPointerDown={onBoardPointer}
        />
        <p className="mt-2 text-center text-xs text-slate-500">
          クリーチャーは常に盤の中心を向きます。
        </p>
      </div>

      {!gameOver && placement && canInteract && (
        <div className="flex flex-wrap justify-center gap-2">
          <p className="w-full text-center text-xs text-slate-400">
            残り {activeState.unplaced[turnPlayer].length} 体。置く型を選んでください。
          </p>
          {activeState.unplaced[turnPlayer].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setPlacementType(type);
                setPlacementHint(null);
              }}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                placementType === type
                  ? "bg-accent/25 text-white ring-1 ring-accent/50"
                  : "bg-white/5 text-slate-300"
              }`}
            >
              {CREATURE_LABEL[type]}
            </button>
          ))}
        </div>
      )}

      {!gameOver && scoutEndVisible && (
        <div className="flex justify-center">
          <button
            type="button"
            className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
            onClick={() => {
              if (isOnline) {
                void online.handleMove({ type: "dejarik-scout-end" });
                setPieceSelection(null);
                return;
              }
              const next = endScoutTurn(activeState);
              if (next) {
                setState(next);
                setPieceSelection(null);
              }
            }}
          >
            手番終了
          </button>
        </div>
      )}
    </div>
  );
}
