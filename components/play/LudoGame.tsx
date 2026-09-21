"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DiceFace } from "@/components/play/shared/DiceFace";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { getPlayerTurnStyle } from "@/lib/player-colors";
import {
  coordKey,
  LUDO_BASE_REGIONS,
  LUDO_DISPLAY_GRID,
  LUDO_DISPLAY_MARGIN,
  LUDO_GRID,
  LUDO_HOME,
  LUDO_HOME_ARROW,
  LUDO_HOME_ENTRY,
  LUDO_PATH,
  LUDO_START_ARROW,
  LUDO_STYLE_INDEX,
  LUDO_YARD,
  LUDO_YARD_BG,
  ludoStartCoord,
  type Coord,
} from "@/lib/play/ludo-board";
import {
  applyLudoMove,
  endLudoTurn,
  initialLudo,
  isLudoTokenFinished,
  ludoMoveAnimationSteps,
  ludoMoves,
  ludoTokenCoord,
  rollLudo,
  type LudoState,
  type LudoToken,
} from "@/lib/play/ludo";

const LUDO_STEP_MS = 130;

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
  if (info.kind === "base") return LUDO_YARD_BG[info.owner];
  return "bg-transparent";
}

function tokensAt(tokens: LudoToken[], coord: Coord): LudoToken[] {
  const key = coordKey(coord);
  return tokens.filter((t) => coordKey(ludoTokenCoord(t)) === key);
}

function tokenIndexIn(tokens: LudoToken[], token: LudoToken): number {
  return tokens.findIndex((t) => t.player === token.player && t.index === token.index);
}

function tokensByPlayer(tokens: LudoToken[]): [number, LudoToken[]][] {
  const map = new Map<number, LudoToken[]>();
  for (const t of tokens) {
    const group = map.get(t.player) ?? [];
    group.push(t);
    map.set(t.player, group);
  }
  return Array.from(map.entries());
}

