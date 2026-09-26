import {
  applyCheckersMove,
  checkersMoves,
  checkersPieceCount,
  initialCheckersBoard,
  type Board as CheckersBoard,
  type CheckersMove,
  type Player,
} from "@/lib/play/checkers";
import {
  dropGravityFour,
  emptyGravityFourBoard,
  gravityFourBoardFull,
  gravityFourWinner,
  type Board as GravityFourBoard,
} from "@/lib/play/gravity-four";
import {
  emptyGomokuBoard,
  gomokuBoardFull,
  gomokuWinner,
  type Board as GomokuBoard,
} from "@/lib/play/gomoku";
import {
  emptyHexBoard,
  hexWinner,
  type Board as HexBoard,
} from "@/lib/play/hex";
import {
  initialMancala,
  sowMancala,
  type Player as MancalaPlayer,
} from "@/lib/play/mancala";
import { initialNim, nimOver, takeNim } from "@/lib/play/nim";
import {
  initialReversiBoard,
  playReversiMove,
  reversiCounts,
  reversiLegalMoves,
  reversiNextPlayer,
  type Board as ReversiBoard,
} from "@/lib/play/reversi";
import {
  applyTttPlace,
  emptyTttBoard,
  emptyTttHistories,
  tttBoardFull,
  tttWinner,
  type Board as TttBoard,
  type TttHistories,
  type TttMode,
} from "@/lib/play/tic-tac-toe";
import { parseFirstPlayer, parseTicTacToeGameOptions } from "./game-options";
import type { OnlineGameSlug } from "./types";

export type ReversiState = {
  board: ReversiBoard;
  current: Player;
  passNotice: string | null;
  phase: "playing" | "game-over";
  counts?: [number, number];
};

export type TttState = {
  board: TttBoard;
  current: Player;
  phase: "playing" | "game-over";
  winner: Player | "draw" | null;
  mode: TttMode;
  histories: TttHistories;
};

export type GomokuState = {
  board: GomokuBoard;
  current: Player;
  phase: "playing" | "game-over";
  winner: Player | "draw" | null;
};

export type CheckersState = {
  board: CheckersBoard;
  current: Player;
  lockFrom: number | null;
  phase: "playing" | "game-over";
  winner: Player | null;
  notice: string | null;
};

export type GravityFourState = {
  board: GravityFourBoard;
  current: Player;
  phase: "playing" | "game-over";
  winner: Player | "draw" | null;
};

export type NimState = {
  heaps: number[];
  current: Player;
  phase: "playing" | "game-over";
  winner: Player | null;
};

export type HexState = {
  board: HexBoard;
  current: Player;
  phase: "playing" | "game-over";
  winner: Player | null;
};

export type MancalaLastMove = {
  seat: number;
  pit: number;
};

export type MancalaState = {
  pits: number[];
  current: Player;
  notice: string | null;
  phase: "playing" | "game-over";
  winner: Player | "draw" | null;
  lastMove: MancalaLastMove | null;
};

export type GameState =
  | ReversiState
  | TttState
  | GomokuState
  | CheckersState
  | GravityFourState
  | NimState
  | HexState
  | MancalaState;

export type MovePayload =
  | { type: "place"; index: number }
  | { type: "drop"; col: number }
  | { type: "nim"; heapIndex: number; count: number }
  | { type: "checkers"; move: CheckersMove }
  | { type: "mancala"; pit: number };

function mancalaWinner(pits: number[]): Player | "draw" {
  const p0 = pits[6];
  const p1 = pits[13];
  if (p0 > p1) return 0;
  if (p1 > p0) return 1;
  return "draw";
}

export function createInitialState(
  slug: OnlineGameSlug,
  gameOptions?: unknown
): GameState {
  const firstPlayer = parseFirstPlayer(gameOptions);

  switch (slug) {
    case "reversi":
      return {
        board: initialReversiBoard(),
        current: firstPlayer,
        passNotice: null,
        phase: "playing",
      };
    case "tic-tac-toe": {
      const { mode } = parseTicTacToeGameOptions(gameOptions);
      return {
        board: emptyTttBoard(),
        current: firstPlayer,
        phase: "playing",
        winner: null,
        mode,
        histories: emptyTttHistories(),
      };
    }
    case "gomoku":
      return {
        board: emptyGomokuBoard(),
        current: firstPlayer,
        phase: "playing",
        winner: null,
      };
    case "checkers":
      return {
        board: initialCheckersBoard(),
        current: firstPlayer,
        lockFrom: null,
        phase: "playing",
        winner: null,
        notice: null,
      };
    case "gravity-four":
      return {
        board: emptyGravityFourBoard(),
        current: firstPlayer,
        phase: "playing",
        winner: null,
      };
    case "nim":
      return {
        heaps: initialNim(),
        current: firstPlayer,
        phase: "playing",
        winner: null,
      };
    case "hex":
      return {
        board: emptyHexBoard(),
        current: firstPlayer,
        phase: "playing",
        winner: null,
      };
    case "mancala":
      return {
        pits: initialMancala(),
        current: firstPlayer,
        notice: null,
        phase: "playing",
        winner: null,
        lastMove: null,
      };
  }
}

