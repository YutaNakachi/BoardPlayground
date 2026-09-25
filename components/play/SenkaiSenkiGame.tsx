"use client";

import { useCallback, useMemo, useState } from "react";
import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { getPlayerTurnStyle } from "@/lib/player-colors";
import {
  applySenkaiAction,
  initialSenkaiSenki,
  legalMovesForPiece,
  legalRotations,
  pieceHasFacing,
  pieceLabel,
  rotateArrowNeighbor,
  shootTarget,
  ssCoord,
  SS_COLS,
  winReasonLabel,
  type Facing,
  type SenkaiPiece,
  type SenkaiState,
} from "@/lib/play/senkai-senki";

type Phase = "setup" | "playing" | "game-over";

const FACING_DEG: Record<Facing, number> = {
  0: 0,
  1: 90,
  2: 180,
  3: 270,
};

const FACING_ARROW: Record<Facing, string> = {
  0: "↑",
  1: "→",
  2: "↓",
  3: "←",
};

function PieceGlyph({ piece }: { piece: SenkaiPiece }) {
  const style = getPlayerTurnStyle(piece.owner);
  const fill = style.fill;
  const rot = pieceHasFacing(piece.type)
    ? FACING_DEG[piece.facing]
    : 0;

  const base = "relative flex h-9 w-9 items-center justify-center sm:h-10 sm:w-10";

  if (piece.type === "command") {
    return (
      <div className={base} aria-hidden>
        <div
          className="flex h-[70%] w-[70%] items-center justify-center rounded-md border-2 border-white/30 shadow-inner"
          style={{ backgroundColor: fill }}
        >
          <span className="text-[10px] font-bold text-white/90 sm:text-xs">指</span>
        </div>
      </div>
    );
  }

  if (piece.type === "light") {
    return (
      <div
        className={base}
        style={{ transform: `rotate(${rot}deg)` }}
        aria-hidden
      >
        <div
          className="h-[40%] w-[85%] rounded-sm"
          style={{ backgroundColor: fill }}
        />
        <div
          className="absolute left-[72%] top-1/2 h-[18%] w-[35%] -translate-y-1/2 rounded-sm"
          style={{ backgroundColor: fill, filter: "brightness(1.2)" }}
        />
        <span className="absolute -bottom-0.5 text-[8px] font-medium text-slate-400">
          軽
        </span>
      </div>
    );
  }

  if (piece.type === "heavy") {
    return (
      <div
        className={base}
        style={{ transform: `rotate(${rot}deg)` }}
        aria-hidden
      >
        <div
          className="h-[55%] w-[95%] rounded-sm"
          style={{ backgroundColor: fill }}
        />
        <div
          className="absolute left-[68%] top-1/2 h-[28%] w-[42%] -translate-y-1/2 rounded-sm"
          style={{ backgroundColor: fill, filter: "brightness(1.15)" }}
        />
        <span className="absolute -bottom-0.5 text-[8px] font-medium text-slate-400">
          重
        </span>
      </div>
    );
  }

  return (
    <div
      className={base}
      style={{ transform: `rotate(${rot}deg)` }}
      aria-hidden
    >
      <div
        className="h-0 w-0 border-b-[18px] border-l-[12px] border-r-[12px] border-b-current border-l-transparent border-r-transparent sm:border-b-[22px] sm:border-l-[14px] sm:border-r-[14px]"
        style={{ color: fill }}
      />
      <span className="absolute -bottom-0.5 text-[8px] font-medium text-slate-400">
        特
      </span>
    </div>
  );
}

