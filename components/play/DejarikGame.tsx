"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { OnlineFirstPlayerPicker } from "@/components/play/shared/OnlineFirstPlayerPicker";
import { OnlineSetupPanel } from "@/components/play/shared/OnlineSetupPanel";
import { PendingJoinConnecting } from "@/components/play/shared/PendingJoinConnecting";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
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
} from "@/lib/play/dejarik/state";

type LocalPhase = "setup" | "active";

const DESCRIPTION =
  "スター・ウォーズに登場するデジャリック（ホロチェス）を、ボドパッ！独自のルールで再現した2人用ゲーム。円形のホロ盤で4タイプのクリーチャーを動かし、相手をすべて除去します。";

export function DejarikGame() {
  const { recordLocalPlay, setPlayMode } = usePlayPage();
  const { onlineEnabled } = usePlayStats();
  const online = useOnlineRoom("dejarik");
  const { firstPlayer, onFirstPlayerChange } = useOnlineFirstPlayer(online);
  const [mode, setMode] = useState<PlayMode>("local");
  const [localPhase, setLocalPhase] = useState<LocalPhase>("setup");
  const [state, setState] = useState<DejarikState | null>(null);
  const [pieceSelection, setPieceSelection] = useState<{
    turnPlayer: number;
    pieceId: number;
  } | null>(null);
  const [placementType, setPlacementType] = useState<CreatureType | null>(null);
  const [placementHint, setPlacementHint] = useState<string | null>(null);

  useEffect(() => {
    if (
      online.room?.code &&
      (online.phase === "waiting" ||
        online.phase === "playing" ||
        online.phase === "finished")
    ) {
      setPlayMode({ mode: "online", roomCode: online.room.code });
    } else if (mode === "local") {
      setPlayMode({ mode: "local" });
    }
  }, [online.room?.code, online.phase, mode, setPlayMode]);

  const startLocal = useCallback(() => {
    recordLocalPlay();
    setPlayMode({ mode: "local" });
    setState(initialDejarik());
    setPieceSelection(null);
    setPlacementType(null);
    setPlacementHint(null);
    setLocalPhase("active");
  }, [recordLocalPlay, setPlayMode]);

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

  const activeSelectedPieceId = useMemo(() => {
    if (isOnline && !online.isMyTurn) return null;
    if (activeState?.scoutPartial) return activeState.scoutPartial.pieceId;
    return selectedPieceId;
  }, [
    isOnline,
    online.isMyTurn,
    activeState?.scoutPartial,
    selectedPieceId,
  ]);

  const placementSecond = activeState
    ? secondPlayer(activeState.firstPlayer)
    : 1;

  const canInteract =
    !gameOver && (isOnline ? online.isMyTurn : true);

  const scoutEndVisible = useMemo(() => {
    if (!activeState?.scoutPartial || !playing) return false;
    const p = activeState.scoutPartial;
    return (p.didMove || p.didAttack) && !(p.didMove && p.didAttack);
  }, [activeState, playing]);

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

      const selected = activeSelectedPieceId;

      if (activeState.scoutPartial && selected !== activeState.scoutPartial.pieceId) {
        return;
      }

      const occupantId = activeState.cells[cell];

      if (selected !== null) {
        const attacks = legalAttackTargets(activeState, selected);
        const moves = legalMoveTargets(activeState, selected);
        if (attacks.includes(cell)) {
          if (isOnline) {
            void online.handleMove({
              type: "dejarik-attack",
              pieceId: selected,
              to: cell,
            });
            return;
          }
          const next = applyDejarikAttack(activeState, selected, cell);
          if (next) {
            setState(next);
            setPieceSelection(
              next.scoutPartial?.pieceId === selected
                ? { turnPlayer, pieceId: selected }
                : null
            );
          }
          return;
        }
        if (moves.includes(cell)) {
          if (isOnline) {
            void online.handleMove({
              type: "dejarik-move",
              pieceId: selected,
              to: cell,
            });
            return;
          }
          const next = applyDejarikMove(activeState, selected, cell);
          if (next) {
            setState(next);
            setPieceSelection(
              next.scoutPartial?.pieceId === selected
                ? { turnPlayer, pieceId: selected }
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
      activeSelectedPieceId,
      turnPlayer,
      isOnline,
      online,
    ]
  );

  const onBoardPointer = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
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
    [onCell]
  );

  const reset = useCallback(() => {
    online.reset();
    setLocalPhase("setup");
    setState(null);
    setPieceSelection(null);
    setPlacementType(null);
    setPlacementHint(null);
    setMode("local");
    setPlayMode({ mode: "local" });
  }, [online.reset, setPlayMode]);

  const isSetupScreen =
    (localPhase === "setup" && online.phase === "idle") || online.phase === "waiting";
  usePlaySetupNavigation(isSetupScreen, reset);

  const highlightCells = new Set<number>();
  if (activeState) {
    if (placement) {
      for (const c of placementHomeCells(turnPlayer)) {
        if (activeState.cells[c] === null) highlightCells.add(c);
      }
    } else if (playing && activeSelectedPieceId !== null && canInteract) {
      for (let c = 0; c < activeState.cells.length; c++) {
        if (activeState.cells[c] === activeSelectedPieceId) highlightCells.add(c);
      }
      for (const d of legalMoveTargets(activeState, activeSelectedPieceId)) {
        highlightCells.add(d);
      }
      for (const d of legalAttackTargets(activeState, activeSelectedPieceId)) {
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
          ? `プレイヤー ${activeState!.winner! + 1} の勝ち（相手が残り1体のまま3手以内に取れませんでした）。`
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

  if (!activeState) return null;

  const turnAction = isOnline
    ? !online.isMyTurn
      ? "相手の手番です"
      : placement
        ? "盤下で型を選び、光ったホーム半円の空きマスをタップしてください。"
        : activeSelectedPieceId === null
          ? "自分のクリーチャーをタップしてください。"
          : "光った空マスで移動、光った敵マスで攻撃してください。"
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
          onReplay={isOnline ? undefined : startLocal}
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
              : `プレイヤー ${turnPlayer + 1}`
          }
          stats={
            placement
              ? `配置 ${activeState.placementStep + 1}/8 · 先攻は${
                  isOnline
                    ? formatSeatLabel(roomPlayers, activeState.firstPlayer)
                    : `プレイヤー ${activeState.firstPlayer + 1}`
                }`
              : [
                  `先攻: プレイヤー ${activeState.firstPlayer + 1}`,
                  stallLabelForPlayer(activeState, turnPlayer),
                ]
                  .filter(Boolean)
                  .join(" · ")
          }
          action={
            turnAction ??
            (placement
              ? "盤下で型を選び、光ったホーム半円の空きマスをタップしてください。"
              : activeSelectedPieceId === null
                ? "自分のクリーチャーをタップしてください。"
                : "光った空マスで移動、光った敵マスで攻撃してください。")
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

      <div className="mx-auto max-w-md rounded-full bg-gradient-to-b from-amber-950/40 to-black/60 p-3">
        <DejarikBoard
          state={activeState}
          highlightCells={highlightCells}
          highlightPlayer={turnPlayer}
          selectedPieceId={canInteract ? activeSelectedPieceId : null}
          onPointerDown={canInteract ? onBoardPointer : () => {}}
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

      {!gameOver && scoutEndVisible && canInteract && (
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
