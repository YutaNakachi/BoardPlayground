import {
  LUDO_BASE_REGIONS,
  LUDO_DISPLAY_GRID,
  LUDO_DISPLAY_MARGIN,
  LUDO_ENTRY,
  LUDO_HOME,
  LUDO_HOME_ENTRY,
  LUDO_PATH,
  LUDO_YARD,
  coordKey,
} from "@/lib/play/ludo-board";

const PLAYER_FILLS = ["#ff5c8a", "#34d399", "#fbbf24", "#38bdf8"];
const BASE_FILLS = [
  "rgba(255,92,138,0.28)",
  "rgba(52,211,153,0.28)",
  "rgba(251,191,36,0.28)",
  "rgba(56,189,248,0.28)",
];

const VIEW_SIZE = 120;
const CELL = VIEW_SIZE / LUDO_DISPLAY_GRID;
const ACTIVE_PLAYERS = [0, 1, 2, 3];

type CellKind = "empty" | "base" | "path" | "home" | "center";

type CellInfo = {
  kind: CellKind;
  owner?: number;
  isStart?: boolean;
  homeSlot?: number;
};

function buildCellMap() {
  const pathKeys = new Set(LUDO_PATH.map(coordKey));
  const homeMap = new Map<string, { player: number; slot: number }>();
  const startMap = new Map<string, number>();
  const homeEntryMap = new Map<string, number>();

  for (const player of ACTIVE_PLAYERS) {
    startMap.set(coordKey(LUDO_PATH[LUDO_ENTRY[player]]), player);
    homeEntryMap.set(coordKey(LUDO_HOME_ENTRY[player]), player);
    LUDO_HOME[player].forEach((coord, slot) => {
      homeMap.set(coordKey(coord), { player, slot });
    });
  }

  const baseMap = new Map<string, number>();
  for (const region of LUDO_BASE_REGIONS) {
    for (let r = region.rows[0]; r <= region.rows[1]; r++) {
      for (let c = region.cols[0]; c <= region.cols[1]; c++) {
        baseMap.set(coordKey({ r, c }), region.player);
      }
    }
  }

  return { pathKeys, homeMap, startMap, homeEntryMap, baseMap };
}

const CELL_MAP = buildCellMap();

function cellInfo(r: number, c: number): CellInfo {
  const key = coordKey({ r, c });
  if (r >= 6 && r <= 8 && c >= 6 && c <= 8) return { kind: "center" };
  if (CELL_MAP.homeMap.has(key)) {
    const home = CELL_MAP.homeMap.get(key)!;
    return {
      kind: "home",
      owner: home.player,
      homeSlot: home.slot,
      isStart: CELL_MAP.homeEntryMap.has(key),
    };
  }
  if (CELL_MAP.startMap.has(key)) {
    return { kind: "path", owner: CELL_MAP.startMap.get(key), isStart: true };
  }
  if (CELL_MAP.pathKeys.has(key)) return { kind: "path" };
  if (CELL_MAP.baseMap.has(key)) return { kind: "base", owner: CELL_MAP.baseMap.get(key) };
  if (r >= 6 && r <= 8) return { kind: "path" };
  if (c >= 6 && c <= 8) return { kind: "path" };
  return { kind: "empty" };
}

function cellRect(r: number, c: number) {
  const dr = r - LUDO_DISPLAY_MARGIN;
  const dc = c - LUDO_DISPLAY_MARGIN;
  return {
    x: dc * CELL,
    y: dr * CELL,
    cx: dc * CELL + CELL / 2,
    cy: dr * CELL + CELL / 2,
    size: CELL,
  };
}

function baseCornerRadius(player: number, r: number, c: number): number {
  if (player === 0 && r === 1 && c === 1) return CELL * 0.45;
  if (player === 1 && r === 1 && c === 13) return CELL * 0.45;
  if (player === 2 && r === 13 && c === 13) return CELL * 0.45;
  if (player === 3 && r === 13 && c === 1) return CELL * 0.45;
  return 0;
}

