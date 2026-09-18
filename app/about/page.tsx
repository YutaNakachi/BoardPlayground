import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/PageContainer";
import {
  ORIGIN_LABEL,
  getAllGames,
  type GameOrigin,
} from "@/lib/games";
import { SHOW_ABOUT_PAGE, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "制作代行について",
  description:
    "オリジナルボードゲームのルール設計からブラウザ実装までのオーダーメイド制作代行。",
};

export default function AboutPage() {
  if (!SHOW_ABOUT_PAGE) {
    notFound();
  }

  const games = getAllGames();

  return (
    <PageContainer>
      <h1 className="text-3xl font-bold">制作代行について</h1>
      <p className="mt-4 leading-relaxed text-slate-300">
        {SITE_NAME}
        はオリジナル、許可あり、または商標を使わない伝統的な抽象ゲームをブラウザで公開・プレイする場です。アイデアのヒアリングからルール設計、Web化までを一貫して代行するサービスをココナラで提供します。受注・納品のやりとりはココナラ上で行い、このサイトは公開プレイと制作実績の置き場です。
      </p>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">できること</h2>
        <ul className="list-disc space-y-2 pl-5 text-slate-300">
          <li>人数・時間・勝利条件を明確にしたルール設計</li>
          <li>例外・タイブレークまで書いた仕様書</li>
          <li>同画面交代プレイのブラウザ実装</li>
        </ul>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">料金の目安</h2>
        <ul className="list-disc space-y-2 pl-5 text-slate-300">
          <li>ライト: 短いカード／配置ゲーム（目安 15分・ルール要素が少ない）</li>
          <li>スタンダード: ラウンド進行や手札秘匿がある中規模</li>
          <li>フル: 複数フェイズや独自ボードが必要な複雑ルール</li>
        </ul>
        <p className="text-sm text-slate-500">
          正式な金額はココナラの出品ページで提示します。工数はヒアリング後に確定します。
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">権利</h2>
        <p className="leading-relaxed text-slate-300">
          既存市販ゲームの無許可なルール再現はお受けしません。依頼者オリジナル、または権利者の許可がある内容に限ります。納品物の利用条件はココナラの取引画面と納品時の権利メモに従います。
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">公開ゲーム</h2>
        <p className="leading-relaxed text-slate-300">
          サイト上のゲームは制作フローの実例と、クラシックの抽象ゲームです。遊んで雰囲気を確かめてからご相談ください。
        </p>
        {(["original", "classic"] as GameOrigin[]).map((origin) => {
          const group = games.filter((game) => game.origin === origin);
          if (group.length === 0) return null;
          return (
            <div key={origin} className="space-y-2">
              <h3 className="text-sm font-medium text-slate-400">
                {ORIGIN_LABEL[origin]}
              </h3>
              <ul className="space-y-2">
                {group.map((game) => (
                  <li key={game.slug}>
                    <Link
                      href={`/games/${game.slug}`}
                      className="text-accent transition hover:text-accent-hover"
                    >
                      {game.title}
                    </Link>
                    <span className="text-sm text-slate-500">
                      {" "}
                      — {game.players}人 · 約{game.durationMinutes}分
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        <Link href="/" className="inline-flex text-sm text-slate-400 transition hover:text-white">
          ゲーム一覧を見る
        </Link>
      </section>
    </PageContainer>
  );
}
