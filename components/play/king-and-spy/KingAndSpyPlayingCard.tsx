"use client";

import Image from "next/image";
import type { CardKind, KingAndSpyCard } from "@/lib/play/king-and-spy/types";
import {
  KING_AND_SPY_CARD_BACK,
  kingAndSpyCardFaceSrc,
} from "@/lib/play/king-and-spy/card-art";

type Props = {
  card?: KingAndSpyCard | null;
  faceDown?: boolean;
  flipped?: boolean;
  size?: "hand" | "field" | "discard";
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
};

const SIZE_CLASS = {
  hand: "h-[7.5rem] w-[5.25rem]",
  field: "h-[9.5rem] w-[6.75rem]",
  discard: "h-[4.5rem] w-[3.15rem]",
} as const;

export function KingAndSpyPlayingCard({
  card,
  faceDown = false,
  flipped = true,
  size = "hand",
  onClick,
  selected,
  disabled,
  ariaLabel,
}: Props) {
  const showFace = Boolean(flipped && !faceDown && card);
  const faceSrc = card ? kingAndSpyCardFaceSrc(card.kind) : kingAndSpyCardFaceSrc("citizen");
  const kindLabel =
    card?.kind === "king" ? "首領" : card?.kind === "spy" ? "刺客" : "市民";

  const inner = (
    <div
      className={`relative ${SIZE_CLASS[size]} [perspective:1000px]`}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div
        className={`relative h-full w-full transition-transform duration-700 ease-in-out ${
          showFace ? "[transform:rotateY(180deg)]" : ""
        }`}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          className="absolute inset-0 overflow-hidden rounded-xl border-2 border-indigo-500/40 shadow-lg shadow-black/50"
          style={{ backfaceVisibility: "hidden" }}
        >
          <Image
            src={KING_AND_SPY_CARD_BACK}
            alt=""
            fill
            className="object-cover"
            sizes="120px"
            priority={size === "field"}
          />
        </div>
        <div
          className="absolute inset-0 overflow-hidden rounded-xl border-2 border-amber-500/30 shadow-lg shadow-black/50"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <Image
            src={faceSrc}
            alt={kindLabel}
            fill
            className="object-cover"
            sizes="120px"
          />
        </div>
      </div>
    </div>
  );

  if (onClick && !disabled) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel ?? `${kindLabel}のカード`}
        className={`rounded-xl transition-transform hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
          selected ? "ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950" : ""
        }`}
      >
        {inner}
      </button>
    );
  }

  return (
    <div
      className={selected ? "rounded-xl ring-2 ring-indigo-400" : undefined}
      aria-label={ariaLabel}
    >
      {inner}
    </div>
  );
}

export function KingAndSpyCardBackPlaceholder({ size = "field" }: { size?: "field" }) {
  return (
    <KingAndSpyPlayingCard faceDown flipped={false} size={size} ariaLabel="裏向きのカード" />
  );
}
