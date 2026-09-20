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
  LUDO_PLAYER_META,
  ludoStartCoord,
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

type CellInfo = {
  kind: CellKind;
  owner?: number;
  isStart?: boolean;
  homeSlot?: number;
};

/** 0=赤BL / 1=青TL / 2=緑BR / 3=黄TR */
const BASE_REGIONS: { player: number; rows: [number, number]; cols: [number, number] }[] = [
  { player: 0, rows: [9, 14], cols: [0, 5] },
  { player: 1, rows: [0, 5], cols: [0, 5] },
  { player: 2, rows: [9, 14], cols: [9, 14] },
  { player: 3, rows: [0, 5], cols: [9, 14] },
];

function buildCellMap(activePlayers: number[]) {
  const pathKeys = new Set(LUDO_PATH.map(coordKey));
  const homeMap = new Map<string, { player: number; slot: number }>();
  const startMap = new Map<string, number>();
  for (const p of activePlayers) {
    startMap.set(coordKey(ludoStartCoord(p)), p);
    LUDO_HOME[p].forEach((coord, slot) => {
      homeMap.set(coordKey(coord), { player: p, slot });
    });
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
  return { pathKeys, homeMap, startMap, baseMap };
}

function cellInfo(
  r: number,
  c: number,
  pathKeys: Set<string>,
  homeMap: Map<string, { player: number; slot: number }>,
  startMap: Map<string, number>,
  baseMap: Map<string, number>
): CellInfo {
  const key = coordKey({ r, c });
  if (r >= 6 && r <= 8 && c >= 6 && c <= 8) return { kind: "center" };
  if (homeMap.has(key)) {
    const home = homeMap.get(key)!;
    return { kind: "home", owner: home.player, homeSlot: home.slot };
  }
  if (startMap.has(key)) {
    return { kind: "path", owner: startMap.get(key), isStart: true };
  }
  if (pathKeys.has(key)) return { kind: "path" };
  if (baseMap.has(key)) return { kind: "base", owner: baseMap.get(key) };
  if (r >= 6 && r <= 8) return { kind: "path" };
  if (c >= 6 && c <= 8) return { kind: "path" };
  return { kind: "empty" };
}

function cellAppearance(info: CellInfo): string {
  if (info.kind === "center") return "bg-slate-700";
  if (info.owner == null) {
    if (info.kind === "path") return "bg-white/10";
    return "bg-slate-950/50";
  }
  const style = getPlayerTurnStyle(info.owner);
  if (info.isStart) {
    return `${style.bg} ring-2 ring-inset ${style.pieceRing} shadow-inner`;
  }
  if (info.kind === "home") {
    if (info.homeSlot === 3) return `${style.piece}/35 ring-2 ring-inset ${style.pieceRing}`;
    if (info.homeSlot === 2) return `${style.bg}`;
    if (info.homeSlot === 1) return `${style.surface}`;
    return `${style.sectionBg}`;
  }
  if (info.kind === "base") return style.bg;
  return "bg-white/10";
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
            const info = cellInfo(
              r,
              c,
              cellMap.pathKeys,
              cellMap.homeMap,
              cellMap.startMap,
              cellMap.baseMap
            );
            const here = tokensAt(state.tokens, { r, c });
            const markerStyle =
              info.owner != null ? getPlayerTurnStyle(info.owner) : null;

            return (
              <div
                key={`${r}-${c}`}
                className={`relative aspect-square ${cellAppearance(info)}`}
              >
                {here.length === 0 && info.isStart && markerStyle ? (
                  <span
                    className={`pointer-events-none absolute inset-0 flex items-center justify-center text-[7px] font-bold ${markerStyle.label}`}
                    aria-hidden
                  >
                    出
                  </span>
                ) : null}
                {here.length === 0 && info.kind === "home" && markerStyle ? (
                  <span
                    className={`pointer-events-none absolute inset-0 flex items-center justify-center text-[7px] font-bold ${markerStyle.label} opacity-80`}
                    aria-hidden
                  >
                    {info.homeSlot === 3 ? "★" : info.homeSlot! + 1}
                  </span>
                ) : null}
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
        <div className="mt-2 flex flex-wrap justify-center gap-3 text-[10px] text-slate-400">
          {state.activePlayers.map((p, displayIdx) => {
            const style = getPlayerTurnStyle(p);
            const meta = LUDO_PLAYER_META[p];
            return (
              <span key={p} className="inline-flex items-center gap-1">
                <span className={`h-2.5 w-2.5 rounded-sm ring-2 ring-inset ${style.pieceRing} ${style.bg}`} />
                P{displayIdx + 1}（{meta.name}・{meta.corner}）出
                <span className={`h-2.5 w-2.5 rounded-sm ${style.sectionBg}`} />
                1〜3
                <span className={`h-2.5 w-2.5 rounded-sm ${style.piece}/35 ring-1 ${style.pieceRing}`} />
                ★
              </span>
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
