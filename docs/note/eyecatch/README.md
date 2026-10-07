# note 用アイキャッチ画像

ゲーム紹介記事（`docs/note/*.md`）向けの**見出し画像**です。**全記事で同じレイアウト**を使います。

## レイアウト（共通）

| 要素 | 内容 |
|---|---|
| 背景 | サイト本体と同じダーク＋アクセントの放射グラデーション（`#0e0c14` 基調） |
| 左 | ロゴ（シンボル＋ワードマーク）、ゲームタイトル、サブタイトル、`Board Game Park` |
| 右 | プレイ画面の盤を **約10%の不透明度** で薄く（左へフェード） |

文言は `entries.json` で管理します（各記事の「サムネ用キャッチコピー」と揃えてください）。  
任意: `boardOpacity`（盤の濃さ）、`titleNoWrap` / `titleFontSize`（長いタイトルの1行表示）。

## ファイル

| パス | 説明 |
|---|---|
| `entries.json` | slug・タイトル・サブタイトル |
| `textures/{slug}.png` | 盤面のみの素材（合成用・再生成可） |
| `{slug}.png` | note に載せる完成画像（1280×670） |

## 再生成

1. 開発サーバー: `npm run dev`
2. 盤テクスチャ＋合成: `node scripts/generate-note-eyecatches.mjs`
3. 文言だけ変えたとき: `entries.json` を編集 → `node scripts/generate-note-eyecatches.mjs --compose-only`

## note での使い方

記事編集画面の「見出し画像」に、該当の `{slug}.png` をアップロードしてください。
