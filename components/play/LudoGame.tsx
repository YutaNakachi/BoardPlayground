"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { getPlayerTurnStyle } from "@/lib/player-colors";
import {
  coordKey,
  LUDO_GRID,
  LUDO_HOME,
  LUDO_PATH,
  type Coord,
} from "@/lib/play/ludo-board";
import {
  applyLudoMove,
  initialLudo,
  ludoGoalCount,
  ludoMoves,
  ludoTokenCoord,
  rollLudo,
  type LudoState,
  type LudoToken,
} from "@/lib/play/ludo";

type Phase = "setup" | "playing" | "game-over";

type CellKind = "empty" | "base" | "path" | "home" | "center";

const BASE_REGIONS: { player: number; rows: [number, number]; cols: [number, number] }[] = [
  { player: 0, rows: [9, 14], cols: [0, 5] },
  { player: 1, rows: [0, 5], cols: [0, 5] },
  { player: 2, rows: [0, 5], cols: [9, 14] },
  { player: 3, rows: [9, 14], cols: [9, 14] },
];

function buildCellMap(activePlayers: number[]) {
  const pathKeys = new Set(LUDO_PATH.map(coordKey));
  const homeMap = new Map<string, number>();
  for (const p of activePlayers) {
    for (const coord of LUDO_HOME[p]) {
      homeMap.set(coordKey(coord), p);
    }
  }
  const baseMap = new Map<string, number>();
  for (const region of BASE_REGIONS) {
    if (!activePlayers.includes(region.player)) continue;
    for (let r = region.rows[0]; r <= region.rows[1]; r++) {
      for (let c = region.cols[0]; c <= region.cols[1]; c++) {
        baseMap.set(coordKey({ r, c }), region.player);
      }
    }
  }
  return { pathKeys, homeMap, baseMap };
}

function cellKind(
  r: number,
  c: number,
  pathKeys: Set<string>,
  homeMap: Map<string, number>,
  baseMap: Map<string, number>
): { kind: CellKind; owner?: number } {
  const key = coordKey({ r, c });
  if (r >= 6 && r <= 8 && c >= 6 && c <= 8) return { kind: "center" };
  if (homeMap.has(key)) return { kind: "home", owner: homeMap.get(key) };
  if (pathKeys.has(key)) return { kind: "path" };
  if (baseMap.has(key)) return { kind: "base", owner: baseMap.get(key) };
  if (r >= 6 && r <= 8) return { kind: "path" };
  if (c >= 6 && c <= 8) return { kind: "path" };
  return { kind: "empty" };
}

function tokensAt(tokens: LudoToken[], coord: Coord): LudoToken[] {
  const key = coordKey(coord);
  return tokens.filter((t) => coordKey(ludoTokenCoord(t)) === key);
}

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

  const cellMap = useMemo(
    () => buildCellMap(state.activePlayers),
    [state.activePlayers]
  );

  const movableTokenIds = useMemo(
    () => new Set(moves.map((m) => m.tokenIndex)),
    [moves]
  );

  const onRoll = useCallback(() => {
    setState((s) => rollLudo(s));
  }, []);

  const onToken = useCallback(
    (tokenIndex: number) => {
      if (!moves.some((m) => m.tokenIndex === tokenIndex)) return;
      const next = applyLudoMove(state, { tokenIndex });
      if (next) setState(next);
      if (next?.winner != null) setPhase("game-over");
    },
    [moves, state]
  );

  const passTurn = useCallback(() => {
    setState((s) => {
      const turnIndex = s.activePlayers.indexOf(s.current);
      return {
        ...s,
        current: s.activePlayers[(turnIndex + 1) % s.activePlayers.length],
        lastRoll: null,
        extraTurn: false,
      };
    });
  }, []);

  if (phase === "setup") {
    return (
      <SetupPanel
        title="ルドー"
        description="サイコロで6が出たらコマを出す。ぴったり止まって相手を戻し、4つすべてをゴールへ。"
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
          playerLabel={`プレイヤー ${state.activePlayers.indexOf(state.current) + 1}`}
          action={
            state.lastRoll == null
              ? "サイコロを振る"
              : moves.length === 0
                ? "出せるコマがありません"
                : "コマを選ぶ"
          }
        />
      )}

      <div className="mx-auto w-full max-w-[min(100%,20rem)]">
        <div
          className="grid gap-px rounded-xl border border-surface-border bg-slate-900 p-1"
          style={{
            gridTemplateColumns: `repeat(${LUDO_GRID}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: LUDO_GRID * LUDO_GRID }, (_, i) => {
            const r = Math.floor(i / LUDO_GRID);
            const c = i % LUDO_GRID;
            const { kind, owner } = cellKind(
              r,
              c,
              cellMap.pathKeys,
              cellMap.homeMap,
              cellMap.baseMap
            );
            const here = tokensAt(state.tokens, { r, c });
            const style = owner != null ? getPlayerTurnStyle(owner) : null;
            const bg =
              kind === "center"
                ? "bg-slate-700"
                : kind === "home" && style
                  ? style.surface
                  : kind === "base" && style
                    ? style.bg
                    : kind === "path"
                      ? "bg-white/10"
                      : "bg-slate-950/50";

            return (
              <div
                key={`${r}-${c}`}
                className={`relative aspect-square ${bg}`}
              >
                {here.map((t) => {
                  const tokenIndex = state.tokens.indexOf(t);
                  const tokenStyle = getPlayerTurnStyle(t.player);
                  const canMove = movableTokenIds.has(tokenIndex);
                  return (
                    <button
                      key={`${t.player}-${t.index}`}
                      type="button"
                      onClick={() => onToken(tokenIndex)}
                      disabled={!canMove}
                      className={`absolute inset-[15%] rounded-full ${tokenStyle.piece} ${
                        canMove ? "ring-2 ring-lime-300" : ""
                      } ${tokenStyle.dotShadow}`}
                      aria-label={`P${state.activePlayers.indexOf(t.player) + 1} コマ ${t.index + 1}`}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {state.activePlayers.map((p, displayIdx) => {
          const style = getPlayerTurnStyle(p);
          return (
            <div
              key={p}
              className="rounded-lg border border-surface-border px-3 py-2 text-sm"
            >
              <span className={`inline-block h-2 w-2 rounded-full ${style.piece} mr-2`} />
              P{displayIdx + 1}: ゴール {ludoGoalCount(state, p)}/4
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
            onClick={passTurn}
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
