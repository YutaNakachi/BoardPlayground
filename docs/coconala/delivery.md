# ココナラ — 納品フォーマット

制作代行の標準納品物。ボドパッ！のゲーム追加手順と同じ形にする。

## 必須

1. `games/{slug}/rules.md` — 人数・時間・勝利条件・手番・例外・タイブレーク
2. `components/play/{Name}Game.tsx` — 同画面交代のプレイ実装（`"use client"`）
3. `lib/games.ts` へ追加するメタデータ案（slug, title, description, players, duration, tags, rulesSummary）

## 任意

- ルールページ用の補足文
- 駒・カードのイラスト指示（実装はシンプルな CSS カードでも可）

## 受け渡し

- ソース一式を zip、または依頼者リポジトリへの PR
- プレイ確認用 URL（ボドパッ！掲載に同意がある場合はサイトの `/play/{slug}`）

## 受け入れ条件

- 2人・最大人数の両方で開始から終了まで通せる
- `rules.md` と実装の得点・終了条件が一致している
- モバイル幅で主要ボタンが押せる
