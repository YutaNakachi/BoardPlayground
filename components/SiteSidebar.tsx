"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { CatalogFilterPanel } from "@/components/CatalogFilterPanel";
import { useCatalogSidebar } from "@/components/CatalogSidebarContext";
import { usePlayStats } from "@/components/PlayStatsProvider";

export function SiteSidebar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { open, closeSidebar, filters, setFilters, clearFilters, games } =
    useCatalogSidebar();
  const { onlineEnabled } = usePlayStats();

  useEffect(() => {
    closeSidebar();
  }, [pathname, closeSidebar]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeSidebar();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, closeSidebar]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!isHome) return null;

  return (
    <>
      <button
        type="button"
        aria-label="検索・絞り込みメニューを閉じる"
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        onClick={closeSidebar}
        className={`fixed inset-0 z-50 bg-black/60 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        id="site-sidebar"
        aria-hidden={!open}
        className={`fixed left-0 top-0 z-50 flex h-dvh max-h-dvh w-72 max-w-[85vw] flex-col overflow-hidden border-r border-surface-border bg-surface shadow-xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-surface-border px-4 py-3">
          <p className="text-sm font-semibold">検索・絞り込み</p>
          <button
            type="button"
            onClick={closeSidebar}
            className="min-h-9 rounded-lg px-2 text-sm text-slate-400 transition hover:text-white"
            aria-label="検索・絞り込みメニューを閉じる"
          >
            閉じる
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          <CatalogFilterPanel
            games={games}
            filters={filters}
            onChange={setFilters}
            onClear={clearFilters}
            onlineEnabled={onlineEnabled}
          />
        </div>
      </aside>
    </>
  );
}
