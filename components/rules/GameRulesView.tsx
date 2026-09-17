"use client";

import { useEffect, useState } from "react";
import type { GameRulesDocument } from "@/lib/game-rules";
import { RulesMarkdown } from "@/components/rules/RulesMarkdown";

type Props = {
  rules: GameRulesDocument;
  onClose?: () => void;
  variant?: "page" | "overlay";
};

export function GameRulesView({ rules, onClose, variant = "page" }: Props) {
  const [activeId, setActiveId] = useState(rules.sections[0]?.id ?? "");
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  useEffect(() => {
    const sectionElements = rules.sections
      .map((section) => document.getElementById(`rule-${section.id}`))
      .filter((element): element is HTMLElement => element !== null);

    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id.replace(/^rule-/, ""));
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] }
    );

    sectionElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [rules.sections]);

  const toc = (
    <nav aria-label="ルール目次">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        目次
      </p>
      <ul className="space-y-1">
        {rules.sections.map((section) => {
          const isActive = activeId === section.id;
          return (
            <li key={section.id}>
              <a
                href={`#rule-${section.id}`}
                onClick={() => setMobileTocOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm transition ${
                  section.level === 3 ? "pl-6" : ""
                } ${
                  isActive
                    ? "bg-accent/15 font-medium text-accent"
                    : "text-slate-400 hover:bg-surface-raised hover:text-white"
                }`}
              >
                {section.title}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const content = (
    <div className="space-y-10">
      {rules.sections.map((section) => (
        <section
          key={section.id}
          id={`rule-${section.id}`}
          className="scroll-mt-24"
        >
          {section.level === 2 ? (
            <h2 className="mb-4 text-xl font-semibold text-white">{section.title}</h2>
          ) : (
            <h3 className="mb-3 text-lg font-semibold text-slate-100">{section.title}</h3>
          )}
          <RulesMarkdown content={section.content} />
        </section>
      ))}
    </div>
  );

  if (variant === "overlay") {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-surface-border px-4 py-3 sm:px-6">
          <h2 className="text-lg font-semibold">{rules.title}のルール</h2>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="min-h-9 rounded-lg px-3 text-sm text-slate-400 transition hover:bg-surface-raised hover:text-white"
            >
              閉じる
            </button>
          ) : null}
        </div>

        <div className="border-b border-surface-border px-4 py-2 sm:hidden">
          <button
            type="button"
            onClick={() => setMobileTocOpen((open) => !open)}
            className="flex min-h-10 w-full items-center justify-between rounded-lg bg-surface-raised px-3 text-sm text-slate-300"
            aria-expanded={mobileTocOpen}
          >
            目次
            <span className="text-slate-500">{mobileTocOpen ? "▲" : "▼"}</span>
          </button>
          {mobileTocOpen ? <div className="py-3">{toc}</div> : null}
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside className="hidden w-56 shrink-0 overflow-y-auto border-r border-surface-border p-4 sm:block lg:w-64">
            {toc}
          </aside>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">{content}</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 border-b border-surface-border pb-4 sm:hidden">
        <button
          type="button"
          onClick={() => setMobileTocOpen((open) => !open)}
          className="flex min-h-10 w-full items-center justify-between rounded-lg bg-surface-raised px-3 text-sm text-slate-300"
          aria-expanded={mobileTocOpen}
        >
          目次
          <span className="text-slate-500">{mobileTocOpen ? "▲" : "▼"}</span>
        </button>
        {mobileTocOpen ? <div className="pt-3">{toc}</div> : null}
      </div>

      <div className="flex gap-8 lg:gap-12">
        <aside className="hidden w-52 shrink-0 lg:block">
          <div className="sticky top-20">{toc}</div>
        </aside>
        <div className="min-w-0 flex-1">{content}</div>
      </div>
    </div>
  );
}
