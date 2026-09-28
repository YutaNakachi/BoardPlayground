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

## お問い合わせメール運用（noreply / contact）

本番の想定:

| 役割 | アドレス | 設定場所 |
|------|----------|----------|
| サイトからの送信 From | `noreply@bodopa.com` | Vercel `RESEND_FROM_EMAIL` + Resend ドメイン認証 |
| お問い合わせ通知の届け先 To | `contact@bodopa.com` | Vercel `CONTACT_TO_EMAIL` + Cloudflare Email Routing |
| お客への返信時の From | `contact@bodopa.com` | Gmail「別のアドレスとして送信」（Resend とは別経路） |

メールの流れ: フォーム → Resend が **From: noreply@** / **To: contact@** / **Reply-To: お客** で運営に通知 → 運営が Gmail で返信（**From: contact@**）→ お客に届く。

---

## Resend（送信元・お問い合わせ B）

お問い合わせ API は `app/api/contact/route.ts`。**3 つの環境変数**と **ドメイン認証**で本番有効。受付確認メール（A）も同 API から送信する。

### 1. Resend で API キー（未作成なら）

1. [Resend](https://resend.com/) にログイン
2. **API Keys** → **Create API Key**
3. 名前例: `boardplayground-production`、Permission: **Sending access**（ドメイン限定でも可）
4. 表示されたキーは **一度だけ**コピー → 次の Vercel 設定へ（チャット・Git に貼らない）

### 2. Resend でドメイン追加

1. **Domains** → **Add Domain**
2. ドメイン名: **`bodopa.com`**（`www` は不要）
3. Region はデフォルトで可（日本向け配信は Resend の仕様に従う）
4. **Add** 後、**DNS Records** 一覧が表示される（件数・ホスト名はアカウントごとに異なる。**Resend 画面の値をそのまま使う**）

### 3. Cloudflare に DNS を追加

**Websites** → `bodopa.com` → **DNS** → **Records** → **Add record**

Resend が示す各行を追加する（典型的には次のような種類。**名前・値は必ず Resend のコピーボタンから**）:

| Resend の種別 | Cloudflare での Type | Name の例 | 注意 |
|---------------|----------------------|-----------|------|
| DKIM | CNAME | `resend._domainkey` など | **DNS only**（CNAME はプロキシ不可のことが多い） |
| SPF / 送信 | TXT または CNAME | `send` または `@` | Resend の指示どおり |
| （表示されたら）DMARC | TXT | `_dmarc` | 任意だが推奨されることが多い |

- 既存の **同じ Name + Type** がある場合は **上書きせず**、Resend のドキュメントに沿って統合する（SPF TXT は 1 本にまとめる必要がある場合あり）
- メール用レコードは **灰い雲（DNS only）**。TXT はプロキシの対象外

追加後:

1. Resend の Domains 画面で **Verify** / 自動再チェックを待つ（数分〜最大 48 時間）
2. ステータスが **Verified** になるまで待つ

### 4. Resend で追加設定は基本不要

- **Domains** で `bodopa.com` が **Verified** なら、`noreply@bodopa.com` は追加登録なしで送信可能（ドメイン単位の認証）。
- **API Keys**: 既存キーが有効なら作り直し不要。漏洩時のみローテーション。
- Resend は **`contact@` の受信はしない**（受信は Cloudflare Email Routing → Gmail）。

### 5. Vercel Environment Variables（Production）

**Settings → Environment Variables**。Preview / Development は空でもよい（本番だけ有効にする運用で可）。

| 変数 | 種別 | 内容 |
|------|------|------|
| `RESEND_API_KEY` | **Sensitive** | 手順 1 の API キー |
| `RESEND_FROM_EMAIL` | 通常 | `noreply@bodopa.com`（表示名は入れない。コード側で `ボドパッ！ <noreply@...>` にする） |
| `CONTACT_TO_EMAIL` | **Sensitive** | `contact@bodopa.com`（Cloudflare で受信設定後に有効） |

- [ ] 以前 `onboarding@resend.dev` を使っていた場合は **Production の `RESEND_FROM_EMAIL` を差し替え**
- [ ] **Deployments** → 最新 Production → **Redeploy**（環境変数だけ変えた場合も必須）

### 6. 手動テスト（本番）

- [ ] https://bodopa.com/contact がフォーム表示（「受け付けられません」が出ない）
- [ ] テスト送信（返信先は自分用の別アドレス）
- [ ] **CONTACT_TO_EMAIL** の受信箱に届く
- [ ] 件名・本文に名前・返信先・本文が含まれる
- [ ] 受信メールで **返信** → 宛先がフォームの返信先（`Reply-To`）になる
- [ ] From が `ボドパッ！` + `noreply@bodopa.com`（または設定したアドレス）で、**resend.dev ではない**

### うまくいかないとき

| 症状 | 確認 |
|------|------|
| フォームが「受け付けられません」 | Production の 3 変数が揃っているか、Redeploy 済みか |
| 送信失敗（503） | Vercel **Functions** ログの `contact notify failed`、Resend が Verified か、From が認証ドメインか |
| 届かない | 迷惑メール、Gmail のフィルタ、`CONTACT_TO_EMAIL` の typo |
| Domain が Verified にならない | Cloudflare の Name が Resend と完全一致か、プロキシ、反映待ち |

### Cloudflare Email Routing（contact@ の受信）

`CONTACT_TO_EMAIL=contact@bodopa.com` にする前に、**contact@ がメールを受け取れる**ようにする。

1. Cloudflare → **bodopa.com** → **Email** → **Email Routing**
2. 初回は **Enable Email Routing**（必要な MX / TXT を Cloudflare が DNS に追加する流れに従う）
3. **Routing rules** → **Create address**
   - **Custom address**: `contact`
   - **Action**: **Send to an email** → 普段使う Gmail（個人アドレス。ドキュメント・Git に書かない）
4. **Destination address** の確認メールが Gmail に届く → **Verify**
5. テスト: 別アドレスから `contact@bodopa.com` に送って Gmail に転送されるか確認

Resend 用の DKIM/SPF と MX（Email Routing）は **別レコード**として共存する（Cloudflare が案内する MX をそのまま使う）。

### Gmail（転送受信・contact@ として返信）

**A. 転送メールを Gmail で受け取る**

- Email Routing の Verify 後、フォーム通知は Gmail に届く（To 表示は `contact@bodopa.com` 経由の転送）
- 届かない場合: 迷惑メール、Routing のルール、Vercel の `CONTACT_TO_EMAIL` の typo

**B. 返信時の From を contact@ にする（推奨）**

1. Gmail → **設定**（歯車）→ **すべての設定を表示**
2. **アカウントとインポート** → **他のメールアドレスを追加**（「別のアドレスとして送信」）
3. 名前: 例 `ボドパッ！`、メール: **`contact@bodopa.com`**
4. **SMTP サーバー**: Gmail の案内に従う（多くの場合 `smtp.gmail.com`、ポート 587、TLS、**Gmail のアプリパスワード**が必要なことがある）
5. 届いた確認コードで認証
6. **デフォルトの送信アドレス**を `contact@bodopa.com` にするか、返信時に From を選ぶ

お問い合わせ通知メールの **返信**は Reply-To がお客のメールになる。**From は contact@** になるよう、上記を設定する（`noreply@` で返信しない）。

**C. noreply@ について**

- Gmail で `noreply@` を「送信用に追加」する必要はない（サイトは Resend が noreply から送るだけ）。
- お客が noreply に直接返信しても届かない運用にする場合は、受付確認メール（A）の文言で「このアドレスには返信できません」と既に案内する。

---

## 受付確認メール（A）

`app/api/contact/route.ts` で運営宛送信成功後、入力メール宛に自動返信する。運営宛のみ失敗した場合は 503、確認メールのみ失敗した場合は成功を返しログに記録する。

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
