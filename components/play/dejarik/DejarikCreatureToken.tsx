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
  fill: string;
  /** 盤面に対する回転（中心向き） */
  faceDeg: number;
};

/** 砲塔戦棋と同様、透過PNGをマスクしてプレイヤー色のクリーチャーにする（HTMLレイヤー） */
export function DejarikCreatureToken({ type, fill, faceDeg }: Props) {
  const src = DEJARIK_TOKEN_SRC[type];
  const maskStyle = {
    backgroundColor: fill,
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
  } as const;

  return (
    <div
      className="h-full w-full"
      style={{
        transform: `rotate(${faceDeg}deg)`,
        filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.45))",
      }}
    >
      <div className="h-full w-full" style={maskStyle} />
    </div>
  );
}