function checkersGameOver(board: CheckersBoard, nextPlayer: Player): Player | null {
  if (
    checkersPieceCount(board, nextPlayer) === 0 ||
    checkersMoves(board, nextPlayer).length === 0
  ) {
    return nextPlayer === 0 ? 1 : 0;
  }
  return null;
}

export function applyMove(
  slug: OnlineGameSlug,
  state: GameState,
  seatIndex: number,
  move: MovePayload
): { state: GameState; currentPlayer: number | null } | { error: string } {
  if (state.phase === "game-over") {
    return { error: "Game is over" };
  }

  if (state.current !== seatIndex) {
    return { error: "Not your turn" };
  }

  switch (slug) {
    case "reversi": {
      const s = state as ReversiState;
      if (move.type !== "place") return { error: "Invalid move type" };
      const nextBoard = playReversiMove(s.board, move.index, s.current);
      if (!nextBoard) return { error: "Illegal move" };
      const nextPlayer = reversiNextPlayer(nextBoard, s.current);
      if (nextPlayer === null) {
        const counts = reversiCounts(nextBoard);
        return {
          state: {
            board: nextBoard,
            current: s.current,
            passNotice: null,
            phase: "game-over",
            counts,
          },
          currentPlayer: null,
        };
      }
      const passNotice =
        nextPlayer === s.current
          ? `プレイヤー${s.current === 0 ? 2 : 1}は置ける場所がないためパス`
          : null;
      return {
        state: {
          board: nextBoard,
          current: nextPlayer,
          passNotice,
          phase: "playing",
        },
        currentPlayer: nextPlayer,
      };
    }

    case "tic-tac-toe": {
      const s = state as TttState;
      const mode = s.mode ?? "classic";
      const histories = s.histories ?? emptyTttHistories();
      if (move.type !== "place") return { error: "Invalid move type" };
      const placed = applyTttPlace(s.board, histories, move.index, s.current, mode);
      if (!placed) return { error: "Illegal move" };
      const { board: next, histories: nextHistories } = placed;
      const won = tttWinner(next);
      if (won !== null) {
        return {
          state: {
            board: next,
            current: s.current,
            phase: "game-over",
            winner: won,
            mode,
            histories: nextHistories,
          },
          currentPlayer: null,
        };
      }
      if (mode === "classic" && tttBoardFull(next)) {
        return {
          state: {
            board: next,
            current: s.current,
            phase: "game-over",
            winner: "draw",
            mode,
            histories: nextHistories,
          },
          currentPlayer: null,
        };
      }
      const nextPlayer: Player = s.current === 0 ? 1 : 0;
      return {
        state: {
          board: next,
          current: nextPlayer,
          phase: "playing",
          winner: null,
          mode,
          histories: nextHistories,
        },
        currentPlayer: nextPlayer,
      };
    }

    case "gomoku": {
      const s = state as GomokuState;
      if (move.type !== "place") return { error: "Invalid move type" };
      if (s.board[move.index] !== null) return { error: "Cell occupied" };
      const next = s.board.map((cell, i) =>
        i === move.index ? s.current : cell
      );
      const won = gomokuWinner(next);
      if (won !== null) {
        return {
          state: { board: next, current: s.current, phase: "game-over", winner: won },
          currentPlayer: null,
        };
      }
      if (gomokuBoardFull(next)) {
        return {
          state: { board: next, current: s.current, phase: "game-over", winner: "draw" },
          currentPlayer: null,
        };
      }
      const nextPlayer: Player = s.current === 0 ? 1 : 0;
      return {
        state: { board: next, current: nextPlayer, phase: "playing", winner: null },
        currentPlayer: nextPlayer,
      };
    }

    case "checkers": {
      const s = state as CheckersState;
      if (move.type !== "checkers") return { error: "Invalid move type" };
      const legal = checkersMoves(s.board, s.current, s.lockFrom);
      const valid = legal.some(
        (m) =>
          m.from === move.move.from &&
          m.to === move.move.to &&
          m.capture === move.move.capture
      );
      if (!valid) return { error: "Illegal move" };
      const { board: nextBoard, continueFrom } = applyCheckersMove(
        s.board,
        move.move
      );
      if (continueFrom != null) {
        return {
          state: {
            board: nextBoard,
            current: s.current,
            lockFrom: continueFrom,
            phase: "playing",
            winner: null,
            notice: "同じ駒でジャンプを続けてください",
          },
          currentPlayer: s.current,
        };
      }
      const nextPlayer: Player = s.current === 0 ? 1 : 0;
      const winner = checkersGameOver(nextBoard, nextPlayer);
      if (winner !== null) {
        return {
          state: {
            board: nextBoard,
            current: nextPlayer,
            lockFrom: null,
            phase: "game-over",
            winner,
            notice: null,
          },
          currentPlayer: null,
        };
      }
      return {
        state: {
          board: nextBoard,
          current: nextPlayer,
          lockFrom: null,
          phase: "playing",
          winner: null,
          notice: null,
        },
        currentPlayer: nextPlayer,
      };
    }

    case "gravity-four": {
      const s = state as GravityFourState;
      if (move.type !== "drop") return { error: "Invalid move type" };
      const next = dropGravityFour(s.board, move.col, s.current);
      if (!next) return { error: "Illegal move" };
      const won = gravityFourWinner(next);
      if (won !== null) {
        return {
          state: { board: next, current: s.current, phase: "game-over", winner: won },
          currentPlayer: null,
        };
      }
      if (gravityFourBoardFull(next)) {
        return {
          state: { board: next, current: s.current, phase: "game-over", winner: "draw" },
          currentPlayer: null,
        };
      }
      const nextPlayer: Player = s.current === 0 ? 1 : 0;
      return {
        state: { board: next, current: nextPlayer, phase: "playing", winner: null },
        currentPlayer: nextPlayer,
      };
    }

    case "nim": {
      const s = state as NimState;
      if (move.type !== "nim") return { error: "Invalid move type" };
      const next = takeNim(s.heaps, move.heapIndex, move.count);
      if (!next) return { error: "Illegal move" };
      if (nimOver(next)) {
        return {
          state: {
            heaps: next,
            current: s.current,
            phase: "game-over",
            winner: s.current,
          },
          currentPlayer: null,
        };
      }
      const nextPlayer: Player = s.current === 0 ? 1 : 0;
      return {
        state: { heaps: next, current: nextPlayer, phase: "playing", winner: null },
        currentPlayer: nextPlayer,
      };
    }

    case "hex": {
      const s = state as HexState;
      if (move.type !== "place") return { error: "Invalid move type" };
      if (s.board[move.index] !== null) return { error: "Cell occupied" };
      const next = s.board.map((cell, i) => (i === move.index ? s.current : cell));
      const won = hexWinner(next);
      if (won !== null) {
        return {
          state: { board: next, current: s.current, phase: "game-over", winner: won },
          currentPlayer: null,
        };
      }
      const nextPlayer: Player = s.current === 0 ? 1 : 0;
      return {
        state: { board: next, current: nextPlayer, phase: "playing", winner: null },
        currentPlayer: nextPlayer,
      };
    }

    case "mancala": {
      const s = state as MancalaState;
      if (move.type !== "mancala") return { error: "Invalid move type" };
      const result = sowMancala(s.pits, s.current as MancalaPlayer, move.pit);
      if (!result) return { error: "Illegal move" };

      const lastMove: MancalaLastMove = { seat: seatIndex, pit: move.pit };

      if (result.over) {
        const winner = mancalaWinner(result.pits);
        return {
          state: {
            pits: result.pits,
            current: s.current,
            notice: null,
            phase: "game-over",
            winner,
            lastMove,
          },
          currentPlayer: null,
        };
      }

      if (result.extraTurn) {
        return {
          state: {
            pits: result.pits,
            current: s.current,
            notice: "最後の石が自分のゴールに入ったので、もう一度",
            phase: "playing",
            winner: null,
            lastMove,
          },
          currentPlayer: s.current,
        };
      }

      const nextPlayer: Player = s.current === 0 ? 1 : 0;
      const notice = result.captured ? "向かいの石を取りました" : null;
      return {
        state: {
          pits: result.pits,
          current: nextPlayer,
          notice,
          phase: "playing",
          winner: null,
          lastMove,
        },
        currentPlayer: nextPlayer,
      };
    }
  }
}
