export type Player = 0 | 1;
export type Cell = Player | null;
export type Board = Cell[];

export const MORRIS_POINTS = 24;
export const MORRIS_PIECES = 9;

export const MORRIS_MILLS: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [9, 10, 11],
  [12, 13, 14],
  [15, 16, 17],
  [18, 19, 20],
  [21, 22, 23],
  [0, 9, 21],
  [3, 10, 18],
  [6, 11, 15],
  [1, 4, 7],
  [16, 19, 22],
  [8, 12, 17],
  [5, 13, 20],
  [2, 14, 23],
];

export const MORRIS_ADJ: number[][] = [
  [1, 9],
  [0, 2, 4],
  [1, 14],
  [4, 10],
  [1, 3, 5, 7],
  [4, 13],
  [7, 11],
  [4, 6, 8],
  [7, 12],
  [0, 10, 21],
  [3, 9, 11, 18],
  [6, 10, 15],
  [8, 13, 17],
  [5, 12, 14, 20],
  [2, 13, 23],
  [11, 16],
  [15, 17, 19],
  [12, 16],
  [10, 19],
  [16, 18, 20, 22],
  [13, 19],
  [9, 22],
  [19, 21, 23],
  [14, 22],
];

/** viewBox 300×300 上の点座標 */
export const MORRIS_XY: [number, number][] = [
  [20, 20],
  [150, 20],
  [280, 20],
  [70, 70],
  [150, 70],
  [230, 70],
  [120, 120],
  [150, 120],
  [180, 120],
  [20, 150],
  [70, 150],
  [120, 150],
  [180, 150],
  [230, 150],
  [280, 150],
  [120, 180],
  [150, 180],
  [180, 180],
  [70, 230],
  [150, 230],
  [230, 230],
  [20, 280],
  [150, 280],
  [280, 280],
];

export const MORRIS_LINES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 14],
  [14, 23],
  [23, 22],
  [22, 21],
  [21, 9],
  [9, 0],
  [3, 4],
  [4, 5],
  [5, 13],
  [13, 20],
  [20, 19],
  [19, 18],
  [18, 10],
  [10, 3],
  [6, 7],
  [7, 8],
  [8, 12],
  [12, 17],
  [17, 16],
  [16, 15],
  [15, 11],
  [11, 6],
  [1, 4],
  [4, 7],
  [16, 19],
  [19, 22],
  [9, 10],
  [10, 11],
  [12, 13],
  [13, 14],
];

export type MorrisState = {
  board: Board;
  toPlace: [number, number];
  current: Player;
  selected: number | null;
  removing: boolean;
  over: boolean;
  winners: number[];
  notice: string | null;
};

export function initialMorrisState(): MorrisState {
  return {
    board: Array(MORRIS_POINTS).fill(null),
    toPlace: [MORRIS_PIECES, MORRIS_PIECES],
    current: 0,
    selected: null,
    removing: false,
    over: false,
    winners: [],
    notice: null,
  };
}

export function morrisCount(board: Board, player: Player): number {
  let n = 0;
  for (const cell of board) {
    if (cell === player) n += 1;
  }
  return n;
}

export function morrisInMill(board: Board, point: number): boolean {
  const owner = board[point];
  if (owner === null) return false;
  return MORRIS_MILLS.some(
    (mill) => mill.includes(point) && mill.every((p) => board[p] === owner)
  );
}

export function morrisFormsMill(
  board: Board,
  point: number,
  player: Player
): boolean {
  return MORRIS_MILLS.some(
    (mill) => mill.includes(point) && mill.every((p) => board[p] === player)
  );
}

export function morrisRemovable(board: Board, opponent: Player): number[] {
  const theirs: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === opponent) theirs.push(i);
  }
  const free = theirs.filter((i) => !morrisInMill(board, i));
  return free.length > 0 ? free : theirs;
}

