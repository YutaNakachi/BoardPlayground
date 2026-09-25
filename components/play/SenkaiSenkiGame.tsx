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
  isEdgeStuck,
  legalRotationFacings,
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

const PIECE_TOKEN_SRC: Record<SenkaiPiece["type"], string> = {
  light: "/games/senkai-senki/senkai-light-token.png",
  heavy: "/games/senkai-senki/senkai-heavy-token.png",
  scout: "/games/senkai-senki/senkai-scout-token.png",
  command: "/games/senkai-senki/senkai-command-token.png",
};

/** トークン画像は facing 0 で上向き（盤面の row 減少方向）。指揮車は向きなし */
function PieceTokenImage({
  fill,
  facing,
  type,
}: {
  fill: string;
  facing: Facing;
  type: SenkaiPiece["type"];
}) {
  const src = PIECE_TOKEN_SRC[type];
  const rotate = type === "command" ? 0 : FACING_DEG[facing];
  const maskStyle = {
    backgroundColor: fill,
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
  } as const;

  return (
    <div
      className="relative flex h-full w-full min-h-[2.35rem] min-w-[2.35rem] max-h-11 max-w-11 items-center justify-center sm:max-h-12 sm:max-w-12"
      aria-hidden
    >
      <div
        className="h-[108%] w-[108%] max-h-[2.75rem] max-w-[2.75rem] sm:max-h-[3rem] sm:max-w-[3rem]"
        style={{
          ...maskStyle,
          transform: `rotate(${rotate}deg)`,
          filter: "drop-shadow(0 1px 1px rgb(0 0 0 / 0.45))",
        }}
      />
    </div>
  );
}

function RotateTokenBadge({ owner }: { owner: SenkaiPiece["owner"] }) {
  const { fill } = getPlayerTurnStyle(owner);
  return (
    <span
      className={[
        "pointer-events-none absolute z-10 flex h-4 w-4 items-center justify-center rounded-sm",
        owner === 0 ? "right-0 top-0" : "bottom-0 left-0",
      ].join(" ")}
      style={{
        color: fill,
        border: `1.5px solid ${fill}`,
        backgroundColor: "rgb(15 23 42 / 0.92)",
        fontSize: "13px",
        fontWeight: 700,
        lineHeight: 1,
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        boxShadow: `0 0 4px ${fill}99`,
      }}
      title="旋回権あり"
      aria-hidden
    >
      ↻
    </span>
  );
}

function PieceGlyph({ piece }: { piece: SenkaiPiece }) {
  const { fill } = getPlayerTurnStyle(piece.owner);
  return (
    <PieceTokenImage fill={fill} facing={piece.facing} type={piece.type} />
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

  const actingPieceId = state.lockedAfterRotate ?? selectedId;

  const selectedPiece =
    actingPieceId !== null ? state.pieces[actingPieceId] ?? null : null;

  const moveTargets = useMemo(() => {
    if (actingPieceId === null || phase !== "playing" || state.gameOver) {
      return [];
    }
    return legalMovesForPiece(state, actingPieceId);
  }, [actingPieceId, phase, state]);

  const shootIdx = useMemo(() => {
    if (actingPieceId === null || phase !== "playing") return null;
    return shootTarget(state, actingPieceId);
  }, [actingPieceId, phase, state]);

  const rotateOptions = useMemo(() => {
    if (actingPieceId === null) return [];
    return legalRotationFacings(state, actingPieceId);
  }, [actingPieceId, state]);

  const showRotateControls = Boolean(
    state.lockedAfterRotate === null &&
      selectedPiece &&
      actingPieceId !== null &&
      selectedPiece.id === actingPieceId &&
      rotateOptions.length > 0
  );

  const apply = useCallback(
    (pieceId: number, action: Parameters<typeof applySenkaiAction>[2]) => {
      const next = applySenkaiAction(state, pieceId, action);
      if (!next) return false;
      setState(next);
      setSelectedId(next.lockedAfterRotate);
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

      const actingId = state.lockedAfterRotate ?? selectedId;

      if (state.lockedAfterRotate !== null) {
        if (
          piece &&
          piece.owner === state.current &&
          piece.id !== state.lockedAfterRotate
        ) {
          setNotice("旋回後は同じ駒で移動または射撃してください");
          return;
        }
        if (selectedId !== state.lockedAfterRotate) {
          setSelectedId(state.lockedAfterRotate);
        }
      } else if (selectedId === null) {
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

      if (actingId !== null && piece && piece.id === actingId) {
        if (state.lockedAfterRotate === actingId) {
          setNotice("旋回後は移動または射撃を選んでください");
          return;
        }
        setSelectedId(null);
        return;
      }

      if (actingId === null) return;

      if (moveTargets.includes(index)) {
        if (!apply(actingId, { kind: "move", to: index })) {
          setNotice("その移動はできません");
        }
        return;
      }

      if (shootIdx === index && shootIdx !== null) {
        if (!apply(actingId, { kind: "shoot" })) {
          setNotice("射撃できません");
        }
        return;
      }

      if (
        piece &&
        piece.owner === state.current &&
        state.lockedAfterRotate === null
      ) {
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
      state.lockedAfterRotate,
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
            state.lockedAfterRotate !== null && selectedPiece
              ? `${pieceLabel(selectedPiece.type)}：旋回後は移動または射撃`
              : selectedPiece &&
                  actingPieceId !== null &&
                  isEdgeStuck(state, actingPieceId)
                ? `${pieceLabel(selectedPiece.type)}：壁際救済（180°旋回で手番終了）`
                : selectedPiece
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
          const isSelected =
            cellId !== null &&
            actingPieceId !== null &&
            cellId === actingPieceId;
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
