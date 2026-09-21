import { getPlayerFill } from "@/lib/player-colors";
import type { Player } from "@/lib/play/mini-shogi";
import { Shippori_Mincho } from "next/font/google";

type Props = {
  label: string;
  player: Player;
  promoted?: boolean;
  size?: "board" | "hand";
  className?: string;
};

const shogiKomaFont = Shippori_Mincho({
  weight: ["700", "800"],
  subsets: ["latin"],
  display: "swap",
});

/** 塗りつぶし表示になる字形（先手・後手共通） */
const KOMA_GLYPH = "☗";

export function ShogiPieceTile({
  label,
  player,
  size = "board",
  className = "",
}: Props) {
  const isHand = size === "hand";
  const pieceColor = getPlayerFill(player);
  const symbolSize = isHand ? "text-[2rem]" : "text-[2.85rem] sm:text-[3.35rem]";
  const charCount = label.length;
  const labelSize =
    charCount >= 2
      ? isHand
        ? "text-[10px] leading-[1.15]"
        : "text-[11px] leading-[1.2] sm:text-xs"
      : isHand
        ? "text-xs leading-none"
        : "text-base leading-none sm:text-lg";

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${
        isHand ? "h-11 w-8" : "h-[3.25rem] w-11 sm:h-[3.75rem] sm:w-12"
      } ${player === 1 ? "rotate-180" : ""} ${className}`}
    >
      <span
        className={`pointer-events-none absolute inset-0 flex items-center justify-center select-none leading-none ${symbolSize}`}
        style={{ color: pieceColor }}
        aria-hidden
      >
        <span className="translate-y-[6%]">{KOMA_GLYPH}</span>
      </span>
      <span
        className={`pointer-events-none absolute left-1/2 top-[57%] z-10 -translate-x-1/2 -translate-y-1/2 font-extrabold text-slate-900 ${labelSize} [text-orientation:upright] [writing-mode:vertical-rl] ${shogiKomaFont.className}`}
      >
        {label}
      </span>
    </span>
  );
}
