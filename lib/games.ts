export const GAME_TAGS = ["盤", "カード", "駒取り", "そろえる", "集める"] as const;
export type GameTag = (typeof GAME_TAGS)[number];

export type GameOrigin = "original" | "classic";
export type GameComplexity = "easy" | "normal" | "hard";

export const ORIGIN_LABEL: Record<GameOrigin, string> = {
  original: "オリジナル",
  classic: "クラシック",
};

export const COMPLEXITY_LABEL: Record<GameComplexity, string> = {
  easy: "易しい",
  normal: "ふつう",
  hard: "やや難しい",
};

export type GameMeta = {
  slug: string;
  title: string;
  description: string;
  origin: GameOrigin;
  players: string;
  playersMin: number;
  playersMax: number;
  durationMinutes: number;
  complexity: GameComplexity;
  cpu: boolean;
  team: boolean;
  tags: GameTag[];
  rulesSummary: string[];
  status: "playable" | "coming-soon";
  /** サイト掲載。同じ盤面を見て対戦するゲームだけ true。手札秘匿などは false。 */
  listed: boolean;
};

const games: GameMeta[] = [
  {
    slug: "star-trade",
    title: "スター・トレード",
    description:
      "宇宙商人となり、カードを取引して最高の財宝コンボを揃える、短時間のセットコレクションゲーム。",
    origin: "original",
    players: "2〜4",
    playersMin: 2,
    playersMax: 4,
    durationMinutes: 10,
    complexity: "normal",
    cpu: false,
    team: false,
    tags: ["カード"],
    rulesSummary: [
      "各プレイヤーは手札3枚からスタート。手番は山札から1枚引き、手札から1枚を公開エリアに出す。",
      "公開エリアは最大3枚。手札と公開エリアを合わせた点数に、種類ボーナス（2種類+2点、3種類以上+5点）を加える。",
      "全員の公開エリアが3枚になるか、山札が尽きた時点でラウンド終了。3ラウンド後の累計点が最も高いプレイヤーの勝ち。",
      "同点は共同勝利。同画面で交代プレイし、手番のあいだは他プレイヤーの手札を見ない。",
    ],
    status: "playable",
    listed: false,
  },
  {
    slug: "nebula-link",
    title: "ネビュラ・リンク",
    description:
      "星核を囲む星雲にノードを置き、自分の連結と星核への隣接で得点する配置ゲーム。",
    origin: "original",
    players: "2〜4",
    playersMin: 2,
    playersMax: 4,
    durationMinutes: 5,
    complexity: "easy",
    cpu: false,
    team: false,
    tags: ["盤"],
    rulesSummary: [
      "5×5の星雲ボードの中央は星核で、ここには置けない。手番に空いているマスへ自分のノードを1つ置く。",
      "コマ数は人数で均等（2人は12個、3人は8個、4人は6個）。置き切ると終了。",
      "得点は「上下左右で最大の連結サイズ×2」＋「星核に隣接する自分のノード数」。",
      "最高点のプレイヤーの勝ち。同点は共同勝利。",
    ],
    status: "playable",
    listed: true,
  },
  {
    slug: "chrono-split",
    title: "クロノ・スプリット",
    description:
      "過去・現在・未来の断片をタイムラインに並べ、時代の共鳴と時系列の美しさで得点するゲーム。",
    origin: "original",
    players: "2〜4",
    playersMin: 2,
    playersMax: 4,
    durationMinutes: 8,
    complexity: "normal",
    cpu: false,
    team: false,
    tags: ["盤", "カード"],
    rulesSummary: [
      "場に公開された3枚の断片から1枚を取り、自分のタイムライン（5枠）の空いている枠へ置く。",
      "カードの点数に加え、隣り合う同じ時代の組ごとに+2、3時代すべて揃えると+3、左から値が厳密に増加していれば+7。",
      "全員のタイムラインが埋まったら終了。最高点のプレイヤーの勝ち。同点は共同勝利。",
    ],
    status: "playable",
    listed: false,
  },
  {
    slug: "reversi",
    title: "リバーシ",
    description:
      "8×8の盤で相手の石を挟んで裏返す、2人用の抽象ゲーム。終局時に石が多い方が勝ち。",
    origin: "classic",
    players: "2",
    playersMin: 2,
    playersMax: 2,
    durationMinutes: 10,
    complexity: "normal",
    cpu: false,
    team: false,
    tags: ["盤", "駒取り"],
    rulesSummary: [
      "中央に白黒2個ずつ置いた状態から、黒（プレイヤー1）が先手。",
      "縦・横・斜めのいずれかで相手の石を挟める空マスに置き、挟んだ石をすべて裏返す。",
      "置けるマスがなければパス（自動）。双方とも置けなくなったら終了。",
      "石の数が多いプレイヤーの勝ち。同数は共同勝利。",
    ],
    status: "playable",
    listed: true,
  },
  {
    slug: "mancala",
    title: "マンカラ・カラハ",
    description:
      "穴に入った種を反時計回りにまき、倉へ集める2人用の種まきゲーム。",
    origin: "classic",
    players: "2",
    playersMin: 2,
    playersMax: 2,
    durationMinutes: 8,
    complexity: "normal",
    cpu: false,
    team: false,
    tags: ["盤", "集める"],
    rulesSummary: [
      "各6つの穴に種4個。自分の穴を選んで種をまき、自分の倉には入れ、相手の倉は飛ばす。",
      "最後の種が倉に入ったら追加手番。自分の空き穴に入ったら、向かいの種も倉へ取る。",
      "どちらかの穴がすべて空になったら終了。残りの種は持ち主の倉へ。",
      "倉の種が多い方が勝ち。同数は共同勝利。",
    ],
    status: "playable",
    listed: true,
  },
  {
    slug: "gomoku",
    title: "五目並べ",
    description:
      "13×13のマスに交互に石を置き、縦・横・斜めに5つ並べる2人用ゲーム。禁じ手なし。",
    origin: "classic",
    players: "2",
    playersMin: 2,
    playersMax: 2,
    durationMinutes: 8,
    complexity: "easy",
    cpu: false,
    team: false,
    tags: ["盤", "そろえる"],
    rulesSummary: [
      "空の13×13盤に、黒（プレイヤー1）から交互に1つ置く。",
      "縦・横・斜めのいずれかで5個以上連続させれば勝ち。6個以上でも勝ち。",
      "禁じ手（三三・四四など）はなし。パスはできない。",
      "盤が埋まっても5連続がなければ共同勝利。",
    ],
    status: "playable",
    listed: true,
  },
  {
    slug: "checkers",
    title: "チェッカー",
    description:
      "暗いマスを斜めに進み、相手を飛び越えて取る2人用ゲーム。奥の段でキングになる。",
    origin: "classic",
    players: "2",
    playersMin: 2,
    playersMax: 2,
    durationMinutes: 10,
    complexity: "normal",
    cpu: false,
    team: false,
    tags: ["盤", "駒取り"],
    rulesSummary: [
      "各12個を下3段／上3段の暗いマスに置き、プレイヤー1から開始。",
      "斜め前へ1マス、または斜め前の相手をジャンプして取る。取れる手があるときは必ず取る。",
      "連続ジャンプは同じ駒で続ける。奥の段に着くとキングになり、前後どちらにも進める。",
      "相手の駒がなくなるか、相手が動けなくなれば勝ち。",
    ],
    status: "playable",
    listed: true,
  },
  {
    slug: "nine-mens-morris",
    title: "ナイン・メンズ・モリス",
    description:
      "24点の盤に各9個を置き、3つ並べて相手の駒を外していく2人用ゲーム。",
    origin: "classic",
    players: "2",
    playersMin: 2,
    playersMax: 2,
    durationMinutes: 12,
    complexity: "hard",
    cpu: false,
    team: false,
    tags: ["盤", "駒取り", "そろえる"],
    rulesSummary: [
      "空点に交互に置いていき、各9個を置き切ったら隣の空点へ動かす。",
      "同じ色が一直線に3つ並んだら、相手の駒を1つ外す（3つ並び以外を優先）。",
      "盤上3個になると飛行でき、任意の空点へ移せる。",
      "配置終了後、相手が2個以下になるか動けなくなれば勝ち。",
    ],
    status: "playable",
    listed: true,
  },
];

