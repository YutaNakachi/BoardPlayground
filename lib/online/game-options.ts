import type { TttMode } from "@/lib/play/tic-tac-toe";
import type { OnlineGameSlug } from "./types";

export type FirstPlayerSeat = 0 | 1;

export type CommonGameOptions = {
  firstPlayer?: FirstPlayerSeat;
};

export type TicTacToeGameOptions = {
  mode: TttMode;
  firstPlayer?: FirstPlayerSeat;
};

export type OnlineGameOptions = TicTacToeGameOptions | CommonGameOptions;

export function parseFirstPlayer(raw: unknown): FirstPlayerSeat {
  if (raw && typeof raw === "object" && "firstPlayer" in raw) {
    const firstPlayer = (raw as { firstPlayer: unknown }).firstPlayer;
    if (firstPlayer === 0 || firstPlayer === 1) {
      return firstPlayer;
    }
  }
  return 0;
}

function normalizeFirstPlayer(
  options: { firstPlayer?: FirstPlayerSeat }
): CommonGameOptions {
  return options.firstPlayer === 1 ? { firstPlayer: 1 } : {};
}

export function parseTicTacToeGameOptions(raw: unknown): TicTacToeGameOptions {
  const mode =
    raw &&
    typeof raw === "object" &&
    "mode" in raw &&
    (raw as { mode: unknown }).mode === "rotating"
      ? "rotating"
      : "classic";
  const firstPlayer = parseFirstPlayer(raw);
  if (firstPlayer === 1) {
    return { mode, firstPlayer: 1 };
  }
  return { mode };
}

function parseCommonGameOptions(raw: unknown): CommonGameOptions | null {
  if (raw == null) return {};
  if (typeof raw !== "object") return null;
  const keys = Object.keys(raw as object);
  if (keys.length === 0) return {};
  if (!keys.every((key) => key === "firstPlayer")) return null;
  const firstPlayer = parseFirstPlayer(raw);
  return normalizeFirstPlayer({ firstPlayer });
}

export function validateGameOptions(
  slug: OnlineGameSlug,
  raw: unknown
): OnlineGameOptions | null {
  switch (slug) {
    case "tic-tac-toe": {
      if (raw == null) return { mode: "classic" };
      if (typeof raw !== "object") return null;
      const keys = Object.keys(raw as object);
      if (!keys.every((key) => key === "mode" || key === "firstPlayer")) {
        return null;
      }
      const parsed = parseTicTacToeGameOptions(raw);
      if (
        "mode" in (raw as object) &&
        (raw as { mode: unknown }).mode !== "classic" &&
        (raw as { mode: unknown }).mode !== "rotating"
      ) {
        return null;
      }
      return parsed;
    }
    case "reversi":
    case "gomoku":
    case "checkers":
      return parseCommonGameOptions(raw);
  }
}

export function mergeGameOptions(
  slug: OnlineGameSlug,
  stored: unknown,
  partial: Record<string, unknown>
): OnlineGameOptions | null {
  const base = validateGameOptions(slug, stored);
  if (base === null && stored != null) return null;
  const merged = { ...(base ?? {}), ...partial };
  return validateGameOptions(slug, merged);
}

export function parseStoredGameOptions(
  slug: OnlineGameSlug,
  raw: unknown
): OnlineGameOptions {
  return validateGameOptions(slug, raw) ?? {};
}

/** デフォルト以外のオプション（DB に game_options 列が必要） */
export function hasNonDefaultGameOptions(
  slug: OnlineGameSlug,
  options: OnlineGameOptions
): boolean {
  if (parseFirstPlayer(options) === 1) return true;
  switch (slug) {
    case "tic-tac-toe":
      return (options as TicTacToeGameOptions).mode !== "classic";
    default:
      return Object.keys(options).length > 0;
  }
}
