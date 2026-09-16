"use client";

import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import {
  applyCheckersMove,
  checkersMoves,
  checkersPieceCount,
  initialCheckersBoard,
  isDarkSquare,
  type Board,
  type CheckersMove,
  type Player,
} from "@/lib/play/checkers";

type Phase = "setup" | "playing" | "game-over";

export function CheckersGame() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [board, setBoard] = useState<Board>(initialCheckersBoard);
  const [current, setCurrent] = useState<Player>(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [lockFrom, setLockFrom] = useState<number | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const startGame = useCallback(() => {
    setBoard(initialCheckersBoard());
    setCurrent(0);
    setSelected(null);
    setLockFrom(null);
    setWinner(null);
    setNotice(null);
    setPhase("playing");
  }, []);

  const moves = useMemo(
    () => (phase === "playing" ? checkersMoves(board, current, lockFrom) : []),
    [phase, board, current, lockFrom]
  );

  const destinations = useMemo(() => {
    if (selected == null) return [];
    return moves.filter((m) => m.from === selected);
  }, [moves, selected]);

  const mustCapture = moves.some((m) => m.capture != null);

  const finishIfNeeded = useCallback(
    (nextBoard: Board, nextPlayer: Player) => {
      if (
        checkersPieceCount(nextBoard, nextPlayer) === 0 ||
        checkersMoves(nextBoard, nextPlayer).length === 0
      ) {
        setWinner(nextPlayer === 0 ? 1 : 0);
        setPhase("game-over");
        return true;
      }
      return false;
    },
    []
  );

  const apply = useCallback(
    (move: CheckersMove) => {
      const { board: nextBoard, continueFrom } = applyCheckersMove(board, move);
      setBoard(nextBoard);
      if (continueFrom != null) {
        setLockFrom(continueFrom);
        setSelected(continueFrom);
        setNotice("同じ駒でジャンプを続けてください");
        return;
      }
      const nextPlayer: Player = current === 0 ? 1 : 0;
      setLockFrom(null);
      setSelected(null);
      setNotice(null);
      if (!finishIfNeeded(nextBoard, nextPlayer)) {
        setCurrent(nextPlayer);
      }
    },
    [board, current, finishIfNeeded]
  );

  const onSquare = useCallback(
    (index: number) => {
      if (phase !== "playing") return;
      const dest = destinations.find((m) => m.to === index);
      if (dest) {
        apply(dest);
        return;
      }
      if (lockFrom != null) return;
      const piece = board[index];
      if (!piece || piece.player !== current) {
        setSelected(null);
        return;
      }
      if (!moves.some((m) => m.from === index)) return;
      setSelected(index);
    },
    [phase, destinations, apply, lockFrom, board, current, moves]
  );

  if (phase === "setup") {
    return (
      <SetupPanel
        title="チェッカー"
        description="暗いマスだけを使います。斜めに進み、隣の相手を飛び越えて取ります。取れるときは必ず取ってください。"
        playerCount={2}
        playerOptions={[2]}
        onPlayerCount={() => {}}
        onStart={startGame}
      />
    );
  }

  if (phase === "game-over" && winner !== null) {
    return (
      <ResultPanel
        winners={[winner]}
        onReplay={() => setPhase("setup")}
        details={
          <p className="text-slate-400">
            相手の駒がなくなったか、相手が動ける手がありませんでした。
          </p>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <TurnBanner
        left={`P1 ${checkersPieceCount(board, 0)} · P2 ${checkersPieceCount(board, 1)}`}
        right={`プレイヤー ${current + 1}${mustCapture ? " · ジャンプ必須" : ""}`}
      />
      {notice ? <p className="text-center text-sm text-amber-200">{notice}</p> : null}

      <div className="mx-auto grid max-w-md grid-cols-8 overflow-hidden rounded-xl border border-surface-border">
        {board.map((piece, index) => {
          const dark = isDarkSquare(index);
          const isDest = destinations.some((m) => m.to === index);
          const isFrom = selected === index;
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
                  ? `プレイヤー ${piece.player + 1}${piece.king ? " キング" : ""}`
                  : isDest
                    ? "移動先"
                    : dark
                      ? "暗いマス"
                      : "明るいマス"
              }
            >
              {piece ? (
                <span
                  className={`flex h-[72%] w-[72%] items-center justify-center rounded-full text-[10px] font-bold sm:text-xs ${
                    piece.player === 0
                      ? "bg-indigo-500 text-white"
                      : "bg-rose-200 text-rose-950"
                  }`}
                >
                  {piece.king ? "K" : ""}
                </span>
              ) : isDest ? (
                <span className="h-2.5 w-2.5 rounded-full bg-lime-300/90" />
              ) : null}
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-500">
        自分の駒を選んでから移動先をタップ。一番奥の段に着くとキングになり、前後どちらにも進めます。
      </p>
    </div>
  );
}
