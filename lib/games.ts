export type GameMeta = {
  slug: string;
  title: string;
  description: string;
  players: string;
  durationMinutes: number;
  tags: string[];
  rulesSummary: string[];
  status: "playable" | "coming-soon";
};

const games: GameMeta[] = [
  {
    slug: "star-trade",
    title: "スター・トレード",
    description:
      "宇宙商人となり、カードを取引して最高の財宝コンボを揃える、短時間のセットコレクションゲーム。",
    players: "2〜4",
    durationMinutes: 15,
    tags: ["カード", "セットコレクション", "オリジナル"],
    rulesSummary: [
      "各プレイヤーは手札3枚からスタート。手番は山札から1枚引き、手札から1枚を公開エリアに出す。",
      "公開エリアは最大3枚。手札と公開エリアを合わせた点数に、種類ボーナス（2種類+2点、3種類以上+5点）を加える。",
      "全員の公開エリアが3枚になるか、山札が尽きた時点でラウンド終了。3ラウンド後の累計点が最も高いプレイヤーの勝ち。",
      "同点は共同勝利。同画面で交代プレイし、手番のあいだは他プレイヤーの手札を見ない。",
    ],
    status: "playable",
  },
  {
    slug: "nebula-link",
    title: "ネビュラ・リンク",
    description:
      "星核を囲む星雲にノードを置き、自分の連結と星核への隣接で得点する配置ゲーム。",
    players: "2〜4",
    durationMinutes: 12,
    tags: ["配置", "コネクション", "オリジナル"],
    rulesSummary: [
      "5×5の星雲ボードの中央は星核で、ここには置けない。手番に空いているマスへ自分のノードを1つ置く。",
      "コマ数は人数で均等（2人は12個、3人は8個、4人は6個）。置き切ると終了。",
      "得点は「上下左右で最大の連結サイズ×2」＋「星核に隣接する自分のノード数」。",
      "最高点のプレイヤーの勝ち。同点は共同勝利。",
    ],
    status: "playable",
  },
  {
    slug: "chrono-split",
    title: "クロノ・スプリット",
    description:
      "過去・現在・未来の断片をタイムラインに並べ、時代の共鳴と時系列の美しさで得点するゲーム。",
    players: "2〜4",
    durationMinutes: 15,
    tags: ["カード", "配置", "オリジナル"],
    rulesSummary: [
      "場に公開された3枚の断片から1枚を取り、自分のタイムライン（5枠）の空いている枠へ置く。",
      "カードの点数に加え、隣り合う同じ時代の組ごとに+2、3時代すべて揃えると+3、左から値が厳密に増加していれば+7。",
      "全員のタイムラインが埋まったら終了。最高点のプレイヤーの勝ち。同点は共同勝利。",
    ],
    status: "playable",
  },
];

export function getAllGames(): GameMeta[] {
  return games;
}

export function getGameBySlug(slug: string): GameMeta | undefined {
  return games.find((g) => g.slug === slug);
}
