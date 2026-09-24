import type { GameOrigin } from "@/lib/games";

export const ORIGIN_CHIP_CLASS: Record<GameOrigin, string> = {
  original:
    "bg-accent/25 text-pink-200 ring-1 ring-accent/40",
  classic:
    "bg-teal-900/50 text-teal-200 ring-1 ring-teal-500/35",
  tribute:
    "bg-violet-900/45 text-violet-200 ring-1 ring-violet-500/35",
  fiction:
    "bg-fuchsia-900/40 text-fuchsia-200 ring-1 ring-fuchsia-500/35",
};
