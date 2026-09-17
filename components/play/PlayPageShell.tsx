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
            className="min-h-9 rounded-full border border-surface-border bg-surface-raised px-4 text-sm font-medium text-slate-200 transition hover:border-accent/40 hover:text-white"
          >
            ルール
          </button>
          <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent">
            ローカルプレイ
          </span>
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
