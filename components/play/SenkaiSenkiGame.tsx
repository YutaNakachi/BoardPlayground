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

/** 選択中駒マス内に置く旋回タップ領域 */
const ROTATE_HIT: Record<Facing, string> = {
  0: "left-1/2 top-0.5 -translate-x-1/2",
  1: "right-0.5 top-1/2 -translate-y-1/2",
  2: "left-1/2 bottom-0.5 -translate-x-1/2",
  3: "left-0.5 top-1/2 -translate-y-1/2",
};

/** 砲塔は facing 0 で上向き（盤面の row 減少方向） */
function TankArt({
  fill,
  facing,
  variant,
}: {
  fill: string;
  facing: Facing;
  variant: "light" | "heavy" | "scout";
}) {
  const rot = FACING_DEG[facing];
  const track =
    variant === "heavy"
      ? "h-[42%] w-[96%] rounded-[4px]"
      : variant === "light"
        ? "h-[26%] w-[62%] rounded-[2px]"
        : "h-[30%] w-[72%] rounded-[2px]";
  const barrelW =
    variant === "heavy" ? "w-[32%]" : variant === "light" ? "w-[14%]" : "w-[18%]";
  const barrelH =
    variant === "heavy" ? "h-[58%]" : variant === "light" ? "h-[50%]" : "h-[40%]";

  return (
    <div
      className="relative flex h-9 w-9 items-center justify-center sm:h-10 sm:w-10"
      style={{ transform: `rotate(${rot}deg)` }}
      aria-hidden
    >
      {variant === "scout" ? (
        <div
          className="absolute top-[18%] h-0 w-0 border-b-[22px] border-l-[11px] border-r-[11px] border-b-current border-l-transparent border-r-transparent"
          style={{ color: fill }}
        />
      ) : (
        <>
          <div
            className={`absolute bottom-[18%] ${track} border border-black/25`}
            style={{ backgroundColor: fill }}
          />
          <div
            className={`absolute top-[8%] left-1/2 ${barrelH} ${barrelW} -translate-x-1/2 rounded-sm border border-black/20`}
            style={{ backgroundColor: fill, filter: "brightness(1.12)" }}
          />
          <div
            className={`absolute bottom-[26%] left-1/2 -translate-x-1/2 rounded-sm border border-black/20 ${
              variant === "heavy" ? "h-[30%] w-[52%]" : "h-[18%] w-[28%]"
            }`}
            style={{ backgroundColor: fill, filter: "brightness(0.9)" }}
          />
        </>
      )}
      {variant === "heavy" ? (
        <>
          <div className="absolute bottom-[22%] left-[6%] h-[10%] w-[22%] rounded-sm bg-black/35" />
          <div className="absolute bottom-[22%] right-[6%] h-[10%] w-[22%] rounded-sm bg-black/35" />
          <div
            className="absolute top-[6%] left-1/2 h-[12%] w-[38%] -translate-x-1/2 rounded-sm border border-black/25"
            style={{ backgroundColor: fill, filter: "brightness(1.08)" }}
          />
        </>
      ) : variant === "light" ? (
        <div className="absolute bottom-[12%] left-1/2 h-[6%] w-[50%] -translate-x-1/2 rounded-full bg-black/25" />
      ) : null}
    </div>
  );
}

function RotateTokenBadge({ owner }: { owner: SenkaiPiece["owner"] }) {
  const { fill } = getPlayerTurnStyle(owner);
  return (
    <span
      className={[
        "pointer-events-none absolute z-10 flex h-[15px] w-[15px] items-center justify-center rounded-[3px] border sm:h-4 sm:w-4",
        owner === 0 ? "right-0.5 top-0.5" : "bottom-0.5 left-0.5",
      ].join(" ")}
      style={{
        color: fill,
        borderColor: fill,
        backgroundColor: `${fill}28`,
        boxShadow: `0 0 6px ${fill}66`,
      }}
      title="旋回権あり"
      aria-hidden
    >
      <svg
        viewBox="0 0 16 16"
        className="h-2.5 w-2.5 sm:h-3 sm:w-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M13.5 8A4.5 4.5 0 1 1 9 3.5" />
        <path d="M13.5 3.5V7H10" />
      </svg>
    </span>
  );
}

function PieceGlyph({ piece }: { piece: SenkaiPiece }) {
  const style = getPlayerTurnStyle(piece.owner);
  const fill = style.fill;
  const base = "relative flex h-9 w-9 items-center justify-center sm:h-10 sm:w-10";

  if (piece.type === "command") {
    return (
      <div className={base} aria-hidden>
        <div
          className="flex h-[72%] w-[72%] items-center justify-center rounded-sm border-2 border-white/35 shadow-inner"
          style={{ backgroundColor: fill }}
        >
          <span className="text-base font-bold leading-none text-amber-100 sm:text-lg">
            ★
          </span>
        </div>
      </div>
    );
  }

  if (piece.type === "light") {
    return <TankArt fill={fill} facing={piece.facing} variant="light" />;
  }

  if (piece.type === "heavy") {
    return <TankArt fill={fill} facing={piece.facing} variant="heavy" />;
  }

  return <TankArt fill={fill} facing={piece.facing} variant="scout" />;
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

  const showRotateControls = Boolean(
    selectedPiece &&
      selectedId !== null &&
      selectedPiece.id === selectedId &&
      rotateOptions.length > 0
  );

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
    [
      phase,
      state.gameOver,
      state.cells,
      state.pieces,
      state.current,
      selectedId,
      moveTargets,
      shootIdx,
      apply,
    ]
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
          const { row } = ssCoord(index);
          const isCenterRow = row === 2;

          return (
            <button
              key={index}
              type="button"
              disabled={isGameOver}
              onClick={() => onCell(index)}
              className={[
                "relative flex aspect-square items-center justify-center rounded-sm border transition",
                isCenterRow ? "bg-slate-700/25" : "bg-slate-800/70",
                "border-slate-700/60",
                isSelected ? "ring-2 ring-indigo-400" : "",
                isMove && !isShoot ? "ring-2 ring-emerald-500/80 bg-emerald-950/40" : "",
                isShoot ? "ring-2 ring-orange-500 bg-orange-950/50" : "",
                showRotateControls && isSelected
                  ? "ring-2 ring-amber-400/70"
                  : "",
              ].join(" ")}
            >
              {piece ? (
                <>
                  <PieceGlyph piece={piece} />
                  {piece.rotateToken && pieceHasFacing(piece.type) ? (
                    <RotateTokenBadge owner={piece.owner} />
                  ) : null}
                  {showRotateControls && isSelected
                    ? rotateOptions.map((facing) => (
                        <button
                          key={facing}
                          type="button"
                          aria-label={`${FACING_ARROW[facing]}へ旋回`}
                          className={[
                            "absolute z-20 flex h-6 w-6 items-center justify-center rounded-md border border-amber-400/80 bg-amber-950/90 text-sm font-bold text-amber-200 shadow-md hover:bg-amber-900",
                            ROTATE_HIT[facing],
                          ].join(" ")}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRotateArrow(facing);
                          }}
                        >
                          {FACING_ARROW[facing]}
                        </button>
                      ))
                    : null}
                </>
              ) : null}
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-500">
        緑＝移動／体当たり · 橙＝射撃 · 選択中の縁矢印＝旋回 · 色付き↻＝旋回権
      </p>
    </div>
  );
}
