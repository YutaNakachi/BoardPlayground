"use client";

import type { CreatureType } from "@/lib/play/dejarik/board";

export const DEJARIK_TOKEN_SRC: Record<CreatureType, string> = {
  brute: "/games/dejarik/dejarik-brute-token.png",
  predator: "/games/dejarik/dejarik-predator-token.png",
  guardian: "/games/dejarik/dejarik-guardian-token.png",
  scout: "/games/dejarik/dejarik-scout-token.png",
};

/** プレイヤー色を盤上の土台向けにくすんだトーンへ */
export function mutedTokenBaseColor(fill: string): string {
  return `color-mix(in srgb, ${fill} 42%, #2c2826 58%)`;
}

type Props = {
  type: CreatureType;
  /** 盤面に対する回転（中心向き） */
  faceDeg: number;
  /** 円形土台（絵と同心） */
  baseColor: string;
};

/** 円形土台の中心にクリーチャー絵を重ねる */
export function DejarikCreatureToken({ type, faceDeg, baseColor }: Props) {
  const src = DEJARIK_TOKEN_SRC[type];
  const pedestal = mutedTokenBaseColor(baseColor);

  return (
    <div
      className="relative h-full w-full"
      style={{ transform: `rotate(${faceDeg}deg)` }}
    >
      <div
        className="absolute left-1/2 top-1/2 z-0 aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: "54%",
          backgroundColor: pedestal,
          boxShadow:
            "inset 0 2px 5px rgb(255 255 255 / 0.12), inset 0 -3px 6px rgb(0 0 0 / 0.4), 0 1px 4px rgb(0 0 0 / 0.5)",
        }}
      />
      <img
        src={src}
        alt=""
        draggable={false}
        className="pointer-events-none absolute left-1/2 top-1/2 z-[1] h-[132%] w-[132%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
        style={{
          filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.45))",
        }}
      />
    </div>
  );
}
