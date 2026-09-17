import type { ReactNode } from "react";
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

function TttPreview() {
  const marks = ["×", "", "○", "", "×", "○", "", "×", ""];
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full max-h-24 max-w-24 drop-shadow-lg">
      <rect width="120" height="120" rx="10" fill="#1e293b" />
      {marks.map((mark, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        const x = 20 + col * 30;
        const y = 28 + row * 30;
        return (
          <text
            key={index}
            x={x}
            y={y}
            textAnchor="middle"
            fontSize="18"
            fill="#f8fafc"
            fontWeight="700"
          >
            {mark}
          </text>
        );
      })}
    </svg>
  );
}

function GravityFourPreview() {
  const cols = [0, 1, 2, 1, 0, 1, 2];
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full max-h-24 max-w-24 drop-shadow-lg">
      <rect width="120" height="120" rx="10" fill="#312e81" />
      {cols.map((col, row) => {
        const x = 18 + col * 14;
        const y = 88 - row * 14;
        return (
          <circle
            key={row}
            cx={x}
            cy={y}
            r="5"
            fill={row % 2 === 0 ? "#fb7185" : "#fcd34d"}
          />
        );
      })}
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
