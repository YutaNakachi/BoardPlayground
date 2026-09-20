import type { ReactNode } from "react";
import { LudoBoardPreview } from "@/components/game-art/LudoBoardPreview";
import type { GameMeta } from "@/lib/games";
import { MORRIS_LINES, MORRIS_XY } from "@/lib/play/nine-mens-morris";

type Props = { game: GameMeta };

function ArtFrame({
  children,
  gradient,
}: {
  children: ReactNode;
  gradient: string;
}) {
  return (
    <div
      className="relative h-32 overflow-hidden"
      style={{ background: gradient }}
      aria-hidden
    >
      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4">
        {children}
      </div>
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-raised via-surface-raised/20 to-transparent"
      />
    </div>
  );
}

function ReversiPreview() {
  const stones: (0 | 1 | null)[] = Array(64).fill(null);
  const set = (row: number, col: number, player: 0 | 1) => {
    stones[row * 8 + col] = player;
  };
  set(3, 3, 1);
  set(3, 4, 0);
  set(4, 3, 0);
  set(4, 4, 1);
  set(2, 3, 0);
  set(2, 4, 1);
  set(5, 2, 1);
  set(5, 5, 0);
  set(1, 5, 1);

  return (
    <svg viewBox="0 0 120 120" className="h-full w-full max-h-24 max-w-24 drop-shadow-lg">
      <rect width="120" height="120" rx="10" fill="#064e3b" />
      {stones.map((cell, index) => {
        const row = Math.floor(index / 8);
        const col = index % 8;
        const x = 6 + col * 13.5;
        const y = 6 + row * 13.5;
        return (
          <g key={index}>
            <rect x={x} y={y} width="12" height="12" rx="1.5" fill="#047857" opacity="0.9" />
            {cell !== null ? (
              <circle
                cx={x + 6}
                cy={y + 6}
                r="4.5"
                fill={cell === 0 ? "#18181b" : "#f4f4f5"}
                stroke={cell === 0 ? "#000" : "#fff"}
                strokeWidth="0.5"
                opacity="0.95"
              />
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function GomokuPreview() {
  const stones: Record<string, 0 | 1> = {
    "3,3": 0,
    "3,4": 1,
    "4,4": 0,
    "4,5": 1,
    "5,5": 0,
    "5,6": 1,
    "6,6": 0,
    "6,5": 1,
    "6,4": 0,
  };

  return (
    <svg viewBox="0 0 120 120" className="h-full w-full max-h-24 max-w-24 drop-shadow-lg">
      <rect width="120" height="120" rx="10" fill="#451a03" />
      {Array.from({ length: 9 }, (_, row) =>
        Array.from({ length: 9 }, (_, col) => {
          const key = `${row},${col}`;
          const stone = stones[key];
          const x = 12 + col * 12;
          const y = 12 + row * 12;
          return (
            <g key={key}>
              <rect x={x - 5.5} y={y - 5.5} width="11" height="11" fill="#78350f" opacity="0.35" />
              {stone !== undefined ? (
                <circle
                  cx={x}
                  cy={y}
                  r="4.2"
                  fill={stone === 0 ? "#18181b" : "#f4f4f5"}
                  stroke={stone === 0 ? "#000" : "#fff"}
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

function MancalaPreview() {
  const pits = [4, 5, 3, 6, 2, 4, 8, 3, 5, 4, 6, 2];
  const stores = [12, 9];

  return (
    <svg viewBox="0 0 160 88" className="h-full w-full max-h-24 max-w-[9.5rem] drop-shadow-lg">
      <rect width="160" height="88" rx="12" fill="#1e293b" />
      <rect x="6" y="10" width="22" height="68" rx="10" fill="#312e81" opacity="0.55" />
      <rect x="132" y="10" width="22" height="68" rx="10" fill="#312e81" opacity="0.55" />
      <text x="17" y="48" fill="#e0e7ff" fontSize="11" fontWeight="700">
        {stores[0]}
      </text>
      <text x="143" y="48" fill="#e0e7ff" fontSize="11" fontWeight="700">
        {stores[1]}
      </text>
      {pits.map((count, index) => {
        const row = index < 6 ? 0 : 1;
        const col = index < 6 ? index : 11 - index;
        const x = 34 + col * 16;
        const y = row === 0 ? 16 : 48;
        return (
          <g key={index}>
            <rect
              x={x}
              y={y}
              width="14"
              height="24"
              rx="7"
              fill={row === 0 ? "#4c1d95" : "#831843"}
              opacity="0.75"
            />
            <text x={x + 7} y={y + 15} textAnchor="middle" fill="#f8fafc" fontSize="9" fontWeight="700">
              {count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function CheckersPreview() {
  const dark = (index: number) => {
    const row = Math.floor(index / 8);
    const col = index % 8;
    return (row + col) % 2 === 1;
  };
  const pieces: Record<number, 0 | 1> = {
    9: 1,
    11: 1,
    18: 0,
    20: 0,
    27: 1,
    36: 0,
    42: 1,
    49: 0,
    58: 1,
  };

  return (
    <svg viewBox="0 0 120 120" className="h-full w-full max-h-24 max-w-24 drop-shadow-lg">
      <rect width="120" height="120" rx="10" fill="#1c1917" />
      {Array.from({ length: 64 }, (_, index) => {
        const row = Math.floor(index / 8);
        const col = index % 8;
        const x = col * 15;
        const y = row * 15;
        const piece = pieces[index];
        return (
          <g key={index}>
            <rect
              x={x}
              y={y}
              width="15"
              height="15"
              fill={dark(index) ? "#064e3b" : "#fef3c7"}
              opacity={dark(index) ? 1 : 0.85}
            />
            {piece !== undefined ? (
              <circle
                cx={x + 7.5}
                cy={y + 7.5}
                r="5"
                fill={piece === 0 ? "#6366f1" : "#fda4af"}
                stroke={piece === 0 ? "#312e81" : "#9f1239"}
                strokeWidth="0.6"
              />
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function NebulaPreview() {
  const cells: (number | "core" | null)[] = [
    null,
    0,
    null,
    1,
    null,
    null,
    0,
    "core",
    1,
    null,
    null,
    1,
    0,
    null,
    2,
    null,
    null,
    2,
    null,
    3,
    null,
    3,
    null,
    null,
    null,
  ];
  const colors = ["#6366f1", "#f43f5e", "#10b981", "#f59e0b"];

  return (
    <svg viewBox="0 0 120 120" className="h-full w-full max-h-24 max-w-24 drop-shadow-lg">
      <rect width="120" height="120" rx="12" fill="#0f172a" />
      {cells.map((cell, index) => {
        const row = Math.floor(index / 5);
        const col = index % 5;
        const x = 10 + col * 20;
        const y = 10 + row * 20;
        const fill =
          cell === "core"
            ? "#fde047"
            : cell === null
              ? "#1e293b"
              : colors[cell];
        return (
          <rect
            key={index}
            x={x}
            y={y}
            width="18"
            height="18"
            rx="4"
            fill={fill}
            opacity={cell === "core" ? 0.85 : cell === null ? 0.7 : 0.95}
            stroke={cell === "core" ? "#facc15" : "#334155"}
            strokeWidth="0.8"
          />
        );
      })}
      <circle cx="60" cy="60" r="4" fill="#fef08a" />
    </svg>
  );
}

function MorrisPreview() {
  const owners: (0 | 1 | null)[] = Array(24).fill(null);
  owners[1] = 0;
  owners[2] = 1;
  owners[4] = 0;
  owners[7] = 1;
  owners[9] = 0;
  owners[10] = 1;
  owners[13] = 0;
  owners[16] = 1;
  owners[19] = 0;

  return (
    <svg viewBox="0 0 120 120" className="h-full w-full max-h-24 max-w-24 drop-shadow-lg">
      <rect width="120" height="120" rx="12" fill="#0f172a" />
      {MORRIS_LINES.map(([a, b], index) => (
        <line
          key={index}
          x1={MORRIS_XY[a][0] * 0.4}
          y1={MORRIS_XY[a][1] * 0.4}
          x2={MORRIS_XY[b][0] * 0.4}
          y2={MORRIS_XY[b][1] * 0.4}
          stroke="#64748b"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      ))}
      {MORRIS_XY.map(([x, y], index) => {
        const owner = owners[index];
        const cx = x * 0.4;
        const cy = y * 0.4;
        return (
          <circle
            key={index}
            cx={cx}
            cy={cy}
            r={owner === null ? 4 : 5.5}
            fill={
              owner === 0 ? "#6366f1" : owner === 1 ? "#f43f5e" : "#1e293b"
            }
            stroke={owner === null ? "#475569" : "none"}
            strokeWidth="1"
          />
        );
      })}
    </svg>
  );
}

function HexPreview() {
  const stones: Record<string, 0 | 1> = {
    "2,5": 0,
    "3,4": 1,
    "3,5": 0,
    "4,5": 1,
    "4,6": 0,
    "5,5": 1,
  };
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full max-h-24 max-w-24 drop-shadow-lg">
      <rect width="120" height="120" rx="12" fill="#1e1b4b" />
      {Object.entries(stones).map(([key, player]) => {
        const [row, col] = key.split(",").map(Number);
        const x = 20 + col * 8 + (row % 2) * 4;
        const y = 18 + row * 7;
        return (
          <circle
            key={key}
            cx={x}
            cy={y}
            r="4"
            fill={player === 0 ? "#fb7185" : "#38bdf8"}
          />
        );
      })}
    </svg>
  );
}

function FoxHoundsPreview() {
  const board = Array(64).fill(null) as (0 | 1 | null)[];
  board[63] = 0;
  [1, 3, 5, 7].forEach((col) => {
    board[col] = 1;
  });
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full max-h-24 max-w-24 drop-shadow-lg">
      <rect width="120" height="120" rx="10" fill="#422006" />
      {board.map((cell, index) => {
        const row = Math.floor(index / 8);
        const col = index % 8;
        const x = 8 + col * 13;
        const y = 8 + row * 13;
        return (
          <rect
            key={index}
            x={x}
            y={y}
            width="12"
            height="12"
            fill={(row + col) % 2 === 0 ? "#78350f" : "#92400e"}
            rx="1"
          />
        );
      })}
      <circle cx={8 + 7 * 13 + 6} cy={8 + 7 * 13 + 6} r="4.5" fill="#f97316" />
      {[1, 3, 5, 7].map((col) => (
        <circle key={col} cx={8 + col * 13 + 6} cy={8 + 6} r="4" fill="#64748b" />
      ))}
    </svg>
  );
}

function DominoPreview() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full max-h-24 max-w-24 drop-shadow-lg">
      <rect width="120" height="120" rx="12" fill="#0f172a" />
      <rect x="28" y="40" width="28" height="40" rx="4" fill="#f8fafc" stroke="#cbd5e1" />
      <rect x="64" y="40" width="28" height="40" rx="4" fill="#f8fafc" stroke="#cbd5e1" />
      <circle cx="42" cy="52" r="3" fill="#1e293b" />
      <circle cx="42" cy="68" r="3" fill="#1e293b" />
      <circle cx="78" cy="60" r="3" fill="#1e293b" />
    </svg>
  );
}

function ChineseCheckersPreview() {
  const dots = [
    [60, 20],
    [45, 35],
    [60, 35],
    [75, 35],
    [30, 50],
    [45, 50],
    [60, 50],
    [75, 50],
    [90, 50],
    [60, 65],
    [45, 80],
    [60, 80],
    [75, 80],
    [60, 95],
  ];
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full max-h-24 max-w-24 drop-shadow-lg">
      <rect width="120" height="120" rx="12" fill="#312e81" />
      {dots.map(([cx, cy], index) => (
        <circle
          key={index}
          cx={cx}
          cy={cy}
          r={index % 3 === 0 ? 5 : 4}
          fill={index % 3 === 0 ? "#a5b4fc" : "#6366f1"}
        />
      ))}
    </svg>
  );
}

function LudoPreview() {
  return <LudoBoardPreview />;
}

function BackgammonPreview() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full max-h-24 max-w-24 drop-shadow-lg">
      <rect width="120" height="120" rx="10" fill="#7c2d12" />
      <polygon points="10,60 30,20 30,100" fill="#451a03" />
      <polygon points="110,60 90,20 90,100" fill="#451a03" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={20 + i * 8} cy={45} r="4" fill="#f8fafc" />
      ))}
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={100 - i * 8} cy={75} r="4" fill="#1e293b" />
      ))}
    </svg>
  );
}

function ChessPreview() {
  const pieces: Record<string, string> = {
    "0,4": "♚",
    "1,3": "♟",
    "6,3": "♙",
    "7,4": "♔",
  };
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full max-h-24 max-w-24 drop-shadow-lg">
      <rect width="120" height="120" rx="10" fill="#14532d" />
      {Array.from({ length: 64 }, (_, index) => {
        const row = Math.floor(index / 8);
        const col = index % 8;
        const x = 12 + col * 12;
        const y = 12 + row * 12;
        const key = `${row},${col}`;
        return (
          <g key={index}>
            <rect
              x={x}
              y={y}
              width="11"
              height="11"
              fill={(row + col) % 2 === 0 ? "#166534" : "#15803d"}
            />
            {pieces[key] ? (
              <text x={x + 5.5} y={y + 9} textAnchor="middle" fontSize="8" fill="#f8fafc">
                {pieces[key]}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function ShogiPreview() {
  const pieceLabel: Record<string, string> = {
    "0,8": "香",
    "0,7": "桂",
    "0,6": "銀",
    "0,5": "金",
    "0,4": "玉",
    "0,3": "金",
    "0,2": "銀",
    "0,1": "桂",
    "0,0": "香",
    "1,1": "角",
    "1,7": "飛",
    "2,0": "歩",
    "2,2": "歩",
    "2,4": "歩",
    "2,6": "歩",
    "2,8": "歩",
    "6,0": "歩",
    "6,2": "歩",
    "6,4": "歩",
    "6,6": "歩",
    "6,8": "歩",
    "7,1": "飛",
    "7,7": "角",
    "8,8": "香",
    "8,7": "桂",
    "8,6": "銀",
    "8,5": "金",
    "8,4": "玉",
    "8,3": "金",
    "8,2": "銀",
    "8,1": "桂",
    "8,0": "香",
  };
  const pieceColor: Record<string, string> = {
    "0": "#1e293b",
    "8": "#7f1d1d",
  };

  const cell = 11.5;
  const pad = 8;

  return (
    <svg viewBox="0 0 120 120" className="h-full w-full max-h-24 max-w-24 drop-shadow-lg">
      <rect width="120" height="120" rx="10" fill="#78350f" />
      <rect
        x={pad - 1}
        y={pad - 1}
        width={cell * 9 + 2}
        height={cell * 9 + 2}
        rx="4"
        fill="#fde68a"
        stroke="#b45309"
        strokeWidth="0.8"
      />
      {Array.from({ length: 81 }, (_, index) => {
        const row = Math.floor(index / 9);
        const col = index % 9;
        const x = pad + col * cell;
        const y = pad + row * cell;
        const key = `${row},${col}`;
        const label = pieceLabel[key];
        const color = pieceColor[String(row)] ?? "#1e293b";
        return (
          <g key={index}>
            <rect x={x} y={y} width={cell} height={cell} fill="#fef3c7" stroke="#d97706" strokeWidth="0.25" />
            {label ? (
              <text
                x={x + cell / 2}
                y={y + cell / 2 + 0.5}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={row === 8 ? "4.8" : "5.2"}
                fill={color}
                fontWeight="700"
                transform={row === 8 ? `rotate(180 ${x + cell / 2} ${y + cell / 2})` : undefined}
              >
                {label}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function MiniShogiPreview() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full max-h-24 max-w-24 drop-shadow-lg">
      <rect width="120" height="120" rx="10" fill="#92400e" />
      {Array.from({ length: 25 }, (_, index) => {
        const row = Math.floor(index / 5);
        const col = index % 5;
        const x = 22 + col * 15;
        const y = 22 + row * 15;
        return (
          <rect
            key={index}
            x={x}
            y={y}
            width="14"
            height="14"
            fill="#fde68a"
            stroke="#b45309"
            strokeWidth="0.5"
          />
        );
      })}
    </svg>
  );
}

function KlondikePreview() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full max-h-24 max-w-24 drop-shadow-lg">
      <rect width="120" height="120" rx="12" fill="#1e3a5f" />
      {[0, 1, 2, 3].map((col) => (
        <rect
          key={col}
          x={16 + col * 22}
          y={50}
          width="18"
          height="26"
          rx="3"
          fill={col === 0 ? "#f8fafc" : "#334155"}
          stroke="#94a3b8"
        />
      ))}
      <rect x="82" y="20" width="18" height="26" rx="3" fill="#f8fafc" stroke="#94a3b8" />
    </svg>
  );
}

function SpiderPreview() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full max-h-24 max-w-24 drop-shadow-lg">
      <rect width="120" height="120" rx="12" fill="#134e4a" />
      {Array.from({ length: 8 }, (_, col) => (
        <g key={col}>
          {[0, 1, 2].map((row) => (
            <rect
              key={row}
              x={10 + col * 13}
              y={30 + row * 10}
              width="11"
              height="16"
              rx="2"
              fill={row === 2 ? "#f8fafc" : "#334155"}
              stroke="#5eead4"
              strokeWidth="0.5"
            />
          ))}
        </g>
      ))}
    </svg>
  );
}

function MahjongPreview() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full max-h-24 max-w-24 drop-shadow-lg">
      <rect width="120" height="120" rx="12" fill="#0f172a" />
      {[
        [30, 40],
        [50, 35],
        [70, 40],
        [40, 60],
        [60, 65],
      ].map(([x, y], index) => (
        <rect
          key={index}
          x={x}
          y={y}
          width="18"
          height="24"
          rx="3"
          fill="#f8fafc"
          stroke="#94a3b8"
          transform={`rotate(${index % 2 === 0 ? -8 : 8} ${x + 9} ${y + 12})`}
        />
      ))}
    </svg>
  );
}

function SlidePuzzlePreview() {
  const tiles = [1, 2, 3, 4, 5, 6, 7, 8, null, 9, 10, 11, 12, 13, 14, 15];
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full max-h-24 max-w-24 drop-shadow-lg">
      <rect width="120" height="120" rx="12" fill="#1e293b" />
      {tiles.map((tile, index) => {
        const row = Math.floor(index / 4);
        const col = index % 4;
        const x = 24 + col * 18;
        const y = 24 + row * 18;
        if (tile === null) {
          return (
            <rect
              key={index}
              x={x}
              y={y}
              width="16"
              height="16"
              rx="3"
              fill="#0f172a"
              stroke="#475569"
              strokeDasharray="2 2"
            />
          );
        }
        return (
          <g key={index}>
            <rect x={x} y={y} width="16" height="16" rx="3" fill="#6366f1" />
            <text x={x + 8} y={y + 11} textAnchor="middle" fontSize="7" fill="#fff">
              {tile}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function TttPreview() {
  const marks: (0 | 1 | null)[] = [0, null, 1, null, 0, 1, null, 0, null];
  const cellSize = 34;
  const origin = 9;
  const gridStroke = "#64748b";

  return (
    <svg viewBox="0 0 120 120" className="h-full w-full max-h-24 max-w-24 drop-shadow-lg">
      <rect width="120" height="120" rx="10" fill="#0f172a" />
      <rect
        x={origin}
        y={origin}
        width={cellSize * 3 + 2}
        height={cellSize * 3 + 2}
        rx="6"
        fill="none"
        stroke={gridStroke}
        strokeWidth="2"
      />
      {[1, 2].map((line) => (
        <line
          key={`v-${line}`}
          x1={origin + cellSize * line}
          y1={origin}
          x2={origin + cellSize * line}
          y2={origin + cellSize * 3}
          stroke={gridStroke}
          strokeWidth="2"
        />
      ))}
      {[1, 2].map((line) => (
        <line
          key={`h-${line}`}
          x1={origin}
          y1={origin + cellSize * line}
          x2={origin + cellSize * 3}
          y2={origin + cellSize * line}
          stroke={gridStroke}
          strokeWidth="2"
        />
      ))}
      {marks.map((mark, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        const cx = origin + col * cellSize + cellSize / 2;
        const cy = origin + row * cellSize + cellSize / 2;
        if (mark === 0) {
          return (
            <text
              key={index}
              x={cx}
              y={cy + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="20"
              fill="#f8fafc"
              fontWeight="700"
            >
              ×
            </text>
          );
        }
        if (mark === 1) {
          return (
            <circle
              key={index}
              cx={cx}
              cy={cy}
              r="10"
              fill="none"
              stroke="#f8fafc"
              strokeWidth="2.5"
            />
          );
        }
        return null;
      })}
    </svg>
  );
}

function GravityFourPreview() {
  const cols = 7;
  const rows = 6;
  const board: (0 | 1 | null)[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(null)
  );
  const drops: [number, 0 | 1][] = [
    [2, 0],
    [3, 1],
    [2, 0],
    [3, 1],
    [4, 0],
    [3, 1],
    [2, 0],
    [1, 1],
    [2, 0],
    [3, 1],
    [4, 0],
    [3, 1],
  ];
  for (const [col, player] of drops) {
    for (let row = rows - 1; row >= 0; row--) {
      if (board[row][col] === null) {
        board[row][col] = player;
        break;
      }
    }
  }

  const cell = 13;
  const padX = 9.5;
  const padY = 12;

  return (
    <svg viewBox="0 0 120 120" className="h-full w-full max-h-24 max-w-24 drop-shadow-lg">
      <rect width="120" height="120" rx="10" fill="#1e1b4b" />
      <rect
        x={padX - 2}
        y={padY - 2}
        width={cols * cell + 4}
        height={rows * cell + 4}
        rx="8"
        fill="#312e81"
        opacity="0.95"
      />
      {board.map((rowCells, row) =>
        rowCells.map((player, col) => {
          const cx = padX + col * cell + cell / 2;
          const cy = padY + row * cell + cell / 2;
          const holeR = 4.6;
          const discR = 3.6;
          return (
            <g key={`${row}-${col}`}>
              <circle cx={cx} cy={cy} r={holeR} fill="#312e81" stroke="#4338ca" strokeWidth="0.6" />
              {player !== null ? (
                <circle
                  cx={cx}
                  cy={cy}
                  r={discR}
                  fill={player === 0 ? "#fb7185" : "#fcd34d"}
                  stroke={player === 0 ? "#fda4af" : "#fde68a"}
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

function DotsBoxesPreview() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full max-h-24 max-w-24 drop-shadow-lg">
      <rect width="120" height="120" rx="10" fill="#0f172a" />
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => (
          <circle
            key={`${row}-${col}`}
            cx={24 + col * 36}
            cy={24 + row * 36}
            r="4"
            fill="#94a3b8"
          />
        ))
      )}
      <line x1="24" y1="24" x2="60" y2="24" stroke="#e2e8f0" strokeWidth="3" />
      <line x1="60" y1="24" x2="60" y2="60" stroke="#e2e8f0" strokeWidth="3" />
      <text x="42" y="48" textAnchor="middle" fontSize="14" fill="#d4849a" fontWeight="700">
        1
      </text>
    </svg>
  );
}

function NimPreview() {
  const heaps = [3, 5, 2];
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full max-h-24 max-w-24 drop-shadow-lg">
      <rect width="120" height="120" rx="10" fill="#1e293b" />
      {heaps.map((count, heap) =>
        Array.from({ length: count }, (_, i) => (
          <circle
            key={`${heap}-${i}`}
            cx={24 + heap * 36}
            cy={88 - i * 12}
            r="5"
            fill="#cbd5e1"
          />
        ))
      )}
    </svg>
  );
}

const PREVIEWS: Record<string, () => ReactNode> = {
  "nebula-link": NebulaPreview,
  reversi: ReversiPreview,
  mancala: MancalaPreview,
  gomoku: GomokuPreview,
  checkers: CheckersPreview,
  "nine-mens-morris": MorrisPreview,
  "tic-tac-toe": TttPreview,
  "gravity-four": GravityFourPreview,
  "dots-and-boxes": DotsBoxesPreview,
  nim: NimPreview,
  hex: HexPreview,
  "fox-hounds": FoxHoundsPreview,
  dominoes: DominoPreview,
  "chinese-checkers": ChineseCheckersPreview,
  ludo: LudoPreview,
  backgammon: BackgammonPreview,
  chess: ChessPreview,
  shogi: ShogiPreview,
  "mini-shogi": MiniShogiPreview,
  klondike: KlondikePreview,
  spider: SpiderPreview,
  "mahjong-solitaire": MahjongPreview,
  "slide-puzzle": SlidePuzzlePreview,
};

function bannerGradient(game: GameMeta): string {
  const hues =
    game.origin === "original" ? [230, 250, 265] : [28, 195, 175, 340, 210];
  let hash = 0;
  for (const ch of game.slug) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = hues[hash % hues.length];
  return `linear-gradient(135deg, hsl(${hue} 55% 22%), #0a0e14 72%, #141c28)`;
}

export function GameCardArt({ game }: Props) {
  const Preview = PREVIEWS[game.slug];

  return (
    <ArtFrame gradient={bannerGradient(game)}>
      {Preview ? <Preview /> : null}
    </ArtFrame>
  );
}
