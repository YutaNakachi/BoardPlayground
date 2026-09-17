import type { GameOrigin } from "@/lib/games";

export const ORIGIN_CHIP_CLASS: Record<GameOrigin, string> = {
  original:
    "bg-accent/25 text-pink-200 ring-1 ring-accent/40",
  classic:
    "bg-teal-900/50 text-teal-200 ring-1 ring-teal-500/35",
};
