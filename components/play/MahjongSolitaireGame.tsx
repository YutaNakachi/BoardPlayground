"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import {
  initialMahjongSolitaire,
  isMahjongTileFree,
  mahjongFreeTiles,
  mahjongStuck,
  mahjongWon,
  removeMahjongPair,
  type MahjongState,
} from "@/lib/play/mahjong-solitaire";

type Phase = "idle" | "playing" | "game-over";

export function MahjongSolitaireGame() {
  const { recordLocalPlay } = usePlayPage();
  const [phase, setPhase] = useState<Phase>("idle");
  const [state, setState] = useState<MahjongState>(initialMahjongSolitaire);
  const [selected, setSelected] = useState<string | null>(null);

  const startGame = useCallback(() => {
    recordLocalPlay();
    setState(initialMahjongSolitaire());
    setSelected(null);
    setPhase("playing");
  }, [recordLocalPlay]);

  const removed = useMemo(() => new Set(state.removed), [state.removed]);
  const freeIds = useMemo(
    () => new Set(mahjongFreeTiles(state).map((t) => t.id)),
    [state]
  );

  const onTile = useCallback(
    (id: string) => {
      if (phase !== "playing" || removed.has(id) || !freeIds.has(id)) return;
      if (!selected) {
        setSelected(id);
        return;
      }
      if (selected === id) {
        setSelected(null);
        return;
      }
      const next = removeMahjongPair(state, selected, id);
      if (!next) {
        setSelected(id);
        return;
      }
      setState(next);
      setSelected(null);
      if (mahjongWon(next)) setPhase("game-over");
      else if (mahjongStuck(next)) setPhase("game-over");
    },
    [phase, removed, freeIds, selected, state]
  );

  const stuck = phase === "playing" && mahjongStuck(state) && !mahjongWon(state);

  const backToSetup = useCallback(() => setPhase("idle"), []);
  usePlaySetupNavigation(phase === "idle", backToSetup);

  if (phase === "idle") {
    return (
      <div className="rounded-2xl border border-white/10 bg-surface-raised p-6 text-center sm:p-8">
        <h2 className="text-xl font-semibold">麻雀ソリティア</h2>
        <p className="mt-2 text-sm text-[#a1a1a6]">
          左右どちらかが開き、上に牌がない牌だけ選べます。同じ種類のペアを取り除いて盤面を空にします。
        </p>
        <button type="button" onClick={startGame} className="btn-game mt-8">
          ゲーム開始
        </button>
      </div>
    );
  }

  const isGameOver = phase === "game-over";
  const won = isGameOver && mahjongWon(state);

  return (
    <div className="space-y-6">
      <p className="text-center text-sm text-slate-400">
        残り {(state.tiles.length - state.removed.length) / 2} ペア
        {stuck ? " · 行き詰まり" : ""}
      </p>
      <div className="relative mx-auto h-72 w-full max-w-lg">
        {state.tiles.map((tile) => {
          if (removed.has(tile.id)) return null;
          const free = isMahjongTileFree(state, tile);
          const isSel = selected === tile.id;
          return (
            <button
              key={tile.id}
              type="button"
              disabled={!free}
              onClick={() => onTile(tile.id)}
              style={{
                left: `${tile.col * 11 + tile.layer * 2}%`,
                top: `${tile.row * 14 + tile.layer * 4}%`,
                zIndex: tile.layer * 10 + tile.row,
              }}
              className={`absolute flex h-10 w-10 items-center justify-center rounded-md border text-xs font-semibold transition ${
                free
                  ? "border-amber-200/40 bg-amber-50 text-amber-950 hover:ring-2 hover:ring-accent"
                  : "border-surface-border bg-slate-800/80 text-slate-600"
              } ${isSel ? "ring-2 ring-accent" : ""}`}
            >
              {tile.type}
            </button>
          );
        })}
      </div>

      {isGameOver && (
        <ResultPanel
          variant="inline"
          winners={won ? [0] : []}
          onReplay={() => setPhase("idle")}
          details={
            <p className="text-slate-400">
              {won ? "すべての牌を取り除きました。" : "これ以上ペアを取れません。"}
            </p>
          }
        />
      )}
    </div>
  );
}
