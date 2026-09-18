export const HEX_SIZE = 11;
export const HEX_CELLS = HEX_SIZE * HEX_SIZE;

export type Player = 0 | 1;
export type Cell = Player | null;
export type Board = Cell[];

const NEIGHBORS: [number, number][] = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
  [1, -1],
  [-1, 1],
];

export function hexIndex(row: number, col: number): number {
  return row * HEX_SIZE + col;
}

export function emptyHexBoard(): Board {
  return Array(HEX_CELLS).fill(null);
}

function groupFrom(
  board: Board,
  start: number,
  player: Player,
  seen: Set<number>
): Set<number> {
  const stack = [start];
  const group = new Set<number>();
  seen.add(start);
  while (stack.length) {
    const cur = stack.pop()!;
    group.add(cur);
    const row = Math.floor(cur / HEX_SIZE);
    const col = cur % HEX_SIZE;
    for (const [dr, dc] of NEIGHBORS) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nr >= HEX_SIZE || nc < 0 || nc >= HEX_SIZE) continue;
      const ni = hexIndex(nr, nc);
      if (board[ni] === player && !seen.has(ni)) {
        seen.add(ni);
        stack.push(ni);
      }
    }
  }
  return group;
}

function touchesSide(group: Set<number>, side: "top" | "bottom" | "left" | "right"): boolean {
  for (const index of group) {
    const row = Math.floor(index / HEX_SIZE);
    const col = index % HEX_SIZE;
    if (side === "top" && row === 0) return true;
    if (side === "bottom" && row === HEX_SIZE - 1) return true;
    if (side === "left" && col === 0) return true;
    if (side === "right" && col === HEX_SIZE - 1) return true;
  }
  return false;
}

export function hexWinner(board: Board): Player | null {
  for (const player of [0, 1] as Player[]) {
    const seen = new Set<number>();
    for (let i = 0; i < board.length; i++) {
      if (board[i] !== player || seen.has(i)) continue;
      const group = groupFrom(board, i, player, seen);
      if (player === 0 && touchesSide(group, "top") && touchesSide(group, "bottom")) {
        return 0;
      }
      if (player === 1 && touchesSide(group, "left") && touchesSide(group, "right")) {
        return 1;
      }
    }
  }
  return null;
}
