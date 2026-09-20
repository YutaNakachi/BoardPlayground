"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { getPlayerTurnStyle } from "@/lib/player-colors";
import {
  coordKey,
  LUDO_BASE_REGIONS,
  LUDO_GRID,
  LUDO_HOME,
  LUDO_HOME_ARROW,
  LUDO_HOME_ENTRY,
  LUDO_PATH,
  LUDO_PLAYER_META,
  LUDO_START_ARROW,
  LUDO_STYLE_INDEX,
  LUDO_YARD,
  isLudoArmTip,
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
  isHomeEntry?: boolean;
  homeSlot?: number;
};

function ludoStyle(player: number) {
  return getPlayerTurnStyle(LUDO_STYLE_INDEX[player]);
}

function buildCellMap(activePlayers: number[]) {
  const pathKeys = new Set(LUDO_PATH.map(coordKey));
  const homeMap = new Map<string, { player: number; slot: number }>();
  const startMap = new Map<string, number>();
  const homeEntryMap = new Map<string, number>();

  for (const p of activePlayers) {
    startMap.set(coordKey(ludoStartCoord(p)), p);
    homeEntryMap.set(coordKey(LUDO_HOME_ENTRY[p]), p);
    LUDO_HOME[p].forEach((coord, slot) => {
      homeMap.set(coordKey(coord), { player: p, slot });
    });
  }

  const baseMap = new Map<string, number>();
  for (const region of LUDO_BASE_REGIONS) {
    if (!activePlayers.includes(region.player)) continue;
    for (let r = region.rows[0]; r <= region.rows[1]; r++) {
      for (let c = region.cols[0]; c <= region.cols[1]; c++) {
        baseMap.set(coordKey({ r, c }), region.player);
      }
    }
  }

  return { pathKeys, homeMap, startMap, homeEntryMap, baseMap };
}

