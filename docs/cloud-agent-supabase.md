# Cloud Agent と Supabase

Cloud Agent が Supabase のマイグレーション実行・オンライン機能の検証を行うための設定です。

## 一度だけ行う設定（Yuta さん）

### 1. Cloud Agent 環境にシークレットを追加

[Cloud Agent 環境設定](https://cursor.com/dashboard/cloud-agents/environments) で、このリポジトリ用環境に以下を登録します（Vercel と同じ値で OK）。

| シークレット名 | 取得場所 |
|----------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 同上 → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | 同上 → service_role（**秘密**） |
| `SUPABASE_DB_URL` | Supabase → Connect → Database → URI（`postgresql://...`） |

`SUPABASE_DB_URL` はマイグレーション実行用です。本番 DB に接続するため、**Cloud Agent 環境だけ**に置き、リポジトリにはコミットしません。

### 2. 環境設定 PR のマージ

`.cursor/environment.json` がマージされると、新しい Cloud Agent は起動時に `.env.local` を自動生成します。

## Agent が実行できるコマンド

```bash
# 未適用のマイグレーションを本番 DB に適用
npm run db:migrate

# DB 接続と主要テーブルの疎通確認
npm run db:check
```

## 運用メモ

- 新しいマイグレーションを追加した PR では、Agent に `npm run db:migrate` の実行と手動テスト手順の記載を依頼できます。
- マイグレーションは `supabase/migrations/` に番号付き SQL を追加するだけです（`005_room_game_options.sql` など）。
- Agent は **あなたの Supabase プロジェクト**に接続します。シークレット未設定の Agent では DB 操作はできません。
