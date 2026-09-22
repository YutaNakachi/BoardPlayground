# Agent 初回プロンプト

New Agent 起動時にコピペする用。`{ゲーム名}` は差し替える。

## ゲームロジック検証

```
.cursor/rules/game-logic-verification.mdc と AGENTS.md に従い、{ゲーム名} の rules.md と lib/play/・プレイ実装の整合を確認し、境界ケースのテストを足して PR を出してください。
```

## 文章・文言検証

```
.cursor/rules/copy-verification.mdc に従い、掲載ゲームの rules.md・lib/games.ts・UI 文言の日本語・表記統一・説明の矛盾を直して PR を出してください。
```

## サイト改善

```
.cursor/rules/site-improvement.mdc に従い、サイト横断の UI・導線・メタデータを改善してください。新ゲームは追加しないでください。
```

## ゲーム追加

```
AGENTS.md に従い、{ゲーム名} を追加してください。lib/games.ts → games/{slug}/rules.md → components/play/ → lib/play-registry.ts の順で。
```

## オンライン対戦（ゲーム追加）

```
.cursor/rules/online-play.mdc と AGENTS.md に従い、{ゲーム名} にオンライン対戦（部屋コード）を追加してください。lib/online/moves.ts → ONLINE_GAME_SLUGS → プレイ画面統合の順で。2ブラウザ手動テスト手順を PR に書いてください。
```

## オンライン対戦（部屋・機能改善）

```
.cursor/rules/online-play.mdc と docs/future-online-lobby.md を読み、{機能名} を実装してください。1 PR は1機能に絞り、DB マイグレーションと手動テスト手順を PR に書いてください。
```

例: `{機能名}` = 対局終了後の再戦、部屋への再接続、明示退出 API

## CPU 対戦

```
AGENTS.md の CPU 対戦 Agent に従い、{ゲーム名} に CPU 対戦（弱・普通・強）を追加し、cpu: true にして PR を出してください。
```
