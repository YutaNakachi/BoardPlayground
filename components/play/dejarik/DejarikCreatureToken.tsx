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
  size: number;
};

/** 砲塔戦棋と同様、透過PNGをマスクしてプレイヤー色のクリーチャーにする */
export function DejarikCreatureToken({ type, fill, size }: Props) {
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
    width: "100%",
    height: "100%",
    filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.5))",
  } as const;

  return (
    <foreignObject
      x={-size / 2}
      y={-size / 2}
      width={size}
      height={size}
      className="pointer-events-none overflow-visible"
    >
      <div
        // @ts-expect-error xmlns for SVG foreignObject HTML
        xmlns="http://www.w3.org/1999/xhtml"
        style={{ width: size, height: size }}
      >
        <div style={maskStyle} />
      </div>
    </foreignObject>
  );
}
