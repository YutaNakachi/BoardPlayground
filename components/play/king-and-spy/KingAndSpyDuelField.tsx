"use client";

import { KingAndSpyPlayingCard } from "@/components/play/king-and-spy/KingAndSpyPlayingCard";
import type { DuelFieldState } from "@/components/play/king-and-spy/useKingAndSpyDuelField";

type Props = {
  field: DuelFieldState;
  labels: [string, string];
  mySeat: 0 | 1;
};

export function KingAndSpyDuelField({ field, labels, mySeat }: Props) {
  const hasCards = field[0].faceDownOnField || field[1].faceDownOnField || field[0].revealed || field[1].revealed;

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
      {!hasCards && (
        <p className="mt-3 text-center text-xs text-slate-500">
          確定したカードがここに裏向きで置かれ、揃ったら同時に公開されます
        </p>
      )}
    </div>
  );
}
