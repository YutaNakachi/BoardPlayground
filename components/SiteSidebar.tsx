"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { CatalogFilterPanel } from "@/components/CatalogFilterPanel";
import { useCatalogSidebar } from "@/components/CatalogSidebarContext";

export function SiteSidebar() {
  const pathname = usePathname();
  const { open, closeSidebar, filters, setFilters, games } = useCatalogSidebar();
  const showFilters = pathname === "/";
  const showHomeLink = pathname !== "/";

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

  return (
    <>
      <button
        type="button"
        aria-label="メニューを閉じる"
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
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-surface-border bg-surface shadow-xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
          <p className="text-sm font-semibold">{showFilters ? "絞り込み" : "メニュー"}</p>
          <button
            type="button"
            onClick={closeSidebar}
            className="min-h-9 rounded-lg px-2 text-sm text-slate-400 transition hover:text-white"
            aria-label="メニューを閉じる"
          >
            閉じる
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {showHomeLink ? (
            <nav aria-label="メイン" className="mb-6">
              <Link
                href="/"
                onClick={closeSidebar}
                className="flex min-h-10 items-center rounded-lg px-3 text-sm text-slate-300 transition hover:bg-surface-raised hover:text-white"
              >
                ゲーム一覧
              </Link>
            </nav>
          ) : null}

          {showFilters ? (
            <CatalogFilterPanel
              games={games}
              filters={filters}
              onChange={setFilters}
            />
          ) : null}
        </div>
      </aside>
    </>
  );
}
