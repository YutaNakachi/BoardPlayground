"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import type { LocalMatchSetupKind } from "@/components/play/shared/PlayModeLocalMatchTabs";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import {
  useCpuTurnScheduler,
  useLocalCpuMatch,
  useStateRef,
  localCpuTurnLabel,
} from "@/hooks/useLocalCpuMatch";
import type { PlayMode } from "@/lib/online/types";
import {
  applyDominoCpuChoice,
  chooseDominoMove,
} from "@/lib/play/ai/dominoes";
import type { BinaryPlayer, CpuDifficulty } from "@/lib/play/cpu/types";
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
  const { recordLocalPlay, setPlayMode } = usePlayPage();
  const [mode] = useState<PlayMode>("local");
  const [phase, setPhase] = useState<Phase>("setup");
  const [state, setState] = useState<DominoesState>(initialDominoes);
  const [notice, setNotice] = useState<string | null>(null);

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
      setState(initialDominoes());
      setNotice(null);
      setPhase("playing");
    },
    [recordLocalPlay, prepareLocalStart, setCpuDifficulty]
  );

  const applyCpuDomino = useCallback(
    (
      snapshot: DominoesState,
      choice: DominoPlay | "draw" | "pass"
    ) => {
      if (phase !== "playing") return;
      const next = applyDominoCpuChoice(snapshot, choice);
      if (!next) return;
      setState(next);
      setNotice(
        choice === "draw"
          ? "CPUが山札から1枚引きました"
          : choice === "pass"
            ? "CPUは出せないため手番を交代しました"
            : null
      );
      if (next.winner != null) setPhase("game-over");
    },
    [phase]
  );

  useCpuTurnScheduler({
    enabled: cpuThinking,
    difficulty: cpuDifficulty,
    state,
    stateRef: localSnapshotRef,
    chooseMove: (snapshot, difficulty) =>
      chooseDominoMove(snapshot, difficulty, cpuSeat),
    applyMove: applyCpuDomino,
    canActOnSnapshot: (snapshot) =>
      snapshot.winner === null && snapshot.current === cpuSeat,
  });

  const plays = useMemo(
    () => (phase === "playing" ? dominoPlays(state, state.current) : []),
    [phase, state]
  );

  const canInteract = humanTurn && !cpuThinking;

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
    if (!canInteract) return;
    const next = drawDomino(state);
    if (!next) return;
    setState(next);
    setNotice("山札から1枚引きました");
    if (dominoPlays(next, next.current).length === 0 && !next.boneyard.length) {
      setNotice("どちらも出せません。手番を交代します");
    }
  }, [state, canInteract]);

  const backToSetup = useCallback(() => {
    setPhase("setup");
    setPlayMode({ mode: "local" });
  }, [setPlayMode]);
  usePlaySetupNavigation(phase === "setup", backToSetup);

  if (phase === "setup") {
    return (
      <SetupPanel
        title="ドミノ"
        description="ダブルシックスの28枚を各7枚ずつ配ります。端の数字に合う牌を並べ、手札が先に空いた方が勝ち。"
        playerCount={2}
        playerOptions={[2]}
        onPlayerCount={() => {}}
        onStart={startGame}
      />
    );
  }

  const isGameOver = phase === "game-over" && state.winner != null;
  const winners = isGameOver ? [state.winner!] : null;

  const hand = state.hands[state.current];

  return (
    <div className="space-y-6">
      {isGameOver && winners && (
        <ResultPanel
          variant="inline"
          winners={winners}
          onReplay={() => setPhase("setup")}
          details={<p className="text-slate-400">手札をすべて出し切りました。</p>}
        />
      )}

      {!isGameOver && (
      <TurnBanner
        playerIndex={state.current}
        playerLabel={localCpuTurnLabel(matchKind, state.current, humanSeat,
          `プレイヤー ${state.current + 1}`
        )}
        action={
          cpuThinking
            ? "CPUの手番…"
            : plays.length === 0
              ? "出せないときは山札から引く"
              : undefined
        }
        notice={notice ?? undefined}
      />
      )}

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
            const canPlayTile = canInteract && plays.some((p) => p.tileId === tile.id);
            return (
              <button
                key={tile.id}
                type="button"
                disabled={!canPlayTile || isGameOver}
                onClick={() => {
                  const options = plays.filter((x) => x.tileId === tile.id);
                  if (options.length === 1) play(options[0]);
                  else if (options.length > 1) {
                    const left = options.find((x) => x.kind === "left");
                    play(left ?? options[0]);
                  }
                }}
                className={`transition ${canPlayTile ? "ring-2 ring-lime-300" : "opacity-60"}`}
              >
                <DominoTileView high={tile.high} low={tile.low} />
              </button>
            );
          })}
        </div>
      </div>

      {plays.length === 0 && !isGameOver && canInteract ? (
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
