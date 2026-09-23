import {
  dropGravityFour,
  emptyGravityFourBoard,
  gfIndex,
  GF_COLS,
  GF_ROWS,
  type Board,
} from "@/lib/play/gravity-four";
import { getPlayerFill } from "@/lib/player-colors";

const BOARD_BG = "#1e1b4b";
const FRAME_BG = "rgba(30, 27, 75, 0.8)";
const HOLE_BG = "rgba(49, 46, 129, 0.6)";
const HOLE_BORDER = "rgba(67, 56, 202, 0.5)";

/** P0 が下段で4つ並んで勝利した直後の局面（P1 は最大3つまで） */
function defaultPreviewBoard(): Board {
  let board = emptyGravityFourBoard();
  const drops: [number, 0 | 1][] = [
    [6, 1],
    [5, 1],
    [4, 1],
    [4, 0],
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
  ];
  for (const [col, player] of drops) {
    board = dropGravityFour(board, col, player)!;
  }
  return board;
}

type Props = {
  board?: Board;
  className?: string;
};

export function GravityFourBoardPreview({
  board = defaultPreviewBoard(),
  className = "h-full w-full max-h-24 max-w-24 drop-shadow-lg",
}: Props) {
  const cell = 13;
  const gap = 1;
  const pad = 8;
  const gridW = GF_COLS * cell + (GF_COLS - 1) * gap;
  const gridH = GF_ROWS * cell + (GF_ROWS - 1) * gap;
  const width = pad * 2 + gridW;
  const height = pad * 2 + gridH;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className}>
      <rect width={width} height={height} rx="10" fill={BOARD_BG} />
      <rect
        x={pad - 2}
        y={pad - 2}
        width={gridW + 4}
        height={gridH + 4}
        rx="8"
        fill={FRAME_BG}
      />
      {Array.from({ length: GF_ROWS }, (_, row) =>
        Array.from({ length: GF_COLS }, (_, col) => {
          const player = board[gfIndex(row, col)];
          const x = pad + col * (cell + gap);
          const y = pad + row * (cell + gap);
          const cx = x + cell / 2;
          const cy = y + cell / 2;
          const holeR = cell * 0.46;
          const discR = cell * 0.39;

          return (
            <g key={`${row}-${col}`}>
              <circle
                cx={cx}
                cy={cy}
                r={holeR}
                fill={HOLE_BG}
                stroke={HOLE_BORDER}
                strokeWidth="0.6"
              />
              {player !== null ? (
                <circle
                  cx={cx}
                  cy={cy}
                  r={discR}
                  fill={getPlayerFill(player)}
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth="0.5"
                />
              ) : null}
            </g>
          );
        })
      )}
    </svg>
  );
}
