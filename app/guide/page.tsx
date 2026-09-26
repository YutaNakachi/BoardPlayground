import type { Metadata } from "next";
import Link from "next/link";
import { BackToHomeLink } from "@/components/BackToHomeLink";
import { PageContainer } from "@/components/PageContainer";
import {
  ORIGIN_LABEL,
  type GameOrigin,
} from "@/lib/games";
import {
  SITE_HELP_PATH,
  SITE_NAME,
  SITE_RANKING_PATH,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "このサイトについて",
  description: `${SITE_NAME}の使い方・無料プレイ・オンライン部屋・ランキングの概要`,
};

const ORIGIN_KEYS: GameOrigin[] = ["original", "classic", "tribute", "fiction"];

export default function GuidePage() {
  return (
    <PageContainer>
      <BackToHomeLink />
      <h1 className="mt-4 text-3xl font-bold">このサイトについて</h1>
      <p className="mt-4 text-lg leading-relaxed text-slate-300">
        {SITE_NAME}は、ブラウザですぐ遊べるボードゲームの遊び場です。アカウント登録やアプリのインストールは不要で、無料で利用できます。
      </p>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold text-white">遊び方の基本</h2>
        <ul className="list-disc space-y-2 pl-5 leading-relaxed text-slate-300">
          <li>トップの一覧からゲームを選び、「遊ぶ！」またはルールページからプレイ画面へ進みます。</li>
          <li>同じ画面で順番に操作する<strong className="font-medium text-slate-200">ローカルプレイ</strong>が基本です。2人以上で1台の端末を共有して遊べます。</li>
          <li>対応ゲームでは、プレイ画面で<strong className="font-medium text-slate-200">オンライン</strong>を選び、部屋コードで離れた相手と対戦できます（サイトのオンライン機能が有効な場合）。</li>
        </ul>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold text-white">ゲームの種類</h2>
        <p className="leading-relaxed text-slate-300">
          一覧では次のラベルで分類しています。
        </p>
        <ul className="list-disc space-y-2 pl-5 leading-relaxed text-slate-300">
          {ORIGIN_KEYS.map((key) => (
            <li key={key}>
              <span className="font-medium text-slate-200">{ORIGIN_LABEL[key]}</span>
              —{" "}
              {key === "tribute" || key === "fiction"
                ? "非公式のプレイ版です。公式商品・権利者提供ではありません。"
                : key === "classic"
                  ? "商標を使わない伝統的なゲームです。"
                  : "当サイト独自のゲームです。"}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold text-white">プレイ回数ランキング</h2>
        <p className="leading-relaxed text-slate-300">
          ゲーム開始時にプレイ回数がカウントされます（日本時間の日付で集計）。統計機能が有効なときは
          <Link href={SITE_RANKING_PATH} className="text-accent hover:underline">
            ランキングページ
          </Link>
          で確認できます。
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold text-white">もっと詳しく</h2>
        <p className="leading-relaxed text-slate-300">
          よくある質問は
          <Link href={SITE_HELP_PATH} className="text-accent hover:underline">
            ヘルプ
          </Link>
          をご覧ください。お問い合わせはフッターのリンクからフォームをご利用ください。
        </p>
      </section>
    </PageContainer>
  );
}
