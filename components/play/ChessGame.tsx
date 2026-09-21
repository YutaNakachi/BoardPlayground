"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { playerPieceClasses } from "@/lib/player-colors";
import {
  applyChessMove,
  chessMoves,
  chessPieceLabel,
  chessStatus,
  initialChessState,
  isInCheck,
  type ChessMove,
  type ChessState,
} from "@/lib/play/chess";

type Phase = "setup" | "playing" | "game-over";

export function ChessGame() {
  const { recordLocalPlay } = usePlayPage();
  const [phase, setPhase] = useState<Phase>("setup");
  const [state, setState] = useState<ChessState>(initialChessState);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<{ winners: number[]; message: string } | null>(null);

  const startGame = useCallback(() => {
    recordLocalPlay();
    setState(initialChessState());
    setSelected(null);
    setResult(null);
    setPhase("playing");
  }, [recordLocalPlay]);

  const moves = useMemo(
    () => (phase === "playing" ? chessMoves(state) : []),
    [phase, state]
  );

  const destinations = useMemo(() => {
    if (selected == null) return [];
    return moves.filter((m) => m.from === selected);
  }, [moves, selected]);

  const inCheck = useMemo(
    () => phase === "playing" && isInCheck(state.board, state.current),
    [phase, state]
  );

  const finishIfNeeded = useCallback((next: ChessState) => {
    const status = chessStatus(next);
    if (status.kind === "checkmate") {
      setResult({
        winners: [status.winner],
        message: "チェックメイトです。",
      });
      setPhase("game-over");
      return true;
    }
    if (status.kind === "stalemate") {
      setResult({
        winners: [0, 1],
        message: "ステイルメイト（引き分け）です。",
      });
      setPhase("game-over");
      return true;
    }
    return false;
  }, []);

  const apply = useCallback(
    (move: ChessMove) => {
      const next = applyChessMove(state, move);
      setState(next);
      setSelected(null);
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
      const piece = state.board[index];
      if (!piece || piece.player !== state.current) {
        setSelected(null);
        return;
      }
      if (!moves.some((m) => m.from === index)) return;
      setSelected(index);
    },
    [phase, destinations, apply, state, moves]
  );

  if (phase === "setup") {
    return (
      <SetupPanel
        title="チェス"
        description="駒を選んでから移動先をクリックします。チェックメイトで勝ち、ステイルメイトは引き分けです。"
        playerCount={2}
        playerOptions={[2]}
        onPlayerCount={() => {}}
        onStart={startGame}
      />
    );
  }

  const isGameOver = phase === "game-over" && result !== null;

  const current = state.current;

  return (
    <div className="space-y-6">
      {!isGameOver && (
      <TurnBanner
        playerIndex={current}
        playerLabel={`プレイヤー ${current + 1}`}
        action={inCheck ? "チェック" : undefined}
      />
      )}

      <div className="mx-auto grid max-w-md grid-cols-8 overflow-hidden rounded-xl border border-surface-border">
        {state.board.map((piece, index) => {
          const isDest = destinations.some((m) => m.to === index);
          const isFrom = selected === index;
          const dark = (Math.floor(index / 8) + (index % 8)) % 2 === 1;
          return (
            <button
              key={index}
              type="button"
              onClick={() => onSquare(index)}
              className={`relative flex aspect-square min-h-9 items-center justify-center sm:min-h-11 ${
                dark ? "bg-emerald-950" : "bg-amber-100/80"
              } ${isFrom ? "ring-2 ring-inset ring-accent" : ""} ${
                isDest ? "ring-2 ring-inset ring-lime-300" : ""
              }`}
              aria-label={
                piece
                  ? `プレイヤー ${piece.player + 1} ${chessPieceLabel(piece)}`
                  : isDest
                    ? "移動先"
                    : "空マス"
              }
            >
              {piece ? (
                <span
                  className={`flex h-[72%] w-[72%] items-center justify-center rounded-full text-xs font-bold sm:text-sm ${piece ? playerPieceClasses(piece.player) : ""}`}
                >
                  {chessPieceLabel(piece)}
                </span>
              ) : isDest ? (
                <span className="h-2.5 w-2.5 rounded-full bg-lime-300/90" />
              ) : null}
            </button>
          );
        })}
      </div>

      {isGameOver && result && (
        <ResultPanel
          variant="inline"
          winners={result.winners}
          onReplay={() => setPhase("setup")}
          details={<p className="text-slate-400">{result.message}</p>}
        />
      )}
    </div>
  );
}
