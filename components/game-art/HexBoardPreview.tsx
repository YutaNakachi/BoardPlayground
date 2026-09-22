import {
  emptyHexBoard,
  HEX_GRID_STROKE,
  HEX_GRID_STROKE_WIDTH,
  HEX_STONE_COLORS,
  hexBoardEdges,
  hexCellFill,
  hexCenter,
  hexCoord,
  hexIndex,
  hexPolygonPoints,
  hexViewBox,
  type Board,
  type Stone,
} from "@/lib/play/hex";

const BOARD_EDGES = hexBoardEdges();
const VIEW_BOX = hexViewBox(1.6);

function defaultPreviewBoard(): Board {
  const board = emptyHexBoard();
  const stones: [number, Stone][] = [
    [hexIndex(0, 4), 0],
    [hexIndex(0, 5), 0],
    [hexIndex(1, 4), 0],
    [hexIndex(2, 3), 0],
    [hexIndex(2, 4), 0],
    [hexIndex(3, 3), 1],
    [hexIndex(4, 2), 1],
    [hexIndex(5, 1), 1],
    [hexIndex(5, 2), 1],
    [hexIndex(6, 2), 1],
    [hexIndex(6, 3), 1],
  ];
  for (const [index, stone] of stones) {
    board[index] = stone;
  }
  return board;
}

type Props = {
  board?: Board;
  className?: string;
};

export function HexBoardPreview({
  board = defaultPreviewBoard(),
  className = "h-full w-full max-h-24 max-w-24 drop-shadow-lg",
}: Props) {
  return (
    <svg viewBox={`${VIEW_BOX.x} ${VIEW_BOX.y} ${VIEW_BOX.width} ${VIEW_BOX.height}`} className={className} aria-hidden>
      <rect
        x={VIEW_BOX.x}
        y={VIEW_BOX.y}
        width={VIEW_BOX.width}
        height={VIEW_BOX.height}
        fill="#111827"
        rx="0.4"
      />

      {board.map((cell, index) => {
        const { row, col } = hexCoord(index);
        return (
          <polygon
            key={`cell-${index}`}
            points={hexPolygonPoints(row, col)}
            fill={hexCellFill(row, col, false)}
          />
        );
      })}

      {BOARD_EDGES.map((edge, index) => (
        <line
          key={`edge-${index}`}
          x1={edge.a.x}
          y1={edge.a.y}
          x2={edge.b.x}
          y2={edge.b.y}
          stroke={HEX_GRID_STROKE}
          strokeWidth={HEX_GRID_STROKE_WIDTH}
          strokeLinecap="round"
        />
      ))}

      {board.map((cell, index) => {
        if (cell === null) return null;
        const { row, col } = hexCoord(index);
        const center = hexCenter(row, col);
        const colors = HEX_STONE_COLORS[cell];
        return (
          <circle
            key={`stone-${index}`}
            cx={center.x}
            cy={center.y}
            r={0.4}
            fill={colors.fill}
            stroke={colors.stroke}
            strokeWidth={0.05}
          />
        );
      })}
    </svg>
  );
}
