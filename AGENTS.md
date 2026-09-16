# Board Playground — Agent 方針

オリジナルボードゲームの Web 公開・プレイ用リポジトリ。

## 基本方針

- **日本語**で応答
- ゲームは **オリジナル** または **許可あり** のみ
- 新ゲーム追加: `lib/games.ts` → `games/{slug}/rules.md` → `components/play/` → `lib/play-registry.ts`

## ルール仕様の整理

1. 人数・時間・勝利条件を明確化
2. 手番の例外・タイブレークを列挙
3. `rules.md` とプレイ実装の整合を保つ

## プレイ実装

- 最初は **ローカルプレイ**（同画面交代）
- クライアントコンポーネントは `"use client"`
- ゲームごとに `components/play/{Name}Game.tsx`

## デザイン

- ダークテーマ、accent は indigo 系（`tailwind.config.ts`）
- モバイルでもプレイ可能なレイアウト

## Agent の分け方

- **サイト改善**（Cloud Agent 向け）: 一覧・ルールページ・ヘッダー/フッター、about、デプロイ関連、共通 UI。新ゲームは追加しない
- **ゲーム追加**: 1ゲームにつき 1 Agent。`lib/games.ts` → `games/{slug}/rules.md` → `components/play/` → `lib/play-registry.ts`
- ゲーム固有ルールまで一般化しない。同じ処理が3本目で必要になったら共通化してよい
