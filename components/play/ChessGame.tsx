"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import type { LocalMatchSetupKind } from "@/components/play/shared/PlayModeLocalMatchTabs";
import {
  useCpuTurnScheduler,
  useLocalCpuMatch,
  useStateRef,
  localCpuTurnLabel,
} from "@/hooks/useLocalCpuMatch";
import type { PlayMode } from "@/lib/online/types";
import { chooseChessMove } from "@/lib/play/ai/chess";
import type { BinaryPlayer, CpuDifficulty } from "@/lib/play/cpu/types";
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
  const { recordLocalPlay, setPlayMode } = usePlayPage();
  const [mode] = useState<PlayMode>("local");
  const [phase, setPhase] = useState<Phase>("setup");
  const [state, setState] = useState<ChessState>(initialChessState);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<{ winners: number[]; message: string } | null>(null);

  const {
    matchKind,
    cpuDifficulty,
    setCpuDifficulty,
    humanTurn,
    cpuThinking,
    cpuSeat,
    prepareLocalStart,
    humanSeat,
    setHumanSeat,
  } = useLocalCpuMatch({
    mode,
    setPlayMode,
    isOnline: false,
    localActive: phase === "playing" || phase === "game-over",
    gameOver: phase === "game-over",
    turnPlayer: state.current,
  });

  const localSnapshotRef = useStateRef(state);

  const startGame = useCallback(
    (kind: LocalMatchSetupKind, difficulty: CpuDifficulty, seat: BinaryPlayer) => {
      setCpuDifficulty(difficulty);
      setHumanSeat(seat);
      recordLocalPlay();
      prepareLocalStart(kind);
      setState(initialChessState());
      setSelected(null);
      setResult(null);
      setPhase("playing");
    },
    [recordLocalPlay, prepareLocalStart, setCpuDifficulty, setHumanSeat]
  );

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
    [phase, state.board, state.current]
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

  const applyCpuChess = useCallback(
    (snapshot: ChessState, move: ChessMove) => {
      if (phase !== "playing") return;
      const next = applyChessMove(snapshot, move);
      setState(next);
      setSelected(null);
      finishIfNeeded(next);
    },
    [phase, finishIfNeeded]
  );

  useCpuTurnScheduler({
    enabled: cpuThinking,
    difficulty: cpuDifficulty,
    state,
    stateRef: localSnapshotRef,
    chooseMove: (snapshot, difficulty) =>
      chooseChessMove(snapshot, difficulty, cpuSeat),
    applyMove: applyCpuChess,
    canActOnSnapshot: (snapshot) => snapshot.current === cpuSeat,
  });

  const onSquare = useCallback(
    (index: number) => {
      if (phase !== "playing" || !humanTurn || cpuThinking) return;
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
    [phase, destinations, apply, state.board, state.current, moves, humanTurn, cpuThinking]
  );

  const backToSetup = useCallback(() => {
    setPhase("setup");
    setPlayMode({ mode: "local" });
  }, [setPlayMode]);
  usePlaySetupNavigation(phase === "setup", backToSetup);

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
      {isGameOver && result && (
        <ResultPanel
          variant="inline"
          winners={result.winners}
          draw={result.winners.length > 1}
          onReplay={() => setPhase("setup")}
          details={<p className="text-slate-400">{result.message}</p>}
        />
      )}

      {!isGameOver && (
      <TurnBanner
        playerIndex={current}
        playerLabel={localCpuTurnLabel(matchKind, current, humanSeat,
          `プレイヤー ${current + 1}`
        )}
        action={
          cpuThinking ? "CPUの手番…" : inCheck ? "チェック" : undefined
        }
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

    </div>
  );
}
