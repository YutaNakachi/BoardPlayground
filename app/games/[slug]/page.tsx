import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GameMetaChips } from "@/components/GameMetaChips";
import { OriginChip } from "@/components/OriginChip";
import { GameRulesView } from "@/components/rules/GameRulesView";
import { TAG_CHIP_CLASS } from "@/lib/chip-styles";
import { loadGameRules } from "@/lib/game-rules";
import { getAllGames, getGameBySlug } from "@/lib/games";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllGames().map((game) => ({ slug: game.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) return { title: "ゲームが見つかりません" };
  return {
    title: game.title,
    description: game.description,
  };
}

export default async function GameDetailPage({ params }: Props) {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) notFound();

  const rules = loadGameRules(slug, game);
  if (!rules) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link
        href="/"
        className="mb-8 inline-flex text-sm text-slate-400 transition hover:text-white"
      >
        ← 一覧に戻る
      </Link>

      <header className="mb-10">
        <div className="mb-4 flex flex-wrap gap-2">
          <OriginChip origin={game.origin} className="rounded-full px-3 py-1" />
          <GameMetaChips game={game} className="contents" />
          {game.tags.map((tag) => (
            <span key={tag} className={`${TAG_CHIP_CLASS} rounded-full px-3 py-1`}>
              {tag}
            </span>
          ))}
        </div>
        <h1 className="text-3xl font-bold sm:text-4xl">{game.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-300">
          {game.description}
        </p>
      </header>

      <section className="mb-10 rounded-2xl border border-white/10 bg-surface-raised p-6 sm:p-8">
        <GameRulesView rules={rules} variant="page" />
      </section>

      {game.status === "playable" ? (
        <Link
          href={`/play/${game.slug}`}
          className="btn-play inline-flex min-h-11 w-full items-center justify-center px-8 py-3 text-base sm:w-auto"
        >
          遊ぶ！
        </Link>
      ) : (
        <p className="text-slate-400">プレイ実装は準備中です。</p>
      )}
    </div>
  );
}