export function SenkaiSenkiGame() {
  const { recordLocalPlay } = usePlayPage();
  const [phase, setPhase] = useState<Phase>("setup");
  const [state, setState] = useState<SenkaiState>(() => initialSenkaiSenki());
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const startGame = useCallback(() => {
    recordLocalPlay();
    setState(initialSenkaiSenki());
    setSelectedId(null);
    setNotice(null);
    setPhase("playing");
  }, [recordLocalPlay]);

  const selectedPiece =
    selectedId !== null ? state.pieces[selectedId] ?? null : null;

  const selectedIndex =
    selectedId !== null
      ? state.cells.findIndex((c) => c === selectedId)
      : -1;

  const moveTargets = useMemo(() => {
    if (selectedId === null || phase !== "playing" || state.gameOver) return [];
    return legalMovesForPiece(state, selectedId);
  }, [selectedId, phase, state]);

  const shootIdx = useMemo(() => {
    if (selectedId === null || phase !== "playing") return null;
    return shootTarget(state, selectedId);
  }, [selectedId, phase, state]);

  const rotateOptions = useMemo(() => {
    if (!selectedPiece) return [];
    return legalRotations(selectedPiece);
  }, [selectedPiece]);

  const rotateArrows = useMemo(() => {
    if (selectedIndex < 0 || rotateOptions.length === 0) return [];
    return rotateOptions
      .map((facing) => ({
        facing,
        cell: rotateArrowNeighbor(selectedIndex, facing),
      }))
      .filter(
        (x): x is { facing: Facing; cell: number } =>
          x.cell !== null && state.cells[x.cell] === null
      );
  }, [selectedIndex, rotateOptions, state.cells]);

  const apply = useCallback(
    (pieceId: number, action: Parameters<typeof applySenkaiAction>[2]) => {
      const next = applySenkaiAction(state, pieceId, action);
      if (!next) return false;
      setState(next);
      setSelectedId(null);
      setNotice(null);
      if (next.gameOver) setPhase("game-over");
      return true;
    },
    [state]
  );

  const onCell = useCallback(
    (index: number) => {
      if (phase !== "playing" || state.gameOver) return;
      const occupant = state.cells[index];
      const piece = occupant !== null ? state.pieces[occupant] : null;

      if (selectedId === null) {
        if (!piece || piece.owner !== state.current) {
          setNotice(
            piece ? "自分の駒を選んでください" : "空のマスです"
          );
          return;
        }
        setSelectedId(occupant);
        setNotice(null);
        return;
      }

      if (piece && piece.id === selectedId) {
        setSelectedId(null);
        return;
      }

      if (moveTargets.includes(index)) {
        if (!apply(selectedId, { kind: "move", to: index })) {
          setNotice("その移動はできません");
        }
        return;
      }

      if (shootIdx === index && shootIdx !== null) {
        if (!apply(selectedId, { kind: "shoot" })) {
          setNotice("射撃できません");
        }
        return;
      }

      if (piece && piece.owner === state.current) {
        setSelectedId(piece.id);
        setNotice(null);
        return;
      }

      setNotice("そこには移動・射撃できません");
    },
    [phase, state, selectedId, moveTargets, shootIdx, apply]
  );

  const onRotateArrow = useCallback(
    (facing: Facing) => {
      if (selectedId === null) return;
      if (!rotateOptions.includes(facing)) {
        setNotice("その向きには旋回できません");
        return;
      }
      if (!apply(selectedId, { kind: "rotate", facing })) {
        setNotice("旋回できません");
      }
    },
    [selectedId, rotateOptions, apply]
  );

  const backToSetup = useCallback(() => setPhase("setup"), []);
  usePlaySetupNavigation(phase === "setup", backToSetup);

  if (phase === "setup") {
    return (
      <SetupPanel
        title="砲塔戦棋"
        description="砲塔の向きと役割が異なる戦車で相手の指揮車を落とす2人対戦。軽・重は射撃、特攻車は体当たり、指揮車は全方位の移動です。"
        playerCount={2}
        playerOptions={[2]}
        onPlayerCount={() => {}}
        onStart={startGame}
      />
    );
  }

  const isGameOver = phase === "game-over" && state.winner !== null;

  return (
    <div className="space-y-4">
      {isGameOver && state.winner !== null && state.winReason && (
        <ResultPanel
          variant="inline"
          winners={[state.winner]}
          onReplay={() => setPhase("setup")}
          details={
            <p className="text-slate-400">{winReasonLabel(state.winReason)}</p>
          }
        />
      )}

      {!isGameOver && (
        <TurnBanner
          playerIndex={state.current}
          playerLabel={`プレイヤー ${state.current + 1}`}
          action={
            selectedPiece
              ? `${pieceLabel(selectedPiece.type)}を操作中`
              : "駒を選んでください"
          }
          notice={notice ?? undefined}
        />
      )}

      <div
        className="mx-auto grid w-full max-w-sm gap-1 rounded-xl border border-slate-700/80 bg-slate-900/50 p-2"
        style={{ gridTemplateColumns: `repeat(${SS_COLS}, minmax(0, 1fr))` }}
        aria-label="砲塔戦棋の盤面"
      >
        {state.cells.map((cellId, index) => {
          const piece = cellId !== null ? state.pieces[cellId] : null;
          const isMove = moveTargets.includes(index);
          const isShoot = shootIdx === index;
          const isSelected = cellId !== null && cellId === selectedId;
          const arrow = rotateArrows.find((a) => a.cell === index);
          const { row } = ssCoord(index);
          const isCenterRow = row === 2;

          return (
            <button
              key={index}
              type="button"
              disabled={isGameOver}
              onClick={() => {
                if (arrow) {
                  onRotateArrow(arrow.facing);
                  return;
                }
                onCell(index);
              }}
              className={[
                "relative flex aspect-square items-center justify-center rounded-sm border transition",
                isCenterRow ? "bg-slate-700/25" : "bg-slate-800/70",
                "border-slate-700/60",
                isSelected ? "ring-2 ring-indigo-400" : "",
                isMove && !isShoot ? "ring-2 ring-emerald-500/80 bg-emerald-950/40" : "",
                isShoot ? "ring-2 ring-orange-500 bg-orange-950/50" : "",
                arrow ? "ring-2 ring-amber-400/90 bg-amber-950/30" : "",
              ].join(" ")}
            >
              {arrow ? (
                <span
                  className="pointer-events-none text-xl font-bold text-amber-300"
                  aria-hidden
                >
                  {FACING_ARROW[arrow.facing]}
                </span>
              ) : null}
              {piece && !arrow ? (
                <>
                  <PieceGlyph piece={piece} />
                  {piece.rotateToken && pieceHasFacing(piece.type) ? (
                    <span
                      className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-amber-300 ring-1 ring-slate-900"
                      title="旋回権あり"
                    />
                  ) : null}
                </>
              ) : null}
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-500">
        緑＝移動／体当たり · 橙＝射撃 · 琥珀＝旋回（矢印） · 黄点＝旋回権
      </p>
    </div>
  );
}
