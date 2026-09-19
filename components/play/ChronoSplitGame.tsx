"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import {
  applyChronoTake,
  CHRONO_SLOTS,
  chronoWinners,
  initialChronoSplit,
  scoreChronoTimeline,
  type Fragment,
} from "@/lib/play/chrono-split";
import { getPlayerTurnStyle } from "@/lib/player-colors";

const ERA_LABEL: Record<Fragment["era"], string> = {
  past: "過去",
  present: "現在",
  future: "未来",
};
const ERA_COLOR: Record<Fragment["era"], string> = {
  past: "text-violet-300",
  present: "text-sky-300",
  future: "text-lime-300",
};

type Phase = "setup" | "playing" | "game-over";

export function ChronoSplitGame() {
  const { recordLocalPlay } = usePlayPage();
  const [playerCount, setPlayerCount] = useState(2);
  const [phase, setPhase] = useState<Phase>("setup");
  const [game, setGame] = useState<ReturnType<typeof initialChronoSplit> | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const startGame = useCallback(() => {
    recordLocalPlay();
    setGame(initialChronoSplit(playerCount));
    setSelectedId(null);
    setPhase("playing");
  }, [recordLocalPlay, playerCount]);

  const takeToSlot = useCallback(
    (slotIndex: number) => {
      if (!game || phase !== "playing" || !selectedId) return;
      const next = applyChronoTake(game, selectedId, slotIndex);
      if (!next) return;
      setGame(next);
      setSelectedId(null);
      if (next.gameOver) setPhase("game-over");
    },
    [phase, game, selectedId]
  );

  const breakdown = useMemo(
    () => (game ? game.timelines.map((line) => scoreChronoTimeline(line)) : []),
    [game]
  );

  const winner = useMemo(() => {
    if (phase !== "game-over" || !game) return null;
    return chronoWinners(game);
  }, [phase, game]);

  if (phase === "setup") {
    return (
      <SetupPanel
        title="クロノ・スプリット"
        description="場のカードを1枚選び、自分のタイムラインの空枠へ置きます。"
        playerCount={playerCount}
        onPlayerCount={setPlayerCount}
        onStart={startGame}
      />
    );
  }

  if (!game) return null;

  const isGameOver = phase === "game-over" && winner !== null;

  return (
    <div className="space-y-6">
      {!isGameOver && (
      <TurnBanner
        playerIndex={game.currentPlayer}
        playerLabel={`プレイヤー ${game.currentPlayer + 1}`}
        stats={`山札 ${game.deck.length} 枚`}
        action={selectedId ? "空枠を選ぶ" : "場のカードを選ぶ"}
      />
      )}

      <section>
        <p className="mb-2 text-xs text-slate-500">場（最大3枚）</p>
        <div className="flex flex-wrap gap-2">
          {game.offer.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => setSelectedId(card.id)}
              className="min-h-11"
            >
              <FragmentView card={card} selected={selectedId === card.id} />
            </button>
          ))}
          {game.offer.length === 0 && (
            <span className="text-sm text-slate-600">（カードなし）</span>
          )}
        </div>
      </section>

      {game.timelines.map((line, playerIndex) => {
        const isCurrent = game.currentPlayer === playerIndex;
        const playerStyle = getPlayerTurnStyle(playerIndex);
        return (
        <section
          key={playerIndex}
          className={`rounded-2xl border p-4 ${
            isCurrent
              ? `${playerStyle.sectionBorder} ${playerStyle.sectionBg} ring-1 ${playerStyle.sectionRing}`
              : "border-surface-border bg-surface-raised"
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className={`font-semibold ${isCurrent ? playerStyle.label : ""}`}>
              プレイヤー {playerIndex + 1}
            </h3>
            <span className="text-sm text-slate-500">
              見込み {scoreChronoTimeline(line).total} 点
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {line.map((card, slot) => {
              const canPlace =
                !isGameOver &&
                game.currentPlayer === playerIndex &&
                selectedId !== null &&
                card === null;
              return (
                <button
                  key={slot}
                  type="button"
                  disabled={!canPlace}
                  onClick={() => takeToSlot(slot)}
                  className="min-h-16 disabled:cursor-default sm:min-h-20"
                >
                  {card ? (
                    <FragmentView card={card} compact />
                  ) : (
                    <div
                      className={`flex h-full min-h-16 items-center justify-center rounded-lg border border-dashed text-xs text-slate-500 sm:min-h-20 ${
                        canPlace
                          ? "border-accent text-accent"
                          : "border-surface-border"
                      }`}
                    >
                      {slot + 1}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>
        );
      })}

      {isGameOver && winner && (
        <ResultPanel
          variant="inline"
          winners={winner}
          onReplay={() => setPhase("setup")}
          details={
            <ul className="space-y-2 text-left text-sm text-slate-400">
              {breakdown.map((b, i) => (
                <li key={i}>
                  プレイヤー {i + 1}: {b.total} 点（本体 {b.base} / 共鳴 {b.adjacent} /
                  時代 {b.eraBonus} / 増加 {b.increaseBonus}）
                </li>
              ))}
            </ul>
          }
        />
      )}
    </div>
  );
}

function FragmentView({
  card,
  selected,
  compact,
}: {
  card: Fragment;
  selected?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex h-16 w-14 flex-col items-center justify-center rounded-lg border bg-surface text-sm shadow-sm sm:h-20 sm:w-16 ${
        selected ? "border-accent ring-2 ring-accent/40" : "border-surface-border"
      } ${compact ? "h-full w-full" : ""}`}
    >
      <span className={`text-xs font-medium ${ERA_COLOR[card.era]}`}>
        {ERA_LABEL[card.era]}
      </span>
      <span className="text-lg font-bold">{card.value}</span>
    </div>
  );
}
