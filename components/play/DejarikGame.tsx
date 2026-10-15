"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { OnlineSetupPanel } from "@/components/play/shared/OnlineSetupPanel";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { CpuDifficultyPicker } from "@/components/play/shared/CpuDifficultyPicker";
import {
  PlaySetupSection,
  setupPillClass,
} from "@/components/play/shared/PlaySetupCard";
import type { LocalMatchSetupKind } from "@/components/play/shared/PlayModeLocalMatchTabs";
import { DejarikBoard } from "@/components/play/dejarik/DejarikBoard";
import {
  CREATURE_LABEL,
  placementHomeCells,
  type CreatureType,
} from "@/lib/play/dejarik/board";
import { dejarikCellAtPoint } from "@/lib/play/dejarik/board-visual";
import {
  chooseMove,
  type CpuDifficulty,
  type DejarikCpuMove,
} from "@/lib/play/dejarik/ai";
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
  type Player,
} from "@/lib/play/dejarik/state";

type LocalPhase = "setup" | "active";
type MatchKind = "pvp" | "cpu";

const DESCRIPTION =
  "スター・ウォーズに登場するデジャリック（ホロチェス）を、ボドパッ！独自のルールで再現した2人用ゲーム。円形のホロ盤で4タイプのクリーチャーを動かし、相手をすべて除去します。";

function applyCpuMove(
  state: DejarikState,
  choice: DejarikCpuMove
): DejarikState | null {
  switch (choice.kind) {
    case "placement":
      return applyPlacement(state, choice.creatureType, choice.cell);
    case "move":
      return applyDejarikMove(state, choice.pieceId, choice.to);
    case "attack":
      return applyDejarikAttack(state, choice.pieceId, choice.to);
    case "endScoutTurn":
      return endScoutTurn(state);
    default:
      return null;
  }
}

