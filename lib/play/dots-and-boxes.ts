export const DB_BOX_ROWS = 4;
export const DB_BOX_COLS = 4;

export type Player = 0 | 1;
export type EdgeKind = "h" | "v";

export type Edge = {
  kind: EdgeKind;
  row: number;
  col: number;
};

export type DotsBoxesState = {
  edges: Set<string>;
  owners: (Player | null)[];
  scores: [number, number];
  current: Player;
  over: boolean;
};

function edgeKey(edge: Edge): string {
  return `${edge.kind}:${edge.row}:${edge.col}`;
}

export function parseEdgeKey(key: string): Edge {
  const [kind, row, col] = key.split(":");
  return { kind: kind as EdgeKind, row: Number(row), col: Number(col) };
}

function boxIndex(row: number, col: number): number {
  return row * DB_BOX_COLS + col;
}

function boxesForEdge(edge: Edge): number[] {
  const boxes: number[] = [];
  if (edge.kind === "h") {
    if (edge.row > 0) boxes.push(boxIndex(edge.row - 1, edge.col));
    if (edge.row < DB_BOX_ROWS) boxes.push(boxIndex(edge.row, edge.col));
  } else {
    if (edge.col > 0) boxes.push(boxIndex(edge.row, edge.col - 1));
    if (edge.col < DB_BOX_COLS) boxes.push(boxIndex(edge.row, edge.col));
  }
  return boxes;
}

function boxEdges(box: number): Edge[] {
  const row = Math.floor(box / DB_BOX_COLS);
  const col = box % DB_BOX_COLS;
  return [
    { kind: "h", row, col },
    { kind: "h", row: row + 1, col },
    { kind: "v", row, col },
    { kind: "v", row, col: col + 1 },
  ];
}

function isBoxComplete(state: DotsBoxesState, box: number): boolean {
  return boxEdges(box).every((edge) => state.edges.has(edgeKey(edge)));
}

export function initialDotsBoxes(): DotsBoxesState {
  return {
    edges: new Set(),
    owners: Array(DB_BOX_ROWS * DB_BOX_COLS).fill(null),
    scores: [0, 0],
    current: 0,
    over: false,
  };
}

export function allDotsBoxesEdges(): Edge[] {
  const edges: Edge[] = [];
  for (let row = 0; row <= DB_BOX_ROWS; row++) {
    for (let col = 0; col < DB_BOX_COLS; col++) {
      edges.push({ kind: "h", row, col });
    }
  }
  for (let row = 0; row < DB_BOX_ROWS; row++) {
    for (let col = 0; col <= DB_BOX_COLS; col++) {
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
  if (state.edges.has(key)) return null;

  const edges = new Set(state.edges);
  edges.add(key);
  const owners = state.owners.slice();
  const scores: [number, number] = [...state.scores];
  let captured = 0;

  for (const box of boxesForEdge(edge)) {
    if (owners[box] !== null) continue;
    if (boxEdges(box).every((side) => edges.has(edgeKey(side)))) {
      owners[box] = state.current;
      scores[state.current] += 1;
      captured += 1;
    }
  }

  const totalBoxes = DB_BOX_ROWS * DB_BOX_COLS;
  const over = owners.every((owner) => owner !== null);
  const nextPlayer: Player = captured > 0 && !over ? state.current : state.current === 0 ? 1 : 0;

  return {
    edges,
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
