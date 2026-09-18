# ボドパッ！ — Agent 方針

オリジナルボードゲームの Web 公開・プレイ用リポジトリ。

## 基本方針

- **日本語**で応答
- ゲームは **オリジナル**、**許可あり**、または **商標を使わない伝統的な抽象ゲーム**
- 市販ゲームの無許可ルール再現は行わない
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
- **ゲームテスト**: ゲーム変更の前後で起動（常設ではない）。`rules.md` と実装の整合、境界ケース、`lib/play/*.ts` のテスト追加。サイト改善 PR には触れない
- **CPU 対戦**: 1ゲームにつき 1 Agent（常設ではない）。`lib/play/{slug}/` にロジックがある前提で `ai.ts` を追加し、`lib/games.ts` の `cpu: true` を更新。手札非公開ゲームはオンライン部屋対応後
- ゲーム固有ルールまで一般化しない。同じ処理が3本目で必要になったら共通化してよい

### ゲームテスト Agent

- **担当**: `games/*/rules.md`、`lib/play/`、`components/play/{Name}Game.tsx`、`lib/play/check-engines.ts`
- **やる**: 勝利条件・手番交代・パス・同点など `rules.md` に書いた例外の確認、ロジックのユニットテスト、変更ゲームの手動テスト手順を PR に記載
- **やらない**: 新ゲーム企画、サイト一覧・共通 UI、CPU 実装
- ロジックがコンポーネント内だけにあるゲームは、テスト可能なら先に `lib/play/` へ抽出する

### CPU 対戦 Agent

- **担当**: `lib/play/{slug}/ai.ts`（新規）、対象ゲームのプレイ画面、`lib/games.ts` の `cpu` フラグ
- **やる**: 合法手生成を使った弱・普通・強の CPU 手番、UI は CPU 手番時に `chooseMove` を呼ぶだけに留める
- **やらない**: 複数ゲームを1 PR でまとめる、手札非公開ゲームの CPU（スター・トレード等）
- CPU インターフェース（`getLegalMoves` / `chooseMove` / `difficulty`）は3本目で `lib/play/cpu/` などへ共通化を検討

### 推奨フロー

1. ゲーム追加 Agent → ルール・実装・PR
2. ゲームテスト Agent → 境界ケース確認・テスト追加
3. CPU 対戦 Agent → 必要なゲームだけ別 PR
