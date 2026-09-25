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
  legalActionsForPiece,
  legalMovesForPiece,
  legalRotations,
  pieceLabel,
  shootTarget,
  ssCoord,
  SS_COLS,
  SS_ROWS,
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

function TankGlyph({
  piece,
  size = "md",
}: {
  piece: SenkaiPiece;
  size?: "md" | "sm";
}) {
  const style = getPlayerTurnStyle(piece.owner);
  const dim = size === "sm" ? "h-7 w-7" : "h-9 w-9 sm:h-10 sm:w-10";
  return (
    <div
      className={`relative ${dim} flex items-center justify-center`}
      style={{ transform: `rotate(${FACING_DEG[piece.facing]}deg)` }}
      aria-hidden
    >
      <div
        className="h-[55%] w-[75%] rounded-sm"
        style={{ backgroundColor: style.fill }}
      />
      <div
        className="absolute top-[8%] h-[35%] w-[22%] rounded-sm"
        style={{ backgroundColor: style.fill, filter: "brightness(1.15)" }}
      />
      {piece.rotateToken ? (
        <span
          className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-300 ring-1 ring-slate-900"
          title="旋回権あり"
        />
      ) : null}
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

  const apply = useCallback(
    (pieceId: number, action: ReturnType<typeof legalActionsForPiece>[number]) => {
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

  const onRotate = useCallback(
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
        title="旋回戦棋"
        description="向きを持つ戦車駒で相手の指揮車を撃ち落とす2人対戦。移動または射撃で旋回権を得てから向きを変えられます。"
        playerCount={2}
        playerOptions={[2]}
        onPlayerCount={() => {}}
        onStart={startGame}
      />
    );
  }

  const isGameOver = phase === "game-over" && state.winner !== null;

  return (
    <div className="space-y-6">
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
        className="mx-auto grid w-full max-w-md gap-0.5 rounded-xl border border-slate-700/80 bg-slate-900/50 p-2 sm:max-w-lg"
        style={{ gridTemplateColumns: `repeat(${SS_COLS}, minmax(0, 1fr))` }}
        aria-label="旋回戦棋の盤面"
      >
        {state.cells.map((cellId, index) => {
          const piece = cellId !== null ? state.pieces[cellId] : null;
          const isMove = moveTargets.includes(index);
          const isShoot = shootIdx === index;
          const isSelected = cellId !== null && cellId === selectedId;
          const { row } = ssCoord(index);
          const isCenterRow = row === 3;

          return (
            <button
              key={index}
              type="button"
              disabled={isGameOver}
              onClick={() => onCell(index)}
              className={[
                "relative flex aspect-[5/6] items-center justify-center rounded-sm border transition",
                isCenterRow ? "bg-slate-700/30" : "bg-slate-800/70",
                "border-slate-700/60",
                isSelected ? "ring-2 ring-indigo-400" : "",
                isMove && !isShoot ? "ring-2 ring-emerald-500/80 bg-emerald-950/40" : "",
                isShoot ? "ring-2 ring-orange-500 bg-orange-950/50" : "",
              ].join(" ")}
            >
              {piece ? <TankGlyph piece={piece} /> : null}
            </button>
          );
        })}
      </div>

      {!isGameOver && selectedPiece && rotateOptions.length > 0 && (
        <div className="mx-auto flex max-w-lg flex-col items-center gap-2">
          <p className="text-xs text-slate-500">旋回（タップで確定）</p>
          <div className="flex flex-wrap justify-center gap-3">
            {rotateOptions.map((facing) => (
              <button
                key={facing}
                type="button"
                onClick={() => onRotate(facing)}
                className="rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-2 hover:border-indigo-400"
              >
                <TankGlyph
                  piece={{ ...selectedPiece, facing }}
                  size="sm"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-slate-500">
        緑＝移動／体当たり先 · 橙＝射撃 · 黄点＝旋回権 · プレイヤー1が先手
      </p>
    </div>
  );
}
