"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { OnlineFirstPlayerPicker } from "@/components/play/shared/OnlineFirstPlayerPicker";
import { OnlineSetupPanel } from "@/components/play/shared/OnlineSetupPanel";
import { PendingJoinConnecting } from "@/components/play/shared/PendingJoinConnecting";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { ShogiPieceTile } from "@/components/play/shared/ShogiPieceTile";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { usePlayStats } from "@/components/PlayStatsProvider";
import { useOnlineFirstPlayer } from "@/hooks/useOnlineFirstPlayer";
import { useOnlineRoom } from "@/hooks/useOnlineRoom";
import { getOnlineResultReplayProps } from "@/lib/online/result-replay";
import type { MiniShogiOnlineState } from "@/lib/online/moves";
import {
  formatSeatLabel,
  formatWinnersWithNames,
} from "@/lib/online/player-labels";
import type { PlayMode } from "@/lib/online/types";
import { getPlayerTurnStyle } from "@/lib/player-colors";
import {
  applyMiniShogiMove,
  isMiniKingInCheck,
  miniShogiHandLabel,
  miniShogiMoves,
  miniShogiPieceLabel,
  miniShogiStatus,
  movesToSquare,
  needsPromotionChoice,
  initialMiniShogiState,
  type Droppable,
  type MiniShogiMove,
  type MiniShogiState,
  type MiniShogiStatus,
} from "@/lib/play/mini-shogi";

type LocalPhase = "setup" | "playing" | "game-over";

const SETUP_DESCRIPTION =
  "5×5の将棋です。敵陣の最奥段に入る・出るとき成れます。玉を詰めるか取れば勝ち。同一局面4回で後手勝ち。";

const PLAYER_LABELS = ["先手（▲）", "後手（▽）"] as const;

function resultMessage(status: MiniShogiStatus): string {
  switch (status.kind) {
    case "checkmate":
      return "王手のまま合法手がなくなりました（詰み）。";
    case "king-captured":
      return "玉を取りました。";
    case "repetition":
      return "同一局面が4回出現したため、後手の勝ちです（千日手）。";
    default:
      return "";
  }
}

function endReasonFromWinner(
  state: MiniShogiState,
  winner: number
): string {
  const status = miniShogiStatus(state);
  if (status.kind !== "playing") return resultMessage(status);
  return winner === 0 ? "先手の勝ちです。" : "後手の勝ちです。";
}

