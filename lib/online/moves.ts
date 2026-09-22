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
  emptyGomokuBoard,
  gomokuBoardFull,
  gomokuWinner,
  type Board as GomokuBoard,
} from "@/lib/play/gomoku";
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
import { parseTicTacToeGameOptions } from "./game-options";
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

export type GameState = ReversiState | TttState | GomokuState | CheckersState;

export type MovePayload =
  | { type: "place"; index: number }
  | { type: "checkers"; move: CheckersMove };

export function createInitialState(
  slug: OnlineGameSlug,
  gameOptions?: unknown
): GameState {
  switch (slug) {
    case "reversi":
      return {
        board: initialReversiBoard(),
        current: 0,
        passNotice: null,
        phase: "playing",
      };
    case "tic-tac-toe": {
      const { mode } = parseTicTacToeGameOptions(gameOptions);
      return {
        board: emptyTttBoard(),
        current: 0,
        phase: "playing",
        winner: null,
        mode,
        histories: emptyTttHistories(),
      };
    }
    case "gomoku":
      return {
        board: emptyGomokuBoard(),
        current: 0,
        phase: "playing",
        winner: null,
      };
    case "checkers":
      return {
        board: initialCheckersBoard(),
        current: 0,
        lockFrom: null,
        phase: "playing",
        winner: null,
        notice: null,
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
  }
}
