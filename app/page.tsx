import { GameCard } from "@/components/GameCard";
import { getAllGames } from "@/lib/games";

export default function HomePage() {
  const games = getAllGames();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-14 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-accent">
          Play in your browser
        </p>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          オリジナルボードゲームの
          <span className="block text-accent">遊び場</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
          自作ルールをブラウザで体験。ルールを読んで、すぐプレイ。
        </p>
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-xl font-semibold">ゲーム一覧</h2>
          <span className="text-sm text-slate-500">{games.length} 本</span>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      </section>
    </div>
  );
}
