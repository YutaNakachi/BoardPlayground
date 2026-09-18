"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCatalogSidebar } from "@/components/CatalogSidebarContext";
import { countSidebarFilters } from "@/lib/games";
import { SiteBrand } from "@/components/SiteBrand";

function MenuIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className="text-current"
    >
      <path
        d="M3 5.5h14M3 10h14M3 14.5h14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { open, toggleSidebar, filters } = useCatalogSidebar();
  const filterCount = isHome ? countSidebarFilters(filters) : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-6xl items-center gap-3 px-4 sm:h-14 sm:px-6">
        {isHome ? (
          <button
            type="button"
            onClick={toggleSidebar}
            aria-expanded={open}
            aria-controls="site-sidebar"
            className="relative inline-flex min-h-9 min-w-9 items-center justify-center rounded-xl text-slate-300 transition hover:bg-surface-raised hover:text-white sm:min-h-10 sm:min-w-10"
            aria-label="絞り込みメニューを開く"
          >
            <MenuIcon />
            {filterCount > 0 ? (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-white">
                {filterCount}
              </span>
            ) : null}
          </button>
        ) : null}

        <Link
          href="/"
          className={`flex min-w-0 items-center gap-2.5 ${isHome ? "flex-1 sm:flex-none" : ""}`}
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-warm text-sm font-extrabold text-white shadow-md shadow-accent/25 sm:h-9 sm:w-9"
          >
            ボ
          </span>
          <SiteBrand variant="header" />
        </Link>

        <Link
          href="/ranking"
          aria-current={pathname === "/ranking" ? "page" : undefined}
          className={`ml-auto inline-flex min-h-9 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition sm:min-h-10 ${
            pathname === "/ranking"
              ? "border-accent/50 bg-accent/20 text-white"
              : "border-white/15 bg-white/5 text-slate-300 hover:border-white/25 hover:text-white"
          }`}
          aria-label="プレイ回数ランキング"
        >
          ランキング
        </Link>
      </div>
    </header>
  );
}
