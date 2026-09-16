import type { ComponentType } from "react";
import { ChronoSplitGame } from "@/components/play/ChronoSplitGame";
import { NebulaLinkGame } from "@/components/play/NebulaLinkGame";
import { StarTradeGame } from "@/components/play/StarTradeGame";

export const playComponents: Record<string, ComponentType> = {
  "star-trade": StarTradeGame,
  "nebula-link": NebulaLinkGame,
  "chrono-split": ChronoSplitGame,
};
