import { createDeck, rankValue, type PlayingCard } from "@/lib/play/cards";

export type SpiderCard = {
  card: PlayingCard;
  faceUp: boolean;
};

export type SpiderState = {
  columns: SpiderCard[][];
  stock: PlayingCard[];
  completed: number;
};

function createSpiderDeck(): PlayingCard[] {
  const base = createDeck(1).filter((c) => c.suit === "spade");
  const deck: PlayingCard[] = [];
  for (let copy = 0; copy < 8; copy++) {
    for (const card of base) {
      deck.push({ ...card, id: `${card.id}-s${copy}` });
    }
  }
  return deck;
}

export function initialSpider(): SpiderState {
  const deck = createSpiderDeck();
  const columns: SpiderCard[][] = Array.from({ length: 10 }, () => []);
  let i = 0;
  for (let col = 0; col < 10; col++) {
    const count = col < 4 ? 6 : 5;
    for (let row = 0; row < count; row++) {
      const card = deck[i++];
      columns[col].push({ card, faceUp: row === count - 1 });
    }
  }
  return { columns, stock: deck.slice(i), completed: 0 };
}

export function spiderWon(state: SpiderState): boolean {
  return state.completed === 8;
}

function validRun(cards: SpiderCard[]): boolean {
  for (let i = 0; i < cards.length - 1; i++) {
    if (!cards[i].faceUp || !cards[i + 1].faceUp) return false;
    if (rankValue(cards[i].card.rank) !== rankValue(cards[i + 1].card.rank) + 1) return false;
  }
  return true;
}

function fullSequenceAtEnd(col: SpiderCard[]): number | null {
  if (!col.length) return null;
  let start = col.length - 1;
  while (start > 0 && col[start - 1].faceUp) {
    if (rankValue(col[start - 1].card.rank) !== rankValue(col[start].card.rank) + 1) break;
    start--;
  }
  const run = col.slice(start);
  if (run.length === 13 && run[0].card.rank === "K" && run[12].card.rank === "A") {
    return start;
  }
  return null;
}

export function removeCompletedSpider(state: SpiderState): SpiderState {
  const columns = state.columns.map((c) => [...c]);
  let completed = state.completed;
  for (let col = 0; col < 10; col++) {
    const start = fullSequenceAtEnd(columns[col]);
    if (start != null) {
      columns[col] = columns[col].slice(0, start);
      completed += 1;
      if (columns[col].length && !columns[col][columns[col].length - 1].faceUp) {
        columns[col][columns[col].length - 1] = {
          ...columns[col][columns[col].length - 1],
          faceUp: true,
        };
      }
    }
  }
  return { ...state, columns, completed };
}

export function canDealSpider(state: SpiderState): boolean {
  return state.stock.length >= 10 && state.columns.every((c) => c.length > 0);
}

export function dealSpider(state: SpiderState): SpiderState | null {
  if (!canDealSpider(state)) return null;
  const columns = state.columns.map((c) => [...c]);
  const stock = [...state.stock];
  for (let col = 0; col < 10; col++) {
    const card = stock.pop()!;
    columns[col].push({ card, faceUp: true });
  }
  return removeCompletedSpider({ ...state, columns, stock });
}

export function canMoveSpider(
  state: SpiderState,
  fromCol: number,
  fromIndex: number,
  toCol: number
): boolean {
  if (fromCol === toCol) return false;
  const source = state.columns[fromCol];
  const run = source.slice(fromIndex);
  if (!run.length || !run[0].faceUp || !validRun(run)) return false;
  const dest = state.columns[toCol];
  if (!dest.length) return true;
  const top = dest[dest.length - 1];
  if (!top.faceUp) return false;
  return rankValue(top.card.rank) === rankValue(run[0].card.rank) + 1;
}

export function applySpiderMove(
  state: SpiderState,
  fromCol: number,
  fromIndex: number,
  toCol: number
): SpiderState | null {
  if (!canMoveSpider(state, fromCol, fromIndex, toCol)) return null;
  const columns = state.columns.map((c) => [...c]);
  const moving = columns[fromCol].slice(fromIndex);
  columns[fromCol] = columns[fromCol].slice(0, fromIndex);
  columns[toCol].push(...moving);
  if (columns[fromCol].length && !columns[fromCol][columns[fromCol].length - 1].faceUp) {
    columns[fromCol][columns[fromCol].length - 1] = {
      ...columns[fromCol][columns[fromCol].length - 1],
      faceUp: true,
    };
  }
  return removeCompletedSpider({ ...state, columns });
}

export function movableSpiderStarts(state: SpiderState, col: number): number[] {
  const column = state.columns[col];
  const starts: number[] = [];
  for (let i = 0; i < column.length; i++) {
    if (!column[i].faceUp) continue;
    if (validRun(column.slice(i))) starts.push(i);
  }
  return starts;
}
