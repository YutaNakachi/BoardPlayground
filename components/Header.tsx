"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCatalogSidebar } from "@/components/CatalogSidebarContext";
import { JoinRoomModal } from "@/components/JoinRoomModal";
import { usePlayStats } from "@/components/PlayStatsProvider";
import { countSidebarFilters } from "@/lib/games";
import { SiteBrand } from "@/components/SiteBrand";
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

function JoinRoomIcon() {
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
        d="M4 7.5V16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7.5M10 11v3M7.5 11 10 8.5 12.5 11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 4.5h6l1 3H6l1-3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RankingIcon() {
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
        d="M5 16V9M10 16V5M15 16v-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M3.5 16h13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const headerActionClass =
  "inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border text-slate-300 transition hover:border-white/25 hover:text-white sm:min-h-10 sm:min-w-10 sm:rounded-full sm:px-3.5";

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { open, toggleSidebar, filters } = useCatalogSidebar();
  const { onlineEnabled } = usePlayStats();
  const [joinOpen, setJoinOpen] = useState(false);
  const filterCount = isHome ? countSidebarFilters(filters) : 0;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-surface-border bg-surface/85 backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-6xl items-center gap-2 px-3 sm:h-14 sm:gap-3 sm:px-6">
          {isHome ? (
            <button
              type="button"
              onClick={toggleSidebar}
              aria-expanded={open}
              aria-controls="site-sidebar"
              className="relative inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-xl text-slate-300 transition hover:bg-surface-raised hover:text-white sm:min-h-10 sm:min-w-10"
              aria-label="検索・絞り込みメニューを開く"
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
            className={`flex min-w-0 items-center overflow-hidden ${isHome ? "min-w-0 flex-1 sm:flex-none" : ""}`}
            aria-label={`${SITE_NAME} トップ`}
          >
            <SiteBrand variant="header" />
          </Link>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            {onlineEnabled ? (
              <button
                type="button"
                onClick={() => setJoinOpen(true)}
                className={`${headerActionClass} border-white/15 bg-white/5`}
                aria-label="部屋に入る"
                title="部屋に入る"
              >
                <JoinRoomIcon />
                <span className="hidden text-sm font-medium sm:inline">部屋に入る</span>
              </button>
            ) : null}
            <Link
              href="/ranking"
              aria-current={pathname === "/ranking" ? "page" : undefined}
              className={`${headerActionClass} ${
                pathname === "/ranking"
                  ? "border-accent/50 bg-accent/20 text-white"
                  : "border-white/15 bg-white/5"
              }`}
              aria-label="プレイ回数ランキング"
              title="ランキング"
            >
              <RankingIcon />
              <span className="hidden text-sm font-medium sm:inline">ランキング</span>
            </Link>
          </div>
        </div>
      </header>
      <JoinRoomModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </>
  );
}
