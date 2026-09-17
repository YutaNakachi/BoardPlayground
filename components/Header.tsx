"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCatalogSidebar } from "@/components/CatalogSidebarContext";
import { countSidebarFilters } from "@/lib/games";
import { SITE_NAME } from "@/lib/site";

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
  const { open, toggleSidebar, filters } = useCatalogSidebar();
  const filterCount = pathname === "/" ? countSidebarFilters(filters) : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-expanded={open}
          aria-controls="site-sidebar"
          className="relative inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl text-slate-300 transition hover:bg-surface-raised hover:text-white"
          aria-label="メニューを開く"
        >
          <MenuIcon />
          {filterCount > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-white">
              {filterCount}
            </span>
          ) : null}
        </button>

        <Link href="/" className="flex min-w-0 flex-1 items-center gap-2.5 sm:flex-none">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-warm text-sm font-extrabold text-white shadow-md shadow-accent/25"
          >
            ボ
          </span>
          <span className="truncate font-display text-base font-extrabold tracking-tight sm:text-lg">
            {SITE_NAME}
          </span>
        </Link>
      </div>
    </header>
  );
}