function centerTrianglePoints(r: number, c: number): string | null {
  const { x, y, size } = cellRect(r, c);
  const x2 = x + size;
  const y2 = y + size;
  if (r === 6 && c === 6) return `${x},${y} ${x2},${y} ${x},${y2}`;
  if (r === 6 && c === 8) return `${x},${y} ${x2},${y} ${x2},${y2}`;
  if (r === 8 && c === 8) return `${x2},${y} ${x2},${y2} ${x},${y2}`;
  if (r === 8 && c === 6) return `${x},${y} ${x2},${y2} ${x},${y2}`;
  return null;
}

function homeFill(owner: number, slot: number): string {
  const alpha = 0.35 + slot * 0.12;
  const hex = PLAYER_FILLS[owner];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

type Props = {
  className?: string;
};

export function LudoBoardPreview({ className = "h-full w-full max-h-24 max-w-24 drop-shadow-lg" }: Props) {
  const cells: { r: number; c: number; info: CellInfo }[] = [];
  for (let r = LUDO_DISPLAY_MARGIN; r < LUDO_DISPLAY_MARGIN + LUDO_DISPLAY_GRID; r++) {
    for (let c = LUDO_DISPLAY_MARGIN; c < LUDO_DISPLAY_MARGIN + LUDO_DISPLAY_GRID; c++) {
      cells.push({ r, c, info: cellInfo(r, c) });
    }
  }

  return (
    <svg viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`} className={className} aria-hidden>
      <rect
        width={VIEW_SIZE}
        height={VIEW_SIZE}
        rx={10}
        fill="rgba(254,243,199,0.08)"
        stroke="rgba(120,53,15,0.35)"
        strokeWidth={1.5}
      />

      {cells.map(({ r, c, info }) => {
        if (info.kind === "empty") return null;
        const { x, y, size, cx, cy } = cellRect(r, c);
        const radius = info.kind === "base" && info.owner != null
          ? baseCornerRadius(info.owner, r, c)
          : 0;

        if (info.kind === "base" && info.owner != null) {
          return (
            <rect
              key={`${r}-${c}`}
              x={x}
              y={y}
              width={size}
              height={size}
              rx={radius}
              fill={BASE_FILLS[info.owner]}
            />
          );
        }

        if (info.kind === "center") {
          const triangle = centerTrianglePoints(r, c);
          if (triangle) {
            const owner =
              r === 6 && c === 6 ? 0 : r === 6 && c === 8 ? 1 : r === 8 && c === 8 ? 2 : 3;
            return (
              <polygon key={`${r}-${c}`} points={triangle} fill={PLAYER_FILLS[owner]} />
            );
          }
          return (
            <rect
              key={`${r}-${c}`}
              x={x}
              y={y}
              width={size}
              height={size}
              fill="#1e293b"
            />
          );
        }

        if (info.kind === "home" && info.owner != null) {
          return (
            <circle
              key={`${r}-${c}`}
              cx={cx}
              cy={cy}
              r={size * 0.34}
              fill={homeFill(info.owner, info.homeSlot ?? 0)}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth={0.6}
            />
          );
        }

        if (info.kind === "path") {
          if (info.isStart && info.owner != null) {
            return (
              <rect
                key={`${r}-${c}`}
                x={x + size * 0.08}
                y={y + size * 0.08}
                width={size * 0.84}
                height={size * 0.84}
                rx={size * 0.12}
                fill={homeFill(info.owner, 3)}
                stroke={PLAYER_FILLS[info.owner]}
                strokeWidth={0.8}
              />
            );
          }
          return (
            <circle
              key={`${r}-${c}`}
              cx={cx}
              cy={cy}
              r={size * 0.3}
              fill="#f8fafc"
              stroke="rgba(148,163,184,0.45)"
              strokeWidth={0.6}
            />
          );
        }

        return null;
      })}

      {LUDO_YARD.map((yard, player) =>
        yard.map((spot, index) => {
          const { cx, cy } = cellRect(spot.r, spot.c);
          return (
            <circle
              key={`yard-${player}-${index}`}
              cx={cx}
              cy={cy}
              r={CELL * 0.22}
              fill={PLAYER_FILLS[player]}
              stroke="rgba(255,255,255,0.55)"
              strokeWidth={0.5}
              style={{ filter: `drop-shadow(0 0 ${CELL * 0.12}px ${PLAYER_FILLS[player]})` }}
            />
          );
        })
      )}
    </svg>
  );
}
