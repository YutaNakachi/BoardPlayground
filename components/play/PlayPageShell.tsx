"use client";

import Link from "next/link";
import { useState } from "react";
import { GameRulesOverlay } from "@/components/rules/GameRulesOverlay";
import type { GameRulesDocument } from "@/lib/game-rules";
import type { GameMeta } from "@/lib/games";

type Props = {
  game: GameMeta;
  rules: GameRulesDocument;
  children: React.ReactNode;
};

export function PlayPageShell({ game, rules, children }: Props) {
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm text-[#86868b] transition hover:text-white"
          >
            ← ゲーム一覧
          </Link>
          <button
            type="button"
            onClick={() => setRulesOpen(true)}
            className="text-sm font-medium text-[#2997ff] transition hover:underline"
          >
            ルールを見る
          </button>
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#f5f5f7] sm:text-4xl">
          {game.title}
        </h1>
        <p className="mt-1.5 text-sm text-[#86868b]">ローカルプレイ</p>
      </header>

      {children}

      <GameRulesOverlay
        rules={rules}
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
      />
    </div>
  );
}
