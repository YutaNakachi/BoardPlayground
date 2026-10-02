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

- サイズ: **1280×670**（note の見出し画像向け・ビューポートそのまま）
- 内容: **プレイ画面の盤面**を画面いっぱいに拡大してキャプチャ（見出し用の文字オーバーレイなし）
- UI: ヘッダー・手番バナー・盤下ボタンは非表示。マンカラの石数・ゴールラベルも非表示（盤の色だけ）
- 背景: サイトのダークテーマ色（`#12101a`）

## 再生成手順

1. 開発サーバーを起動: `npm run dev`
2. Playwright を用意（初回のみ）: `npx playwright install chromium`
3. キャプチャ: `node scripts/capture-note-eyecatches.mjs`

任意で本番相当の URL を指定:  
`node scripts/capture-note-eyecatches.mjs https://bodopa.com`

## note での使い方

記事編集画面の「見出し画像」に、該当の PNG をアップロードしてください。
