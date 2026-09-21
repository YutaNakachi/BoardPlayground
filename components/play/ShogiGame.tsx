"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { getPlayerTurnStyle } from "@/lib/player-colors";
import {
  applyShogiMove,
  initialShogiState,
  isShogiKingInCheck,
  shogiHandLabel,
  shogiMoves,
  shogiPieceLabel,
  shogiStatus,
  type Droppable,
  type ShogiMove,
  type ShogiState,
} from "@/lib/play/shogi";

type Phase = "setup" | "playing" | "game-over";

export function ShogiGame() {
  const { recordLocalPlay } = usePlayPage();
  const [phase, setPhase] = useState<Phase>("setup");
  const [state, setState] = useState<ShogiState>(initialShogiState);
  const [selected, setSelected] = useState<number | null>(null);
  const [dropPiece, setDropPiece] = useState<Droppable | null>(null);
  const [winner, setWinner] = useState<number | null>(null);

  const startGame = useCallback(() => {
    recordLocalPlay();
    setState(initialShogiState());
    setSelected(null);
    setDropPiece(null);
    setWinner(null);
    setPhase("playing");
  }, [recordLocalPlay]);

  const moves = useMemo(
    () => (phase === "playing" ? shogiMoves(state) : []),
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
    () => phase === "playing" && isShogiKingInCheck(state.board, state.current),
    [phase, state]
  );

  const finishIfNeeded = useCallback((next: ShogiState) => {
    const status = shogiStatus(next);
    if (status.kind === "checkmate") {
      setWinner(status.winner);
      setPhase("game-over");
      return true;
    }
    return false;
  }, []);

  const apply = useCallback(
    (move: ShogiMove) => {
      const next = applyShogiMove(state, move);
      setState(next);
      setSelected(null);
      setDropPiece(null);
      finishIfNeeded(next);
    },
    [state, finishIfNeeded]
  );

  const onSquare = useCallback(
    (index: number) => {
      if (phase !== "playing") return;
      const dest = destinations.find((m) => m.to === index);
      if (dest) {
        apply(dest);
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
    [phase, destinations, apply, dropPiece, state, moves]
  );

  const onHandPiece = useCallback(
    (piece: Droppable) => {
      if (phase !== "playing") return;
      if (state.hands[state.current][piece] <= 0) return;
      setSelected(null);
      setDropPiece((prev) => (prev === piece ? null : piece));
    },
    [phase, state]
  );

  const backToSetup = useCallback(() => setPhase("setup"), []);
  usePlaySetupNavigation(phase === "setup", backToSetup);

  if (phase === "setup") {
    return (
      <SetupPanel
        title="将棋"
        description="9×9の本将棋です。持ち駒の打ち込みと成りに対応。敵陣に入った駒は自動で成ります。"
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
  const hand = state.hands[current];
  const droppables = (Object.keys(hand) as Droppable[]).filter((p) => hand[p] > 0);

  return (
    <div className="space-y-6">
      {!isGameOver && (
      <TurnBanner
        playerIndex={current}
        playerLabel={`プレイヤー ${current + 1}`}
        action={inCheck ? "王手" : dropPiece ? `${shogiHandLabel(dropPiece)}を打つ` : undefined}
      />
      )}

      <section className="rounded-xl border border-surface-border bg-surface-raised p-3">
        <h3 className="mb-2 text-sm font-medium text-slate-400">持ち駒（プレイヤー {current + 1}）</h3>
        <div className="flex flex-wrap gap-2">
          {droppables.length === 0 ? (
            <span className="text-sm text-slate-600">なし</span>
          ) : (
            droppables.map((piece) => {
              const style = getPlayerTurnStyle(current);
              const active = dropPiece === piece;
              return (
                <button
                  key={piece}
                  type="button"
                  onClick={() => onHandPiece(piece)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium sm:px-3 sm:text-sm ${
                    active
                      ? `${style.sectionBorder} ${style.sectionBg} ring-1 ${style.sectionRing}`
                      : "border-surface-border bg-surface"
                  }`}
                >
                  {shogiHandLabel(piece)} ×{hand[piece]}
                </button>
              );
            })
          )}
        </div>
      </section>

      <div className="mx-auto grid max-w-lg grid-cols-9 gap-px overflow-hidden rounded-xl border border-surface-border bg-amber-900/40 p-1">
        {state.board.map((piece, index) => {
          const isDest = destinations.some((m) => m.to === index);
          const isFrom = selected === index;
          const pieceStyle = piece ? getPlayerTurnStyle(piece.player) : null;
          const promoted = piece?.promoted && piece.type !== "K" && piece.type !== "G";
          return (
            <button
              key={index}
              type="button"
              onClick={() => onSquare(index)}
              className={`relative flex aspect-square min-h-8 items-center justify-center bg-amber-100/90 sm:min-h-10 ${
                isFrom ? "ring-2 ring-inset ring-accent" : ""
              } ${isDest ? "ring-2 ring-inset ring-lime-400" : ""}`}
              aria-label={piece ? shogiPieceLabel(piece) : isDest ? "移動先" : "空マス"}
            >
              {piece ? (
                <span
                  className={`text-[10px] font-bold leading-none sm:text-xs ${
                    piece.player === 1 ? "rotate-180" : ""
                  } ${pieceStyle?.label ?? "text-slate-900"} ${promoted ? "text-rose-800" : ""}`}
                >
                  {shogiPieceLabel(piece)}
                </span>
              ) : isDest ? (
                <span className="h-1.5 w-1.5 rounded-full bg-lime-500/80 sm:h-2 sm:w-2" />
              ) : null}
            </button>
          );
        })}
      </div>

      {isGameOver && winners && (
        <ResultPanel
          variant="inline"
          winners={winners}
          onReplay={() => setPhase("setup")}
          details={<p className="text-slate-400">王手のまま合法手がなくなりました。</p>}
        />
      )}
    </div>
  );
}
