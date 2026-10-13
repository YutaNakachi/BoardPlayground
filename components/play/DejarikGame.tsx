"use client";

import { useCallback, useMemo, useState } from "react";
import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { OnlineSetupPanel } from "@/components/play/shared/OnlineSetupPanel";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import {
  CREATURE_LABEL,
  DEJARIK_CELL_COUNT,
  DEJARIK_NODE_POS,
  DEJARIK_VIEW_BOX,
  getOrthoNeighbors,
  type CreatureType,
  validPlacementStarts,
} from "@/lib/play/dejarik/board";
import {
  applyDejarikAttack,
  applyDejarikMove,
  applyPlacement,
  endScoutTurn,
  homeCellsForPlayer,
  initialDejarik,
  legalAttackTargets,
  legalMoveTargets,
  placementPlayer,
  setHomeStart,
  type DejarikState,
} from "@/lib/play/dejarik/state";
import { getPlayerTurnStyle } from "@/lib/player-colors";

type LocalPhase = "setup" | "active";
type ActionMode = "move" | "attack";

const HIT_RADIUS = 14;
const DESCRIPTION =
  "円形のホロ盤で4型のクリーチャーを動かし、相手をすべて除去する2人用ゲーム。フィクション作品のイメージを再現したボドパッ！独自の非公式ルールです。";

const TYPE_ABBR: Record<CreatureType, string> = {
  brute: "Br",
  predator: "Pr",
  guardian: "Gu",
  scout: "Sc",
};