function HandPanel({
  playerIndex,
  hand,
  isCurrent,
  dropPiece,
  onHandPiece,
}: {
  playerIndex: number;
  hand: Record<Droppable, number>;
  isCurrent: boolean;
  dropPiece: Droppable | null;
  onHandPiece: (piece: Droppable) => void;
}) {
  const droppables = (Object.keys(hand) as Droppable[]).filter((p) => hand[p] > 0);
  const style = getPlayerTurnStyle(playerIndex);

  return (
    <section
      className={`rounded-xl border p-3 ${
        isCurrent
          ? `${style.sectionBorder} ${style.sectionBg}`
          : "border-surface-border bg-surface-raised opacity-80"
      }`}
    >
      <h3 className="mb-2 text-sm font-medium text-slate-400">
        持ち駒（{PLAYER_LABELS[playerIndex]}）
      </h3>
      <div className="flex flex-wrap gap-2">
        {droppables.length === 0 ? (
          <span className="text-sm text-slate-600">なし</span>
        ) : (
          droppables.map((piece) => {
            const active = isCurrent && dropPiece === piece;
            return (
              <button
                key={piece}
                type="button"
                disabled={!isCurrent}
                onClick={() => onHandPiece(piece)}
                className={`flex items-center gap-1 rounded-lg border px-2 py-1 ${
                  active
                    ? `ring-1 ${style.sectionRing} ${style.sectionBorder}`
                    : "border-surface-border bg-surface"
                } ${!isCurrent ? "cursor-default" : ""}`}
              >
                <ShogiPieceTile
                  label={miniShogiHandLabel(piece)}
                  player={playerIndex as 0 | 1}
                  size="hand"
                />
                <span className="text-sm font-medium text-slate-300">×{hand[piece]}</span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

export function MiniShogiGame() {
  const { recordLocalPlay, setPlayMode } = usePlayPage();
  const { onlineEnabled } = usePlayStats();
  const online = useOnlineRoom("mini-shogi");
  const { firstPlayer, onFirstPlayerChange } = useOnlineFirstPlayer(online);
  const [mode, setMode] = useState<PlayMode>("local");
  const [localPhase, setLocalPhase] = useState<LocalPhase>("setup");
  const [state, setState] = useState<MiniShogiState>(initialMiniShogiState);
  const [selected, setSelected] = useState<number | null>(null);
  const [dropPiece, setDropPiece] = useState<Droppable | null>(null);
  const [localWinner, setLocalWinner] = useState<number | null>(null);
  const [endReason, setEndReason] = useState<string>("");
  const [pendingPromotion, setPendingPromotion] = useState<MiniShogiMove[] | null>(null);

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
    setState(initialMiniShogiState());
    setSelected(null);
    setDropPiece(null);
    setLocalWinner(null);
    setEndReason("");
    setPendingPromotion(null);
    setLocalPhase("playing");
  }, [recordLocalPlay]);

  const isOnline =
    online.phase === "playing" || online.phase === "finished";
  const onlineState = online.gameState as MiniShogiOnlineState | null;

  const activePhase =
    isOnline && onlineState
      ? onlineState.phase
      : localPhase === "game-over"
        ? "game-over"
        : localPhase === "playing"
          ? "playing"
          : "setup";
  const activeWinner =
    isOnline && onlineState ? onlineState.winner : localWinner;

  const boardState: MiniShogiState =
    isOnline && onlineState
      ? onlineState
      : state;

  const moves = useMemo(
    () =>
      activePhase === "playing"
        ? miniShogiMoves(boardState)
        : [],
    [activePhase, boardState]
  );

  const destinations = useMemo(() => {
    if (dropPiece) {
      return moves.filter((m) => m.kind === "drop" && m.piece === dropPiece);
    }
    if (selected == null) return [];
    return moves.filter((m) => m.kind === "move" && m.from === selected);
  }, [moves, selected, dropPiece]);

  const inCheck = useMemo(
    () => activePhase === "playing" && isMiniKingInCheck(boardState.board, boardState.current),
    [activePhase, boardState]
  );

  const finishIfNeeded = useCallback((next: MiniShogiState) => {
    const status = miniShogiStatus(next);
    if (status.kind !== "playing") {
      setLocalWinner(status.winner);
      setEndReason(resultMessage(status));
      setLocalPhase("game-over");
      return true;
    }
    return false;
  }, []);

  const applyLocal = useCallback(
    (move: MiniShogiMove) => {
      const next = applyMiniShogiMove(state, move);
      setState(next);
      setSelected(null);
      setDropPiece(null);
      setPendingPromotion(null);
      finishIfNeeded(next);
    },
    [state, finishIfNeeded]
  );

  const applyMove = useCallback(
    (move: MiniShogiMove) => {
      if (isOnline) {
        void online.handleMove({ type: "mini-shogi", move });
        setSelected(null);
        setDropPiece(null);
        setPendingPromotion(null);
        return;
      }
      applyLocal(move);
    },
    [isOnline, online, applyLocal]
  );

  const onSquare = useCallback(
    (index: number) => {
      if (activePhase !== "playing" || pendingPromotion) return;
      if (isOnline && !online.isMyTurn) return;

      const destMoves = dropPiece
        ? destinations.filter((m) => m.to === index)
        : selected != null
          ? movesToSquare(moves, selected, index)
          : [];

      if (destMoves.length === 1) {
        applyMove(destMoves[0]);
        return;
      }
      if (destMoves.length === 2 && needsPromotionChoice(destMoves)) {
        setPendingPromotion(destMoves);
        return;
      }

      const piece = boardState.board[index];
      if (piece && piece.player === boardState.current) {
        if (moves.some((m) => m.kind === "move" && m.from === index)) {
          setDropPiece(null);
          setPendingPromotion(null);
          setSelected(index);
        }
        return;
      }

      setSelected(null);
      setDropPiece(null);
      setPendingPromotion(null);
    },
    [
      activePhase,
      pendingPromotion,
      isOnline,
      online.isMyTurn,
      dropPiece,
      destinations,
      selected,
      moves,
      applyMove,
      boardState,
    ]
  );

  const onHandPiece = useCallback(
    (piece: Droppable) => {
      if (activePhase !== "playing") return;
      if (isOnline && !online.isMyTurn) return;
      if (boardState.hands[boardState.current][piece] <= 0) return;
      setSelected(null);
      setPendingPromotion(null);
      setDropPiece((prev) => (prev === piece ? null : piece));
    },
    [activePhase, isOnline, online.isMyTurn, boardState]
  );

  const roomPlayers = isOnline ? online.players : [];

  const reset = useCallback(() => {
    online.reset();
    setLocalPhase("setup");
    setMode("local");
    setSelected(null);
    setDropPiece(null);
    setLocalWinner(null);
    setEndReason("");
    setPendingPromotion(null);
    setPlayMode({ mode: "local" });
  }, [online.reset, setPlayMode]);

  const isSetupScreen =
    (localPhase === "setup" && online.phase === "idle") || online.phase === "waiting";
  usePlaySetupNavigation(isSetupScreen, reset);

  if (online.completingPendingJoin) {
    return <PendingJoinConnecting />;
  }

  if (localPhase === "setup" && online.phase === "idle") {
    return (
      <OnlineSetupPanel
        title="5五将棋"
        description={SETUP_DESCRIPTION}
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
        title="5五将棋"
        description={SETUP_DESCRIPTION}
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
  const winners = isGameOver ? [activeWinner!] : null;
  const current = boardState.current;
  const canInteract = !isOnline || online.isMyTurn;

  const replayProps = getOnlineResultReplayProps(
    isOnline,
    online.isHost,
    () => online.handleRematch({ firstPlayer }),
    reset
  );

  const displayEndReason =
    isOnline && onlineState && activeWinner !== null
      ? endReasonFromWinner(onlineState, activeWinner)
      : endReason;

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
          details={<p className="text-slate-400">{displayEndReason}</p>}
        />
      )}

      {!isGameOver && (
        <TurnBanner
          playerIndex={current}
          playerLabel={
            isOnline
              ? formatSeatLabel(roomPlayers, current, PLAYER_LABELS[current])
              : PLAYER_LABELS[current]
          }
          action={
            isOnline && !online.isMyTurn
              ? "相手の手番です"
              : inCheck
                ? "王手"
                : dropPiece
                  ? `${miniShogiHandLabel(dropPiece)}を打つ`
                  : undefined
          }
        />
      )}

      <HandPanel
        playerIndex={1}
        hand={boardState.hands[1]}
        isCurrent={current === 1 && !isGameOver && canInteract}
        dropPiece={dropPiece}
        onHandPiece={onHandPiece}
      />

      <div className="mx-auto grid max-w-xs grid-cols-5 gap-0.5 rounded-xl border border-surface-border bg-amber-900/30 p-1.5 sm:max-w-sm">
        {boardState.board.map((piece, index) => {
          const isDest = destinations.some((m) => m.to === index);
          const isFrom = selected === index;
          return (
            <button
              key={index}
              type="button"
              onClick={() => onSquare(index)}
              className={`relative flex aspect-square min-h-[3.25rem] items-center justify-center rounded-sm bg-amber-100/90 sm:min-h-16 ${
                isFrom ? "ring-2 ring-inset ring-accent" : ""
              } ${isDest ? "ring-2 ring-inset ring-lime-400" : ""}`}
              aria-label={piece ? miniShogiPieceLabel(piece) : isDest ? "移動先" : "空マス"}
            >
              {piece ? (
                <ShogiPieceTile
                  label={miniShogiPieceLabel(piece)}
                  player={piece.player}
                  promoted={piece.promoted && piece.type !== "K" && piece.type !== "G"}
                />
              ) : isDest ? (
                <span className="h-2 w-2 rounded-full bg-lime-500/80" />
              ) : null}
            </button>
          );
        })}
      </div>

      <HandPanel
        playerIndex={0}
        hand={boardState.hands[0]}
        isCurrent={current === 0 && !isGameOver && canInteract}
        dropPiece={dropPiece}
        onHandPiece={onHandPiece}
      />

      {pendingPromotion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="promotion-title"
        >
          <div className="w-full max-w-xs rounded-xl border border-surface-border bg-surface-raised p-5 shadow-xl">
            <h3 id="promotion-title" className="mb-4 text-center text-lg font-semibold text-slate-100">
              成りますか？
            </h3>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  const move = pendingPromotion.find(
                    (m) => m.kind === "move" && m.promote
                  );
                  if (move) applyMove(move);
                }}
                className="flex-1 rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white hover:bg-accent/90"
              >
                成る
              </button>
              <button
                type="button"
                onClick={() => {
                  const move = pendingPromotion.find(
                    (m) => m.kind === "move" && !m.promote
                  );
                  if (move) applyMove(move);
                }}
                className="flex-1 rounded-lg border border-surface-border bg-surface px-4 py-3 text-sm font-medium text-slate-200 hover:bg-surface-border/30"
              >
                成らない
              </button>
            </div>
            <button
              type="button"
              onClick={() => setPendingPromotion(null)}
              className="mt-3 w-full text-center text-xs text-slate-500 hover:text-slate-400"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
