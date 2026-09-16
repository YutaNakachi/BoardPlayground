import type { ComponentType } from "react";
import { CheckersGame } from "@/components/play/CheckersGame";
import { ChronoSplitGame } from "@/components/play/ChronoSplitGame";
import { GomokuGame } from "@/components/play/GomokuGame";
import { MancalaGame } from "@/components/play/MancalaGame";
import { NebulaLinkGame } from "@/components/play/NebulaLinkGame";
import { NineMensMorrisGame } from "@/components/play/NineMensMorrisGame";
import { ReversiGame } from "@/components/play/ReversiGame";
import { StarTradeGame } from "@/components/play/StarTradeGame";

export const playComponents: Record<string, ComponentType> = {
  "star-trade": StarTradeGame,
  "nebula-link": NebulaLinkGame,
  "chrono-split": ChronoSplitGame,
  reversi: ReversiGame,
  mancala: MancalaGame,
  gomoku: GomokuGame,
  checkers: CheckersGame,
  "nine-mens-morris": NineMensMorrisGame,
};
