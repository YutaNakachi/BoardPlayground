"use client";

import type { CreatureType } from "@/lib/play/dejarik/board";

export const DEJARIK_TOKEN_SRC: Record<CreatureType, string> = {
  brute: "/games/dejarik/dejarik-brute-token.png",
  predator: "/games/dejarik/dejarik-predator-token.png",
  guardian: "/games/dejarik/dejarik-guardian-token.png",
  scout: "/games/dejarik/dejarik-scout-token.png",
};

type Props = {
  type: CreatureType;
  /** 盤面に対する回転（中心向き） */
  faceDeg: number;
  /** 絵の下の円形土台 */
  baseColor: string;
};

/** 生成済みトークン画像＋プレイヤー色の円形土台 */
export function DejarikCreatureToken({ type, faceDeg, baseColor }: Props) {
  const src = DEJARIK_TOKEN_SRC[type];
  return (
    <div
      className="relative h-full w-full"
      style={{ transform: `rotate(${faceDeg}deg)` }}
    >
      <div
        className="absolute bottom-[6%] left-1/2 aspect-square -translate-x-1/2 rounded-full"
        style={{
          width: "58%",
          backgroundColor: baseColor,
          boxShadow:
            "inset 0 2px 4px rgb(255 255 255 / 0.22), inset 0 -2px 4px rgb(0 0 0 / 0.35), 0 1px 3px rgb(0 0 0 / 0.45)",
        }}
      />
      <img
        src={src}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-x-0 bottom-[14%] top-0 z-[1] h-auto w-full max-h-[96%] object-contain object-bottom"
        style={{
          filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.45))",
        }}
      />
    </div>
  );
}
