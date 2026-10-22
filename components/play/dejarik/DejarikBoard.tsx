"use client";

import { DEJARIK_CELL_COUNT, DEJARIK_NODE_POS } from "@/lib/play/dejarik/board";
import {
  BOARD_CX,
  BOARD_CY,
  CELL_RADIAL_BOUNDARY_DEGS,
  CENTER_RADIAL_DEGS,
  cellBaseFill,
  cellSectorPath,
  cellWedgeAngles,
  DEJARIK_VIEW_BOX,
  GROOVE,
  lineFromCenter,
  lineFromRadius,
  ringArcPath,
  R_CENTER_OUT,
  R_MIDDLE_OUT,
  R_PLAY_OUTER,
  R_RIM_OUTER,
} from "@/lib/play/dejarik/board-visual";
import { getPlayerTurnStyle } from "@/lib/player-colors";
import type { DejarikState } from "@/lib/play/dejarik/state";
import { DejarikCreatureToken } from "@/components/play/dejarik/DejarikCreatureToken";

const VIEW_SIZE = 200;
const TOKEN_SIZE_PCT = (40 / VIEW_SIZE) * 100;

/** 画像は上向き。盤中心方向へ回転（度） */
function facingCenterDeg(cx: number, cy: number): number {
  const dx = BOARD_CX - cx;
  const dy = BOARD_CY - cy;
  return (Math.atan2(dy, dx) * 180) / Math.PI + 90;
}

type Props = {
  state: DejarikState;
  highlightCells: Set<number>;
  /** ハイライト色（手番プレイヤー） */
  highlightPlayer: number;
  selectedPieceId: number | null;
  onPointerDown: (event: React.PointerEvent<SVGSVGElement>) => void;
};

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function DejarikBoard({
  state,
  highlightCells,
  highlightPlayer,
  selectedPieceId,
  onPointerDown,
}: Props) {
  const turnStyle = getPlayerTurnStyle(highlightPlayer);
  const hlFill = hexToRgba(turnStyle.fill, 0.42);
  const hlStroke = hexToRgba(turnStyle.fill, 0.88);
  const selectedStroke = turnStyle.fill;
  const pieces = DEJARIK_NODE_POS.flatMap(([cx, cy], cell) => {
    const pieceId = state.cells[cell];
    if (pieceId === null) return [];
    const piece = state.pieces[pieceId];
    if (!piece) return [];
    return [{ pieceId, piece, cx, cy, cell }];
  });

  return (
    <div className="relative w-full touch-none select-none drop-shadow-lg">
      <svg
        viewBox={DEJARIK_VIEW_BOX}
        className="block h-auto w-full"
        onPointerDown={onPointerDown}
        role="img"
        aria-label="ホロチェス盤"
      >
      <defs>
        <radialGradient id="dejarik-rim" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#c4a574" />
          <stop offset="70%" stopColor="#8b6914" />
          <stop offset="100%" stopColor="#5c4618" />
        </radialGradient>
        <radialGradient id="dejarik-surface" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3d2e24" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.35" />
        </radialGradient>
      </defs>

      <circle cx={BOARD_CX} cy={BOARD_CY} r={R_RIM_OUTER} fill="url(#dejarik-rim)" />
      <circle cx={BOARD_CX} cy={BOARD_CY} r={R_PLAY_OUTER + 2} fill="#2a1f18" />
      <path
        d={`M ${BOARD_CX - 4} ${BOARD_CY - R_RIM_OUTER} A 4 4 0 0 1 ${BOARD_CX + 4} ${BOARD_CY - R_RIM_OUTER} L ${BOARD_CX + 3} ${BOARD_CY - R_PLAY_OUTER} A 3 3 0 0 0 ${BOARD_CX - 3} ${BOARD_CY - R_PLAY_OUTER} Z`}
        fill="#6b5428"
        opacity={0.85}
      />

      {Array.from({ length: DEJARIK_CELL_COUNT }, (_, cell) => {
        const hl = highlightCells.has(cell);
        const pieceId = state.cells[cell];
        const isSelected = pieceId !== null && pieceId === selectedPieceId;
        return (
          <path
            key={`cell-${cell}`}
            d={cellSectorPath(cell)}
            fill={cellBaseFill(cell)}
            stroke={isSelected ? selectedStroke : "none"}
            strokeWidth={isSelected ? 2 : 0}
            className="transition-[fill-opacity] duration-150"
            style={{
              fillOpacity: hl ? 1 : 1,
            }}
          />
        );
      })}

      <circle
        cx={BOARD_CX}
        cy={BOARD_CY}
        r={R_PLAY_OUTER}
        fill="url(#dejarik-surface)"
        pointerEvents="none"
      />

      {highlightCells.size > 0 &&
        Array.from(highlightCells).map((cell) => (
          <path
            key={`hl-${cell}`}
            d={cellSectorPath(cell)}
            fill={hlFill}
            stroke={hlStroke}
            strokeWidth={1.1}
            pointerEvents="none"
          />
        ))}

      {CENTER_RADIAL_DEGS.map((deg) => {
        const [x0, y0, x1, y1] = lineFromCenter(deg, R_CENTER_OUT);
        return (
          <line
            key={`cdiv-${deg}`}
            x1={x0}
            y1={y0}
            x2={x1}
            y2={y1}
            stroke={GROOVE}
            strokeWidth={0.85}
            pointerEvents="none"
          />
        );
      })}

      {Array.from({ length: 4 }, (_, k) => {
        const { start, end } = cellWedgeAngles(24 + k);
        return (
          <path
            key={`carc-${k}`}
            d={ringArcPath(R_CENTER_OUT, start, end)}
            fill="none"
            stroke={GROOVE}
            strokeWidth={0.85}
            pointerEvents="none"
          />
        );
      })}

      {CELL_RADIAL_BOUNDARY_DEGS.map((deg) => {
        const [x0, y0, x1, y1] = lineFromRadius(deg, R_CENTER_OUT, R_PLAY_OUTER);
        return (
          <line
            key={`mb-${deg}`}
            x1={x0}
            y1={y0}
            x2={x1}
            y2={y1}
            stroke={GROOVE}
            strokeWidth={0.85}
            pointerEvents="none"
          />
        );
      })}

      <circle
        cx={BOARD_CX}
        cy={BOARD_CY}
        r={R_MIDDLE_OUT}
        fill="none"
        stroke={GROOVE}
        strokeWidth={0.9}
        pointerEvents="none"
      />

      {pieces.map(({ pieceId, piece, cx, cy }) => {
        const ownerStyle = getPlayerTurnStyle(piece.owner);
        const isSelected = pieceId === selectedPieceId;
        return isSelected ? (
          <circle
            key={`sel-${pieceId}`}
            cx={cx}
            cy={cy}
            r={13}
            fill="none"
            stroke={ownerStyle.fill}
            strokeWidth={1.8}
            opacity={0.95}
            pointerEvents="none"
          />
        ) : null;
      })}
      </svg>

      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {pieces.map(({ pieceId, piece, cx, cy }) => {
          const ownerStyle = getPlayerTurnStyle(piece.owner);
          const face = facingCenterDeg(cx, cy);
          return (
            <div
              key={`tok-${pieceId}`}
              className="absolute aspect-square -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${(cx / VIEW_SIZE) * 100}%`,
                top: `${(cy / VIEW_SIZE) * 100}%`,
                width: `${TOKEN_SIZE_PCT}%`,
              }}
            >
              <DejarikCreatureToken
                type={piece.type}
                faceDeg={face}
                baseColor={ownerStyle.fill}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
