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
};

/** 生成済みトークン画像をそのまま表示（プレイヤー色の塗りつぶしはしない） */
export function DejarikCreatureToken({ type, faceDeg }: Props) {
  const src = DEJARIK_TOKEN_SRC[type];
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      className="pointer-events-none h-full w-full object-contain"
      style={{
        transform: `rotate(${faceDeg}deg)`,
        filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.45))",
      }}
    />
  );
}
