import { isOnlineGame } from "@/lib/online/types";

export const GAME_TAGS = [
  "ボード",
  "カード",
  "コマ取り",
  "そろえる",
  "あつめる",
  "すごろく",
  "心理戦",
  "運要素",
] as const;
export type GameTag = (typeof GAME_TAGS)[number];

export type GameOrigin = "original" | "classic" | "tribute" | "fiction";
export type GameComplexity = "easy" | "normal" | "hard";

export const ORIGIN_LABEL: Record<GameOrigin, string> = {
  original: "オリジナル",
  classic: "クラシック",
  tribute: "トリビュート",
  fiction: "フィクション",
};

/** 一覧フィルタ・about などの表示順 */
export const GAME_ORIGIN_ORDER: readonly GameOrigin[] = [
  "original",
  "classic",
  "tribute",
  "fiction",
];

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
    tags: ["カード", "心理戦", "運要素"],
    rulesSummary: [
      "各プレイヤーは手札3枚からスタート。手番は山札から1枚引き、手札から1枚を公開エリアに出す。",
      "公開エリアは最大3枚。手札と公開エリアを合わせた点数に、種類ボーナス（2種類+2点、3種類以上+5点）を加える。",
      "全員の公開エリアが3枚になるか、山札が尽きた時点でラウンド終了。3ラウンド後の累計点が最も高いプレイヤーの勝ち。",
      "同点は引き分け。同画面で交代プレイし、手番のあいだは他プレイヤーの手札を見ない。",
    ],
    status: "playable",
    listed: false,
  },
  {
    slug: "nebula-link",
    title: "ネビュラ・リンク",
    description:
      "星核を囲む星雲にノードを置き、星核に隣接するマスを3つつなげて先に勝つ配置ゲーム。",
    origin: "original",
    players: "2〜4",
    playersMin: 2,
    playersMax: 4,
    durationMinutes: 5,
    complexity: "easy",
    cpu: false,
    team: false,
    tags: ["ボード", "心理戦"],
    rulesSummary: [
      "5×5の星雲ボードの中央は星核で、ここには置けない。最初の1個はどこでも、2個目以降は自分のノードに隣接する空マスに置く。",
      "ノード数は人数で均等（2人は12個、3人は8個、4人は6個）。置ける場所がなければパス。",
      "自分の1つの連結グループが星核に隣接するマスを3つ以上占めたら即勝ち。得点計算はない。",
      "誰も勝てず置ける手がなくなったら引き分け。",
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
    tags: ["ボード", "カード", "心理戦", "運要素"],
    rulesSummary: [
      "場に公開された3枚の断片から1枚を取り、自分のタイムライン（5枠）の空いている枠へ置く。",
      "カードの点数に加え、隣り合う同じ時代の組ごとに+2、3時代すべて揃えると+3、左から値が厳密に増加していれば+7。",
      "全員のタイムラインが埋まったら終了。最高点のプレイヤーの勝ち。同点は引き分け。",
    ],
    status: "playable",
    listed: false,
  },
  {
    slug: "reversi",
    title: "リバーシ",
    description:
      "8×8の盤で相手の石を挟んで裏返す、2人用ゲーム。終局時に石が多い方が勝ち。",
    origin: "classic",
    players: "2",
    playersMin: 2,
    playersMax: 2,
    durationMinutes: 10,
    complexity: "normal",
    cpu: false,
    team: false,
    tags: ["ボード", "コマ取り", "心理戦"],
    rulesSummary: [
      "中央に白黒2個ずつ置いた状態から、黒（プレイヤー1）が先手。",
      "縦・横・斜めのいずれかで相手の石を挟める空マスに置き、挟んだ石をすべて裏返す。",
      "置けるマスがなければパス（自動）。双方とも置けなくなったら終了。",
      "石の数が多いプレイヤーの勝ち。同数は引き分け。",
    ],
    status: "playable",
    listed: true,
  },
  {
    slug: "mancala",
    title: "マンカラ・カラハ",
    description:
      "穴に入った石を反時計回りにまき、ゴールへ集める2人用の石まきゲーム。",
    origin: "classic",
    players: "2",
    playersMin: 2,
    playersMax: 2,
    durationMinutes: 8,
    complexity: "normal",
    cpu: false,
    team: false,
    tags: ["ボード", "あつめる"],
    rulesSummary: [
      "各6つの穴に石4個。自分の穴を選んで石をまき、自分のゴールには入れ、相手のゴールは飛ばす。",
      "最後の石がゴールに入ったら追加手番。自分側の空き穴に入り、向かいにも石があれば両方をゴールへ取る。",
      "どちらかの穴がすべて空になったら終了。残りの石は持ち主のゴールへ。",
      "ゴールの石が多い方が勝ち。同数は引き分け。",
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
    tags: ["ボード", "そろえる", "心理戦"],
    rulesSummary: [
      "空の13×13盤に、黒（プレイヤー1）から交互に1つ置く。",
      "縦・横・斜めのいずれかで5個以上連続させれば勝ち。6個以上でも勝ち。",
      "禁じ手（三三・四四など）はなし。パスはできない。",
      "盤が埋まっても5連続がなければ引き分け。",
    ],
    status: "playable",
    listed: true,
  },
  {
    slug: "checkers",
    title: "チェッカー",
    description:
      "黒マスを斜めに進み、相手を飛び越えて取る2人用ゲーム。奥の段でキングになる。",
    origin: "classic",
    players: "2",
    playersMin: 2,
    playersMax: 2,
    durationMinutes: 10,
    complexity: "normal",
    cpu: false,
    team: false,
    tags: ["ボード", "コマ取り"],
    rulesSummary: [
      "各12個を下3段／上3段の黒マスに置き、プレイヤー1から開始。",
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
    tags: ["ボード", "コマ取り", "そろえる"],
    rulesSummary: [
      "空いている点に交互に置いていき、各9個を置き切ったら隣の空いている点へ動かす。",
      "同じ色が一直線に3つ並んだら、相手の駒を1つ外す（3つ並び以外を優先）。",
      "盤上3個になると飛行でき、任意の空いている点へ移せる。",
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
    tags: ["ボード", "そろえる"],
    rulesSummary: [
      "空の3×3盤に、×（プレイヤー1）から交互に1マスずつ置く。",
      "縦・横・斜めのいずれかで3つ並べたら勝ち。",
      "ローテモード：4つ目で最古の駒が消える（オンライン部屋作成時にも選択可）。",
    ],
    status: "playable",
    listed: true,
  },
  {
    slug: "gravity-four",
    title: "重力四目",
    description:
      "7列×6段の盤で列を選び石を落とし、4つ以上並べる2人用ゲーム。",
    origin: "classic",
    players: "2",
    playersMin: 2,
    playersMax: 2,
    durationMinutes: 5,
    complexity: "easy",
    cpu: false,
    team: false,
    tags: ["ボード", "そろえる", "心理戦"],
    rulesSummary: [
      "列を選んで石を落とす。満杯の列には置けない。",
      "縦・横・斜めのいずれかで4つ以上連続させれば勝ち。",
      "盤が埋まっても4連がなければ引き分け。",
    ],
    status: "playable",
    listed: true,
  },
  {
    slug: "dots-and-boxes",
    title: "ドット・アンド・ボックス",
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
    tags: ["ボード", "あつめる"],
    rulesSummary: [
      "3×3〜5×5の箱を囲む点の辺に、交互に線を1本引く。",
      "箱が完成したらそのプレイヤーが1点。同じ手で箱を取れたら、取れるあいだ手番が続く。",
      "すべての箱に所有者がついたら終了。多い方が勝ち。同数は引き分け。",
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
    tags: ["ボード", "あつめる"],
    rulesSummary: [
      "初期は3・5・7個の3山。プレイヤー1から開始。",
      "1つの山を選び、1個以上取り除く。複数の山から同時に取れない。",
      "最後の石を取ったプレイヤーの勝ち。",
    ],
    status: "playable",
    listed: true,
  },
  {
    slug: "hex",
    title: "ヘックス",
    description:
      "六角形のマスに石を置き、向かい側の辺をつなぐ2人用ゲーム。",
    origin: "classic",
    players: "2",
    playersMin: 2,
    playersMax: 2,
    durationMinutes: 15,
    complexity: "hard",
    cpu: false,
    team: false,
    tags: ["ボード", "そろえる", "心理戦"],
    rulesSummary: [
      "11×11の六角マスに交互に1石ずつ置く。",
      "プレイヤー1は上辺と下辺、プレイヤー2は左辺と右辺をつなげば勝ち。",
      "石は縦・斜めの6方向で連結する。盤が埋まっても必ず一方がつながる（引き分けなし）。",
    ],
    status: "playable",
    listed: true,
  },
  {
    slug: "fox-hounds",
    title: "ウサギと猟犬",
    description:
      "11点の専用盤で猟犬3匹とウサギ1匹が対峙。ウサギは左端を目指し、猟犬は囲んで止める。",
    origin: "classic",
    players: "2",
    playersMin: 2,
    playersMax: 2,
    durationMinutes: 8,
    complexity: "easy",
    cpu: false,
    team: false,
    tags: ["ボード", "心理戦"],
    rulesSummary: [
      "猟犬3匹（左端・左列上下）とウサギ1匹（右端）から開始。猟犬が先手。",
      "線でつながった隣の空き点に1マス進む。取り合いはない。",
      "猟犬は前・斜め前・上下のみ（左へ戻れない）。ウサギは全方向。",
      "ウサギは左端到達・猟犬の手詰まり・10手停滞で勝ち。猟犬はウサギを詰めれば勝ち。",
    ],
    status: "playable",
    listed: true,
  },
  {
    slug: "dominoes",
    title: "ドミノ",
    description:
      "0〜6のドミノ28枚を端の数字を合わせて並べ、手札を先に出し切る2人用ゲーム。",
    origin: "classic",
    players: "2",
    playersMin: 2,
    playersMax: 2,
    durationMinutes: 10,
    complexity: "easy",
    cpu: false,
    team: false,
    tags: ["カード", "心理戦", "運要素"],
    rulesSummary: [
      "各7枚の手札。残りは山札。先手は好きな1枚を場に出す。",
      "以降は場の両端の数字と一致する牌を1枚出す。",
      "出せなければ山札から1枚引く。引いた牌が出せるなら続けて出してよい。山札が空ならパス。",
      "手札を先に出し切ったプレイヤーの勝ち。",
    ],
    status: "playable",
    listed: false,
  },
  {
    slug: "chinese-checkers",
    title: "チャイニーズチェッカー",
    description:
      "六角格子の盤で駒を跳躍し、向かい側のエリアへすべて移動させる2〜4人用ゲーム。",
    origin: "classic",
    players: "2〜4",
    playersMin: 2,
    playersMax: 4,
    durationMinutes: 12,
    complexity: "normal",
    cpu: false,
    team: false,
    tags: ["ボード"],
    rulesSummary: [
      "簡略化した六角盤（81穴）。2人は上下のエリアに各15個。3〜4人は開始位置が変わる。",
      "隣接する空の穴へ1マス進むか、隣の駒を飛び越えて連続ジャンプできる。",
      "自分の駒をすべて向かい側のゴールエリアへ移動させたプレイヤーが勝ち。",
      "1つの穴に駒は1個だけ。重ねられない。",
    ],
    status: "playable",
    listed: false,
  },
  {
    slug: "ludo",
    title: "ルドー",
    description:
      "サイコロの目でコマを進め、4つすべてをゴールさせる、2〜4人用のすごろくゲーム。",
    origin: "classic",
    players: "2〜4",
    playersMin: 2,
    playersMax: 4,
    durationMinutes: 15,
    complexity: "easy",
    cpu: false,
    team: false,
    tags: ["ボード", "コマ取り", "すごろく", "運要素"],
    rulesSummary: [
      "十字型の盤を一周し、各プレイヤー4コマを持つ。",
      "6が出るまでコマは出せない。6では新しく出すか、場のコマを6進める。",
      "相手のコマにぴったり止まると、そのコマをコマ置き場へ戻す。",
      "4コマすべてをゴール完了にしたプレイヤーが勝ち。",
    ],
    status: "playable",
    listed: true,
  },
  {
    slug: "backgammon",
    title: "バックギャモン",
    description:
      "2つのサイコロで駒を進め、自陣に集めてベアオフする2人用ゲームの簡略版。",
    origin: "classic",
    players: "2",
    playersMin: 2,
    playersMax: 2,
    durationMinutes: 15,
    complexity: "normal",
    cpu: false,
    team: false,
    tags: ["ボード", "すごろく", "運要素"],
    rulesSummary: [
      "各15個を標準配置。交互にサイコロ2つを振り、出目ごとに駒を動かす。",
      "相手の駒が2個以上いるマスには入れない。1個だけなら取ってバーへ送る。",
      "全駒が自陣に入ったらベアオフ（盤外へ取り除く）。",
      "先に15個すべてをベアオフしたプレイヤーの勝ち。",
    ],
    status: "playable",
    listed: false,
  },
  {
    slug: "chess",
    title: "チェス",
    description:
      "8×8の盤で駒を動かし、相手のキングをチェックメイトする2人用ゲーム。",
    origin: "classic",
    players: "2",
    playersMin: 2,
    playersMax: 2,
    durationMinutes: 30,
    complexity: "hard",
    cpu: false,
    team: false,
    tags: ["ボード", "コマ取り", "心理戦"],
    rulesSummary: [
      "標準配置。プレイヤー1（白）から開始。",
      "各駒の動きに従い1手。自分のキングをチェックにさらす手は不可。",
      "キャスリング・ポーン昇格（クイーン）・アンパッサンに対応。",
      "チェックメイトで勝ち。ステイルメイトは引き分け。",
    ],
    status: "playable",
    listed: false,
  },
  {
    slug: "shogi",
    title: "将棋",
    description:
      "9×9の盤で駒を動かし、持ち駒を打ち込んで相手の玉を詰める2人用ゲーム。",
    origin: "classic",
    players: "2",
    playersMin: 2,
    playersMax: 2,
    durationMinutes: 45,
    complexity: "hard",
    cpu: false,
    team: false,
    tags: ["ボード", "コマ取り", "心理戦"],
    rulesSummary: [
      "標準配置。先手（プレイヤー1）から開始。",
      "駒を動かすか、持ち駒を空マスに打つ。敵陣入りは自動成り。",
      "王手をかけたまま受けられる手がなくなれば詰み。",
      "打ち歩詰め・千日手などの競技ルールは採用しない。",
    ],
    status: "playable",
    listed: false,
  },
  {
    slug: "mini-shogi",
    title: "5五将棋",
    description:
      "5×5の小さな盤で遊ぶ将棋バリアント。持ち駒の打ち込みと成りが特徴。",
    origin: "classic",
    players: "2",
    playersMin: 2,
    playersMax: 2,
    durationMinutes: 15,
    complexity: "normal",
    cpu: false,
    team: false,
    tags: ["ボード", "コマ取り", "心理戦"],
    rulesSummary: [
      "5×5盤。先手・後手が点対称の初期配置で対局開始。",
      "敵陣最奥段への入出で成れる（歩は最奥段で強制成り）。",
      "詰み・玉の捕獲で勝利。同一局面4回で後手勝ち（千日手）。",
      "二歩・最奥段への歩打ちは禁止。",
    ],
    status: "playable",
    listed: true,
  },
  {
    slug: "klondike",
    title: "クロンダイク",
    description:
      "7列の場（タブロー）と組札で遊ぶ、1人用のクラシック・ソリティア。",
    origin: "classic",
    players: "1",
    playersMin: 1,
    playersMax: 1,
    durationMinutes: 10,
    complexity: "normal",
    cpu: false,
    team: false,
    tags: ["カード", "運要素"],
    rulesSummary: [
      "場の列（タブロー）7列・組札4つ・山札（1枚ずつめくる）の標準構成。",
      "表向きのカードを場の列のあいだ、または組札へ移動できる。",
      "場の列は赤黒交互で降順、空列にはキングのみ。組札はマークごとにAから昇順。",
      "4つの組札をすべて完成させれば勝ち。",
    ],
    status: "playable",
    listed: false,
  },
  {
    slug: "spider",
    title: "スパイダー",
    description:
      "10列の場（タブロー）でK→Aの13枚列を8組完成させる1人用ソリティア（スペード1種類の簡略版）。",
    origin: "classic",
    players: "1",
    playersMin: 1,
    playersMax: 1,
    durationMinutes: 15,
    complexity: "normal",
    cpu: false,
    team: false,
    tags: ["カード", "そろえる", "運要素"],
    rulesSummary: [
      "10列に54枚を配る。空列には表向きのカードを置ける。",
      "降順に並んだ連続カードをまとめて移動できる。",
      "スペードのK→Aの13枚列が完成すると取り除ける。",
      "8組すべて完成すれば勝ち。",
    ],
    status: "playable",
    listed: false,
  },
  {
    slug: "mahjong-solitaire",
    title: "麻雀ソリティア",
    description:
      "レイヤー状に積まれた牌から同種のペアを取り除く1人用パズル。",
    origin: "classic",
    players: "1",
    playersMin: 1,
    playersMax: 1,
    durationMinutes: 8,
    complexity: "easy",
    cpu: false,
    team: false,
    tags: ["カード", "運要素"],
    rulesSummary: [
      "36枚（18ペア）をレイヤー配置。上に乗っておらず、左右どちらかが開いている牌だけ選べる。",
      "同じ種類の牌を2枚選んで取り除く。",
      "取り除けるペアがなくなったら行き詰まり（負け）。シャッフル機能はない。",
      "盤上の牌をすべて取り除けば勝ち。",
    ],
    status: "playable",
    listed: false,
  },
  {
    slug: "slide-puzzle",
    title: "スライドパズル",
    description:
      "4×4の盤で1〜15のタイルを順に並べる1人用パズル。",
    origin: "classic",
    players: "1",
    playersMin: 1,
    playersMax: 1,
    durationMinutes: 5,
    complexity: "easy",
    cpu: false,
    team: false,
    tags: ["ボード", "そろえる"],
    rulesSummary: [
      "1〜15のタイルと空きマス1つの4×4盤。",
      "空きマスに隣接するタイルをタップしてスライドする。",
      "左上から1, 2, 3 … 15の順に並べ、空きマスを右下にすれば完成。",
      "手数制限なし。完成でクリア。",
    ],
    status: "playable",
    listed: true,
  },
];

/** 登録済みゲーム全件（`listed` 未掲載も含む）。管理用・生成スクリプト向け */
export function getAllRegisteredGames(): readonly GameMeta[] {
  return games;
}

export function getAllGames(): GameMeta[] {
  return games.filter((game) => game.listed);
}

export function getGameBySlug(slug: string): GameMeta | undefined {
  return getAllGames().find((g) => g.slug === slug);
}

const ORIGIN_ORDER: GameOrigin[] = [...GAME_ORIGIN_ORDER];
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

export type PlayerBucket = "solo" | "two" | "threePlus";
export type DurationBucket = "short" | "medium" | "long";

const PLAYER_BUCKET_ORDER: PlayerBucket[] = ["solo", "two", "threePlus"];
const DURATION_BUCKET_ORDER: DurationBucket[] = ["short", "medium", "long"];

export const PLAYER_BUCKET_LABEL: Record<PlayerBucket, string> = {
  solo: "1人",
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
    case "solo":
      return game.playersMin === 1 && game.playersMax === 1;
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

export function catalogHasOnline(list: GameMeta[] = getAllGames()): boolean {
  return list.some((game) => isOnlineGame(game.slug));
}

export type CatalogFilters = {
  query: string;
  origins: GameOrigin[];
  complexities: GameComplexity[];
  playerBuckets: PlayerBucket[];
  durationBuckets: DurationBucket[];
  cpu: boolean;
  team: boolean;
  online: boolean;
  tags: GameTag[];
};

export const EMPTY_CATALOG_FILTERS: CatalogFilters = {
  query: "",
  origins: [],
  complexities: [],
  playerBuckets: [],
  durationBuckets: [],
  cpu: false,
  team: false,
  online: false,
  tags: [],
};

function normalizeCatalogQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function matchesCatalogQuery(game: GameMeta, query: string): boolean {
  const normalized = normalizeCatalogQuery(query);
  if (!normalized) return true;

  const haystack = [
    game.title,
    game.description,
    game.slug.replace(/-/g, " "),
    game.players,
    ORIGIN_LABEL[game.origin],
    COMPLEXITY_LABEL[game.complexity],
    ...game.tags,
    ...game.rulesSummary,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

export function countSidebarFilters(filters: CatalogFilters): number {
  return (
    (normalizeCatalogQuery(filters.query) ? 1 : 0) +
    filters.origins.length +
    filters.complexities.length +
    filters.playerBuckets.length +
    filters.durationBuckets.length +
    (filters.cpu ? 1 : 0) +
    (filters.team ? 1 : 0) +
    (filters.online ? 1 : 0)
  );
}

export function countCatalogFilters(filters: CatalogFilters): number {
  return countSidebarFilters(filters) + filters.tags.length;
}

export function matchesCatalogFilters(game: GameMeta, filters: CatalogFilters): boolean {
  if (!matchesCatalogQuery(game, filters.query)) return false;
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
  if (filters.online && !isOnlineGame(game.slug)) return false;
  if (!filters.tags.every((tag) => game.tags.includes(tag))) return false;
  return true;
}
