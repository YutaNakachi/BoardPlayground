"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { getPlayerTurnStyle } from "@/lib/player-colors";
import {
  applyLudoMove,
  initialLudo,
  LUDO_TRACK,
  ludoMoves,
  rollLudo,
  type LudoState,
} from "@/lib/play/ludo";

type Phase = "setup" | "playing" | "game-over";

export function LudoGame() {
  const { recordLocalPlay } = usePlayPage();
  const [phase, setPhase] = useState<Phase>("setup");
  const [playerCount, setPlayerCount] = useState(2);
  const [state, setState] = useState<LudoState>(initialLudo(2));

  const startGame = useCallback(() => {
    recordLocalPlay();
    setState(initialLudo(playerCount));
    setPhase("playing");
  }, [recordLocalPlay, playerCount]);

  const moves = useMemo(
    () => (phase === "playing" ? ludoMoves(state) : []),
    [phase, state]
  );

  const onRoll = useCallback(() => {
    setState((s) => rollLudo(s));
  }, []);

  const onToken = useCallback(
    (tokenIndex: number) => {
      if (!moves.some((m) => m.tokenIndex === tokenIndex)) return;
      const next = applyLudoMove(state, { tokenIndex, steps: state.lastRoll! });
      if (next) setState(next);
      if (next?.winner != null) setPhase("game-over");
    },
    [moves, state]
  );

  if (phase === "setup") {
    return (
      <SetupPanel
        title="ルード"
        description="サイコロを振り、6が出たらコマを出す。相手をスタートへ戻し、4つすべてをゴールへ。"
        playerCount={playerCount}
        playerOptions={[2, 3, 4]}
        onPlayerCount={setPlayerCount}
        onStart={startGame}
      />
    );
  }

  const isGameOver = phase === "game-over" && state.winner != null;
  const winners = isGameOver ? [state.winner!] : null;

  return (
    <div className="space-y-6">
      {!isGameOver && (
      <TurnBanner
        playerIndex={state.current}
        playerLabel={`プレイヤー ${state.current + 1}`}
        action={
          state.lastRoll == null
            ? "サイコロを振る"
            : moves.length === 0
              ? "出せるコマがありません"
              : "コマを選ぶ"
        }
      />
      )}

      <div className="mx-auto max-w-md space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: state.players }, (_, player) => {
            const yardTokens = state.tokens.filter(
              (t) => t.player === player && t.position === -1
            );
            if (yardTokens.length === 0) return null;
            return (
              <div
                key={`yard-${player}`}
                className="rounded-lg border border-surface-border bg-surface-raised p-2"
              >
                <p className="mb-2 text-center text-[10px] text-slate-500">
                  P{player + 1} スタート
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {yardTokens.map((t) => {
                    const tokenIndex = state.tokens.indexOf(t);
                    const canMove = moves.some((m) => m.tokenIndex === tokenIndex);
                    const style = getPlayerTurnStyle(t.player);
                    return (
                      <button
                        key={`yard-${t.player}-${t.index}`}
                        type="button"
                        onClick={() => onToken(tokenIndex)}
                        disabled={!canMove}
                        className={`flex h-10 items-center justify-center rounded-md bg-white/5 ${
                          canMove ? "ring-2 ring-lime-300" : ""
                        }`}
                        aria-label={`P${t.player + 1} コマ ${t.index + 1}`}
                      >
                        <span
                          className={`h-5 w-5 rounded-full ${style.piece} ${style.dotShadow}`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="grid gap-0.5 rounded-xl border border-surface-border bg-surface-raised p-2"
          style={{ gridTemplateColumns: `repeat(${LUDO_TRACK}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: LUDO_TRACK }, (_, pos) => {
            const here = state.tokens.filter((t) => t.position === pos);
            return (
              <div
                key={pos}
                className="relative flex aspect-square min-h-6 items-center justify-center rounded-sm bg-white/5 text-[8px] text-slate-600"
              >
                {here.map((t) => {
                  const style = getPlayerTurnStyle(t.player);
                  const canMove = moves.some((m) => m.tokenIndex === state.tokens.indexOf(t));
                  return (
                    <button
                      key={`${t.player}-${t.index}`}
                      type="button"
                      onClick={() => onToken(state.tokens.indexOf(t))}
                      className={`absolute h-3 w-3 rounded-full ${style.piece} ${
                        canMove ? "ring-2 ring-lime-300" : ""
                      } ${style.dotShadow}`}
                      aria-label={`P${t.player + 1} コマ ${t.index + 1}`}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {Array.from({ length: state.players }, (_, p) => {
          const style = getPlayerTurnStyle(p);
          return (
          <div key={p} className="rounded-lg border border-surface-border px-3 py-2 text-sm">
            <span className={`inline-block h-2 w-2 rounded-full ${style.piece} mr-2`} />
            P{p + 1}: ゴール{" "}
            {state.tokens.filter((t) => t.player === p && t.position === 58).length}/4
          </div>
          );
        })}
      </div>

      {state.lastRoll == null && !isGameOver ? (
        <div className="text-center">
          <button type="button" onClick={onRoll} className="btn-game">
            サイコロを振る
          </button>
        </div>
      ) : !isGameOver ? (
        <p className="text-center text-lg font-bold text-white">出目: {state.lastRoll}</p>
      ) : null}

      {state.lastRoll != null && moves.length === 0 && !isGameOver ? (
        <div className="text-center">
          <button
            type="button"
            onClick={() =>
              setState((s) => ({
                ...s,
                current: (s.current + 1) % s.players,
                lastRoll: null,
                extraTurn: false,
              }))
            }
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
          details={<p className="text-slate-400">4つのコマをすべてゴールしました。</p>}
        />
      )}
    </div>
  );
}