export function morrisIsFlying(state: MorrisState, player: Player): boolean {
  return state.toPlace[0] === 0 && state.toPlace[1] === 0 && morrisCount(state.board, player) === 3;
}

export function morrisCanMove(state: MorrisState, player: Player): boolean {
  if (state.toPlace[player] > 0) {
    return state.board.some((cell) => cell === null);
  }
  const n = morrisCount(state.board, player);
  if (n < 3) return false;
  const flying = n === 3;
  for (let i = 0; i < state.board.length; i++) {
    if (state.board[i] !== player) continue;
    if (flying) {
      if (state.board.some((cell) => cell === null)) return true;
    } else if (MORRIS_ADJ[i].some((j) => state.board[j] === null)) {
      return true;
    }
  }
  return false;
}

function placingDone(state: MorrisState): boolean {
  return state.toPlace[0] === 0 && state.toPlace[1] === 0;
}

function loseIfStuck(state: MorrisState, player: Player): MorrisState {
  if (!placingDone(state)) return { ...state, current: player, selected: null, removing: false };
  if (morrisCount(state.board, player) < 3 || !morrisCanMove(state, player)) {
    const winner: Player = player === 0 ? 1 : 0;
    return {
      ...state,
      current: player,
      selected: null,
      removing: false,
      over: true,
      winners: [winner],
      notice: morrisCount(state.board, player) < 3
        ? "相手の駒が2個以下になりました"
        : "動ける駒がありません",
    };
  }
  return { ...state, current: player, selected: null, removing: false };
}

function advance(state: MorrisState): MorrisState {
  const next: Player = state.current === 0 ? 1 : 0;
  return loseIfStuck({ ...state, notice: null }, next);
}

function afterPlaceOrMove(state: MorrisState, point: number): MorrisState {
  if (morrisFormsMill(state.board, point, state.current)) {
    return {
      ...state,
      selected: null,
      removing: true,
      notice: "3つ並んだので、相手の駒を1つ外してください",
    };
  }
  return advance({ ...state, selected: null, removing: false });
}

export function morrisLegalDestinations(state: MorrisState, from: number): number[] {
  if (state.board[from] !== state.current) return [];
  if (morrisIsFlying(state, state.current)) {
    return state.board.flatMap((cell, i) => (cell === null ? [i] : []));
  }
  return MORRIS_ADJ[from].filter((i) => state.board[i] === null);
}

export function clickMorris(state: MorrisState, point: number): MorrisState {
  if (state.over) return state;

  if (state.removing) {
    const opponent: Player = state.current === 0 ? 1 : 0;
    const removable = morrisRemovable(state.board, opponent);
    if (!removable.includes(point)) return state;
    const board = state.board.map((cell, i) => (i === point ? null : cell));
    const next: MorrisState = { ...state, board, removing: false, notice: null };
    if (placingDone(next) && morrisCount(board, opponent) < 3) {
      return {
        ...next,
        over: true,
        winners: [state.current],
        selected: null,
        notice: "相手の駒が2個以下になりました",
      };
    }
    return advance(next);
  }

  if (state.toPlace[state.current] > 0) {
    if (state.board[point] !== null) return state;
    const board = state.board.map((cell, i) =>
      i === point ? state.current : cell
    );
    const toPlace: [number, number] = [...state.toPlace];
    toPlace[state.current] -= 1;
    return afterPlaceOrMove({ ...state, board, toPlace, selected: null }, point);
  }

  if (state.selected === null) {
    if (state.board[point] !== state.current) return state;
    return { ...state, selected: point, notice: null };
  }

  if (point === state.selected) {
    return { ...state, selected: null };
  }

  if (!morrisLegalDestinations(state, state.selected).includes(point)) {
    if (state.board[point] === state.current) {
      return { ...state, selected: point };
    }
    return state;
  }

  const board = state.board.slice();
  board[state.selected] = null;
  board[point] = state.current;
  return afterPlaceOrMove({ ...state, board, selected: null }, point);
}
