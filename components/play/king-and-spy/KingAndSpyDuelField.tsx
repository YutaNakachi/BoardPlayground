"use client";

import { KingAndSpyPlayingCard } from "@/components/play/king-and-spy/KingAndSpyPlayingCard";
import type { DuelFieldState } from "@/components/play/king-and-spy/useKingAndSpyDuelField";
import { CARD_KIND_LABEL, winningSideLabel } from "@/lib/play/king-and-spy/labels";
import type { KingAndSpyPublicState } from "@/lib/play/king-and-spy/types";

type Props = {
  field: DuelFieldState;
  labels: [string, string];
  mySeat: 0 | 1;
  lastReveal: KingAndSpyPublicState["lastReveal"];
};

export function KingAndSpyDuelField({
  field,
  labels,
  mySeat,
  lastReveal,
}: Props) {
  const hasCards = field[0].faceDownOnField || field[1].faceDownOnField || field[0].revealed || field[1].revealed;
  const bothOpen = field[0].revealed && field[1].revealed;
  const c0 = field[0].card;
  const c1 = field[1].card;

  let openResult: import("react").ReactNode = null;
  if (bothOpen && c0 && c1) {
    if (
      lastReveal &&
      lastReveal.cards[0].id === c0.id &&
      lastReveal.cards[1].id === c1.id
    ) {
      openResult = (
        <p className="mt-4 text-center text-sm font-medium text-white">
          <span className="text-slate-300">
            {CARD_KIND_LABEL[c0.kind]} vs {CARD_KIND_LABEL[c1.kind]}
          </span>
          <span className="mx-2 text-slate-600">→</span>
          <span className="text-indigo-200">
            {labels[lastReveal.recipientSeat]} +{lastReveal.pointsAwarded}
          </span>
          <span className="mt-1 block text-xs font-normal text-slate-400">
            {winningSideLabel(lastReveal.winningSide)}の決着
          </span>
        </p>
      );
    } else if (c0.kind === "citizen" && c1.kind === "citizen") {
      openResult = (
        <p className="mt-4 text-center text-sm text-slate-300">
          市民同士 — 引き分け（加点なし・同じラウンドで続行）
        </p>
      );
    }
  }

  return (
    <div className="rounded-2xl border border-indigo-500/25 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-4 shadow-inner shadow-black/40">
      <p className="text-center text-xs font-medium tracking-wide text-indigo-300/80">
        対決エリア
      </p>
      <div className="mt-4 flex items-end justify-center gap-6 sm:gap-10">
        {([0, 1] as const).map((seat) => {
          const slot = field[seat];
          const show = slot.faceDownOnField || slot.revealed;
          return (
            <div key={seat} className="flex flex-col items-center gap-2">
              <span
                className={`text-xs ${seat === mySeat ? "text-indigo-300" : "text-slate-500"}`}
              >
                {labels[seat]}
              </span>
              <div className="flex h-[9.5rem] w-[6.75rem] items-center justify-center">
                {show ? (
                  <KingAndSpyPlayingCard
                    card={slot.card}
                    faceDown={slot.faceDownOnField && !slot.revealed}
                    flipped={slot.revealed}
                    size="field"
                    ariaLabel={
                      slot.revealed && slot.card
                        ? `${labels[seat]}の公開カード`
                        : `${labels[seat]}の裏向きカード`
                    }
                  />
                ) : (
                  <div
                    className="h-[9.5rem] w-[6.75rem] rounded-xl border border-dashed border-slate-700/60 bg-slate-900/30"
                    aria-hidden
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
      {openResult}
      {!hasCards && (
        <p className="mt-3 text-center text-xs text-slate-500">
          確定したカードがここに裏向きで置かれ、揃ったら同時に公開されます
        </p>
      )}
    </div>
  );
}