export function DejarikGame() {
  const { recordLocalPlay, setPlayMode } = usePlayPage();
  const [localPhase, setLocalPhase] = useState<LocalPhase>("setup");
  const [cpuDifficulty, setCpuDifficulty] = useState<CpuDifficulty>("normal");
  const [humanSeat, setHumanSeat] = useState<Player>(0);
  const [matchKind, setMatchKind] = useState<MatchKind>("pvp");
  const [state, setState] = useState<DejarikState | null>(null);
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);
  const [placementType, setPlacementType] = useState<CreatureType | null>(null);
  const [placementHint, setPlacementHint] = useState<string | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const cpuSeat: Player = humanSeat === 0 ? 1 : 0;

  const startMatch = useCallback(
    (kind: LocalMatchSetupKind) => {
      recordLocalPlay();
      setMatchKind(kind);
      setPlayMode(
        kind === "cpu" ? { mode: "cpu", humanSeat } : { mode: "local" }
      );
      setState(initialDejarik());
      setSelectedPieceId(null);
      setPlacementType(null);
      setPlacementHint(null);
      setLocalPhase("active");
    },
    [recordLocalPlay, setPlayMode, humanSeat]
  );

  const reset = useCallback(() => {
    setLocalPhase("setup");
    setState(null);
    setSelectedPieceId(null);
    setPlacementType(null);
    setPlacementHint(null);
    setPlayMode({ mode: "local" });
  }, [setPlayMode]);

  usePlaySetupNavigation(localPhase === "setup", reset);

  const placement = state?.phase === "placement";
  const playing = state?.phase === "playing";
  const gameOver = state?.phase === "game-over";

  const turnPlayer =
    state && placement
      ? placementPlayer(state.placementStep)
      : state?.current ?? 0;

  const humanTurn =
    matchKind !== "cpu" ||
    (localPhase === "active" && !gameOver && turnPlayer === humanSeat);

  const cpuThinking =
    matchKind === "cpu" &&
    localPhase === "active" &&
    !gameOver &&
    turnPlayer === cpuSeat;

  useEffect(() => {
    if (!cpuThinking) return;

    const delayMs =
      cpuDifficulty === "hard"
        ? 550 + Math.random() * 250
        : cpuDifficulty === "normal"
          ? 400 + Math.random() * 250
          : 300 + Math.random() * 200;

    const timer = window.setTimeout(() => {
      const snapshot = stateRef.current;
      if (!snapshot || snapshot.phase === "game-over") return;
      const actor =
        snapshot.phase === "placement"
          ? placementPlayer(snapshot.placementStep)
          : snapshot.current;
      if (actor !== cpuSeat) return;

      const choice = chooseMove(snapshot, cpuDifficulty, cpuSeat);
      if (!choice) return;
      const next = applyCpuMove(snapshot, choice);
      if (!next) return;
      setState(next);
      setSelectedPieceId(null);
      setPlacementType(null);
      setPlacementHint(null);
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [cpuThinking, cpuSeat, cpuDifficulty, state]);

  const scoutEndVisible = useMemo(() => {
    if (!state?.scoutPartial || !playing || !humanTurn) return false;
    const p = state.scoutPartial;
    return (p.didMove || p.didAttack) && !(p.didMove && p.didAttack);
  }, [state, playing, humanTurn]);

  const onCell = useCallback(
    (cell: number) => {
      if (!state || !humanTurn) return;

      if (placement) {
        const player = placementPlayer(state.placementStep);
        const homes = placementHomeCells(player);
        if (!placementType) {
          setPlacementHint("先に盤下で置く型を選んでください。");
          return;
        }
        if (!homes.includes(cell) || state.cells[cell] !== null) {
          setPlacementHint("自分のホーム半円（光った外輪）の空きマスをタップしてください。");
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

      const partial = state.scoutPartial;
      const scoutContinues =
        partial &&
        (partial.didMove || partial.didAttack) &&
        !(partial.didMove && partial.didAttack);
      const actingPieceId =
        selectedPieceId ?? (scoutContinues ? partial.pieceId : null);

      const occupantId = state.cells[cell];

      if (actingPieceId !== null) {
        const attacks = legalAttackTargets(state, actingPieceId);
        const moves = legalMoveTargets(state, actingPieceId);
        if (attacks.includes(cell)) {
          const next = applyDejarikAttack(state, actingPieceId, cell);
          if (next) {
            setState(next);
            setSelectedPieceId(
              next.scoutPartial?.pieceId === actingPieceId ? actingPieceId : null
            );
          }
          return;
        }
        if (moves.includes(cell)) {
          const next = applyDejarikMove(state, actingPieceId, cell);
          if (next) {
            setState(next);
            setSelectedPieceId(
              next.scoutPartial?.pieceId === actingPieceId ? actingPieceId : null
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
    [state, placement, playing, selectedPieceId, placementType, humanTurn]
  );

  const onBoardPointer = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (!humanTurn) return;
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
    [onCell, humanTurn]
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
        onStartLocal={startMatch}
        loading={false}
        error={null}
        extra={(kind) =>
          kind === "cpu" ? (
            <>
              <PlaySetupSection label="CPUの強さ">
                <CpuDifficultyPicker
                  value={cpuDifficulty}
                  onChange={setCpuDifficulty}
                />
              </PlaySetupSection>
              <PlaySetupSection label="あなたの陣">
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHumanSeat(0)}
                    className={setupPillClass(humanSeat === 0)}
                  >
                    先手（下段）
                  </button>
                  <button
                    type="button"
                    onClick={() => setHumanSeat(1)}
                    className={setupPillClass(humanSeat === 1)}
                  >
                    後手（上段）
                  </button>
                </div>
              </PlaySetupSection>
            </>
          ) : null
        }
      />
    );
  }

  if (!state) return null;

  const placementSecond = secondPlayer(state.firstPlayer);
  const boardLocked = gameOver || !humanTurn;

  const highlightCells = new Set<number>();
  if (placement && humanTurn) {
    for (const c of placementHomeCells(turnPlayer)) {
      if (state.cells[c] === null) highlightCells.add(c);
    }
  } else if (playing && humanTurn) {
    const highlightPieceId =
      selectedPieceId ??
      (scoutEndVisible && state.scoutPartial ? state.scoutPartial.pieceId : null);
    if (highlightPieceId !== null) {
      for (let c = 0; c < state.cells.length; c++) {
        if (state.cells[c] === highlightPieceId) highlightCells.add(c);
      }
      for (const d of legalMoveTargets(state, highlightPieceId)) highlightCells.add(d);
      for (const d of legalAttackTargets(state, highlightPieceId)) highlightCells.add(d);
    }
  }

  const playerLabel =
    matchKind === "cpu" && turnPlayer === cpuSeat
      ? "CPU"
      : matchKind === "cpu" && turnPlayer === humanSeat
        ? "あなた"
        : `プレイヤー ${turnPlayer + 1}`;

  const defaultPlacementAction =
    "盤下で型を選び、光ったホーム半円の空きマスをタップしてください。";
  const defaultPlayingAction =
    scoutEndVisible && selectedPieceId === null
      ? "スカウトをタップするか、光ったマスで続けて操作してください。"
      : selectedPieceId === null
        ? "自分のクリーチャーをタップしてください。"
        : "光った空マスで移動、光った敵マスで攻撃してください。";

  return (
    <div className="space-y-6">
      {gameOver && state.winner !== null && (
        <ResultPanel
          variant="inline"
          winners={[state.winner]}
          details={
            <p className="text-slate-400">
              {state.winReason === "stall"
                ? matchKind === "cpu" && state.winner === humanSeat
                  ? "あなたの勝ち（相手が残り1体のまま3手以内に取れませんでした）。"
                  : matchKind === "cpu" && state.winner === cpuSeat
                    ? "CPUの勝ち（相手が残り1体のまま3手以内に取れませんでした）。"
                    : `プレイヤー ${state.winner! + 1} の勝ち（相手が残り1体のまま3手以内に取れませんでした）。`
                : matchKind === "cpu" && state.winner === humanSeat
                  ? "あなたが相手のクリーチャーをすべて除去しました。"
                  : matchKind === "cpu" && state.winner === cpuSeat
                    ? "CPUがあなたのクリーチャーをすべて除去しました。"
                    : `プレイヤー ${state.winner! + 1} が相手のクリーチャーをすべて除去しました。`}
            </p>
          }
          onReplay={reset}
        />
      )}

      {!gameOver && (
        <TurnBanner
          playerIndex={turnPlayer}
          playerLabel={playerLabel}
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
            cpuThinking
              ? "CPUの手番…"
              : placement
                ? defaultPlacementAction
                : defaultPlayingAction
          }
          notice={
            placement
              ? humanTurn
                ? placementHint ??
                  (state.placementStep === 0
                    ? `配置は後攻のプレイヤー ${placementSecond + 1} からです。`
                    : undefined)
                : undefined
              : scoutEndVisible
                ? "スカウト：もう1操作できるか、盤下の「手番終了」を押してください。"
                : undefined
          }
        />
      )}

      <div
        className={[
          "mx-auto max-w-md rounded-full bg-gradient-to-b from-amber-950/40 to-black/60 p-3",
          boardLocked ? "pointer-events-none opacity-95" : "",
        ].join(" ")}
      >
        <DejarikBoard
          state={state}
          highlightCells={highlightCells}
          highlightPlayer={turnPlayer}
          selectedPieceId={selectedPieceId}
          onPointerDown={onBoardPointer}
        />
        <p className="mt-2 text-center text-xs text-slate-500">
          クリーチャーは常に盤の中心を向きます。
        </p>
      </div>

      {!gameOver && placement && humanTurn && (
        <div className="flex flex-wrap justify-center gap-2">
          <p className="w-full text-center text-xs text-slate-400">
            残り {state.unplaced[turnPlayer].length} 体。置く型を選んでください。
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
