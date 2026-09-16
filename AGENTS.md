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