function baseCornerRadius(player: number, r: number, c: number): string {
  if (player === 0 && r === 1 && c === 1) return "rounded-tl-[0.65rem]";
  if (player === 1 && r === 1 && c === 13) return "rounded-tr-[0.65rem]";
  if (player === 2 && r === 13 && c === 13) return "rounded-br-[0.65rem]";
  if (player === 3 && r === 13 && c === 1) return "rounded-bl-[0.65rem]";
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

  const [diceFace, setDiceFace] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const rollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [animatingTokenIndex, setAnimatingTokenIndex] = useState<number | null>(null);
  const [animatingToken, setAnimatingToken] = useState<LudoToken | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAnimating = animatingTokenIndex !== null;

  const displayTokens = useMemo(() => {
    if (animatingTokenIndex === null || animatingToken === null) return state.tokens;
    return state.tokens.map((t, i) =>
      i === animatingTokenIndex ? animatingToken : t
    );
  }, [state.tokens, animatingTokenIndex, animatingToken]);

  useEffect(() => {
    return () => {
      if (rollTimerRef.current) clearInterval(rollTimerRef.current);
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, []);

  const onRoll = useCallback(() => {
    if (isAnimating || isRolling || state.lastRoll != null || state.winner != null) return;

    setIsRolling(true);
    let ticks = 0;
    rollTimerRef.current = setInterval(() => {
      ticks += 1;
      setDiceFace(Math.floor(Math.random() * 6) + 1);
      if (ticks >= 10) {
        if (rollTimerRef.current) clearInterval(rollTimerRef.current);
        rollTimerRef.current = null;
        setState((s) => {
          const next = rollLudo(s);
          setDiceFace(next.lastRoll ?? 1);
          setIsRolling(false);
          return next;
        });
      }
    }, 70);
  }, [isAnimating, isRolling, state.lastRoll, state.winner]);

  const onToken = useCallback(
    (tokenIndex: number) => {
      if (isAnimating) return;
      if (!moves.some((m) => m.tokenIndex === tokenIndex)) return;

      const roll = state.lastRoll!;
      const steps = ludoMoveAnimationSteps(state.tokens[tokenIndex], roll);

      if (steps.length === 0) {
        const next = applyLudoMove(state, { tokenIndex });
        if (next) setState(next);
        if (next?.winner != null) setPhase("game-over");
        return;
      }

      setAnimatingTokenIndex(tokenIndex);

      const finishMove = () => {
        const next = applyLudoMove(state, { tokenIndex });
        setAnimatingTokenIndex(null);
        setAnimatingToken(null);
        if (next) setState(next);
        if (next?.winner != null) setPhase("game-over");
      };

      const showStep = (stepIndex: number) => {
        setAnimatingToken(steps[stepIndex]);
        if (stepIndex < steps.length - 1) {
          animTimerRef.current = setTimeout(() => showStep(stepIndex + 1), LUDO_STEP_MS);
        } else {
          animTimerRef.current = setTimeout(finishMove, LUDO_STEP_MS);
        }
      };

      showStep(0);
    },
    [isAnimating, moves, state]
  );

  const passTurn = useCallback(() => {
    if (isAnimating) return;
    setState((s) => endLudoTurn(s));
  }, [isAnimating]);

  const backToSetup = useCallback(() => setPhase("setup"), []);
  usePlaySetupNavigation(phase === "setup", backToSetup);

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
                ? state.extraTurn
                  ? "出せるコマがありません（もう一度振れます）"
                  : "出せるコマがありません"
                : "コマを選ぶ"
          }
        />
      )}

      <div className="mx-auto w-full max-w-[min(100%,22rem)]">
        <div
          className="grid gap-0 rounded-2xl border border-amber-900/30 bg-amber-100/10 p-1.5 shadow-inner"
          style={{
            gridTemplateColumns: `repeat(${LUDO_DISPLAY_GRID}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: LUDO_DISPLAY_GRID * LUDO_DISPLAY_GRID }, (_, i) => {
            const r = Math.floor(i / LUDO_DISPLAY_GRID) + LUDO_DISPLAY_MARGIN;
            const c = (i % LUDO_DISPLAY_GRID) + LUDO_DISPLAY_MARGIN;
            const info = cellInfo(
              r,
              c,
              cellMap.pathKeys,
              cellMap.homeMap,
              cellMap.startMap,
              cellMap.homeEntryMap,
              cellMap.baseMap
            );
            const here = tokensAt(displayTokens, { r, c });
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

                {tokensByPlayer(here).flatMap(([player, group]) => {
                  const tokenStyle = ludoStyle(player);
                  const onColoredCell = info.isStart || info.kind === "home";
                  const finished = group.filter((t) => {
                    const i = tokenIndexIn(state.tokens, t);
                    return i >= 0 && isLudoTokenFinished(state.tokens, i);
                  });
                  const active = group.filter((t) => {
                    const i = tokenIndexIn(state.tokens, t);
                    return i >= 0 && !isLudoTokenFinished(state.tokens, i);
                  });
                  const pieces: ReactNode[] = [];

                  for (const token of finished) {
                    pieces.push(
                      <span
                        key={`${player}-done-${token.index}`}
                        className={`pointer-events-none absolute inset-[14%] z-10 rounded-full opacity-90 ${tokenStyle.piece} ${
                          onColoredCell
                            ? "ring-2 ring-white/70 ring-offset-1 ring-offset-slate-950"
                            : tokenStyle.dotShadow
                        }`}
                        aria-label={`P${state.activePlayers.indexOf(player) + 1} ゴール済みコマ`}
                      />
                    );
                  }

                  if (active.length === 0) return pieces;

                  const indices = active.map((t) => tokenIndexIn(state.tokens, t));
                  const tokenIndex =
                    indices.find((i) => movableTokenIds.has(i)) ?? indices[0];
                  const canMove = !isAnimating && movableTokenIds.has(tokenIndex);
                  const isMoving = tokenIndex === animatingTokenIndex;

                  pieces.push(
                    <button
                      key={`${player}-active-${active.map((t) => t.index).join("-")}`}
                      type="button"
                      onClick={() => onToken(tokenIndex)}
                      disabled={!canMove}
                      className={`absolute inset-[14%] z-10 rounded-full transition-transform duration-75 ${tokenStyle.piece} ${
                        isMoving
                          ? "z-20 scale-110 ring-2 ring-white ring-offset-1 ring-offset-slate-950"
                          : canMove
                            ? "ring-2 ring-lime-300 ring-offset-1 ring-offset-slate-950"
                            : onColoredCell
                              ? "ring-2 ring-white ring-offset-1 ring-offset-slate-950 shadow-[0_1px_4px_rgba(0,0,0,0.6)]"
                              : tokenStyle.dotShadow
                      }`}
                      aria-label={`P${state.activePlayers.indexOf(player) + 1} コマ ${active.length}個`}
                    >
                      {active.length >= 2 ? (
                        <span
                          className="pointer-events-none flex h-full items-center justify-center text-[9px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                          aria-hidden
                        >
                          {active.length}
                        </span>
                      ) : null}
                    </button>
                  );

                  return pieces;
                })}
              </div>
            );
          })}
        </div>
      </div>

      {!isGameOver ? (
        <div className="flex flex-col items-center gap-3">
          {(isRolling || state.lastRoll != null) && (
            <div className="flex flex-col items-center gap-2">
              <DiceFace value={diceFace} size="lg" rolling={isRolling} />
              {isRolling ? <p className="text-sm text-slate-400">振っています…</p> : null}
            </div>
          )}

          {state.lastRoll == null && !isRolling && !isAnimating ? (
            <button type="button" onClick={onRoll} className="btn-game">
              サイコロを振る
            </button>
          ) : null}
        </div>
      ) : null}

      {state.lastRoll != null && moves.length === 0 && !isGameOver && !isAnimating ? (
        <div className="text-center">
          <button
            type="button"
            onClick={passTurn}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm"
          >
            {state.extraTurn ? "もう一度振る" : "手番を終える"}
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
