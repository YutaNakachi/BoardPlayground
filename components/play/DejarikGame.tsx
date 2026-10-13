"use client";

import { useCallback, useMemo, useState } from "react";
import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { OnlineSetupPanel } from "@/components/play/shared/OnlineSetupPanel";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { DejarikBoard } from "@/components/play/dejarik/DejarikBoard";
import {
  CREATURE_LABEL,
  placementHomeCells,
  type CreatureType,
} from "@/lib/play/dejarik/board";
import { dejarikCellAtPoint } from "@/lib/play/dejarik/board-visual";
import {
  applyDejarikAttack,
  applyDejarikMove,
  applyPlacement,
  endScoutTurn,
  initialDejarik,
  legalAttackTargets,
  legalMoveTargets,
  placementPlayer,
  secondPlayer,
  stallLabelForPlayer,
  type DejarikState,
} from "@/lib/play/dejarik/state";

type LocalPhase = "setup" | "active";

const DESCRIPTION =
  "円形のホロ盤で4型のクリーチャーを動かし、相手をすべて除去する2人用ゲーム。フィクション作品のイメージを再現したボドパッ！独自の非公式ルールです。";

export function DejarikGame() {
  const { recordLocalPlay, setPlayMode } = usePlayPage();
  const [localPhase, setLocalPhase] = useState<LocalPhase>("setup");
  const [state, setState] = useState<DejarikState | null>(null);
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);
  const [placementType, setPlacementType] = useState<CreatureType | null>(null);
  const [placementHint, setPlacementHint] = useState<string | null>(null);

  const startLocal = useCallback(() => {
    recordLocalPlay();
    setPlayMode({ mode: "local" });
    setState(initialDejarik());
    setSelectedPieceId(null);
    setPlacementType(null);
    setPlacementHint(null);
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
        const homes = placementHomeCells(player);
        if (!placementType) {
          setPlacementHint("先に盤下で置く型を選んでください");
          return;
        }
        if (!homes.includes(cell) || state.cells[cell] !== null) {
          setPlacementHint("自分のホーム半円（光った外輪）の空きマスをタップしてください");
          return;
        }
        const next = applyPlacement(state, placementType, cell);
        if (next) {
          setState(next);
          setPlacementType(null);
          setPlacementHint(null);
        }
        return;
      }

      if (!playing) return;

      if (state.scoutPartial && selectedPieceId !== state.scoutPartial.pieceId) {
        return;
      }

      const occupantId = state.cells[cell];

      if (selectedPieceId !== null) {
        const attacks = legalAttackTargets(state, selectedPieceId);
        const moves = legalMoveTargets(state, selectedPieceId);
        if (attacks.includes(cell)) {
          const next = applyDejarikAttack(state, selectedPieceId, cell);
          if (next) {
            setState(next);
            setSelectedPieceId(
              next.scoutPartial?.pieceId === selectedPieceId ? selectedPieceId : null
            );
          }
          return;
        }
        if (moves.includes(cell)) {
          const next = applyDejarikMove(state, selectedPieceId, cell);
          if (next) {
            setState(next);
            setSelectedPieceId(
              next.scoutPartial?.pieceId === selectedPieceId ? selectedPieceId : null
            );
          }
          return;
        }
      }

      if (occupantId === null) {
        setSelectedPieceId(null);
        return;
      }
      const piece = state.pieces[occupantId];
      if (!piece || piece.owner !== state.current) {
        setSelectedPieceId(null);
        return;
      }
      if (state.scoutPartial && state.scoutPartial.pieceId !== occupantId) return;
      setSelectedPieceId(occupantId);
    },
    [state, placement, playing, selectedPieceId, placementType]
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
      const cell = dejarikCellAtPoint(x, y);
      if (cell !== null) onCell(cell);
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
  const placementSecond = secondPlayer(state.firstPlayer);

  const highlightCells = new Set<number>();
  if (placement) {
    for (const c of placementHomeCells(turnPlayer)) {
      if (state.cells[c] === null) highlightCells.add(c);
    }
  } else if (playing && selectedPieceId !== null) {
    for (let c = 0; c < state.cells.length; c++) {
      if (state.cells[c] === selectedPieceId) highlightCells.add(c);
    }
    for (const d of legalMoveTargets(state, selectedPieceId)) highlightCells.add(d);
    for (const d of legalAttackTargets(state, selectedPieceId)) highlightCells.add(d);
  }

  return (
    <div className="space-y-6">
      {gameOver && state.winner !== null && (
        <ResultPanel
          variant="inline"
          winners={[state.winner]}
          details={
            <p className="text-slate-400">
              {state.winReason === "stall"
                ? `プレイヤー ${state.winner! + 1} の勝ち（相手が残り1体のまま3手以内に取れませんでした）`
                : `プレイヤー ${state.winner! + 1} が相手のクリーチャーをすべて除去しました。`}
            </p>
          }
          onReplay={startLocal}
        />
      )}

      {!gameOver && (
        <TurnBanner
          playerIndex={turnPlayer}
          playerLabel={`プレイヤー ${turnPlayer + 1}`}
          stats={
            placement
              ? `配置 ${state.placementStep + 1}/8 · 先攻はプレイヤー ${state.firstPlayer + 1}`
              : [
                  `先攻: プレイヤー ${state.firstPlayer + 1}`,
                  stallLabelForPlayer(state, turnPlayer),
                ]
                  .filter(Boolean)
                  .join(" · ")
          }
          action={
            placement
              ? "盤下で型を選び、光ったホーム半円の空きマスをタップ"
              : selectedPieceId === null
                ? "自分のクリーチャーをタップ"
                : "光った空マスで移動、光った敵マスで攻撃"
          }
          notice={
            placement
              ? placementHint ??
                (state.placementStep === 0
                  ? `配置は後攻のプレイヤー ${placementSecond + 1} から`
                  : undefined)
              : scoutEndVisible
                ? "スカウト：もう1操作できるか、盤下の「手番終了」"
                : undefined
          }
        />
      )}

      <div className="mx-auto max-w-md rounded-full bg-gradient-to-b from-amber-950/40 to-black/60 p-3">
        <DejarikBoard
          state={state}
          highlightCells={highlightCells}
          selectedPieceId={selectedPieceId}
          onPointerDown={onBoardPointer}
        />
        <p className="mt-2 text-center text-xs text-slate-500">
          Br=ブルート Pr=プレデター Gu=ガーディアン Sc=スカウト
        </p>
      </div>

      {!gameOver && placement && (
        <div className="flex flex-wrap justify-center gap-2">
          <p className="w-full text-center text-xs text-slate-400">
            残り {state.unplaced[turnPlayer].length} 体 — 置く型を選ぶ
          </p>
          {state.unplaced[turnPlayer].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setPlacementType(type);
                setPlacementHint(null);
              }}
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
