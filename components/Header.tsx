"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCatalogSidebar } from "@/components/CatalogSidebarContext";
import { DiceIcon } from "@/components/DiceIcon";
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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0c]/72 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-12 max-w-6xl items-center gap-3 px-4 sm:h-14 sm:px-6">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-expanded={open}
          aria-controls="site-sidebar"
          className="relative inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg text-slate-400 transition hover:text-white"
          aria-label="メニューを開く"
        >
          <MenuIcon />
          {filterCount > 0 ? (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-white">
              {filterCount}
            </span>
          ) : null}
        </button>

        <Link href="/" className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
          <DiceIcon size={28} className="shrink-0 sm:h-8 sm:w-8" />
          <span className="truncate text-base font-semibold tracking-tight text-white/95 sm:text-[17px]">
            {SITE_NAME}
          </span>
        </Link>
      </div>
    </header>
  );
}