function cellInfo(
  r: number,
  c: number,
  pathKeys: Set<string>,
  homeMap: Map<string, { player: number; slot: number }>,
  startMap: Map<string, number>,
  homeEntryMap: Map<string, number>,
  baseMap: Map<string, number>
): CellInfo {
  const key = coordKey({ r, c });
  if (isLudoArmTip(r, c)) return { kind: "empty" };
  if (r >= 6 && r <= 8 && c >= 6 && c <= 8) return { kind: "center" };
  if (homeMap.has(key)) {
    const home = homeMap.get(key)!;
    return {
      kind: "home",
      owner: home.player,
      homeSlot: home.slot,
      isHomeEntry: homeEntryMap.has(key),
    };
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

function ArrowIcon({
  direction,
  className = "",
}: {
  direction: "right" | "down" | "left" | "up";
  className?: string;
}) {
  const rotation =
    direction === "right"
      ? "rotate-0"
      : direction === "down"
        ? "rotate-90"
        : direction === "left"
          ? "rotate-180"
          : "-rotate-90";
  return (
    <svg
      viewBox="0 0 12 12"
      className={`h-2.5 w-2.5 text-white ${rotation} ${className}`}
      aria-hidden
    >
      <path
        d="M2 6h6M6 3l3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function cellAppearance(info: CellInfo): string {
  if (info.kind === "center") return "bg-slate-800";
  if (info.owner == null) {
    if (info.kind === "path") return "bg-transparent";
    return "bg-transparent";
  }
  const style = ludoStyle(info.owner);
  if (info.isStart) {
    return `${style.surface} ring-2 ring-inset ${style.pieceRing}`;
  }
  if (info.kind === "home") {
    if (info.homeSlot === 4) return `${style.bg} ring-1 ring-inset ${style.pieceRing}`;
    if (info.homeSlot === 3) return `${style.surface}`;
    if (info.homeSlot === 2) return `${style.sectionBg}`;
    return `${style.sectionBg}/90`;
  }
  if (info.kind === "base") return `${style.piece}/30`;
  return "bg-transparent";
}

function tokensAt(tokens: LudoToken[], coord: Coord): LudoToken[] {
  const key = coordKey(coord);
  return tokens.filter((t) => coordKey(ludoTokenCoord(t)) === key);
}

function baseCornerRadius(player: number, r: number, c: number): string {
  if (player === 0 && r === 0 && c === 0) return "rounded-tl-[0.65rem]";
  if (player === 1 && r === 0 && c === 14) return "rounded-tr-[0.65rem]";
  if (player === 2 && r === 14 && c === 14) return "rounded-br-[0.65rem]";
  if (player === 3 && r === 14 && c === 0) return "rounded-bl-[0.65rem]";
  return "";
}

function centerTriangleClass(r: number, c: number): string | null {
  if (r === 6 && c === 6) return `${ludoStyle(0).piece} clip-triangle-tl`;
  if (r === 6 && c === 8) return `${ludoStyle(1).piece} clip-triangle-tr`;
  if (r === 8 && c === 8) return `${ludoStyle(2).piece} clip-triangle-br`;
  if (r === 8 && c === 6) return `${ludoStyle(3).piece} clip-triangle-bl`;
  return null;
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
          playerIndex={LUDO_STYLE_INDEX[state.current]}
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

      <div className="mx-auto w-full max-w-[min(100%,22rem)]">
        <div
          className="grid gap-0 rounded-2xl border border-amber-900/30 bg-amber-100/10 p-1.5 shadow-inner"
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
              cellMap.homeEntryMap,
              cellMap.baseMap
            );
            const here = tokensAt(state.tokens, { r, c });
            const markerStyle =
              info.owner != null ? ludoStyle(info.owner) : null;
            const triangle = info.kind === "center" ? centerTriangleClass(r, c) : null;
            const isPathCircle =
              info.kind === "path" && !info.isStart && info.owner == null;
            const isHomeCircle = info.kind === "home";
            const yardKey = coordKey({ r, c });
            const isYardSpot = LUDO_YARD.some((yard) =>
              yard.some((spot) => coordKey(spot) === yardKey)
            );

            const baseRadius =
              info.kind === "base" && info.owner != null
                ? baseCornerRadius(info.owner, r, c)
                : "";

            return (
              <div
                key={`${r}-${c}`}
                className={`relative aspect-square ${cellAppearance(info)} ${baseRadius}`}
              >
                {triangle ? (
                  <div className={`absolute inset-0 ${triangle}`} />
                ) : null}

                {isPathCircle ? (
                  <span
                    className="pointer-events-none absolute inset-[18%] rounded-full border border-slate-400/40 bg-white/90 shadow-sm"
                    aria-hidden
                  />
                ) : null}

                {isHomeCircle && !here.length && markerStyle ? (
                  <span
                    className={`pointer-events-none absolute inset-[12%] rounded-full border border-white/25 ${cellAppearance(info)}`}
                    aria-hidden
                  />
                ) : null}

                {info.isStart && info.owner != null ? (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <ArrowIcon direction={LUDO_START_ARROW[info.owner]} />
                  </span>
                ) : null}

                {info.isHomeEntry && info.owner != null ? (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <ArrowIcon direction={LUDO_HOME_ARROW[info.owner]} />
                  </span>
                ) : null}

                {isYardSpot && !here.length ? (
                  <span
                    className="pointer-events-none absolute inset-[22%] rounded-full border border-white/30 bg-white/20"
                    aria-hidden
                  />
                ) : null}

                {here.map((t) => {
                  const tokenIndex = state.tokens.indexOf(t);
                  const tokenStyle = ludoStyle(t.player);
                  const canMove = movableTokenIds.has(tokenIndex);
                  const onColoredCell = info.isStart || info.kind === "home";
                  return (
                    <button
                      key={`${t.player}-${t.index}`}
                      type="button"
                      onClick={() => onToken(tokenIndex)}
                      disabled={!canMove}
                      className={`absolute inset-[14%] z-10 rounded-full ${tokenStyle.piece} ${
                        canMove
                          ? "ring-2 ring-lime-300 ring-offset-1 ring-offset-slate-950"
                          : onColoredCell
                            ? "ring-2 ring-white ring-offset-1 ring-offset-slate-950 shadow-[0_1px_4px_rgba(0,0,0,0.6)]"
                            : tokenStyle.dotShadow
                      }`}
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
            const style = ludoStyle(p);
            const meta = LUDO_PLAYER_META[p];
            return (
              <span key={p} className="inline-flex items-center gap-1">
                <span className={`h-2.5 w-2.5 rounded-full ${style.piece}`} />
                P{displayIdx + 1}（{meta.name}・{meta.corner}）
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {state.activePlayers.map((p, displayIdx) => {
          const style = ludoStyle(p);
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
