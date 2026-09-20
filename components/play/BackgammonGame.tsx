"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DiceFace } from "@/components/play/shared/DiceFace";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { getPlayerTurnStyle } from "@/lib/player-colors";
import {
  applyBackgammonMove,
  backgammonMoves,
  checkerCount,
  endBackgammonTurn,
  initialBackgammon,
  rollBackgammon,
  type BackgammonMove,
  type BackgammonState,
} from "@/lib/play/backgammon";

type Phase = "setup" | "playing" | "game-over";

export function BackgammonGame() {
  const { recordLocalPlay } = usePlayPage();
  const [phase, setPhase] = useState<Phase>("setup");
  const [state, setState] = useState<BackgammonState>(initialBackgammon);
  const [selected, setSelected] = useState<number | "bar" | null>(null);

  const startGame = useCallback(() => {
    recordLocalPlay();
    setState(initialBackgammon());
    setSelected(null);
    setPhase("playing");
  }, [recordLocalPlay]);

  const moves = useMemo(
    () => (phase === "playing" ? backgammonMoves(state) : []),
    [phase, state]
  );

  const destinations = useMemo(() => {
    if (selected == null) return [];
    return moves.filter((m) => m.from === selected);
  }, [moves, selected]);

  const [diceFaces, setDiceFaces] = useState<[number, number]>([1, 1]);
  const [isRolling, setIsRolling] = useState(false);
  const rollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (rollTimerRef.current) clearInterval(rollTimerRef.current);
    };
  }, []);

  const onRoll = useCallback(() => {
    if (isRolling || state.dice || state.winner != null) return;

    setIsRolling(true);
    let ticks = 0;
    rollTimerRef.current = setInterval(() => {
      ticks += 1;
      setDiceFaces([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ]);
      if (ticks >= 10) {
        if (rollTimerRef.current) clearInterval(rollTimerRef.current);
        rollTimerRef.current = null;
        setState((s) => {
          const next = rollBackgammon(s);
          if (next.dice) setDiceFaces([next.dice[0], next.dice[1]]);
          setIsRolling(false);
          return next;
        });
      }
    }, 70);
  }, [isRolling, state.dice, state.winner]);

  const apply = useCallback(
    (move: BackgammonMove) => {
      const next = applyBackgammonMove(state, move);
      if (!next) return;
      setState(next);
      setSelected(null);
      if (next.winner != null) setPhase("game-over");
    },
    [state]
  );

  const onPoint = useCallback(
    (point: number) => {
      if (phase !== "playing") return;
      const dest = destinations.find((m) => m.to === point);
      if (dest && selected != null) {
        apply(dest);
        return;
      }
      const player = state.current;
      if (state.bar[player] > 0) {
        setSelected("bar");
        return;
      }
      if (checkerCount(state, player, point) > 0) setSelected(point);
      else setSelected(null);
    },
    [phase, destinations, selected, apply, state]
  );

  if (phase === "setup") {
    return (
      <SetupPanel
        title="バックギャモン"
        description="サイコロで進み、単独の駒を取り、全駒をベアオフした方が勝ち。バーからの再投入あり。"
        playerCount={2}
        playerOptions={[2]}
        onPlayerCount={() => {}}
        onStart={startGame}
      />
    );
  }

  const isGameOver = phase === "game-over" && state.winner != null;
  const winners = isGameOver ? [state.winner!] : null;

  const player = state.current;

  return (
    <div className="space-y-6">
      {!isGameOver && (
      <TurnBanner
        playerIndex={player}
        playerLabel={`プレイヤー ${player + 1}`}
        stats={`ベアオフ P1:${state.off[0]} P2:${state.off[1]} · バー P1:${state.bar[0]} P2:${state.bar[1]}`}
        action={state.dice ? `残りダイス: ${state.movesLeft.join(", ")}` : "サイコロを振る"}
      />
      )}

      <div className="mx-auto flex max-w-2xl flex-col gap-2">
        <div className="flex justify-between text-xs text-slate-500">
          <span>P2 ホーム (19-24)</span>
          <span>P1 ホーム (1-6)</span>
        </div>
        <div className="grid grid-cols-12 gap-1">
          {Array.from({ length: 24 }, (_, i) => {
            const point = 23 - i;
            const p0 = checkerCount(state, 0, point);
            const p1 = checkerCount(state, 1, point);
            const isDest = destinations.some((m) => m.to === point);
            const isFrom = selected === point;
            return (
              <button
                key={point}
                type="button"
                onClick={() => onPoint(point)}
                className={`flex min-h-16 flex-col items-center justify-between rounded-md border px-1 py-1 text-[10px] ${
                  point < 6
                    ? getPlayerTurnStyle(0).surface
                    : point > 17
                      ? getPlayerTurnStyle(1).surface
                      : "bg-white/5"
                } ${isFrom ? "ring-2 ring-accent" : "border-surface-border"} ${
                  isDest ? "ring-2 ring-lime-300" : ""
                }`}
              >
                <span className="text-slate-500">{point + 1}</span>
                <div className="flex flex-col gap-0.5">
                  {p1 > 0 ? (
                    <span
                      className={`rounded px-1 ${getPlayerTurnStyle(1).piece} ${getPlayerTurnStyle(1).pieceText}`}
                    >
                      {p1}
                    </span>
                  ) : null}
                  {p0 > 0 ? (
                    <span
                      className={`rounded px-1 ${getPlayerTurnStyle(0).piece} ${getPlayerTurnStyle(0).pieceText}`}
                    >
                      {p0}
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {state.bar[player] > 0 ? (
          <button
            type="button"
            onClick={() => setSelected("bar")}
            className={`rounded-lg border px-4 py-2 text-sm ${
              selected === "bar" ? "ring-2 ring-accent" : "border-surface-border"
            }`}
          >
            バーから出す ({state.bar[player]})
          </button>
        ) : null}
        {destinations.some((m) => m.to === "off") ? (
          <button
            type="button"
            onClick={() => {
              const m = destinations.find((x) => x.to === "off");
              if (m) apply(m);
            }}
            className="rounded-lg border border-lime-400/50 px-4 py-2 text-sm text-lime-200"
          >
            ベアオフ
          </button>
        ) : null}
      </div>

      {!isGameOver ? (
        <div className="flex flex-col items-center gap-3">
          {(isRolling || state.dice) && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-3">
                <DiceFace value={diceFaces[0]} size="lg" rolling={isRolling} />
                <DiceFace value={diceFaces[1]} size="lg" rolling={isRolling} />
              </div>
              {isRolling ? <p className="text-sm text-slate-400">振っています…</p> : null}
            </div>
          )}

          {!state.dice && !isRolling ? (
            <button type="button" onClick={onRoll} className="btn-game">
              サイコロを振る
            </button>
          ) : null}
        </div>
      ) : null}

      {state.dice && moves.length === 0 && !isGameOver ? (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setState((s) => endBackgammonTurn(s))}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm"
          >
            手番を終える
          </button>
        </div>
      ) : null}

      {isGameOver && winners && (
        <ResultPanel
          variant="inline"
          winners={winners}
          onReplay={() => setPhase("setup")}
          details={<p className="text-slate-400">15個すべてをベアオフしました。</p>}
        />
      )}
    </div>
  );
}
