"use client";

import { KingAndSpyPlayingCard } from "@/components/play/king-and-spy/KingAndSpyPlayingCard";
import type { DuelFieldState } from "@/components/play/king-and-spy/useKingAndSpyDuelField";
import { CARD_KIND_LABEL } from "@/lib/play/king-and-spy/labels";
import type {
  KingAndSpyPublicState,
  KingAndSpyRoundRecord,
} from "@/lib/play/king-and-spy/types";

type Props = {
  field: DuelFieldState;
  labels: [string, string];
  mySeat: 0 | 1;
  lastReveal: KingAndSpyPublicState["lastReveal"];
  roundHistory: KingAndSpyRoundRecord[];
};

export function KingAndSpyDuelField({
  field,
  labels,
  mySeat,
  lastReveal,
  roundHistory,
}: Props) {
  const bothOpen = field[0].revealed && field[1].revealed;
  const c0 = field[0].card;
  const c1 = field[1].card;

  let openResult: import("react").ReactNode = null;
  if (bothOpen && c0 && c1) {
    if (c0.kind === "citizen" && c1.kind === "citizen") {
      openResult = (
        <p className="mt-2 text-center text-sm text-slate-300">
          市民同士の引き分け。このラウンドを続けます
        </p>
      );
    } else {
      const fromReveal =
        lastReveal &&
        lastReveal.cards[0].id === c0.id &&
        lastReveal.cards[1].id === c1.id
          ? lastReveal
          : null;
      const fromHistory = roundHistory.at(-1);
      const recipientSeat = fromReveal?.recipientSeat ?? fromHistory?.winnerSeat;
      const points = fromReveal?.pointsAwarded ?? fromHistory?.pointsAwarded;

      if (recipientSeat !== undefined && points !== undefined) {
        openResult = (
          <p className="mt-2 text-center text-sm font-medium text-white">
            <span className="text-slate-300">
              {CARD_KIND_LABEL[c0.kind]} 対 {CARD_KIND_LABEL[c1.kind]}
            </span>
            <span className="mx-2 text-slate-600">→</span>
            <span className="text-indigo-200">
              {labels[recipientSeat]} +{points}
            </span>
          </p>
        );
      }
    }
  }

  return (
    <div className="rounded-2xl border border-indigo-500/25 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-3 shadow-inner shadow-black/40 sm:p-4">
      <p className="text-center text-xs font-medium tracking-wide text-indigo-300/80">
        対決エリア
      </p>
      <div className="mt-2 flex items-end justify-center gap-4 sm:mt-4 sm:gap-10">
        {([0, 1] as const).map((seat) => {
          const slot = field[seat];
          const show = slot.faceDownOnField || slot.revealed;
          return (
            <div key={seat} className="flex flex-col items-center gap-1 sm:gap-2">
              <span
                className={`text-xs ${seat === mySeat ? "text-indigo-300" : "text-slate-500"}`}
              >
                {labels[seat]}
              </span>
              <div className="flex h-[8rem] w-[5.6rem] items-center justify-center sm:h-[9.5rem] sm:w-[6.75rem]">
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
                    className="h-[8rem] w-[5.6rem] rounded-xl border border-dashed border-slate-700/60 bg-slate-900/30 sm:h-[9.5rem] sm:w-[6.75rem]"
                    aria-hidden
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
      {openResult}
    </div>
  );
}
