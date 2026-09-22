export type DotsBoxesSize = 3 | 4 | 5;

export const DOTS_BOXES_SIZE_OPTIONS: DotsBoxesSize[] = [3, 4, 5];

/** @deprecated 互換用。新コードは state.rows / state.cols を使う */
export const DB_BOX_ROWS = 4;
/** @deprecated 互換用。新コードは state.rows / state.cols を使う */
export const DB_BOX_COLS = 4;

export type Player = 0 | 1;
export type EdgeKind = "h" | "v";

export type Edge = {
  kind: EdgeKind;
  row: number;
  col: number;
};

export type DotsBoxesState = {
  rows: number;
  cols: number;
  edgeOwners: Record<string, Player>;
  owners: (Player | null)[];
  scores: [number, number];
  current: Player;
  over: boolean;
};

export function edgeKey(edge: Edge): string {
  return `${edge.kind}:${edge.row}:${edge.col}`;
}

export function parseEdgeKey(key: string): Edge {
  const [kind, row, col] = key.split(":");
  return { kind: kind as EdgeKind, row: Number(row), col: Number(col) };
}

function boxIndex(row: number, col: number, cols: number): number {
  return row * cols + col;
}

function boxesForEdge(edge: Edge, rows: number, cols: number): number[] {
  const boxes: number[] = [];
  if (edge.kind === "h") {
    if (edge.row > 0) boxes.push(boxIndex(edge.row - 1, edge.col, cols));
    if (edge.row < rows) boxes.push(boxIndex(edge.row, edge.col, cols));
  } else {
    if (edge.col > 0) boxes.push(boxIndex(edge.row, edge.col - 1, cols));
    if (edge.col < cols) boxes.push(boxIndex(edge.row, edge.col, cols));
  }
  return boxes;
}

function boxEdges(box: number, rows: number, cols: number): Edge[] {
  const row = Math.floor(box / cols);
  const col = box % cols;
  return [
    { kind: "h", row, col },
    { kind: "h", row: row + 1, col },
    { kind: "v", row, col },
    { kind: "v", row, col: col + 1 },
  ];
}

export function initialDotsBoxes(size: DotsBoxesSize = 4): DotsBoxesState {
  return {
    rows: size,
    cols: size,
    edgeOwners: {},
    owners: Array(size * size).fill(null),
    scores: [0, 0],
    current: 0,
    over: false,
  };
}

export function allDotsBoxesEdges(state: DotsBoxesState): Edge[] {
  const { rows, cols } = state;
  const edges: Edge[] = [];
  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col < cols; col++) {
      edges.push({ kind: "h", row, col });
    }
  }
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col <= cols; col++) {
      edges.push({ kind: "v", row, col });
    }
  }
  return edges;
}

export function drawDotsBoxesEdge(
  state: DotsBoxesState,
  edge: Edge
): DotsBoxesState | null {
  const key = edgeKey(edge);
  if (state.edgeOwners[key] !== undefined) return null;

  const edgeOwners = { ...state.edgeOwners, [key]: state.current };
  const owners = state.owners.slice();
  const scores: [number, number] = [...state.scores];
  let captured = 0;

  for (const box of boxesForEdge(edge, state.rows, state.cols)) {
    if (owners[box] !== null) continue;
    if (
      boxEdges(box, state.rows, state.cols).every((side) =>
        edgeOwners[edgeKey(side)] !== undefined
      )
    ) {
      owners[box] = state.current;
      scores[state.current] += 1;
      captured += 1;
    }
  }

  const over = owners.every((owner) => owner !== null);
  const nextPlayer: Player =
    captured > 0 && !over ? state.current : state.current === 0 ? 1 : 0;

  return {
    ...state,
    edgeOwners,
    owners,
    scores,
    current: over ? state.current : nextPlayer,
    over,
  };
}

export function dotsBoxesWinners(scores: [number, number]): number[] {
  if (scores[0] === scores[1]) return [0, 1];
  return scores[0] > scores[1] ? [0] : [1];
}
