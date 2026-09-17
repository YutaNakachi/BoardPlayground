import { GameCatalog } from "@/components/GameCatalog";
import { SITE_TAGLINE } from "@/lib/site";
import { getAllGames } from "@/lib/games";

export default function HomePage() {
  const games = getAllGames();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-14 text-center">
        <p className="mb-3 text-sm font-medium tracking-widest text-accent">
          {SITE_TAGLINE}
        </p>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          タップして、一局。
          <span className="block text-accent">ブラウザで遊べるボドゲ</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
          ルールを読んで、そのままプレイ。オリジナルとクラシックの抽象ゲームを無料で公開しています。
        </p>
      </section>

      <GameCatalog games={games} />
    </div>
  );
}
