import {
  bruteWarpTarget,
  centerForMiddle,
  connectedMiddles,
  getBruteDiagonals,
  getOrthoNeighbors,
  guardianDiagonalBackFromCenter,
  isCenter,
  isMiddle,
  isOuter,
  middleIndex,
  oppositeCenter,
  orbitIndex,
  outerIndex,
  stepOrbit,
  type CreatureType,
} from "./board";

export type Cells = (number | null)[];

function occupant(cells: Cells, cell: number): number | null {
  return cells[cell] ?? null;
}

function isEmpty(cells: Cells, cell: number): boolean {
  return occupant(cells, cell) === null;
}

function filterFriendly(
  cells: Cells,
  pieces: Record<number, { owner: number }>,
  owner: number,
  pieceId: number,
  targets: Set<number>,
  forAttack: boolean
): number[] {
  const out: number[] = [];
  for (const t of targets) {
    const occ = occupant(cells, t);
    if (occ === pieceId) continue;
    if (occ !== null) {
      if (pieces[occ]?.owner === owner) continue;
      if (!forAttack) continue;
    } else if (forAttack) continue;
    out.push(t);
  }
  return out;
}

export function bruteMoveTargets(
  cells: Cells,
  pieces: Record<number, { owner: number }>,
  owner: number,
  pieceId: number,
  from: number
): number[] {
  const raw = new Set<number>();
  for (const n of getOrthoNeighbors(from)) raw.add(n);
  for (const d of getBruteDiagonals(from)) raw.add(d);
  if (isCenter(from)) {
    for (const d of guardianDiagonalBackFromCenter(from)) raw.add(d);
  }
  if (isOuter(from)) {
    raw.add(bruteWarpTarget(from));
  }
  return filterFriendly(cells, pieces, owner, pieceId, raw, false);
}

export function bruteAttackTargets(
  cells: Cells,
  pieces: Record<number, { owner: number }>,
  owner: number,
  pieceId: number,
  from: number
): number[] {
  const raw = new Set<number>();
  for (const n of getOrthoNeighbors(from)) raw.add(n);
  for (const d of getBruteDiagonals(from)) raw.add(d);
  if (isCenter(from)) {
    for (const d of guardianDiagonalBackFromCenter(from)) raw.add(d);
  }
  if (isOuter(from)) {
    raw.add(bruteWarpTarget(from));
  }
  return filterFriendly(cells, pieces, owner, pieceId, raw, true);
}

function predatorRawTargets(from: number): Set<number> {
  const raw = new Set<number>();
  if (isOuter(from)) {
    const i = orbitIndex(from);
    for (const d of [-2, 2]) {
      raw.add(stepOrbit("middle", i, d));
    }
  } else if (isMiddle(from)) {
    const ck = centerForMiddle(from);
    raw.add(oppositeCenter(ck));
    const i = orbitIndex(from);
    for (const d of [-2, 2]) {
      raw.add(stepOrbit("outer", i, d));
    }
  } else if (isCenter(from)) {
    const mids = connectedMiddles(from);
    for (const start of mids) {
      const mi = orbitIndex(start);
      for (const d of [-2, 2]) {
        raw.add(stepOrbit("middle", mi, d));
      }
    }
  }
  return raw;
}

export function predatorMoveTargets(
  cells: Cells,
  pieces: Record<number, { owner: number }>,
  owner: number,
  pieceId: number,
  from: number
): number[] {
  return filterFriendly(
    cells,
    pieces,
    owner,
    pieceId,
    predatorRawTargets(from),
    false
  );
}

export function predatorAttackTargets(
  cells: Cells,
  pieces: Record<number, { owner: number }>,
  owner: number,
  pieceId: number,
  from: number
): number[] {
  return filterFriendly(
    cells,
    pieces,
    owner,
    pieceId,
    predatorRawTargets(from),
    true
  );
}

