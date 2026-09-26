import type { MetadataRoute } from "next";
import { getAllGames } from "@/lib/games";
import {
  SHOW_ABOUT_PAGE,
  SITE_CONTACT_PATH,
  SITE_GUIDE_PATH,
  SITE_HELP_PATH,
  SITE_PRIVACY_PATH,
  SITE_RANKING_PATH,
  SITE_TERMS_PATH,
  SITE_URL,
} from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL;
  const games = getAllGames().flatMap((game) => [
    { url: `${base}/games/${game.slug}`, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${base}/play/${game.slug}`, changeFrequency: "monthly" as const, priority: 0.7 },
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}${SITE_RANKING_PATH}`, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}${SITE_GUIDE_PATH}`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}${SITE_HELP_PATH}`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}${SITE_TERMS_PATH}`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}${SITE_PRIVACY_PATH}`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}${SITE_CONTACT_PATH}`, changeFrequency: "monthly", priority: 0.4 },
  ];
  if (SHOW_ABOUT_PAGE) {
    staticPages.push({ url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 });
  }

  return [...staticPages, ...games];
}
