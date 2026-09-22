# ボドパッ！ — Agent 方針

オリジナルボードゲームの Web 公開・プレイ用リポジトリ。

## 基本方針

- **日本語**で応答
- ゲームは **オリジナル**、**許可あり**、または **商標を使わない伝統的なボードゲーム**
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

初回プロンプトのコピペ用: `docs/agent-prompts.md`

- **サイト改善**（Cloud Agent 向け）: 一覧・ルールページ・ヘッダー/フッター、about、デプロイ関連、共通 UI。新ゲームは追加しない
- **ゲーム追加**: 1ゲームにつき 1 Agent。`lib/games.ts` → `games/{slug}/rules.md` → `components/play/` → `lib/play-registry.ts`
- **ゲームロジック検証**: ゲーム変更の前後で起動（常設ではない）。`rules.md` と実装の一致、境界ケース、`lib/play/*.ts` のテスト。サイト改善 PR には触れない
- **文章・文言検証**: サイト横断の日本語・説明の正確さ（常設ではない）。ルール文・一覧説明・UI 文言のわかりやすさと表記統一。ゲームロジックの実装変更はしない
- **オンライン対戦**: 1機能 or 1ゲームにつき 1 Agent（常設ではない）。部屋・Realtime・API・既存ゲームのオンライン化。将来構想は `docs/future-online-lobby.md`
- **CPU 対戦**: 1ゲームにつき 1 Agent（常設ではない）。`lib/play/{slug}/` にロジックがある前提で `ai.ts` を追加し、`lib/games.ts` の `cpu: true` を更新。手札非公開ゲームはオンライン部屋対応後
- ゲーム固有ルールまで一般化しない。同じ処理が3本目で必要になったら共通化してよい

### ゲームロジック検証 Agent

- **担当**: `games/*/rules.md`（仕様の読み取り）、`lib/play/`、`components/play/{Name}Game.tsx`、`lib/play/check-engines.ts`、`lib/online/moves.ts`
- **やる**: 勝利条件・手番交代・パス・同点など仕様どおり動くかの確認、非法手の拒否、ロジックのユニットテスト、変更ゲームの手動テスト手順を PR に記載
- **やらない**: 新ゲーム企画、文章の推敲・表記統一、サイト一覧・共通 UI、CPU 実装
- ロジックがコンポーネント内だけにあるゲームは、検証可能なら先に `lib/play/` へ抽出する
- ルール Cursor ルール: `.cursor/rules/game-logic-verification.mdc`

### 文章・文言検証 Agent

- **担当**: `games/*/rules.md`（文章）、`lib/games.ts`（`title` / `description` / `rulesSummary`）、`app/` のページ文、`components/` の表示文言、`app/layout.tsx` のメタデータ
- **やる**: 日本語の正確さ（誤字・文法・用語）、説明のわかりやすさ、同一概念の表記統一、`rules.md` と一覧・プレイ画面の説明が矛盾しないかの確認
- **やらない**: ルール仕様の変更（実装と食い違う記述の**指摘**はする。直すのはゲーム追加 or ロジック検証と連携）、レイアウト変更、新ゲーム追加、ロジック修正
- ルール Cursor ルール: `.cursor/rules/copy-verification.mdc`

### オンライン対戦 Agent

- **担当**: `lib/online/`、`hooks/useOnlineRoom.ts`、`app/api/rooms/`、部屋関連マイグレーション、`OnlineSetupPanel`、各ゲームのオンライン統合、`docs/future-online-lobby.md`
- **やる**: 部屋作成・参加・同期の改善、既存ゲームのオンライン化（`lib/online/moves.ts` + `ONLINE_GAME_SLUGS`）、再接続・再戦などロビー機能（フェーズごとに小さく PR）
- **やらない**: 新ゲーム追加、ローカル専用ルール変更、サイト横断 UI、CPU 実装、手札非公開ゲームのオンライン
- ルール Cursor ルール: `.cursor/rules/online-play.mdc`

### CPU 対戦 Agent

- **担当**: `lib/play/{slug}/ai.ts`（新規）、対象ゲームのプレイ画面、`lib/games.ts` の `cpu` フラグ
- **やる**: 合法手生成を使った弱・普通・強の CPU 手番、UI は CPU 手番時に `chooseMove` を呼ぶだけに留める
- **やらない**: 複数ゲームを1 PR でまとめる、手札非公開ゲームの CPU（スター・トレード等）
- CPU インターフェース（`getLegalMoves` / `chooseMove` / `difficulty`）は3本目で `lib/play/cpu/` などへ共通化を検討

### 推奨フロー

1. ゲーム追加 Agent → ルール・実装・PR
2. ゲームロジック検証 Agent → 境界ケース確認・テスト追加
3. 文章・文言検証 Agent → ルール文・一覧・UI 文言の推敲（ゲーム PR に含めても、別 PR でも可）
4. オンライン対戦 Agent → 2人・盤面公開ゲームのみ別 PR（既存4本は対応済み。新ゲーム or 部屋機能改善）
5. CPU 対戦 Agent → 必要なゲームだけ別 PR

サイト改善 PR のマージ前に、必要なら文章・文言検証 Agent を回す。
