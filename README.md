# Board Playground

オリジナルボードゲームをブラウザで公開・プレイするサイト。

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
- Vercel: [このリポジトリをインポート](https://vercel.com/new/clone?repository-url=https://github.com/YutaNakachi/BoardPlayground)（Framework Preset は Next.js が自動検出。環境変数は不要）

## ゲーム

掲載するのは、お互いが同じ盤面を見て対戦するゲームのみ（手札秘匿などは一旦非掲載）。

- **ネビュラ・リンク** (`/play/nebula-link`) — 2〜4人、配置・コネクション

同画面交代プレイ。

## ゲームを増やす

1. `lib/games.ts` にメタデータを追加
2. `games/{slug}/rules.md` にルール仕様
3. `components/play/{Name}Game.tsx` を実装（専用実装。共通化は同じ処理が3本目で必要になったとき）
4. `lib/play-registry.ts` でコンポーネントを紐付け

## 方針

- 既存ボードゲームの無許可ルール再現は行わない
- オリジナルゲームと、許可ありコラボのみ
