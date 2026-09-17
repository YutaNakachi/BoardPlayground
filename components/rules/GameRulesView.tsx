"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { GameRulesDocument } from "@/lib/game-rules";
import { RulesMarkdown } from "@/components/rules/RulesMarkdown";

type Props = {
  rules: GameRulesDocument;
  onClose?: () => void;
  variant?: "page" | "overlay";
};

export function GameRulesView({ rules, onClose, variant = "page" }: Props) {
  const sectionIds = rules.sections.map((section) => section.id);
  const [activeId, setActiveId] = useState(sectionIds[0] ?? "");
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef(new Map<string, HTMLElement>());

  const updateEndSpacer = useCallback(() => {
    const scrollEl = scrollRef.current;
    const sectionsEl = sectionsRef.current;
    const spacerEl = spacerRef.current;
    const lastId = sectionIds[sectionIds.length - 1];
    const lastEl = lastId ? sectionRefs.current.get(lastId) : null;
    if (!scrollEl || !sectionsEl || !spacerEl || !lastEl || scrollEl.clientHeight === 0) {
      return;
    }

    const style = getComputedStyle(scrollEl);
    const paddingTop = Number.parseFloat(style.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(style.paddingBottom) || 0;
    const targetMaxScroll = paddingTop + lastEl.offsetTop;
    const maxScrollWithoutSpacer =
      paddingTop + sectionsEl.offsetHeight + paddingBottom - scrollEl.clientHeight;
    const nextSpacer = Math.max(0, Math.ceil(targetMaxScroll - maxScrollWithoutSpacer));

    spacerEl.style.height = `${nextSpacer}px`;
  }, [sectionIds]);

  useLayoutEffect(() => {
    updateEndSpacer();
    const frame = requestAnimationFrame(updateEndSpacer);
    return () => cancelAnimationFrame(frame);
  }, [updateEndSpacer, rules]);

  useEffect(() => {
    let timeout: number | undefined;
    const onResize = () => {
      if (timeout !== undefined) window.clearTimeout(timeout);
      timeout = window.setTimeout(updateEndSpacer, 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(timeout);
    };
  }, [updateEndSpacer]);

  const scrollToSection = useCallback((sectionId: string) => {
    const scrollEl = scrollRef.current;
    const sectionEl = sectionRefs.current.get(sectionId);
    if (!scrollEl || !sectionEl) return;

    const nextScrollTop =
      scrollEl.scrollTop +
      sectionEl.getBoundingClientRect().top -
      scrollEl.getBoundingClientRect().top;

    scrollEl.scrollTop = nextScrollTop;
    setActiveId(sectionId);
    setMobileTocOpen(false);
  }, []);

  const updateActiveSection = useCallback(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || sectionIds.length === 0) return;

    const rootTop = scrollEl.getBoundingClientRect().top;
    let nextActive = sectionIds[0];

    for (const id of sectionIds) {
      const element = sectionRefs.current.get(id);
      if (!element) continue;
      if (element.getBoundingClientRect().top - rootTop <= 2) {
        nextActive = id;
      }
    }

    setActiveId((previous) => (previous === nextActive ? previous : nextActive));
  }, [sectionIds]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    updateActiveSection();
    scrollEl.addEventListener("scroll", updateActiveSection, { passive: true });
    return () => scrollEl.removeEventListener("scroll", updateActiveSection);
  }, [updateActiveSection, rules]);

  const registerSectionRef = useCallback(
    (sectionId: string, element: HTMLElement | null) => {
      if (element) {
        sectionRefs.current.set(sectionId, element);
      } else {
        sectionRefs.current.delete(sectionId);
      }
    },
    []
  );

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
                onClick={() => scrollToSection(section.id)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
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
      <div ref={scrollRef} className={`min-w-0 flex-1 ${scrollAreaClass}`}>
        <div ref={sectionsRef} className="space-y-10">
          {rules.sections.map((section) => (
            <section
              key={section.id}
              ref={(element) => registerSectionRef(section.id, element)}
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
        <div ref={spacerRef} aria-hidden />
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
