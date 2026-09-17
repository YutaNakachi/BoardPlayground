import type { GameOrigin } from "@/lib/games";

export const ORIGIN_CHIP_CLASS: Record<GameOrigin, string> = {
  original:
    "bg-accent/15 text-accent ring-1 ring-accent/30",
  classic:
    "bg-teal-500/15 text-teal-300 ring-1 ring-teal-500/30",
};
