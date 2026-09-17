"use client";

import Link from "next/link";
import { useState } from "react";
import type { GameMeta } from "@/lib/games";

type Props = {
  game: GameMeta;
  children: React.ReactNode;
};

export function PlayPageShell({ game, children }: Props) {
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

      {rulesOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="presentation"
          onClick={() => setRulesOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="play-rules-title"
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-surface-border bg-surface p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 id="play-rules-title" className="text-lg font-semibold">
                {game.title}のルール
              </h2>
              <button
                type="button"
                onClick={() => setRulesOpen(false)}
                className="shrink-0 rounded-lg px-2 py-1 text-sm text-slate-400 transition hover:text-white"
                aria-label="ルールを閉じる"
              >
                閉じる
              </button>
            </div>
            <div className="space-y-4 text-sm leading-relaxed text-slate-300">
              {game.rulesSummary.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            <Link
              href={`/games/${game.slug}`}
              className="mt-6 inline-flex text-sm text-accent transition hover:text-accent-hover"
              onClick={() => setRulesOpen(false)}
            >
              ルールページを開く →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
