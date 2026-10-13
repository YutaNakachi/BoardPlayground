export const DEJARIK_VIEW_BOX = "0 0 200 200";

const OUTER_N = 12;

function isOuterCell(cell: number): boolean {
  return cell < OUTER_N;
}
function isMiddleCell(cell: number): boolean {
  return cell >= OUTER_N && cell < OUTER_N * 2;
}
function isCenterCell(cell: number): boolean {
  return cell >= OUTER_N * 2;
}

export const BOARD_CX = 100;
export const BOARD_CY = 100;

/** プレイ面の外周（リム内側） */
export const R_PLAY_OUTER = 88;
export const R_OUTER_IN = 62;
export const R_MIDDLE_OUT = 62;
export const R_MIDDLE_IN = 40;
export const R_CENTER_OUT = 40;
export const R_RIM_OUTER = 98;

const CELL_BROWN = "#5c4033";
const CELL_BLACK = "#1a1410";
const GROOVE = "#0d0a08";

function degToRad(d: number): number {
  return (d * Math.PI) / 180;
}

function sectorPath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startDeg: number,
  endDeg: number
): string {
  const a0 = degToRad(startDeg);
  const a1 = degToRad(endDeg);
  const x0o = cx + rOuter * Math.cos(a0);
  const y0o = cy + rOuter * Math.sin(a0);
  const x1o = cx + rOuter * Math.cos(a1);
  const y1o = cy + rOuter * Math.sin(a1);
  const x1i = cx + rInner * Math.cos(a1);
  const y1i = cy + rInner * Math.sin(a1);
  const x0i = cx + rInner * Math.cos(a0);
  const y0i = cy + rInner * Math.sin(a0);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x0o} ${y0o} A ${rOuter} ${rOuter} 0 ${large} 1 ${x1o} ${y1o} L ${x1i} ${y1i} A ${rInner} ${rInner} 0 ${large} 0 ${x0i} ${y0i} Z`;
}

function piePath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number
): string {
  const a0 = degToRad(startDeg);
  const a1 = degToRad(endDeg);
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${BOARD_CX} ${BOARD_CY} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
}

export function cellWedgeAngles(cell: number): { start: number; end: number } {
  if (isOuterCell(cell)) {
    const i = cell;
    const mid = -90 + i * 30;
    return { start: mid - 15, end: mid + 15 };
  }
  if (isMiddleCell(cell)) {
    const i = cell - OUTER_N;
    const mid = -90 + i * 30;
    return { start: mid - 15, end: mid + 15 };
  }
  const k = cell - OUTER_N * 2;
  return centerWedgeAngles(k);
}

/** Ck が接続する中輪 M[3k]〜M[3k+2] と同じ90°幅（カードinal 90°ではなく15°ずらす） */
export function centerWedgeAngles(k: number): { start: number; end: number } {
  return { start: -105 + k * 90, end: -15 + k * 90 };
}

function normalizeDeg(d: number): number {
  let x = d % 360;
  if (x < 0) x += 360;
  return x;
}

function isAngleInWedge(deg: number, startDeg: number, endDeg: number): boolean {
  const d = normalizeDeg(deg);
  const a = normalizeDeg(startDeg);
  const b = normalizeDeg(endDeg);
  if (a < b) return d >= a && d < b;
  return d >= a || d < b;
}

/** 周方向・輪方向で隣接マスと色が交互になる */
export function cellBaseFill(cell: number): string {
  if (isOuterCell(cell)) {
    return cell % 2 === 0 ? CELL_BROWN : CELL_BLACK;
  }
  if (isMiddleCell(cell)) {
    const i = cell - OUTER_N;
    return (i + 1) % 2 === 0 ? CELL_BROWN : CELL_BLACK;
  }
  const k = cell - OUTER_N * 2;
  return (k + 1) % 2 === 0 ? CELL_BROWN : CELL_BLACK;
}

export function cellSectorPath(cell: number): string {
  const { start, end } = cellWedgeAngles(cell);
  if (isCenterCell(cell)) {
    return piePath(BOARD_CX, BOARD_CY, R_CENTER_OUT, start, end);
  }
  if (isOuterCell(cell)) {
    return sectorPath(BOARD_CX, BOARD_CY, R_OUTER_IN, R_PLAY_OUTER, start, end);
  }
  return sectorPath(BOARD_CX, BOARD_CY, R_MIDDLE_IN, R_MIDDLE_OUT, start, end);
}

export function cellCentroid(cell: number): [number, number] {
  const { start, end } = cellWedgeAngles(cell);
  const mid = (start + end) / 2;
  const rad = degToRad(mid);
  let r: number;
  if (isCenterCell(cell)) {
    r = R_CENTER_OUT * 0.58;
  } else if (isOuterCell(cell)) {
    r = (R_OUTER_IN + R_PLAY_OUTER) / 2;
  } else {
    r = (R_MIDDLE_IN + R_MIDDLE_OUT) / 2;
  }
  return [BOARD_CX + r * Math.cos(rad), BOARD_CY + r * Math.sin(rad)];
}

/** ポインタ座標からマス ID（viewBox 座標系） */
export function dejarikCellAtPoint(x: number, y: number): number | null {
  const dx = x - BOARD_CX;
  const dy = y - BOARD_CY;
  const r = Math.hypot(dx, dy);
  if (r > R_PLAY_OUTER) return null;

  let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
  let a = deg + 90;
  if (a < 0) a += 360;
  if (a >= 360) a -= 360;

  if (r <= R_CENTER_OUT) {
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    for (let k = 0; k < 4; k++) {
      const { start, end } = centerWedgeAngles(k);
      if (isAngleInWedge(deg, start, end)) return OUTER_N * 2 + k;
    }
    return OUTER_N * 2;
  }
  if (r <= R_MIDDLE_OUT) {
    const i = Math.floor((a + 15) / 30) % OUTER_N;
    return OUTER_N + i;
  }
  const i = Math.floor((a + 15) / 30) % OUTER_N;
  return i;
}

/** 中央4マスの境界（Ck と Ck+1 の境＝中輪3マス区切り） */
export const CENTER_RADIAL_DEGS = [-105, -15, 75, 165];

/** 外輪・中輪のマス境界（マス中心ではなく境目） */
export const CELL_RADIAL_BOUNDARY_DEGS = Array.from(
  { length: 12 },
  (_, i) => -90 + i * 30 + 15
);

export function lineFromCenter(deg: number, rEnd: number): [number, number, number, number] {
  const rad = degToRad(deg);
  return [
    BOARD_CX,
    BOARD_CY,
    BOARD_CX + rEnd * Math.cos(rad),
    BOARD_CY + rEnd * Math.sin(rad),
  ];
}

export function lineFromRadius(
  deg: number,
  rStart: number,
  rEnd: number
): [number, number, number, number] {
  const rad = degToRad(deg);
  return [
    BOARD_CX + rStart * Math.cos(rad),
    BOARD_CY + rStart * Math.sin(rad),
    BOARD_CX + rEnd * Math.cos(rad),
    BOARD_CY + rEnd * Math.sin(rad),
  ];
}

export function ringArcPath(r: number, startDeg: number, endDeg: number): string {
  const a0 = degToRad(startDeg);
  const a1 = degToRad(endDeg);
  const x0 = BOARD_CX + r * Math.cos(a0);
  const y0 = BOARD_CY + r * Math.sin(a0);
  const x1 = BOARD_CX + r * Math.cos(a1);
  const y1 = BOARD_CY + r * Math.sin(a1);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

export { CELL_BROWN, CELL_BLACK, GROOVE };
