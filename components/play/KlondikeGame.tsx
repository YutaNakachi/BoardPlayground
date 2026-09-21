"use client";

import { usePlayPage } from "@/components/play/PlayPageContext";
import { usePlaySetupNavigation } from "@/components/play/usePlaySetupNavigation";
import { useCallback, useMemo, useState } from "react";
import { ResultPanel } from "@/components/play/shared/ResultPanel";
import {
  SUIT_COLOR,
  SUIT_SYMBOL,
  type PlayingCard,
  type Suit,
} from "@/lib/play/cards";
import {
  applyKlondikeMove,
  autoFoundationKlondike,
  drawKlondike,
  initialKlondike,
  klondikeWon,
  type KlondikeSource,
  type KlondikeState,
  type KlondikeTarget,
} from "@/lib/play/klondike";

type Phase = "idle" | "playing" | "game-over";
type Selection = KlondikeSource | null;

const SUITS: Suit[] = ["spade", "heart", "diamond", "club"];

function CardFace({ card, small }: { card: PlayingCard; small?: boolean }) {
  return (
    <span className={`font-semibold ${SUIT_COLOR[card.suit]} ${small ? "text-xs" : "text-sm"}`}>
      {card.rank}
      {SUIT_SYMBOL[card.suit]}
    </span>
  );
}

export function KlondikeGame() {
  const { recordLocalPlay } = usePlayPage();
  const [phase, setPhase] = useState<Phase>("idle");
  const [state, setState] = useState<KlondikeState>(initialKlondike);
  const [selected, setSelected] = useState<Selection>(null);

  const startGame = useCallback(() => {
    recordLocalPlay();
    setState(initialKlondike());
    setSelected(null);
    setPhase("playing");
  }, [recordLocalPlay]);

  const tryMove = useCallback(
    (target: KlondikeTarget) => {
      if (!selected || phase !== "playing") return;
      const next = applyKlondikeMove(state, selected, target);
      if (!next) return;
      const auto = autoFoundationKlondike(next);
      setState(auto);
      setSelected(null);
      if (klondikeWon(auto)) setPhase("game-over");
    },
    [selected, phase, state]
  );

  const onDraw = useCallback(() => {
    if (phase !== "playing") return;
    setState(drawKlondike(state));
    setSelected(null);
  }, [phase, state]);

  const wasteTop = state.waste.length ? state.waste[state.waste.length - 1] : null;

  const highlights = useMemo(() => {
    if (!selected) return new Set<string>();
    const keys = new Set<string>();
    for (const suit of SUITS) {
      if (applyKlondikeMove(state, selected, { kind: "foundation", suit })) {
        keys.add(`f-${suit}`);
      }
    }
    for (let col = 0; col < 7; col++) {
      if (applyKlondikeMove(state, selected, { kind: "tableau", col })) {
        keys.add(`t-${col}`);
      }
    }
    return keys;
  }, [selected, state]);

  const backToSetup = useCallback(() => setPhase("idle"), []);
  usePlaySetupNavigation(phase === "idle", backToSetup);

  if (phase === "idle") {
    return (
      <div className="rounded-2xl border border-white/10 bg-surface-raised p-6 text-center sm:p-8">
        <h2 className="text-xl font-semibold">クロンダイク</h2>
        <p className="mt-2 text-sm text-[#a1a1a6]">
          7列のタブローと4つの組札。山札は1枚ずつめくります。組札をすべて完成させれば勝ち。
        </p>
        <button type="button" onClick={startGame} className="btn-game mt-8">
          ゲーム開始
        </button>
      </div>
    );
  }

  const isGameOver = phase === "game-over";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-center gap-3">
        <button
          type="button"
          onClick={onDraw}
          className="flex h-16 w-12 items-center justify-center rounded-lg border border-surface-border bg-emerald-900/60 text-xs text-slate-300"
        >
          {state.stock.length || state.waste.length ? "山" : "—"}
        </button>
        <button
          type="button"
          onClick={() => wasteTop && setSelected({ kind: "waste" })}
          className={`flex h-16 w-12 items-center justify-center rounded-lg border bg-white ${
            selected?.kind === "waste" ? "ring-2 ring-accent" : "border-surface-border"
          }`}
        >
          {wasteTop ? <CardFace card={wasteTop} /> : null}
        </button>
        <div className="flex gap-2">
          {SUITS.map((suit) => {
            const pile = state.foundations[suit];
            const top = pile.length ? pile[pile.length - 1] : null;
            return (
              <button
                key={suit}
                type="button"
                onClick={() => tryMove({ kind: "foundation", suit })}
                className={`flex h-16 w-12 items-center justify-center rounded-lg border bg-white/5 ${
                  highlights.has(`f-${suit}`) ? "ring-2 ring-lime-300" : "border-surface-border"
                }`}
              >
                {top ? <CardFace card={top} /> : <span className="text-slate-600">{SUIT_SYMBOL[suit]}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto flex max-w-4xl justify-center gap-1.5 overflow-x-auto pb-2">
        {state.tableau.map((col, colIdx) => (
          <div key={colIdx} className="relative min-h-28 w-12 shrink-0">
            {col.length === 0 ? (
              <button
                type="button"
                onClick={() => tryMove({ kind: "tableau", col: colIdx })}
                className={`absolute inset-x-0 top-0 h-16 rounded-lg border border-dashed border-surface-border ${
                  highlights.has(`t-${colIdx}`) ? "ring-2 ring-lime-300" : ""
                }`}
              />
            ) : (
              col.map((cell, rowIdx) => (
                <button
                  key={cell.card.id}
                  type="button"
                  onClick={() => {
                    if (!cell.faceUp) return;
                    if (
                      selected?.kind === "tableau" &&
                      selected.col === colIdx &&
                      selected.from === rowIdx
                    ) {
                      setSelected(null);
                      return;
                    }
                    if (selected) tryMove({ kind: "tableau", col: colIdx });
                    else setSelected({ kind: "tableau", col: colIdx, from: rowIdx });
                  }}
                  style={{ top: rowIdx * 18 }}
                  className={`absolute inset-x-0 flex h-16 items-start justify-center rounded-lg border pt-1 ${
                    cell.faceUp ? "bg-white" : "bg-indigo-900"
                  } ${
                    selected?.kind === "tableau" &&
                    selected.col === colIdx &&
                    selected.from === rowIdx
                      ? "ring-2 ring-accent"
                      : "border-surface-border"
                  } ${highlights.has(`t-${colIdx}`) && rowIdx === col.length - 1 ? "ring-2 ring-lime-300" : ""}`}
                >
                  {cell.faceUp ? <CardFace card={cell.card} small /> : null}
                </button>
              ))
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-slate-500">
        カードをタップして選択し、移動先をタップ。山札をタップで1枚めくり。
      </p>

      {isGameOver && (
        <ResultPanel
          variant="inline"
          winners={[0]}
          onReplay={() => setPhase("idle")}
          details={<p className="text-slate-400">すべての組札を完成させました。</p>}
        />
      )}
    </div>
  );
}
