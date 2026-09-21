"use client";

import { useState } from "react";
import { PageContainer } from "@/components/PageContainer";
import { PlayCatalogLink } from "@/components/play/PlayCatalogLink";
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
  const { playMode, setupNav } = usePlayPage();

  return (
    <PageContainer padding="compact">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <PlayCatalogLink />
          <h1 className="mt-2 text-2xl font-bold">{game.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {setupNav.backToSetup ? (
            <button
              type="button"
              onClick={setupNav.backToSetup}
              className="min-h-9 rounded-full border border-white/15 bg-white/5 px-4 text-sm font-medium text-[#e8e8ed] transition hover:border-white/25 hover:bg-white/10"
            >
              はじめから
            </button>
          ) : null}
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
    </PageContainer>
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
