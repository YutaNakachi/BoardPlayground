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
.cursor/rules/game-addition.mdc と AGENTS.md「新規ゲーム追加」に従い、{ゲーム名}（slug: {slug}）を追加してください。
系統: {original|classic|tribute|fiction}。listed: false。
lib/games.ts → games/{slug}/rules.md → components/play/ → lib/play-registry.ts の順で。
PR に npm run catalog:doc の結果を含め、手動テスト手順を書いてください。テスト・カードアートは別 PR。
```

企画だけ依頼する場合（実装しない）:

```
AGENTS.md に従い、{テーマ} の新規ゲーム企画を提案してください。実装はせず、タイトル・slug 候補・系統・ルール概要・やらないことを出し、オーナーの OK を待ってください。
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

## CPU 対戦（汎用）

```
AGENTS.md の CPU 対戦 Agent に従い、{ゲーム名}（slug: {slug}）に CPU 対戦（弱・普通・強）を追加し、lib/games.ts の cpu: true にして PR を出してください。
lib/play/{slug}/ai.ts で legalActions 系を使い、プレイ画面は CPU 手番時に chooseMove のみ。サイト初の CPU の場合はセットアップ UI から設計し、PlaySetupCard / setupPillClass の既存デザインを踏襲すること。
```

### CPU 対戦 — 砲塔戦棋（サイト初）

```
AGENTS.md「CPU 対戦 Agent」に従い、砲塔戦棋（slug: senkai-senki）に CPU 対戦を追加して PR を出してください。

【背景】サイト初の CPU。先例の ai.ts / CPU UI なし。オンライン未対応。ロジック lib/play/senkai-senki.ts（legalActionsForPiece, applySenkaiAction）。UI components/play/SenkaiSenkiGame.tsx。

【AI】lib/play/senkai-senki/ai.ts。legalActionsForPiece を集約。chooseMove(state, easy|normal|hard)。自前ルール再実装禁止。

【セットアップ UI】PlaySetupCard + setupPillClass（OnlineSetupPanel の pill と同系統）。「同画面2人｜CPU対戦」→ CPU 時は難易度 pill + 人間の陣（プレイヤー1下段 / プレイヤー2上段）。必要なら components/play/shared/ に CpuDifficultyPicker 等を最小追加。

【対局中】CPU 手番は盤無効・TurnBanner で短い案内（外に出し入れ UI 禁止）。思考ディレイ 300〜800ms。useEffect 二重・チラつき禁止。

【PlayPageShell】playMode を cpu 等に最小拡張しヘッダー「CPU対戦」表示。オンライン・他ゲーム挙動は変えない。

【メタ】cpu: true、npm run catalog:doc、rules.md に CPU 1〜2文。

【やらない】オンライン、他ゲーム CPU、lib/play/cpu/ 共通化（3本目まで見送り）。

【PR】手動テスト（ローカル2人回帰、CPU 各難易度、上下陣）、着手前に UI pill 案・playMode 案・難易度概要を短く返信してから実装。
```

## オンライン対戦 — ウサギと猟犬（役割選択）

slug: `fox-hounds`。先手ピッカーではなく **猟犬役の seat**（game_options.houndsSeat）をホストが選択。

```
.cursor/rules/online-play.mdc と AGENTS.md に従い、fox-hounds にオンライン2人対戦を PR で追加。

【役割】Player 0=猟犬、1=ウサギ。開始 current は常に 0。firstPlayer は使わない。houndsSeat: 0|1 で猟犬担当 seat。roleForSeat / seatForRole で applyMove と currentPlayer（seat 番号）を変換。待機 UI は「猟犬をどちらがやるか」（OnlineFirstPlayerPicker パターン参考、ラベルは先手でない）。

【実装】lib/online/moves.ts（MovePayload type fox-hounds）、ONLINE_GAME_SLUGS、game-options、FoxHoundsGame を Checkers + Hex/Nim パターンで統合。オンライン中盤は online.gameState のみ（楽観的ローカル盤禁止）。sync-game-state は原則触らない。

【品質】チラつき・遅延対策、他 slug 無影響、ローカル回帰。rules.md にオンライン短段落。

【PR】2ブラウザテスト、houndsSeat 説明。着手前にキー名・UI 案を返信してから実装。
```

## ココナラ — 制作代行（出品・返信サポート）

コード PR は基本しない。出品文案・見積整理・購入者メッセージへの返信ドラフト。

```
ボドパッ！のボードゲーム制作代行をココナラ出品・運用する相談役。AGENTS.md・app/about/page.tsx（SHOW_ABOUT_PAGE=false も文案ベース）・lib/games.ts の実績を参照。市販商品名・作品名・無許可ルール再現はお断り文案。取引はココナラ、サイトは実績デモ。法律断定しない。

やる: 出品タイトル・説明・オプション（ライト/スタンダード/フル）・FAQ・購入者への返信ドラフト（貼付メッセージから）・見積メモ。出力は結論→提案→オーナー確認→次の一手。

最初: ターゲット・単価レンジ・納期・オンライン/CPU オプション可否をヒアリング後、タイトル3案・説明・オプション表・お断りテンプレ1本。
```

## note — サイト／ゲーム紹介記事

```
note 向け紹介記事 Agent。実装 PR しない。日本語。AGENTS.md に従い商標・作品名を出さない。

A: サイト全体（1,200〜2,000字目安）— 無料・登録不要・ローカル/オンライン・系統ラベル・ランキング・https://board-playground.vercel.app
B: ゲーム単体（600〜1,200字）— listed: true の slug。lib/games.ts + games/{slug}/rules.md。ルールページとプレイ URL をリンク。

出力: タイトル3案、リード、本文、ハッシュタグ、サムネ1行、確認事項。最初はモード A を lib/games.ts の listed 確認のうえ執筆。

モード B 依頼例: 「モード B: slug: {slug}」
```