export function getAllGames(): GameMeta[] {
  return games.filter((game) => game.listed);
}

export function getGameBySlug(slug: string): GameMeta | undefined {
  return getAllGames().find((g) => g.slug === slug);
}

const ORIGIN_ORDER: GameOrigin[] = ["original", "classic"];
const COMPLEXITY_ORDER: GameComplexity[] = ["easy", "normal", "hard"];

export function getCatalogTags(list: GameMeta[] = getAllGames()): GameTag[] {
  const used = new Set(list.flatMap((game) => game.tags));
  return GAME_TAGS.filter((tag) => used.has(tag));
}

export function getCatalogOrigins(list: GameMeta[] = getAllGames()): GameOrigin[] {
  const used = new Set(list.map((game) => game.origin));
  return ORIGIN_ORDER.filter((origin) => used.has(origin));
}

export function getCatalogComplexities(
  list: GameMeta[] = getAllGames()
): GameComplexity[] {
  const used = new Set(list.map((game) => game.complexity));
  return COMPLEXITY_ORDER.filter((complexity) => used.has(complexity));
}

export function getCatalogPlayerLabels(list: GameMeta[] = getAllGames()): string[] {
  const byLabel = new Map<string, number>();
  for (const game of list) {
    if (!byLabel.has(game.players)) {
      byLabel.set(game.players, game.playersMin);
    }
  }
  return [...byLabel.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([label]) => label);
}

export function getCatalogDurations(list: GameMeta[] = getAllGames()): number[] {
  const used = new Set(list.map((game) => game.durationMinutes));
  return [...used].sort((a, b) => a - b);
}

export function catalogHasCpu(list: GameMeta[] = getAllGames()): boolean {
  return list.some((game) => game.cpu);
}

export function catalogHasTeam(list: GameMeta[] = getAllGames()): boolean {
  return list.some((game) => game.team);
}

export type CatalogFilters = {
  origins: GameOrigin[];
  complexities: GameComplexity[];
  players: string[];
  durations: number[];
  cpu: boolean;
  team: boolean;
  tags: GameTag[];
};

export function matchesCatalogFilters(game: GameMeta, filters: CatalogFilters): boolean {
  if (filters.origins.length > 0 && !filters.origins.includes(game.origin)) {
    return false;
  }
  if (
    filters.complexities.length > 0 &&
    !filters.complexities.includes(game.complexity)
  ) {
    return false;
  }
  if (filters.players.length > 0 && !filters.players.includes(game.players)) {
    return false;
  }
  if (
    filters.durations.length > 0 &&
    !filters.durations.includes(game.durationMinutes)
  ) {
    return false;
  }
  if (filters.cpu && !game.cpu) return false;
  if (filters.team && !game.team) return false;
  if (!filters.tags.every((tag) => game.tags.includes(tag))) return false;
  return true;
}
