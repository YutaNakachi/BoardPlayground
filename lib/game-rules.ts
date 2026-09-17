import fs from "fs";
import path from "path";
import type { GameMeta } from "@/lib/games";

export type GameRulesSection = {
  id: string;
  title: string;
  level: 2 | 3;
  content: string;
};

export type GameRulesDocument = {
  slug: string;
  title: string;
  sections: GameRulesSection[];
};

function slugifyHeading(title: string, index: number): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u3040-\u30ff\u4e00-\u9faf-]/g, "");
  return base ? `${base}-${index}` : `section-${index}`;
}

export function parseGameRulesMarkdown(
  markdown: string,
  slug: string
): GameRulesDocument {
  const lines = markdown.split("\n");
  let title = "";
  const sections: GameRulesSection[] = [];
  let current: GameRulesSection | null = null;
  const bodyLines: string[] = [];

  function flushSection() {
    if (!current) return;
    current.content = bodyLines.join("\n").trim();
    sections.push(current);
    current = null;
    bodyLines.length = 0;
  }

  for (const line of lines) {
    if (line.startsWith("# ")) {
      title = line.slice(2).trim();
      continue;
    }

    const h2 = /^## (.+)$/.exec(line);
    const h3 = /^### (.+)$/.exec(line);
    if (h2 || h3) {
      flushSection();
      const sectionTitle = (h2 ?? h3)![1].trim();
      const id = slugifyHeading(sectionTitle, sections.length);
      current = {
        id,
        title: sectionTitle,
        level: h2 ? 2 : 3,
        content: "",
      };
      continue;
    }

    if (current) {
      bodyLines.push(line);
    }
  }

  flushSection();

  return {
    slug,
    title: title || slug,
    sections,
  };
}

export function loadGameRules(
  slug: string,
  fallback?: GameMeta
): GameRulesDocument | null {
  const filePath = path.join(process.cwd(), "games", slug, "rules.md");

  if (fs.existsSync(filePath)) {
    const markdown = fs.readFileSync(filePath, "utf-8");
    return parseGameRulesMarkdown(markdown, slug);
  }

  if (fallback && fallback.rulesSummary.length > 0) {
    return {
      slug,
      title: fallback.title,
      sections: [
        {
          id: "summary",
          title: "ルール概要",
          level: 2,
          content: fallback.rulesSummary.join("\n\n"),
        },
      ],
    };
  }

  return null;
}
