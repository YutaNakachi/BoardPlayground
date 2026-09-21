"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { playerPieceClasses } from "@/lib/player-colors";
import {
  clickMorris,
  initialMorrisState,
  MORRIS_LINES,
  MORRIS_XY,
  morrisCanMove,
  morrisIsFlying,
  morrisLegalDestinations,
  morrisRemovable,
  type MorrisState,
} from "@/lib/play/nine-mens-morris";

type Phase = "setup" | "playing";

export function NineMensMorrisGame() {
  const { recordLocalPlay } = usePlayPage();
  const [phase, setPhase] = useState<Phase>("setup");
  const [state, setState] = useState<MorrisState>(initialMorrisState);

  const startGame = useCallback(() => {
    recordLocalPlay();
    setState(initialMorrisState());
    setPhase("playing");
  }, [recordLocalPlay]);

  const dests = useMemo(() => {
    if (state.selected == null || state.removing) return [];
    return morrisLegalDestinations(state, state.selected);
  }, [state]);

  const removable = useMemo(() => {
    if (!state.removing) return [];
    const opponent = state.current === 0 ? 1 : 0;
    return morrisRemovable(state.board, opponent);
  }, [state]);

  const onPoint = useCallback(
    (index: number) => {
      if (phase !== "playing" || state.over) return;
      setState((prev) => clickMorris(prev, index));
    },
    [phase, state.over]
  );

  const backToSetup = useCallback(() => setPhase("setup"), []);
  usePlaySetupNavigation(phase === "setup", backToSetup);

  if (phase === "setup") {
    return (
      <SetupPanel
        title="ナイン・メンズ・モリス"
        description="各9個の駒を点に置き、隣へ動かして3つ並べます。並べたら相手の駒を1つ外します。"
        playerCount={2}
        playerOptions={[2]}
        onPlayerCount={() => {}}
        onStart={startGame}
      />
    );
  }

  const isGameOver = state.over;
  const winners = isGameOver ? state.winners : null;

  const placing = state.toPlace[state.current] > 0;
  const flying = morrisIsFlying(state, state.current);
  const right = state.removing
    ? "相手の駒を外す"
    : placing
      ? "空点に置く"
      : flying
        ? "飛行（空点へ）"
        : "駒を動かして3つ並べる";

  return (
    <div className="space-y-6">
      {!isGameOver && (
      <TurnBanner
        playerIndex={state.current}
        playerLabel={`プレイヤー ${state.current + 1}`}
        action={right}
      />
      )}
      {state.notice && !isGameOver ? (
        <p className="text-center text-sm text-amber-200">{state.notice}</p>
      ) : null}

      <div className="relative mx-auto aspect-square w-full max-w-md">
        <svg viewBox="0 0 300 300" className="h-full w-full text-slate-500">
          {MORRIS_LINES.map(([a, b], i) => (
            <line
              key={i}
              x1={MORRIS_XY[a][0]}
              y1={MORRIS_XY[a][1]}
              x2={MORRIS_XY[b][0]}
              y2={MORRIS_XY[b][1]}
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ))}
        </svg>
        {MORRIS_XY.map(([x, y], index) => {
          const owner = state.board[index];
          const isDest = dests.includes(index);
          const canRemove = removable.includes(index);
          const selected = state.selected === index;
          return (
            <button
              key={index}
              type="button"
              onClick={() => onPoint(index)}
              style={{ left: `${(x / 300) * 100}%`, top: `${(y / 300) * 100}%` }}
              className={`absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full sm:h-10 sm:w-10 ${
                selected ? "ring-2 ring-accent" : ""
              } ${isDest || canRemove ? "ring-2 ring-lime-300" : ""}`}
              aria-label={
                owner === 0
                  ? "プレイヤー1の駒"
                  : owner === 1
                    ? "プレイヤー2の駒"
                    : isDest
                      ? "移動先"
                      : "空点"
              }
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full sm:h-8 sm:w-8 ${
                  owner === null
                    ? isDest
                      ? "bg-lime-300/80"
                      : "bg-surface-raised ring-1 ring-surface-border"
                    : playerPieceClasses(owner)
                }`}
              />
            </button>
          );
        })}
      </div>

      {isGameOver && winners && (
        <ResultPanel
          variant="inline"
          winners={winners}
          onReplay={() => setPhase("setup")}
          details={
            <p className="text-slate-400">
              {state.notice ?? "相手の駒が足りないか、動けなくなりました。"}
            </p>
          }
        />
      )}
    </div>
  );
}
