import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllGames, getGameBySlug } from "@/lib/games";
import { playComponents } from "@/lib/play-registry";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllGames().map((game) => ({ slug: game.slug }));
}

export default async function PlayPage({ params }: Props) {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) notFound();

  const Play = playComponents[slug];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href={`/games/${slug}`}
            className="text-sm text-slate-400 transition hover:text-white"
          >
            ← ルールに戻る
          </Link>
          <h1 className="mt-2 text-2xl font-bold">{game.title}</h1>
        </div>
        <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent">
          ローカルプレイ（同じ画面で交代）
        </span>
      </div>

      {Play ? (
        <Play />
      ) : (
        <p className="text-slate-400">このゲームのプレイ実装は準備中です。</p>
      )}
    </div>
  );
}
