"use client";

import { DEJARIK_CELL_COUNT, DEJARIK_NODE_POS, type CreatureType } from "@/lib/play/dejarik/board";
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

const TYPE_ABBR: Record<CreatureType, string> = {
  brute: "Br",
  predator: "Pr",
  guardian: "Gu",
  scout: "Sc",
};

type Props = {
  state: DejarikState;
  highlightCells: Set<number>;
  selectedPieceId: number | null;
  onPointerDown: (event: React.PointerEvent<SVGSVGElement>) => void;
};

export function DejarikBoard({ state, highlightCells, selectedPieceId, onPointerDown }: Props) {
  return (
    <svg
      viewBox={DEJARIK_VIEW_BOX}
      className="w-full touch-none select-none drop-shadow-lg"
      onPointerDown={onPointerDown}
      role="img"
      aria-label="デジャリック盤"
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
        <filter id="dejarik-piece-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodOpacity="0.55" />
        </filter>
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
            stroke={isSelected ? "#a5b4fc" : "none"}
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
            fill="rgb(99 102 241 / 0.48)"
            stroke="rgb(199 210 254 / 0.85)"
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

      {DEJARIK_NODE_POS.map(([cx, cy], cell) => {
        const pieceId = state.cells[cell];
        if (pieceId === null) return null;
        const piece = state.pieces[pieceId];
        if (!piece) return null;
        const { fill } = getPlayerTurnStyle(piece.owner);
        const isSelected = pieceId === selectedPieceId;
        return (
          <g key={`piece-${pieceId}`} filter="url(#dejarik-piece-shadow)">
            <circle
              cx={cx}
              cy={cy}
              r={isSelected ? 9.5 : 8.5}
              fill={fill}
              stroke={isSelected ? "#e0e7ff" : "#1e1b18"}
              strokeWidth={isSelected ? 2 : 1.2}
            />
            <circle cx={cx - 2} cy={cy - 2.5} r={2.2} fill="white" opacity={0.22} />
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#0f0a08"
              fontSize={7}
              fontWeight={800}
              className="pointer-events-none"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              {TYPE_ABBR[piece.type]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
