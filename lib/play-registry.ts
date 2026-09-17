import type { ComponentType } from "react";
import { CheckersGame } from "@/components/play/CheckersGame";
import { ChronoSplitGame } from "@/components/play/ChronoSplitGame";
import { DotsAndBoxesGame } from "@/components/play/DotsAndBoxesGame";
import { GomokuGame } from "@/components/play/GomokuGame";
import { GravityFourGame } from "@/components/play/GravityFourGame";
import { MancalaGame } from "@/components/play/MancalaGame";
import { NebulaLinkGame } from "@/components/play/NebulaLinkGame";
import { NineMensMorrisGame } from "@/components/play/NineMensMorrisGame";
import { NimGame } from "@/components/play/NimGame";
import { ReversiGame } from "@/components/play/ReversiGame";
import { StarTradeGame } from "@/components/play/StarTradeGame";
import { TicTacToeGame } from "@/components/play/TicTacToeGame";

export const playComponents: Record<string, ComponentType> = {
  "star-trade": StarTradeGame,
  "nebula-link": NebulaLinkGame,
  "chrono-split": ChronoSplitGame,
  reversi: ReversiGame,
  mancala: MancalaGame,
  gomoku: GomokuGame,
  checkers: CheckersGame,
  "nine-mens-morris": NineMensMorrisGame,
  "tic-tac-toe": TicTacToeGame,
  "gravity-four": GravityFourGame,
  "dots-and-boxes": DotsAndBoxesGame,
  nim: NimGame,
};
