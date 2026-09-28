# 本番ドメイン・メール・検索（bodopa.com）

本番の正規 URL は **apex** の `https://bodopa.com`（`lib/site.ts` の `SITE_URL`）。`www` は 301 で apex に寄せる。

機密情報（`RESEND_API_KEY`・`CONTACT_TO_EMAIL`・受信用 Gmail など）は **Vercel の Secret のみ**。リポジトリ・PR 本文・チャットに平文で書かない。

## 進行順序

1. Vercel にドメイン接続（このドキュメント「Vercel + Cloudflare DNS」）
2. デプロイ後、`https://bodopa.com` と sitemap / robots を確認
3. Resend で `bodopa.com` を認証し、本番 From に切り替え（「Resend」）
4. 本番 `/contact` で運営宛送信を手動テスト
5. 受付確認メール（A）をコードで有効化した PR をマージ後、再テスト
6. Google Search Console（正規 URL のみ）

---

## Vercel + Cloudflare DNS

### Vercel

- [ ] プロジェクト **Settings → Domains** で `bodopa.com` と `www.bodopa.com` を追加
- [ ] 表示された DNS レコードを Cloudflare に入れる（下記）
- [ ] **Production** のプライマリドメインを `bodopa.com` にする
- [ ] `www.bodopa.com` を **Redirect to `bodopa.com`（301）** に設定
- [ ] 最新の `main`（または Production ブランチ）を **Redeploy**

### Cloudflare（DNS）

1. **Websites** → `bodopa.com` → **DNS** → **Records**
2. Vercel が指示するレコードを追加（例: apex 用 `A`、www 用 `CNAME` → `cname.vercel-dns.com`）。Vercel 画面の値が正。古いプレースホルダと重複する行は整理する。
3. 初回は **Proxy status: DNS only（灰色の雲）** 推奨。Vercel で Valid になったら、必要に応じて Cloudflare プロキシを検討（Vercel 公式の Cloudflare 連携手順に従う）。

### 確認

- [ ] `https://bodopa.com` が開き、HTTPS が有効
- [ ] `https://www.bodopa.com` が `https://bodopa.com` に 301
- [ ] `https://bodopa.com/sitemap.xml` の URL がすべて `https://bodopa.com/...`
- [ ] `https://bodopa.com/robots.txt` の `Sitemap:` が `https://bodopa.com/sitemap.xml`
- [ ] `https://bodopa.com/api/status` が期待どおり（Supabase 設定済みの場合）

`board-playground.vercel.app` は Preview 用として残してもよい。Search Console には **bodopa.com のみ**登録する。

---

## Resend（送信元・お問い合わせ B）

### Resend ダッシュボード

- [ ] **Domains** → `bodopa.com` を追加
- [ ] 表示される **SPF / DKIM** 等を Cloudflare DNS に追加
- [ ] ドメインが **Verified** になるまで待つ

### Vercel Environment Variables（Production）

| 変数 | 種別 | 内容 |
|------|------|------|
| `RESEND_API_KEY` | Secret | Resend API キー |
| `RESEND_FROM_EMAIL` | 通常 | 認証済みドメインの送信元（例: `noreply@bodopa.com`） |
| `CONTACT_TO_EMAIL` | Secret | 運営の受信先（リポジトリに書かない） |

- [ ] `onboarding@resend.dev` 運用をやめ、上記 `RESEND_FROM_EMAIL` に切り替え
- [ ] **Redeploy**

### 手動テスト（本番）

- [ ] `/contact` からテスト送信（返信先は自分用の捨てアドレスなど）
- [ ] 運営宛に届く
- [ ] メールクライアントで **Reply（返信）** すると、宛先がフォームの返信先になる（`Reply-To`）

### 運営が Gmail で返信する場合

受信は Gmail でもよいが、**返信時の From が個人の @gmail.com にならない**ようにする。

- Gmail → **設定** → **アカウントとインポート** → **他のメールアドレスを追加**（「別のアドレスとして送信」）
- 認証済みドメインの運用用アドレス（Resend の From と同じか、別の `@bodopa.com`）を追加し、返信時はその From を選ぶ

---

## 受付確認メール（A）

`lib/contact/auto-reply.ts` を `app/api/contact/route.ts` から有効化する PR は、**B の本番テスト成功後**にマージする。

有効化後の手動テスト:

- [ ] フォーム送信後、入力した返信先に自動確認メールが届く
- [ ] From は `RESEND_FROM_EMAIL`（サイト名付き表示名）
- [ ] 確認メールに運営の受信アドレスは載らない

失敗時の想定（実装方針）: 運営宛送信が成功したら API は成功を返し、確認メールのみ失敗した場合はサーバーログに記録（ユーザーへの再送はフォーム案内）。

---

## Google Search Console

- [ ] [Search Console](https://search.google.com/search-console) でプロパティ追加
  - **URL プレフィックス**: `https://bodopa.com` のみ（`www` 別登録・`vercel.app` 登録はしない）
- [ ] 所有権確認: **DNS TXT**（Cloudflare DNS にレコード追加）
- [ ] **サイトマップ** を送信: `https://bodopa.com/sitemap.xml`
- [ ] 数日後: **URL 検査** でトップや主要ページのインデックス状況を確認

---

## コードとの関係

| 項目 | 場所 |
|------|------|
| 正規 URL | `lib/site.ts` → `SITE_URL` |
| sitemap / robots | `app/sitemap.ts`, `app/robots.ts`（`SITE_URL` 参照） |
| OGP 等の基準 URL | `app/layout.tsx` の `metadataBase` |
| お問い合わせ API | `app/api/contact/route.ts` |
