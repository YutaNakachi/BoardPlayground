import type { MetadataRoute } from "next";
import { getAllGames } from "@/lib/games";
import { SHOW_ABOUT_PAGE, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL;
  const games = getAllGames().flatMap((game) => [
    { url: `${base}/games/${game.slug}`, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${base}/play/${game.slug}`, changeFrequency: "monthly" as const, priority: 0.7 },
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
  ];
  if (SHOW_ABOUT_PAGE) {
    staticPages.push({ url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 });
  }

  return [...staticPages, ...games];
}
