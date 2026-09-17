import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlayPageShell } from "@/components/play/PlayPageShell";
import { getAllGames, getGameBySlug } from "@/lib/games";
import { playComponents } from "@/lib/play-registry";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllGames().map((game) => ({ slug: game.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) return { title: "ゲームが見つかりません" };
  return {
    title: `${game.title}をプレイ`,
    description: `${game.title}をブラウザでローカルプレイ。${game.description}`,
  };
}

export default async function PlayPage({ params }: Props) {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) notFound();

  const Play = playComponents[slug];

  return (
    <PlayPageShell game={game}>
      {Play ? (
        <Play />
      ) : (
        <p className="text-slate-400">このゲームのプレイ実装は準備中です。</p>
      )}
    </PlayPageShell>
  );
}
