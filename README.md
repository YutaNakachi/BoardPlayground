# ボドパッ！

ブラウザで今すぐ遊べるボードゲームサイト。オリジナルと、商標を使わない伝統的な抽象ゲームを公開・プレイします。

## 構成

```
BoardPlayground/
├── app/                 # Next.js App Router
│   ├── page.tsx         # トップ（ゲーム一覧）
│   ├── about/           # 制作代行（ココナラ Phase 2）
│   ├── games/[slug]/    # ルール・詳細
│   └── play/[slug]/     # プレイ画面
├── components/          # UI・ゲームコンポーネント
├── lib/games.ts         # ゲーム一覧（メタデータ）
├── lib/play-registry.ts # slug → プレイコンポーネント
├── lib/game-engine/     # シャッフル・勝者判定など共通処理
├── games/               # ルール仕様（Markdown）
└── docs/coconala/       # ココナラ出品用テンプレート
```

## 起動

```bash
cd C:\Users\yutan\Projects\BoardPlayground
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開く。

## 公開

- GitHub: https://github.com/YutaNakachi/BoardPlayground
- Vercel: [このリポジトリをインポート](https://vercel.com/new/clone?repository-url=https://github.com/YutaNakachi/BoardPlayground)（Framework Preset は Next.js が自動検出）

### 環境変数（Supabase・オンライン対戦・統計）

`.env.example` をコピーして `.env.local` を作成し、Supabase の値を設定します。

| 変数 | 用途 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | クライアント（Realtime）用 |
| `SUPABASE_SERVICE_ROLE_KEY` | API Route（統計・部屋）用 |

未設定の場合はローカルプレイのみ動作し、プレイ回数・ランキング・オンライン対戦は無効化されます。

### Supabase セットアップ

1. [Supabase](https://supabase.com/) でプロジェクトを作成
2. SQL Editor で `supabase/migrations/001_stats.sql` と `002_rooms.sql` を実行
3. Vercel の Environment Variables に上記3つを追加

## ゲーム

掲載するのはブラウザ実装済みのゲーム（オンライン部屋未対応のため、手札秘匿などは順次追加予定）。

- **ネビュラ・リンク** (`/play/nebula-link`) — オリジナル、2〜4人、約5分
- **リバーシ** (`/play/reversi`) — クラシック、2人、約10分
- **マンカラ・カラハ** (`/play/mancala`) — クラシック、2人、約8分
- **五目並べ** (`/play/gomoku`) — クラシック、2人、約8分
- **チェッカー** (`/play/checkers`) — クラシック、2人、約10分
- **ナイン・メンズ・モリス** (`/play/nine-mens-morris`) — クラシック、2人、約12分

同画面交代プレイ。リバーシ・三目並べ・五目並べ・チェッカーはオンライン対戦（部屋コード＋合言葉）にも対応。

プレイ回数はゲーム開始時にカウントされ、[/ranking](/ranking) でランキングを確認できます。

## ゲームを増やす

1. `lib/games.ts` にメタデータを追加
2. `games/{slug}/rules.md` にルール仕様
3. `components/play/{Name}Game.tsx` を実装（専用実装。共通化は同じ処理が3本目で必要になったとき）
4. `lib/play-registry.ts` でコンポーネントを紐付け

## 方針

- 市販ボードゲームの無許可ルール再現は行わない（商品名も使わない）
- オリジナル、許可ありコラボ、または権利上の問題が小さい伝統的な抽象ゲーム
