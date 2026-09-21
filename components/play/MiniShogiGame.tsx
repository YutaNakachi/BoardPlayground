"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { ShogiPieceTile } from "@/components/play/shared/ShogiPieceTile";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
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

type Phase = "setup" | "playing" | "game-over";

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
  const { recordLocalPlay } = usePlayPage();
  const [phase, setPhase] = useState<Phase>("setup");
  const [state, setState] = useState<MiniShogiState>(initialMiniShogiState);
  const [selected, setSelected] = useState<number | null>(null);
  const [dropPiece, setDropPiece] = useState<Droppable | null>(null);
  const [winner, setWinner] = useState<number | null>(null);
  const [endReason, setEndReason] = useState<string>("");
  const [pendingPromotion, setPendingPromotion] = useState<MiniShogiMove[] | null>(null);

  const startGame = useCallback(() => {
    recordLocalPlay();
    setState(initialMiniShogiState());
    setSelected(null);
    setDropPiece(null);
    setWinner(null);
    setEndReason("");
    setPendingPromotion(null);
    setPhase("playing");
  }, [recordLocalPlay]);

  const moves = useMemo(
    () => (phase === "playing" ? miniShogiMoves(state) : []),
    [phase, state]
  );

  const destinations = useMemo(() => {
    if (dropPiece) {
      return moves.filter((m) => m.kind === "drop" && m.piece === dropPiece);
    }
    if (selected == null) return [];
    return moves.filter((m) => m.kind === "move" && m.from === selected);
  }, [moves, selected, dropPiece]);

  const inCheck = useMemo(
    () => phase === "playing" && isMiniKingInCheck(state.board, state.current),
    [phase, state]
  );

  const finishIfNeeded = useCallback((next: MiniShogiState) => {
    const status = miniShogiStatus(next);
    if (status.kind !== "playing") {
      setWinner(status.winner);
      setEndReason(resultMessage(status));
      setPhase("game-over");
      return true;
    }
    return false;
  }, []);

  const apply = useCallback(
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

  const onSquare = useCallback(
    (index: number) => {
      if (phase !== "playing" || pendingPromotion) return;

      const destMoves = dropPiece
        ? destinations.filter((m) => m.to === index)
        : selected != null
          ? movesToSquare(moves, selected, index)
          : [];

      if (destMoves.length === 1) {
        apply(destMoves[0]);
        return;
      }
      if (destMoves.length === 2 && needsPromotionChoice(destMoves)) {
        setPendingPromotion(destMoves);
        return;
      }

      if (dropPiece) return;
      const piece = state.board[index];
      if (!piece || piece.player !== state.current) {
        setSelected(null);
        return;
      }
      if (!moves.some((m) => m.kind === "move" && m.from === index)) return;
      setSelected(index);
    },
    [phase, pendingPromotion, dropPiece, destinations, selected, moves, apply, state]
  );

  const onHandPiece = useCallback(
    (piece: Droppable) => {
      if (phase !== "playing") return;
      if (state.hands[state.current][piece] <= 0) return;
      setSelected(null);
      setPendingPromotion(null);
      setDropPiece((prev) => (prev === piece ? null : piece));
    },
    [phase, state]
  );

  if (phase === "setup") {
    return (
      <SetupPanel
        title="5五将棋"
        description="5×5の将棋です。敵陣の最奥段に入る・出るとき成れます。玉を詰めるか取れば勝ち。同一局面4回で後手勝ち。"
        playerCount={2}
        playerOptions={[2]}
        onPlayerCount={() => {}}
        onStart={startGame}
      />
    );
  }

  const isGameOver = phase === "game-over" && winner !== null;
  const winners = isGameOver ? [winner!] : null;
  const current = state.current;

  return (
    <div className="space-y-6">
      {!isGameOver && (
        <TurnBanner
          playerIndex={current}
          playerLabel={PLAYER_LABELS[current]}
          action={
            inCheck
              ? "王手"
              : dropPiece
                ? `${miniShogiHandLabel(dropPiece)}を打つ`
                : undefined
          }
        />
      )}

      <HandPanel
        playerIndex={1}
        hand={state.hands[1]}
        isCurrent={current === 1 && !isGameOver}
        dropPiece={dropPiece}
        onHandPiece={onHandPiece}
      />

      <div className="mx-auto grid max-w-xs grid-cols-5 gap-0.5 rounded-xl border border-surface-border bg-amber-900/30 p-1.5 sm:max-w-sm">
        {state.board.map((piece, index) => {
          const isDest = destinations.some((m) => m.to === index);
          const isFrom = selected === index;
          return (
            <button
              key={index}
              type="button"
              onClick={() => onSquare(index)}
              className={`relative flex aspect-square min-h-12 items-center justify-center rounded-sm bg-amber-100/90 sm:min-h-14 ${
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
        hand={state.hands[0]}
        isCurrent={current === 0 && !isGameOver}
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
                  if (move) apply(move);
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
                  if (move) apply(move);
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

      {isGameOver && winners && (
        <ResultPanel
          variant="inline"
          winners={winners}
          onReplay={() => setPhase("setup")}
          details={<p className="text-slate-400">{endReason}</p>}
        />
      )}
    </div>
  );
}
