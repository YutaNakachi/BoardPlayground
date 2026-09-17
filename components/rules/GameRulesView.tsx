"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { GameRulesDocument } from "@/lib/game-rules";
import { RulesMarkdown } from "@/components/rules/RulesMarkdown";

type Props = {
  rules: GameRulesDocument;
  onClose?: () => void;
  variant?: "page" | "overlay";
};

function getScrollTopToAlignSection(
  scrollRoot: HTMLElement,
  section: HTMLElement
): number {
  const rootTop = scrollRoot.getBoundingClientRect().top;
  const sectionTop = section.getBoundingClientRect().top;
  return scrollRoot.scrollTop + (sectionTop - rootTop);
}

export function GameRulesView({ rules, onClose, variant = "page" }: Props) {
  const sectionIds = rules.sections.map((section) => section.id);
  const [activeId, setActiveId] = useState(sectionIds[0] ?? "");
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [spacerHeight, setSpacerHeight] = useState(0);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<HTMLDivElement>(null);
  const isScrollingToSectionRef = useRef(false);

  const scrollToSection = useCallback((sectionId: string) => {
    const scrollRoot = contentScrollRef.current;
    const section = document.getElementById(`rule-${sectionId}`);
    if (!scrollRoot || !section) return;

    isScrollingToSectionRef.current = true;
    const nextScrollTop = getScrollTopToAlignSection(scrollRoot, section);
    scrollRoot.scrollTo({ top: nextScrollTop, behavior: "smooth" });
    setActiveId(sectionId);

    window.setTimeout(() => {
      isScrollingToSectionRef.current = false;
    }, 400);
  }, []);

  const measureSpacer = useCallback(() => {
    const scrollRoot = contentScrollRef.current;
    const sectionsRoot = sectionsRef.current;
    const lastId = sectionIds[sectionIds.length - 1];
    const lastSection = lastId ? document.getElementById(`rule-${lastId}`) : null;
    if (!scrollRoot || !sectionsRoot || !lastSection) return;

    const savedScrollTop = scrollRoot.scrollTop;
    const styles = getComputedStyle(scrollRoot);
    const paddingTop = Number.parseFloat(styles.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(styles.paddingBottom) || 0;

    const targetMaxScroll = paddingTop + lastSection.offsetTop;
    const contentHeightWithoutSpacer =
      paddingTop + sectionsRoot.offsetHeight + paddingBottom;
    const maxScrollWithoutSpacer = contentHeightWithoutSpacer - scrollRoot.clientHeight;
    const nextSpacer = Math.max(0, Math.ceil(targetMaxScroll - maxScrollWithoutSpacer));

    setSpacerHeight((previous) => (previous === nextSpacer ? previous : nextSpacer));

    requestAnimationFrame(() => {
      const maxScroll = scrollRoot.scrollHeight - scrollRoot.clientHeight;
      scrollRoot.scrollTop = Math.min(savedScrollTop, maxScroll);
    });
  }, [sectionIds]);

  const updateActiveSection = useCallback(() => {
    if (isScrollingToSectionRef.current) return;

    const scrollRoot = contentScrollRef.current;
    if (!scrollRoot || sectionIds.length === 0) return;

    const rootTop = scrollRoot.getBoundingClientRect().top;
    let nextActive = sectionIds[0];

    for (const id of sectionIds) {
      const element = document.getElementById(`rule-${id}`);
      if (!element) continue;
      const relativeTop = element.getBoundingClientRect().top - rootTop;
      if (relativeTop <= 1) {
        nextActive = id;
      }
    }

    setActiveId((previous) => (previous === nextActive ? previous : nextActive));
  }, [sectionIds]);

  useLayoutEffect(() => {
    measureSpacer();
  }, [measureSpacer, rules.sections]);

  useEffect(() => {
    updateActiveSection();

    const scrollRoot = contentScrollRef.current;
    if (!scrollRoot) return;

    const onScroll = () => updateActiveSection();
    scrollRoot.addEventListener("scroll", onScroll, { passive: true });

    const onResize = () => measureSpacer();
    window.addEventListener("resize", onResize);

    const resizeObserver = new ResizeObserver(() => {
      measureSpacer();
    });
    resizeObserver.observe(scrollRoot);
    if (sectionsRef.current) resizeObserver.observe(sectionsRef.current);

    return () => {
      scrollRoot.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      resizeObserver.disconnect();
    };
  }, [measureSpacer, updateActiveSection, rules.sections]);

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
              <button
                type="button"
                onClick={() => {
                  scrollToSection(section.id);
                  setMobileTocOpen(false);
                }}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  section.level === 3 ? "pl-6" : ""
                } ${
                  isActive
                    ? "bg-accent/15 font-medium text-accent"
                    : "text-slate-400 hover:bg-surface-raised hover:text-white"
                }`}
              >
                {section.title}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const scrollAreaClass =
    variant === "overlay"
      ? "min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6"
      : "max-h-[min(70vh,calc(100vh-10rem))] overflow-y-auto overscroll-contain p-4 sm:p-6 lg:max-h-[min(75vh,calc(100vh-12rem))]";

  const layout = (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <aside
        className={`hidden shrink-0 overflow-y-auto border-surface-border p-4 sm:block ${
          variant === "overlay"
            ? "w-56 border-r lg:w-64"
            : "w-52 border-r lg:w-56"
        }`}
      >
        {toc}
      </aside>
      <div ref={contentScrollRef} className={`min-w-0 flex-1 ${scrollAreaClass}`}>
        <div ref={sectionsRef} className="space-y-10">
          {rules.sections.map((section) => (
            <section key={section.id} id={`rule-${section.id}`}>
              {section.level === 2 ? (
                <h2 className="mb-4 text-xl font-semibold text-white">{section.title}</h2>
              ) : (
                <h3 className="mb-3 text-lg font-semibold text-slate-100">{section.title}</h3>
              )}
              <RulesMarkdown content={section.content} />
            </section>
          ))}
        </div>
        <div aria-hidden style={{ height: spacerHeight }} />
      </div>
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

        {layout}
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

      {layout}
    </div>
  );
}
