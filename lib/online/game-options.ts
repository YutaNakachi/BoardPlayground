import type { TttMode } from "@/lib/play/tic-tac-toe";
import type { OnlineGameSlug } from "./types";

export type TicTacToeGameOptions = {
  mode: TttMode;
};

export type OnlineGameOptions = TicTacToeGameOptions | Record<string, never>;

export function parseTicTacToeGameOptions(raw: unknown): TicTacToeGameOptions {
  if (raw && typeof raw === "object" && "mode" in raw) {
    const mode = (raw as { mode: unknown }).mode;
    if (mode === "classic" || mode === "rotating") {
      return { mode };
    }
  }
  return { mode: "classic" };
}

export function validateGameOptions(
  slug: OnlineGameSlug,
  raw: unknown
): OnlineGameOptions | null {
  switch (slug) {
    case "tic-tac-toe":
      return parseTicTacToeGameOptions(raw);
    case "reversi":
    case "gomoku":
    case "checkers":
      if (raw == null || (typeof raw === "object" && Object.keys(raw).length === 0)) {
        return {};
      }
      return null;
  }
}

export function parseStoredGameOptions(
  slug: OnlineGameSlug,
  raw: unknown
): OnlineGameOptions {
  return validateGameOptions(slug, raw) ?? {};
}
