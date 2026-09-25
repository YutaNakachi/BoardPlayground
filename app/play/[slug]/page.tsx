import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlayPageShell } from "@/components/play/PlayPageShell";
import { loadGameRules } from "@/lib/game-rules";
import { getRegisteredGameBySlug } from "@/lib/games";
import { playComponents } from "@/lib/play-registry";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(playComponents).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const game = getRegisteredGameBySlug(slug);
  if (!game) return { title: "ゲームが見つかりません" };
  return {
    title: `${game.title}をプレイ`,
    description: `${game.title}をブラウザでローカルプレイ。${game.description}`,
  };
}

export default async function PlayPage({ params }: Props) {
  const { slug } = await params;
  const game = getRegisteredGameBySlug(slug);
  if (!game) notFound();

  const Play = playComponents[slug];
  const rules = loadGameRules(slug, game);
  if (!rules) notFound();

  return (
    <PlayPageShell game={game} rules={rules}>
      {Play ? (
        <Play />
      ) : (
        <p className="text-slate-400">このゲームのプレイ実装は準備中です。</p>
      )}
    </PlayPageShell>
  );
}