function buildBoardEdges(): [number, number][] {
  const seen = new Set<string>();
  const edges: [number, number][] = [];
  for (let c = 0; c < DEJARIK_CELL_COUNT; c++) {
    for (const n of getOrthoNeighbors(c)) {
      const key = c < n ? `${c}-${n}` : `${n}-${c}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push([c, n]);
    }
  }
  return edges;
}

const BOARD_EDGES = buildBoardEdges();

export function DejarikGame() {
  const { recordLocalPlay, setPlayMode } = usePlayPage();
  const [localPhase, setLocalPhase] = useState<LocalPhase>("setup");
  const [state, setState] = useState<DejarikState | null>(null);
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);
  const [actionMode, setActionMode] = useState<ActionMode>("move");
  const [placementType, setPlacementType] = useState<CreatureType | null>(null);

  const startLocal = useCallback(() => {
    recordLocalPlay();
    setPlayMode({ mode: "local" });
    setState(initialDejarik());
    setSelectedPieceId(null);
    setPlacementType(null);
    setLocalPhase("active");
  }, [recordLocalPlay, setPlayMode]);

  const reset = useCallback(() => {
    setLocalPhase("setup");
    setState(null);
    setSelectedPieceId(null);
    setPlacementType(null);
    setPlayMode({ mode: "local" });
  }, [setPlayMode]);

  usePlaySetupNavigation(localPhase === "setup", reset);

  const placement = state?.phase === "placement";
  const playing = state?.phase === "playing";
  const gameOver = state?.phase === "game-over";

  const destinations = useMemo(() => {
    if (!state || !playing || selectedPieceId === null) return [];
    return actionMode === "move"
      ? legalMoveTargets(state, selectedPieceId)
      : legalAttackTargets(state, selectedPieceId);
  }, [state, playing, selectedPieceId, actionMode]);

  const scoutEndVisible = useMemo(() => {
    if (!state?.scoutPartial || !playing) return false;
    const p = state.scoutPartial;
    return (p.didMove || p.didAttack) && !(p.didMove && p.didAttack);
  }, [state, playing]);

  const onCell = useCallback(
    (cell: number) => {
      if (!state) return;

      if (placement) {
        const player = placementPlayer(state.placementStep);
        const homes = homeCellsForPlayer(state, player);
        if (!homes) {
          if (validPlacementStarts(player).includes(cell)) {
            const next = setHomeStart(state, player, cell);
            if (next) setState(next);
          }
          return;
        }
        if (!placementType) return;
        const next = applyPlacement(state, placementType, cell);
        if (next) {
          setState(next);
          setPlacementType(null);
        }
        return;
      }

      if (!playing) return;

      if (state.scoutPartial && selectedPieceId !== state.scoutPartial.pieceId) {
        return;
      }

      const pieceId = state.cells[cell];
      if (pieceId !== null && destinations.includes(cell) && selectedPieceId !== null) {
        const next =
          actionMode === "move"
            ? applyDejarikMove(state, selectedPieceId, cell)
            : applyDejarikAttack(state, selectedPieceId, cell);
        if (next) {
          setState(next);
          if (next.scoutPartial?.pieceId === selectedPieceId) {
            setSelectedPieceId(selectedPieceId);
          } else {
            setSelectedPieceId(null);
          }
        }
        return;
      }

      if (pieceId === null) {
        setSelectedPieceId(null);
        return;
      }
      const piece = state.pieces[pieceId];
      if (!piece || piece.owner !== state.current) {
        setSelectedPieceId(null);
        return;
      }
      if (state.scoutPartial && state.scoutPartial.pieceId !== pieceId) return;
      setSelectedPieceId(pieceId);
    },
    [state, placement, playing, destinations, selectedPieceId, actionMode, placementType]
  );

  const onBoardPointer = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      const svg = event.currentTarget;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const { x, y } = point.matrixTransform(ctm.inverse());
      let nearest = -1;
      let nearestDist = HIT_RADIUS * HIT_RADIUS;
      for (let i = 0; i < DEJARIK_NODE_POS.length; i++) {
        const [px, py] = DEJARIK_NODE_POS[i];
        const dx = px - x;
        const dy = py - y;
        const dist = dx * dx + dy * dy;
        if (dist <= nearestDist) {
          nearestDist = dist;
          nearest = i;
        }
      }
      if (nearest >= 0) onCell(nearest);
    },
    [onCell]
  );

  if (localPhase === "setup") {
    return (
      <OnlineSetupPanel
        title="デジャリック"
        description={DESCRIPTION}
        mode="local"
        onModeChange={() => {}}
        onlineSupported={false}
        onCreateRoom={() => {}}
        onJoinRoom={() => {}}
        onStartLocal={startLocal}
        loading={false}
        error={null}
      />
    );
  }

  if (!state) return null;

  const turnPlayer = placement ? placementPlayer(state.placementStep) : state.current;
  const placementHomes =
    placement ? homeCellsForPlayer(state, turnPlayer) : null;

  const highlightCells = new Set<number>();
  if (placement && !placementHomes) {
    for (const start of validPlacementStarts(turnPlayer)) {
      highlightCells.add(start);
    }
  } else if (placement && placementHomes) {
    for (const c of placementHomes) {
      if (state.cells[c] === null) highlightCells.add(c);
    }
  } else if (playing && selectedPieceId !== null) {
    for (const d of destinations) highlightCells.add(d);
  }

  return (
    <div className="space-y-6">
      {gameOver && state.winner !== null && (
        <ResultPanel
          variant="inline"
          winners={[state.winner]}
          details={
            <p className="text-slate-400">
              プレイヤー {state.winner + 1} が相手のクリーチャーをすべて除去しました。
            </p>
          }
          onReplay={startLocal}
        />
      )}

      {!gameOver && (
        <TurnBanner
          playerIndex={turnPlayer}
          playerLabel={`プレイヤー ${turnPlayer + 1}`}
          action={
            placement
              ? placementHomes
                ? "型を選び、ホームの空きマスをタップ"
                : "ホームの連続4マス（開始マス）をタップ"
              : selectedPieceId === null
                ? "自分のクリーチャーを選ぶ"
                : actionMode === "move"
                  ? "移動先をタップ"
                  : "攻撃先をタップ"
          }
          notice={
            placement
              ? "非公式フィクションルール"
              : scoutEndVisible
                ? "スカウトはもう1操作できるか、下の「手番終了」"
                : undefined
          }
        />
      )}

      {!gameOver && playing && (
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setActionMode("move")}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              actionMode === "move"
                ? "bg-accent/25 text-white ring-1 ring-accent/50"
                : "bg-white/5 text-slate-400"
            }`}
          >
            移動
          </button>
          <button
            type="button"
            onClick={() => setActionMode("attack")}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              actionMode === "attack"
                ? "bg-accent/25 text-white ring-1 ring-accent/50"
                : "bg-white/5 text-slate-400"
            }`}
          >
            攻撃
          </button>
        </div>
      )}

      {!gameOver && placement && placementHomes && (
        <div className="flex flex-wrap justify-center gap-2">
          {state.unplaced[turnPlayer].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setPlacementType(type)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                placementType === type
                  ? "bg-accent/25 text-white ring-1 ring-accent/50"
                  : "bg-white/5 text-slate-300"
              }`}
            >
              {CREATURE_LABEL[type]}
            </button>
          ))}
        </div>
      )}

      <div className="mx-auto max-w-md">
        <svg
          viewBox={DEJARIK_VIEW_BOX}
          className="w-full touch-none select-none"
          onPointerDown={onBoardPointer}
          role="img"
          aria-label="デジャリック盤"
        >
          {BOARD_EDGES.map(([a, b]) => {
            const [x1, y1] = DEJARIK_NODE_POS[a];
            const [x2, y2] = DEJARIK_NODE_POS[b];
            return (
              <line
                key={`${a}-${b}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgb(100 116 139 / 0.45)"
                strokeWidth={1}
              />
            );
          })}
          {DEJARIK_NODE_POS.map(([cx, cy], cell) => {
            const pieceId = state.cells[cell];
            const piece = pieceId !== null ? state.pieces[pieceId] : null;
            const hl = highlightCells.has(cell);
            const isSelected = pieceId !== null && pieceId === selectedPieceId;
            const owner = piece?.owner;
            const fill =
              owner !== undefined ? getPlayerTurnStyle(owner).fill : "rgb(51 65 85)";
            return (
              <g key={cell}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={hl ? 11 : 9}
                  fill={hl ? "rgb(99 102 241 / 0.35)" : "rgb(30 41 59 / 0.9)"}
                  stroke={isSelected ? "rgb(129 140 248)" : "rgb(71 85 105)"}
                  strokeWidth={isSelected ? 2.5 : 1}
                />
                {piece && (
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={fill}
                    fontSize={8}
                    fontWeight={700}
                    className="pointer-events-none"
                  >
                    {TYPE_ABBR[piece.type]}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <p className="mt-2 text-center text-xs text-slate-500">
          Br=ブルート Pr=プレデター Gu=ガーディアン Sc=スカウト
        </p>
      </div>

      {!gameOver && scoutEndVisible && (
        <div className="flex justify-center">
          <button
            type="button"
            className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
            onClick={() => {
              const next = endScoutTurn(state);
              if (next) {
                setState(next);
                setSelectedPieceId(null);
              }
            }}
          >
            手番終了
          </button>
        </div>
      )}
    </div>
  );
}
