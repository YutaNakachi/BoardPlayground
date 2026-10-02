# note 用アイキャッチ画像

ゲーム紹介記事（`docs/note/*.md`）向けの**見出し画像**です。

| ファイル | ゲーム |
|---|---|
| `ludo.png` | ルドー |
| `mancala.png` | マンカラ・カラハ |
| `fox-hounds.png` | ウサギと猟犬 |
| `hex.png` | ヘックス |
| `mini-shogi.png` | 5五将棋 |

## 仕様

- サイズ: **1280×670**（note の見出し画像向け）
- 内容: **ボドパッ！のプレイ画面の盤面**をキャプチャ（宣伝用の文字オーバーレイはなし）
- 背景: サイトのダークテーマ色（`#12101a`）でレターボックス

## 再生成手順

1. 開発サーバーを起動: `npm run dev`
2. Playwright と sharp を用意（初回のみ例）:
   - `npx playwright install chromium`
   - `cd /tmp && npm install sharp@0.33.5`
3. キャプチャ:  
   `NODE_PATH=/tmp/node_modules node scripts/capture-note-eyecatches.mjs`

任意で本番相当の URL を指定:  
`NODE_PATH=/tmp/node_modules node scripts/capture-note-eyecatches.mjs https://bodopa.com`

## note での使い方

記事編集画面の「見出し画像」に、該当の PNG をアップロードしてください。
