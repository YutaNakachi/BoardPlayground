import type { OnlineGameSlug } from "./types";

export const ONLINE_SECRET_GAME_SLUGS = ["king-and-spy"] as const;

export type OnlineSecretGameSlug = (typeof ONLINE_SECRET_GAME_SLUGS)[number];

export function isOnlineSecretGame(slug: string): slug is OnlineSecretGameSlug {
  return (ONLINE_SECRET_GAME_SLUGS as readonly string[]).includes(slug);
}
