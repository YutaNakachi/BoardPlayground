"use client";

import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import { SetupPanel } from "@/components/play/shared/SetupPanel";
import { TurnBanner } from "@/components/play/shared/TurnBanner";
import { shuffle, winnerIndices } from "@/lib/game-engine";

type Era = "past" | "present" | "future";

type Fragment = {
  id: string;
  era: Era;
  value: number;
};

type Phase = "setup" | "playing" | "game-over";

const ERAS: Era[] = ["past", "present", "future"];
const ERA_LABEL: Record<Era, string> = {
  past: "過去",
  present: "現在",
  future: "未来",
};
const ERA_COLOR: Record<Era, string> = {
  past: "text-violet-300",
  present: "text-sky-300",
  future: "text-lime-300",
};

const SLOTS = 5;

function createDeck(): Fragment[] {
  const deck: Fragment[] = [];
  let n = 0;
  for (const era of ERAS) {
    for (let value = 1; value <= 4; value++) {
      for (let copy = 0; copy < 2; copy++) {
        deck.push({ id: `${era}-${value}-${copy}-${n++}`, era, value });
      }
    }
  }
  return shuffle(deck);
}

function scoreTimeline(line: (Fragment | null)[]) {
  const cards = line.filter((c): c is Fragment => c !== null);
  const base = cards.reduce((s, c) => s + c.value, 0);
  let adjacent = 0;
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i];
    const b = line[i + 1];
    if (a && b && a.era === b.era) adjacent += 2;
  }
  const eras = new Set(cards.map((c) => c.era)).size;
  const eraBonus = eras === 3 ? 3 : 0;
  let increasing = cards.length === SLOTS;
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i];
    const b = line[i + 1];
    if (!a || !b || a.value >= b.value) increasing = false;
  }
  const increaseBonus = increasing ? 7 : 0;
  return {
    total: base + adjacent + eraBonus + increaseBonus,
    base,
    adjacent,
    eraBonus,
    increaseBonus,
  };
}

export function ChronoSplitGame() {
  const [playerCount, setPlayerCount] = useState(2);
  const [phase, setPhase] = useState<Phase>("setup");
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [deck, setDeck] = useState<Fragment[]>([]);
  const [offer, setOffer] = useState<Fragment[]>([]);
  const [timelines, setTimelines] = useState<(Fragment | null)[][]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const startGame = useCallback(() => {
    const d = createDeck();
    const startOffer = [d.pop()!, d.pop()!, d.pop()!];
    setDeck(d);
    setOffer(startOffer);
    setTimelines(
      Array.from({ length: playerCount }, () => Array(SLOTS).fill(null))
    );
    setCurrentPlayer(0);
    setSelectedId(null);
    setPhase("playing");
  }, [playerCount]);

  const takeToSlot = useCallback(
    (slotIndex: number) => {
      if (phase !== "playing" || !selectedId) return;
      const line = timelines[currentPlayer];
      if (line[slotIndex] !== null) return;
      const card = offer.find((c) => c.id === selectedId);
      if (!card) return;

      const nextOffer = offer.filter((c) => c.id !== selectedId);
      const nextDeck = [...deck];
      if (nextDeck.length > 0 && nextOffer.length < 3) {
        nextOffer.push(nextDeck.pop()!);
      }

      const nextLines = timelines.map((row, i) =>
        i === currentPlayer ? row.map((c, s) => (s === slotIndex ? card : c)) : row
      );
      setTimelines(nextLines);
      setOffer(nextOffer);
      setDeck(nextDeck);
      setSelectedId(null);

      if (nextLines.every((row) => row.every((c) => c !== null))) {
        setPhase("game-over");
        return;
      }

      setCurrentPlayer((currentPlayer + 1) % playerCount);
    },
    [phase, selectedId, timelines, currentPlayer, offer, deck, playerCount]
  );

  const breakdown = useMemo(
    () => timelines.map((line) => scoreTimeline(line)),
    [timelines]
  );

  const winner = useMemo(() => {
    if (phase !== "game-over") return null;
    return winnerIndices(breakdown.map((b) => b.total));
  }, [phase, breakdown]);

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

  if (phase === "game-over" && winner) {
    return (
      <ResultPanel
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
    );
  }

  return (
    <div className="space-y-6">
      <TurnBanner
        left={`山札 ${deck.length} 枚`}
        right={`プレイヤー ${currentPlayer + 1} · ${
          selectedId ? "空枠を選ぶ" : "場のカードを選ぶ"
        }`}
      />

      <section>
        <p className="mb-2 text-xs text-slate-500">場（最大3枚）</p>
        <div className="flex flex-wrap gap-2">
          {offer.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => setSelectedId(card.id)}
              className="min-h-11"
            >
              <FragmentView card={card} selected={selectedId === card.id} />
            </button>
          ))}
          {offer.length === 0 && (
            <span className="text-sm text-slate-600">（カードなし）</span>
          )}
        </div>
      </section>

      {timelines.map((line, playerIndex) => (
        <section
          key={playerIndex}
          className={`rounded-2xl border p-4 ${
            currentPlayer === playerIndex
              ? "border-accent/60 bg-accent/5 ring-1 ring-accent/30"
              : "border-surface-border bg-surface-raised"
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">プレイヤー {playerIndex + 1}</h3>
            <span className="text-sm text-slate-500">
              見込み {scoreTimeline(line).total} 点
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {line.map((card, slot) => {
              const canPlace =
                currentPlayer === playerIndex && selectedId !== null && card === null;
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
      ))}

      <p className="text-center text-xs text-slate-500">
        手順: 場のカードを選ぶ → 自分の空枠をタップ
      </p>
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
