/** Sticky site header overlap when scrolling in-page panels (rules TOC, etc.). */
export function getSiteHeaderScrollOffset(scrollContainer?: HTMLElement | null): number {
  if (typeof document === "undefined") return 0;

  const header = document.querySelector("header");
  const headerBottom = header?.getBoundingClientRect().bottom ?? 0;
  const containerTop = scrollContainer?.getBoundingClientRect().top ?? 0;
  const overlap = Math.max(0, headerBottom - containerTop);

  return overlap + 8;
}
