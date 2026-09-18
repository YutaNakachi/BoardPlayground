"use client";

import Link from "next/link";
import { useState } from "react";
import { PlayPageProvider, usePlayPage } from "@/components/play/PlayPageContext";
import { GameRulesOverlay } from "@/components/rules/GameRulesOverlay";
import type { GameRulesDocument } from "@/lib/game-rules";
import type { GameMeta } from "@/lib/games";

type Props = {
  game: GameMeta;
  rules: GameRulesDocument;
  children: React.ReactNode;
};

function PlayPageShellInner({ game, rules, children }: Props) {
  const [rulesOpen, setRulesOpen] = useState(false);
  const { playMode } = usePlayPage();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/"
            className="text-sm text-slate-400 transition hover:text-white"
          >
            ← ゲーム一覧
          </Link>
          <h1 className="mt-2 text-2xl font-bold">{game.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setRulesOpen(true)}
            className="min-h-9 rounded-full border border-white/15 bg-white/5 px-4 text-sm font-medium text-[#e8e8ed] transition hover:border-white/25 hover:bg-white/10"
          >
            ルール
          </button>
          {playMode.mode === "online" ? (
            <span className="badge-online">
              オンライン · {playMode.roomCode ?? "接続中"}
            </span>
          ) : (
            <span className="badge-local">ローカルプレイ</span>
          )}
        </div>
      </div>

      {children}

      <GameRulesOverlay
        rules={rules}
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
      />
    </div>
  );
}

export function PlayPageShell({ game, rules, children }: Props) {
  return (
    <PlayPageProvider gameSlug={game.slug}>
      <PlayPageShellInner game={game} rules={rules}>
        {children}
      </PlayPageShellInner>
    </PlayPageProvider>
  );
}
