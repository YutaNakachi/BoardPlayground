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
| `SUPABASE_DB_URL` | Supabase → **Connect → Session pooler** の URI（`postgresql://postgres.[ref]:...@aws-0-[region].pooler.supabase.com:5432/postgres`） |

`SUPABASE_DB_URL` はマイグレーション実行用です。本番 DB に接続するため、**Cloud Agent 環境だけ**に置き、リポジトリにはコミットしません。

Cloud Agent では Direct connection（`db.[ref].supabase.co:5432`）が IPv6 で届かないことがあるため、**Session pooler（port 5432）** を使ってください。Transaction pooler（port 6543）はマイグレーションで失敗します。

### 2. 環境設定 PR のマージ

`.cursor/environment.json` がマージされると、新しい Cloud Agent は起動時に `.env.local` を自動生成します。

### 3. カスタム Dockerfile の注意（必読）

`.cursor/Dockerfile` で `node:*-slim` など最小イメージを使う場合、**`curl` を必ずインストール**してください。Cloud Agent の起動処理（`install-exec-daemon`）が `curl` でバイナリを取得します。`git` を入れても `curl` コマンドは入りません。

環境変更 PR ではマージ前に:

1. `npm run env:check`
2. Cloud Agent 環境の **Rebuild 成功**
3. **新規 Agent 起動**の確認

詳細: `.cursor/rules/cloud-agent-env.mdc`

## Agent が実行できるコマンド

```bash
# 未適用のマイグレーションを本番 DB に適用
npm run db:migrate

# DB 接続・GRANT の疎通確認（anon キーがあるとき GRANT も検証）
npm run db:check

# 本番 DB にどのマイグレーションが適用済みか一覧（SUPABASE_DB_URL 必須）
npm run db:migrations
```

## 本番でマイグレーションが揃っているか確認する

**いつ**: 新しいマイグレーション PR をマージしたあと、`db reset` やプレビューブランチを触る前、オンライン対戦が permission denied になったとき。

### 1. CLI（推奨）

`SUPABASE_DB_URL`（Session pooler・port **5432**）を設定したうえで:

```bash
npm run db:migrations
# または
npx supabase@2.58.3 migration list --db-url "$SUPABASE_DB_URL"
```

`supabase/migrations/` の各行で **REMOTE** 列にバージョンが付いていれば適用済み。REMOTE が空の行があれば `npm run db:migrate` を実行する。

Cloud Agent では環境シークレットに `SUPABASE_DB_URL` が入っているので `npm run db:migrations` が使える。

### 2. アプリ経由（Vercel 本番）

デプロイ済みで環境変数が入っている場合:

- `https://<your-domain>/api/status` が `{ "stats": true, "online": true }` → service_role 経由の統計・部屋 API は動いている
- ローカルで `.env.local` に本番と同じ3変数を置き `npm run db:check` → `[ok] stats` / `[ok] rooms` と **anon GRANT**（`[ok] anon select on rooms` など）が `[ok]` であること
- `SUPABASE_DB_URL` を足して `npm run db:migrations` → 全行の REMOTE が埋まっていること（特に `007`）

### 3. Supabase Dashboard（手動適用した場合）

**SQL Editor** で次を実行し、`007_explicit_grants.sql` 相当の権限があるか確認する:

```sql
select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'rooms', 'room_players', 'room_state',
    'game_stats_daily', 'game_stats_total', 'play_rate_limit'
  )
  and grantee in ('anon', 'service_role')
group by table_name, grantee
order by table_name, grantee;
```

期待値（このリポジトリの設計）:

| テーブル | anon | service_role |
|----------|------|----------------|
| `rooms`, `room_players`, `room_state` | `SELECT` | `DELETE, INSERT, SELECT, UPDATE` |
| `game_stats_*`, `play_rate_limit` | （行なし） | `DELETE, INSERT, SELECT, UPDATE` |

`authenticated` は Supabase Auth 未使用のため付けていない。

## Data API の明示 GRANT（2026-10-30〜）

Supabase は **2026-10-30** 以降、`public` に**新規作成**したテーブルへ Data API 権限を自動付与しなくなる。既存プロジェクトの**既存テーブル**は従来どおり。`supabase db reset`・プレビューブランチ・新規プロジェクトではテーブルが作り直されるため、マイグレーション内の GRANT が必須。

本リポジトリは `supabase/migrations/007_explicit_grants.sql` で現行テーブルをカバー済み。**新しい `public` テーブルを追加するマイグレーション**では、同じファイルに `CREATE TABLE` と **同じマイグレーション**で GRANT を書く（パターンは `007` をコピー。anon は Realtime 用 SELECT が必要なテーブルだけ）。

## 運用メモ

- 新しいマイグレーションを追加した PR では、Agent に `npm run db:migrate` の実行と手動テスト手順の記載を依頼できます。
- マイグレーションは `supabase/migrations/` に番号付き SQL を追加するだけです（`005_room_game_options.sql` など）。**新規テーブル**は GRANT 必須（上記）。
- Agent は **あなたの Supabase プロジェクト**に接続します。シークレット未設定の Agent では DB 操作はできません。
