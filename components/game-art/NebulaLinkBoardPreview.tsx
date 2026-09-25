import {
  applyNebulaPlace,
  borderEdgesAt,
  homeEdgeOwnersAt,
  initialNebulaLink,
  NEBULA_CORE,
  NEBULA_MONO_ID,
  NEBULA_SIZE,
  nebulaIndex,
  type NebulaBoard,
  type NebulaEdge,
  type NebulaPlacement,
} from "@/lib/play/nebula-link";
import { getPlayerTurnStyle } from "@/lib/player-colors";

const NEUTRAL_EDGE_FILL = "rgba(71,85,105,0.55)";
const INTERIOR_EMPTY = "rgba(28, 24, 38, 0.92)";

function fillAlpha(color: string, alpha = 0.62): string {
  if (color.startsWith("rgba")) return color;
  const hex = color.replace("#", "");
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function cornerDiagonalFill(
  row: number,
  col: number,
  fills: Partial<Record<NebulaEdge, string>>
): string | null {
  const last = NEBULA_SIZE - 1;
  const n = fills.north;
  const s = fills.south;
  const e = fills.east;
  const w = fills.west;

  if (row === 0 && col === 0 && n && w) {
    return `linear-gradient(to top right, ${fillAlpha(w)} 50%, ${fillAlpha(n)} 50%)`;
  }
  if (row === 0 && col === last && n && e) {
    return `linear-gradient(to top left, ${fillAlpha(e)} 50%, ${fillAlpha(n)} 50%)`;
  }
  if (row === last && col === 0 && s && w) {
    return `linear-gradient(to bottom right, ${fillAlpha(w)} 50%, ${fillAlpha(s)} 50%)`;
  }
  if (row === last && col === last && s && e) {
    return `linear-gradient(to bottom left, ${fillAlpha(e)} 50%, ${fillAlpha(s)} 50%)`;
  }
  return null;
}

function edgeFillsAt(
  row: number,
  col: number,
  playerCount: number
): Partial<Record<NebulaEdge, string>> {
  const edges = borderEdgesAt(row, col);
  const owners = homeEdgeOwnersAt(nebulaIndex(row, col), playerCount);
  const fills: Partial<Record<NebulaEdge, string>> = {};
  edges.forEach((edge, i) => {
    const owner = owners[i];
    if (owner === undefined) return;
    fills[edge] =
      owner === "neutral"
        ? NEUTRAL_EDGE_FILL
        : getPlayerTurnStyle(owner).fill;
  });
  return fills;
}

function emptyCellFill(
  row: number,
  col: number,
  playerCount: number
): string {
  const fills = edgeFillsAt(row, col, playerCount);
  const corner = cornerDiagonalFill(row, col, fills);
  if (corner) return corner;

  const owners = homeEdgeOwnersAt(nebulaIndex(row, col), playerCount);
  if (owners.length === 1) {
    const owner = owners[0];
    if (owner === "neutral") return NEUTRAL_EDGE_FILL;
    return fillAlpha(getPlayerTurnStyle(owner).fill);
  }

  if (owners.length >= 2) {
    return "rgba(71,85,105,0.45)";
  }

  return INTERIOR_EMPTY;
}

function withRouletteForPlacement(
  game: ReturnType<typeof initialNebulaLink>,
  placement: NebulaPlacement
) {
  if (placement.pieceId === NEBULA_MONO_ID) return game;
  return { ...game, roulette: [placement.pieceId, "L3", "tri"] };
}

/** ルーレット形状をバランスよく見せる合法手列（単マス＋ domino〜F5 など） */
const PREVIEW_NEBULA_PLACEMENTS: NebulaPlacement[] = [
  { pieceId: "mono", rotation: 0, anchorRow: 0, anchorCol: 10 },
  { pieceId: "mono", rotation: 0, anchorRow: 20, anchorCol: 10 },
  { pieceId: "domino", rotation: 0, anchorRow: 1, anchorCol: 8 },
  { pieceId: "tri", rotation: 0, anchorRow: 19, anchorCol: 7 },
  { pieceId: "domino", rotation: 0, anchorRow: 0, anchorCol: 6 },
  { pieceId: "L3", rotation: 0, anchorRow: 17, anchorCol: 5 },
  { pieceId: "tri", rotation: 0, anchorRow: 1, anchorCol: 3 },
  { pieceId: "L4", rotation: 0, anchorRow: 14, anchorCol: 3 },
  { pieceId: "domino", rotation: 0, anchorRow: 0, anchorCol: 1 },
  { pieceId: "L3", rotation: 0, anchorRow: 12, anchorCol: 1 },
  { pieceId: "T4", rotation: 0, anchorRow: 1, anchorCol: 11 },
  { pieceId: "tri", rotation: 0, anchorRow: 11, anchorCol: 2 },
  { pieceId: "L4", rotation: 0, anchorRow: 1, anchorCol: 0 },
  { pieceId: "square", rotation: 0, anchorRow: 9, anchorCol: 0 },
  { pieceId: "domino", rotation: 0, anchorRow: 0, anchorCol: 14 },
  { pieceId: "L3", rotation: 0, anchorRow: 7, anchorCol: 2 },
  { pieceId: "Z4", rotation: 0, anchorRow: 1, anchorCol: 16 },
  { pieceId: "line4", rotation: 0, anchorRow: 6, anchorCol: 3 },
  { pieceId: "plus", rotation: 0, anchorRow: 2, anchorCol: 5 },
  { pieceId: "F5", rotation: 0, anchorRow: 3, anchorCol: 1 },
];

/** 北・南から入り、複数形状が混ざった中盤 */
export function defaultPreviewNebulaBoard(): {
  board: NebulaBoard;
  playerCount: number;
} {
  const playerCount = 2;
  let game = initialNebulaLink(playerCount);

  for (const placement of PREVIEW_NEBULA_PLACEMENTS) {
    game = withRouletteForPlacement(game, placement);
    const next = applyNebulaPlace(game, placement);
    if (!next) break;
    game = next;
  }

  return { board: game.board, playerCount };
}

type Props = {
  board?: NebulaBoard;
  playerCount?: number;
  className?: string;
};

export function NebulaLinkBoardPreview({
  board: boardProp,
  playerCount: playerCountProp,
  className = "h-full w-full max-h-24 max-w-24 drop-shadow-lg",
}: Props) {
  const defaults = defaultPreviewNebulaBoard();
  const board = boardProp ?? defaults.board;
  const playerCount = playerCountProp ?? defaults.playerCount;

  const cell = 4.6;
  const pad = 4;
  const size = NEBULA_SIZE * cell + pad * 2;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} aria-hidden>
      <rect width={size} height={size} rx="8" fill="#0a0e14" />
      {board.map((owner, index) => {
        const row = Math.floor(index / NEBULA_SIZE);
        const col = index % NEBULA_SIZE;
        const x = pad + col * cell;
        const y = pad + row * cell;
        const isCore = index === NEBULA_CORE;

        const fill = isCore
          ? "rgba(253, 224, 71, 0.35)"
          : owner !== null
            ? getPlayerTurnStyle(owner).fill
            : emptyCellFill(row, col, playerCount);

        return (
          <rect
            key={index}
            x={x}
            y={y}
            width={cell - 0.15}
            height={cell - 0.15}
            rx="0.35"
            fill={fill}
            stroke={
              isCore
                ? "rgba(250, 204, 21, 0.65)"
                : owner !== null
                  ? "rgba(0,0,0,0.25)"
                  : "rgba(61, 53, 80, 0.45)"
            }
            strokeWidth={isCore ? 0.35 : 0.2}
          />
        );
      })}
      <text
        x={pad + (NEBULA_SIZE / 2 - 0.5) * cell + cell / 2}
        y={pad + (NEBULA_SIZE / 2 - 0.5) * cell + cell / 2 + 1.2}
        textAnchor="middle"
        fontSize="3.2"
        fill="#fef08a"
        fontWeight="700"
      >
        ★
      </text>
    </svg>
  );
}
