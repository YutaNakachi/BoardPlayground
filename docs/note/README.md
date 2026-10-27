# note 記事下書き（`docs/note/`）

ボドパッ！公式 note 用の記事案です。**原稿の正本は `main` ブランチのこのディレクトリ**に置き、掲載前の推敲も **main に直接コミット**して更新します（別ブランチだけに置かない）。

## ファイル一覧

| ファイル | 内容 |
|---|---|
| `ludo.md` など | ゲーム紹介・リリース告知の記事案 |
| `dejarik-release.md` | デジャリック（ホロチェス）リリース告知 |
| `king-and-spy.md` | キング＆スパイ |
| `overheat-chicken.md` | オーバーヒート・チキンレース |
| `eyecatch/` | 見出し画像（共通レイアウト）と `entries.json` |

## 書くときの前提

- 掲載状態・人数・オンライン/CPU は `lib/games.ts` と `games/{slug}/rules.md` に合わせる
- フィクション・トリビュートは `AGENTS.md` の系統ルール（非公式・商品名など）を守る
- 公開 URL は `https://bodopa.com`（`lib/site.ts`）

## アイキャッチ

手順は `eyecatch/README.md`。記事の「サムネ用キャッチコピー」と `eyecatch/entries.json` の `subtitle` を揃える。