export function guardianMoveTargets(
  cells: Cells,
  pieces: Record<number, { owner: number }>,
  owner: number,
  pieceId: number,
  from: number
): number[] {
  const raw = new Set<number>();
  if (isOuter(from)) {
    const i = orbitIndex(from);
    if (isEmpty(cells, middleIndex(i))) raw.add(middleIndex(i));
    for (const d of [-2, 2] as const) {
      const step1 = stepOrbit("outer", i, d > 0 ? 1 : -1);
      const to = stepOrbit("outer", i, d);
      if (isEmpty(cells, step1)) raw.add(to);
    }
  } else if (isMiddle(from)) {
    const i = orbitIndex(from);
    raw.add(centerForMiddle(from));
    raw.add(outerIndex(i));
    for (const d of [-2, 2] as const) {
      const step1 = stepOrbit("middle", i, d > 0 ? 1 : -1);
      const to = stepOrbit("middle", i, d);
      if (isEmpty(cells, step1)) raw.add(to);
    }
  } else if (isCenter(from)) {
    for (const m of connectedMiddles(from)) raw.add(m);
    const ci = orbitIndex(from);
    for (const d of [-2, 2] as const) {
      const step1 = stepOrbit("center", ci, d > 0 ? 1 : -1);
      const to = stepOrbit("center", ci, d);
      if (isEmpty(cells, step1)) raw.add(to);
    }
  }
  return filterFriendly(cells, pieces, owner, pieceId, raw, false);
}

export function guardianAttackTargets(
  cells: Cells,
  pieces: Record<number, { owner: number }>,
  owner: number,
  pieceId: number,
  from: number
): number[] {
  const ring: "outer" | "middle" | "center" = isOuter(from)
    ? "outer"
    : isMiddle(from)
      ? "middle"
      : "center";
  const i = orbitIndex(from);
  const raw = new Set<number>();
  for (const d of [-2, 2] as const) {
    const step1 = stepOrbit(ring, i, d > 0 ? 1 : -1);
    const to = stepOrbit(ring, i, d);
    if (!isEmpty(cells, step1)) continue;
    raw.add(to);
  }
  return filterFriendly(cells, pieces, owner, pieceId, raw, true);
}

function scoutStraight2(cells: Cells, from: number): number[] {
  const raw = new Set<number>();
  if (isOuter(from)) {
    const i = orbitIndex(from);
    for (const d of [-2, 2]) raw.add(stepOrbit("outer", i, d));
    const mid = middleIndex(i);
    if (isEmpty(cells, mid)) raw.add(centerForMiddle(mid));
  } else if (isMiddle(from)) {
    const i = orbitIndex(from);
    for (const d of [-2, 2]) raw.add(stepOrbit("middle", i, d));
  } else if (isCenter(from)) {
    const i = orbitIndex(from);
    for (const d of [-2, 2]) {
      const step1 = stepOrbit("center", i, d > 0 ? 1 : -1);
      const to = stepOrbit("center", i, d);
      if (isEmpty(cells, step1)) raw.add(to);
    }
    for (const m of connectedMiddles(from)) {
      if (isEmpty(cells, m)) raw.add(outerIndex(orbitIndex(m)));
    }
  }
  return [...raw];
}

export function scoutMoveTargets(
  cells: Cells,
  pieces: Record<number, { owner: number }>,
  owner: number,
  pieceId: number,
  from: number
): number[] {
  const raw = scoutStraight2(cells, from);
  const set = new Set(raw);
  return filterFriendly(cells, pieces, owner, pieceId, set, false);
}

export function scoutAttackTargets(
  cells: Cells,
  pieces: Record<number, { owner: number }>,
  owner: number,
  pieceId: number,
  from: number
): number[] {
  const set = new Set(getOrthoNeighbors(from));
  return filterFriendly(cells, pieces, owner, pieceId, set, true);
}

export function moveTargetsFor(
  type: CreatureType,
  cells: Cells,
  pieces: Record<number, { owner: number }>,
  owner: number,
  pieceId: number,
  from: number
): number[] {
  switch (type) {
    case "brute":
      return bruteMoveTargets(cells, pieces, owner, pieceId, from);
    case "predator":
      return predatorMoveTargets(cells, pieces, owner, pieceId, from);
    case "guardian":
      return guardianMoveTargets(cells, pieces, owner, pieceId, from);
    case "scout":
      return scoutMoveTargets(cells, pieces, owner, pieceId, from);
    default:
      return [];
  }
}

export function attackTargetsFor(
  type: CreatureType,
  cells: Cells,
  pieces: Record<number, { owner: number }>,
  owner: number,
  pieceId: number,
  from: number
): number[] {
  switch (type) {
    case "brute":
      return bruteAttackTargets(cells, pieces, owner, pieceId, from);
    case "predator":
      return predatorAttackTargets(cells, pieces, owner, pieceId, from);
    case "guardian":
      return guardianAttackTargets(cells, pieces, owner, pieceId, from);
    case "scout":
      return scoutAttackTargets(cells, pieces, owner, pieceId, from);
    default:
      return [];
  }
}
