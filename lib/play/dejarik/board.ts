export const OUTER_COUNT = 12;
export const MIDDLE_COUNT = 12;
export const CENTER_COUNT = 4;
export const DEJARIK_CELL_COUNT = OUTER_COUNT + MIDDLE_COUNT + CENTER_COUNT;

export type Player = 0 | 1;
export type CreatureType = "brute" | "predator" | "guardian" | "scout";

export const CREATURE_TYPES: CreatureType[] = [
  "brute",
  "predator",
  "guardian",
  "scout",
];

export const CREATURE_LABEL: Record<CreatureType, string> = {
  brute: "ブルート",
  predator: "プレデター",
  guardian: "ガーディアン",
  scout: "スカウト",
};

export function outerIndex(i: number): number {
  return i;
}

export function middleIndex(i: number): number {
  return OUTER_COUNT + i;
}

export function centerIndex(k: number): number {
  return OUTER_COUNT + MIDDLE_COUNT + k;
}

export function isOuter(cell: number): boolean {
  return cell >= 0 && cell < OUTER_COUNT;
}

export function isMiddle(cell: number): boolean {
  return cell >= OUTER_COUNT && cell < OUTER_COUNT + MIDDLE_COUNT;
}

export function isCenter(cell: number): boolean {
  return cell >= OUTER_COUNT + MIDDLE_COUNT;
}

export function orbitIndex(cell: number): number {
  if (isOuter(cell)) return cell;
  if (isMiddle(cell)) return cell - OUTER_COUNT;
  return cell - OUTER_COUNT - MIDDLE_COUNT;
}

export function centerSector(cell: number): number {
  if (isCenter(cell)) return cell - OUTER_COUNT - MIDDLE_COUNT;
  if (isMiddle(cell)) return Math.floor((cell - OUTER_COUNT) / 3);
  return Math.floor(orbitIndex(cell) / 3);
}

export function centerForMiddle(middleCell: number): number {
  const m = middleCell - OUTER_COUNT;
  return centerIndex(Math.floor(m / 3));
}

export function oppositeCenter(centerCell: number): number {
  const k = centerCell - OUTER_COUNT - MIDDLE_COUNT;
  return centerIndex((k + 2) % CENTER_COUNT);
}

export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function stepOrbit(
  ring: "outer" | "middle" | "center",
  index: number,
  delta: number
): number {
  const size =
    ring === "outer"
      ? OUTER_COUNT
      : ring === "middle"
        ? MIDDLE_COUNT
        : CENTER_COUNT;
  const next = mod(index + delta, size);
  if (ring === "outer") return outerIndex(next);
  if (ring === "middle") return middleIndex(next);
  return centerIndex(next);
}

/** 中輪 M[3k±1]（斜め後用） */
export function guardianDiagonalBackFromCenter(centerCell: number): number[] {
  const k = centerCell - OUTER_COUNT - MIDDLE_COUNT;
  return [
    middleIndex(mod(3 * k - 1, MIDDLE_COUNT)),
    middleIndex(mod(3 * k + 3, MIDDLE_COUNT)),
  ];
}

export function connectedMiddles(centerCell: number): number[] {
  const k = centerCell - OUTER_COUNT - MIDDLE_COUNT;
  return [0, 1, 2].map((j) => middleIndex(3 * k + j));
}

const orthoNeighbors: number[][] = [];

function buildNeighbors(): void {
  for (let c = 0; c < DEJARIK_CELL_COUNT; c++) {
    orthoNeighbors[c] = [];
  }
  for (let i = 0; i < OUTER_COUNT; i++) {
    const o = outerIndex(i);
    orthoNeighbors[o].push(
      stepOrbit("outer", i, -1),
      stepOrbit("outer", i, 1),
      middleIndex(i)
    );
  }
  for (let i = 0; i < MIDDLE_COUNT; i++) {
    const m = middleIndex(i);
    orthoNeighbors[m].push(
      stepOrbit("middle", i, -1),
      stepOrbit("middle", i, 1),
      outerIndex(i),
      centerForMiddle(m)
    );
  }
  for (let k = 0; k < CENTER_COUNT; k++) {
    const c = centerIndex(k);
    orthoNeighbors[c].push(
      stepOrbit("center", k, -1),
      stepOrbit("center", k, 1),
      ...connectedMiddles(c)
    );
  }
  for (let c = 0; c < DEJARIK_CELL_COUNT; c++) {
    orthoNeighbors[c] = [...new Set(orthoNeighbors[c])];
  }
}

buildNeighbors();

export function getOrthoNeighbors(cell: number): number[] {
  return orthoNeighbors[cell] ?? [];
}

/** ブルート斜め：外↔中で周回±1 など */
export function getBruteDiagonals(cell: number): number[] {
  const out: number[] = [];
  if (isOuter(cell)) {
    const i = orbitIndex(cell);
    for (const d of [-1, 1]) {
      out.push(middleIndex(mod(i + d, MIDDLE_COUNT)));
    }
  } else if (isMiddle(cell)) {
    const i = orbitIndex(cell);
    for (const d of [-1, 1]) {
      out.push(outerIndex(mod(i + d, OUTER_COUNT)));
    }
  }
  return out;
}

export function bruteWarpTarget(outerCell: number): number {
  const i = orbitIndex(outerCell);
  return outerIndex(mod(i + 6, OUTER_COUNT));
}

/** プレイヤー0のホーム外輪インデックス 0–5、プレイヤー1は 6–11 */
export function homeOuterIndices(player: Player): number[] {
  return player === 0 ? [0, 1, 2, 3, 4, 5] : [6, 7, 8, 9, 10, 11];
}

/** 連続4マス配置の開始インデックス（外輪番号） */
export function validPlacementStarts(player: Player): number[] {
  const home = homeOuterIndices(player);
  const starts: number[] = [];
  for (let s = 0; s <= home.length - 4; s++) {
    starts.push(home[s]);
  }
  return starts;
}

export function placementCellsFromStart(startOuter: number): number[] {
  return [0, 1, 2, 3].map((d) => outerIndex(mod(startOuter + d, OUTER_COUNT)));
}

/** SVG 配置（viewBox 0 0 200 200） */
export const DEJARIK_VIEW_BOX = "0 0 200 200";

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

const CX = 100;
const CY = 100;
const R_OUTER = 82;
const R_MIDDLE = 58;
const R_CENTER = 28;

export const DEJARIK_NODE_POS: [number, number][] = [];

function buildPositions(): void {
  for (let i = 0; i < DEJARIK_CELL_COUNT; i++) {
    DEJARIK_NODE_POS.push([0, 0]);
  }
  for (let i = 0; i < OUTER_COUNT; i++) {
    const deg = -90 + i * 30;
    DEJARIK_NODE_POS[outerIndex(i)] = polar(CX, CY, R_OUTER, deg);
  }
  for (let i = 0; i < MIDDLE_COUNT; i++) {
    const deg = -90 + i * 30;
    DEJARIK_NODE_POS[middleIndex(i)] = polar(CX, CY, R_MIDDLE, deg);
  }
  for (let k = 0; k < CENTER_COUNT; k++) {
    const deg = -90 + k * 90 + 45;
    DEJARIK_NODE_POS[centerIndex(k)] = polar(CX, CY, R_CENTER * 0.55, deg);
  }
}

buildPositions();
