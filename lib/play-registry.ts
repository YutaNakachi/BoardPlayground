import type { ComponentType } from "react";
import { BackgammonGame } from "@/components/play/BackgammonGame";
import { CheckersGame } from "@/components/play/CheckersGame";
import { ChessGame } from "@/components/play/ChessGame";
import { ChineseCheckersGame } from "@/components/play/ChineseCheckersGame";
import { ChronoSplitGame } from "@/components/play/ChronoSplitGame";
import { DominoesGame } from "@/components/play/DominoesGame";
import { DotsAndBoxesGame } from "@/components/play/DotsAndBoxesGame";
import { FoxHoundsGame } from "@/components/play/FoxHoundsGame";
import { GomokuGame } from "@/components/play/GomokuGame";
import { GravityFourGame } from "@/components/play/GravityFourGame";
import { HexGame } from "@/components/play/HexGame";
import { KlondikeGame } from "@/components/play/KlondikeGame";
import { LudoGame } from "@/components/play/LudoGame";
import { MahjongSolitaireGame } from "@/components/play/MahjongSolitaireGame";
import { MancalaGame } from "@/components/play/MancalaGame";
import { MiniShogiGame } from "@/components/play/MiniShogiGame";
import { NebulaLinkGame } from "@/components/play/NebulaLinkGame";
import { NineMensMorrisGame } from "@/components/play/NineMensMorrisGame";
import { NimGame } from "@/components/play/NimGame";
import { ReversiGame } from "@/components/play/ReversiGame";
import { SenkaiSenkiGame } from "@/components/play/SenkaiSenkiGame";
import { ShogiGame } from "@/components/play/ShogiGame";
import { SlidePuzzleGame } from "@/components/play/SlidePuzzleGame";
import { SpiderGame } from "@/components/play/SpiderGame";
import { StarTradeGame } from "@/components/play/StarTradeGame";
import { TicTacToeGame } from "@/components/play/TicTacToeGame";

export const playComponents: Record<string, ComponentType> = {
  "star-trade": StarTradeGame,
  "nebula-link": NebulaLinkGame,
  "senkai-senki": SenkaiSenkiGame,
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
  hex: HexGame,
  "fox-hounds": FoxHoundsGame,
  dominoes: DominoesGame,
  "chinese-checkers": ChineseCheckersGame,
  ludo: LudoGame,
  backgammon: BackgammonGame,
  chess: ChessGame,
  shogi: ShogiGame,
  "mini-shogi": MiniShogiGame,
  klondike: KlondikeGame,
  spider: SpiderGame,
  "mahjong-solitaire": MahjongSolitaireGame,
  "slide-puzzle": SlidePuzzleGame,
};
