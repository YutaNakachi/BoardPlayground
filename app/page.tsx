import { GameCatalog } from "@/components/GameCatalog";
import { getAllGames } from "@/lib/games";

export default function HomePage() {
  const games = getAllGames();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-14 text-center">
        <p className="mb-3 text-sm font-medium tracking-widest text-accent">
          ブラウザですぐ遊べる
        </p>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          同じ盤面で対戦する
          <span className="block text-accent">ボードゲームの遊び場</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
          お互いが同じ盤面を見て対戦できます。ルールを読んで、すぐプレイ。
        </p>
      </section>

      <GameCatalog games={games} />
    </div>
  );
}
