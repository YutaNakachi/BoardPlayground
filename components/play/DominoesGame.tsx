"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import {
  applyDominoPlay,
  dominoPlays,
  drawDomino,
  initialDominoes,
  type DominoPlay,
  type DominoesState,
} from "@/lib/play/dominoes";

type Phase = "setup" | "playing" | "game-over";

function DominoTileView({ high, low }: { high: number; low: number }) {
  return (
    <div className="flex h-12 w-8 flex-col items-center justify-between rounded-md border border-slate-300 bg-white py-1 text-sm font-bold text-slate-900">
      <span>{high}</span>
      <span className="h-px w-full bg-slate-300" />
      <span>{low}</span>
    </div>
  );
}

export function DominoesGame() {
  const { recordLocalPlay } = usePlayPage();
  const [phase, setPhase] = useState<Phase>("setup");
  const [state, setState] = useState<DominoesState>(initialDominoes);
  const [notice, setNotice] = useState<string | null>(null);

  const startGame = useCallback(() => {
    recordLocalPlay();
    setState(initialDominoes());
    setNotice(null);
    setPhase("playing");
  }, [recordLocalPlay]);

  const plays = useMemo(
    () => (phase === "playing" ? dominoPlays(state, state.current) : []),
    [phase, state]
  );

  const play = useCallback(
    (p: DominoPlay) => {
      const next = applyDominoPlay(state, p);
      if (!next) return;
      setState(next);
      setNotice(null);
      if (next.winner != null) setPhase("game-over");
    },
    [state]
  );

  const onDraw = useCallback(() => {
    const next = drawDomino(state);
    if (!next) return;
    setState(next);
    setNotice("山札から1枚引きました");
    if (dominoPlays(next, next.current).length === 0 && !next.boneyard.length) {
      setNotice("どちらも出せません。手番を交代します");
    }
  }, [state]);

  if (phase === "setup") {
    return (
      <SetupPanel
        title="ドミノ"
        description="ダブルシックスの28枚。はじめに1枚出し、端の数字に合う牌を並べます。手札が先に空いた方が勝ち。"
        playerCount={2}
        playerOptions={[2]}
        onPlayerCount={() => {}}
        onStart={startGame}
      />
    );
  }

  if (phase === "game-over" && state.winner != null) {
    return (
      <ResultPanel
        winners={[state.winner]}
        onReplay={() => setPhase("setup")}
        details={<p className="text-slate-400">手札をすべて出し切りました。</p>}
      />
    );
  }

  const hand = state.hands[state.current];

  return (
    <div className="space-y-6">
      <TurnBanner
        playerIndex={state.current}
        playerLabel={`プレイヤー ${state.current + 1}`}
        stats={`手札 ${hand.length} · 山札 ${state.boneyard.length}`}
        action={plays.length === 0 ? "出せないときは山札から引く" : undefined}
      />
      {notice ? <p className="text-center text-sm text-amber-200">{notice}</p> : null}

      <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
        <p className="mb-2 text-center text-xs text-slate-500">
          {state.ends
            ? `端: ${state.ends.left} — ${state.ends.right}`
            : "最初の牌を出してください"}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-1">
          {state.chain.map((tile, i) => (
            <DominoTileView key={`${tile.id}-${i}`} high={tile.high} low={tile.low} />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-center text-sm text-slate-400">あなたの手札</p>
        <div className="flex flex-wrap justify-center gap-2">
          {hand.map((tile) => {
            const canPlay = plays.some((p) => p.tileId === tile.id);
            return (
              <button
                key={tile.id}
                type="button"
                disabled={!canPlay}
                onClick={() => {
                  const options = plays.filter((x) => x.tileId === tile.id);
                  if (options.length === 1) play(options[0]);
                  else if (options.length > 1) {
                    const left = options.find((x) => x.kind === "left");
                    play(left ?? options[0]);
                  }
                }}
                className={`transition ${canPlay ? "ring-2 ring-lime-300" : "opacity-60"}`}
              >
                <DominoTileView high={tile.high} low={tile.low} />
              </button>
            );
          })}
        </div>
      </div>

      {plays.length === 0 ? (
        <div className="text-center">
          <button type="button" onClick={onDraw} className="btn-game">
            山札から引く
          </button>
        </div>
      ) : null}

      <p className="text-center text-xs text-slate-500">
        相手の手札: {state.hands[state.current === 0 ? 1 : 0].length} 枚（伏せ）
      </p>
    </div>
  );
}
