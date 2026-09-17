import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  COMPLEXITY_LABEL,
  ORIGIN_LABEL,
  getAllGames,
  getGameBySlug,
} from "@/lib/games";

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/"
        className="mb-8 inline-flex text-sm text-slate-400 transition hover:text-white"
      >
        ← 一覧に戻る
      </Link>

      <header className="mb-10">
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent ring-1 ring-accent/30">
            {ORIGIN_LABEL[game.origin]}
          </span>
          {game.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-surface-raised px-3 py-1 text-xs text-slate-300 ring-1 ring-surface-border"
            >
              {tag}
            </span>
          ))}
        </div>
        <h1 className="text-3xl font-bold sm:text-4xl">{game.title}</h1>
        <p className="mt-2 text-slate-400">
          {COMPLEXITY_LABEL[game.complexity]} · {game.players}人 · 約
          {game.durationMinutes}分
          {game.cpu ? " · CPUあり" : ""}
          {game.team ? " · チーム可" : ""}
        </p>
        <p className="mt-4 text-lg leading-relaxed text-slate-300">
          {game.description}
        </p>
      </header>

      <section className="mb-10 rounded-2xl border border-surface-border bg-surface-raised p-6 sm:p-8">
        <h2 className="mb-4 text-lg font-semibold">ルール概要</h2>
        <div className="space-y-4 text-slate-300 leading-relaxed">
          {game.rulesSummary.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </section>

      {game.status === "playable" ? (
        <Link
          href={`/play/${game.slug}`}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-accent px-6 py-4 text-lg font-semibold text-white transition hover:bg-accent-hover sm:w-auto"
        >
          このゲームを遊ぶ
        </Link>
      ) : (
        <p className="text-slate-400">プレイ実装は準備中です。</p>
      )}
    </div>
  );
}
