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
  /** サイト掲載。ブラウザ実装済みで公開するゲームだけ true。 */
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
  {
    slug: "tic-tac-toe",
    title: "三目並べ",
    description:
      "3×3のマスに×と○を置き、縦・横・斜めで3つ並べる最短の定番ゲーム。",
    origin: "classic",
    players: "2",
    playersMin: 2,
    playersMax: 2,
    durationMinutes: 3,
    complexity: "easy",
    cpu: false,
    team: false,
    tags: ["盤", "そろえる"],
    rulesSummary: [
      "空の3×3盤に、×（プレイヤー1）から交互に1マスずつ置く。",
      "縦・横・斜めのいずれかで3つ並べたら勝ち。",
      "盤が埋まっても3つ並びがなければ共同勝利。",
    ],
    status: "playable",
    listed: true,
  },
  {
    slug: "gravity-four",
    title: "重力四目",
    description:
      "7列×6段の盤で列を選び石を落とし、4つ並べる2人用ゲーム。",
    origin: "classic",
    players: "2",
    playersMin: 2,
    playersMax: 2,
    durationMinutes: 5,
    complexity: "easy",
    cpu: false,
    team: false,
    tags: ["盤", "そろえる"],
    rulesSummary: [
      "列を選んで石を落とす。満杯の列には置けない。",
      "縦・横・斜めのいずれかで4つ以上連続させれば勝ち。",
      "盤が埋まっても4連がなければ共同勝利。",
    ],
    status: "playable",
    listed: true,
  },
  {
    slug: "dots-and-boxes",
    title: "ドッツ・アンド・ボックス",
    description:
      "点を線でつないで箱を作り、完成した箱が多い方が勝つ2人用ゲーム。",
    origin: "classic",
    players: "2",
    playersMin: 2,
    playersMax: 2,
    durationMinutes: 8,
    complexity: "easy",
    cpu: false,
    team: false,
    tags: ["盤", "集める"],
    rulesSummary: [
      "4×4の箱を囲む点の辺に、交互に線を1本引く。",
      "箱が完成したらそのプレイヤーが1点。同じ手で箱を取れたらもう一度。",
      "すべての箱に所有者がついたら終了。多い方が勝ち。",
    ],
    status: "playable",
    listed: true,
  },
  {
    slug: "nim",
    title: "ニム",
    description:
      "3つの山から石を取り、最後の1個を取ったプレイヤーが勝つ数えゲーム。",
    origin: "classic",
    players: "2",
    playersMin: 2,
    playersMax: 2,
    durationMinutes: 5,
    complexity: "easy",
    cpu: false,
    team: false,
    tags: ["盤", "集める"],
    rulesSummary: [
      "初期は3・5・7個の3山。プレイヤー1から開始。",
      "1つの山を選び、1個以上取り除く。複数の山から同時に取れない。",
      "すべての石を取り終えたプレイヤーの勝ち。",
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

export type PlayerBucket = "two" | "threePlus";
export type DurationBucket = "short" | "medium" | "long";

const PLAYER_BUCKET_ORDER: PlayerBucket[] = ["two", "threePlus"];
const DURATION_BUCKET_ORDER: DurationBucket[] = ["short", "medium", "long"];

export const PLAYER_BUCKET_LABEL: Record<PlayerBucket, string> = {
  two: "2人",
  threePlus: "3人以上",
};

export const DURATION_BUCKET_LABEL: Record<DurationBucket, string> = {
  short: "短い（〜5分）",
  medium: "ふつう（〜10分）",
  long: "やや長め（11分〜）",
};

export function matchesPlayerBucket(
  game: GameMeta,
  bucket: PlayerBucket
): boolean {
  switch (bucket) {
    case "two":
      return game.playersMin <= 2 && game.playersMax >= 2;
    case "threePlus":
      return game.playersMax >= 3;
  }
}

export function matchesDurationBucket(
  game: GameMeta,
  bucket: DurationBucket
): boolean {
  switch (bucket) {
    case "short":
      return game.durationMinutes <= 5;
    case "medium":
      return game.durationMinutes >= 6 && game.durationMinutes <= 10;
    case "long":
      return game.durationMinutes >= 11;
  }
}

export function getCatalogPlayerBuckets(
  list: GameMeta[] = getAllGames()
): PlayerBucket[] {
  return PLAYER_BUCKET_ORDER.filter((bucket) =>
    list.some((game) => matchesPlayerBucket(game, bucket))
  );
}

export function getCatalogDurationBuckets(
  list: GameMeta[] = getAllGames()
): DurationBucket[] {
  return DURATION_BUCKET_ORDER.filter((bucket) =>
    list.some((game) => matchesDurationBucket(game, bucket))
  );
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
  playerBuckets: PlayerBucket[];
  durationBuckets: DurationBucket[];
  cpu: boolean;
  team: boolean;
  tags: GameTag[];
};

export const EMPTY_CATALOG_FILTERS: CatalogFilters = {
  origins: [],
  complexities: [],
  playerBuckets: [],
  durationBuckets: [],
  cpu: false,
  team: false,
  tags: [],
};

export function countSidebarFilters(filters: CatalogFilters): number {
  return (
    filters.origins.length +
    filters.complexities.length +
    filters.playerBuckets.length +
    filters.durationBuckets.length +
    (filters.cpu ? 1 : 0) +
    (filters.team ? 1 : 0)
  );
}

export function countCatalogFilters(filters: CatalogFilters): number {
  return countSidebarFilters(filters) + filters.tags.length;
}

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
  if (
    filters.playerBuckets.length > 0 &&
    !filters.playerBuckets.some((bucket) => matchesPlayerBucket(game, bucket))
  ) {
    return false;
  }
  if (
    filters.durationBuckets.length > 0 &&
    !filters.durationBuckets.some((bucket) => matchesDurationBucket(game, bucket))
  ) {
    return false;
  }
  if (filters.cpu && !game.cpu) return false;
  if (filters.team && !game.team) return false;
  if (!filters.tags.every((tag) => game.tags.includes(tag))) return false;
  return true;
}
