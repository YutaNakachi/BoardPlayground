"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { releaseBodyScrollLock } from "@/lib/body-scroll-lock";
import { useCatalogSidebar } from "@/components/CatalogSidebarContext";
import { JoinRoomModal } from "@/components/JoinRoomModal";
import { usePlayStats } from "@/components/PlayStatsProvider";
import { countSidebarFilters } from "@/lib/games";
import { SiteBrand } from "@/components/SiteBrand";
import {
  SITE_CONTACT_PATH,
  SITE_GUIDE_PATH,
  SITE_NAME,
  SITE_RANKING_PATH,
} from "@/lib/site";

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

function GuideIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className="text-current"
    >
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M7.75 7.9a2.75 2.75 0 0 1 4.35-.15c.85.85.75 2.1-.2 2.75-.55.4-1 .75-1 1.35V12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="10" cy="14.25" r="0.85" fill="currentColor" />
    </svg>
  );
}

function ContactIcon() {
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
        d="M4 6.5 10 11l6-4.5M4 6.5h12V14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6.5Z"
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
  "group relative inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-xl border text-slate-300 transition hover:border-white/25 hover:text-white sm:min-h-10 sm:min-w-10 sm:rounded-full";

const headerTooltipClass =
  "pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-surface-raised px-2.5 py-1 text-xs font-medium text-slate-200 opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100";

function HeaderTooltip({ label }: { label: string }) {
  return <span className={headerTooltipClass}>{label}</span>;
}

function headerNavLinkClass(active: boolean) {
  return `${headerActionClass} ${
    active ? "border-accent/50 bg-accent/20 text-white" : "border-white/15 bg-white/5"
  }`;
}

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { open, toggleSidebar, filters } = useCatalogSidebar();
  const { onlineEnabled } = usePlayStats();
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinModalKey, setJoinModalKey] = useState(0);
  const [joinNavSlug, setJoinNavSlug] = useState<string | null>(null);
  const filterCount = isHome ? countSidebarFilters(filters) : 0;

  const joinNavArrived = useMemo(() => {
    if (!joinNavSlug) return false;
    const playPath = `/play/${joinNavSlug}`;
    return pathname === playPath || pathname.startsWith(`${playPath}/`);
  }, [joinNavSlug, pathname]);

  const finishJoinNavigation = useCallback(() => {
    setJoinNavSlug(null);
    setJoinOpen(false);
  }, []);

  useEffect(() => {
    releaseBodyScrollLock();
  }, [pathname]);

  useEffect(() => {
    if (!joinNavSlug || !joinNavArrived) return;
    queueMicrotask(() => {
      finishJoinNavigation();
    });
  }, [joinNavSlug, joinNavArrived, finishJoinNavigation]);

  return (
    <>
      <header className="sticky top-0 z-40 overflow-visible border-b border-surface-border bg-surface/85 backdrop-blur-md">
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

          <div className="ml-auto flex shrink-0 items-center gap-1 overflow-visible sm:gap-1.5">
            {onlineEnabled ? (
              <button
                type="button"
                onClick={() => {
                  setJoinModalKey((k) => k + 1);
                  setJoinOpen(true);
                }}
                className={`${headerActionClass} border-white/15 bg-white/5`}
                aria-label="部屋に入る"
              >
                <JoinRoomIcon />
                <HeaderTooltip label="部屋に入る" />
              </button>
            ) : null}
            <Link
              href={SITE_RANKING_PATH}
              aria-current={pathname === SITE_RANKING_PATH ? "page" : undefined}
              className={headerNavLinkClass(pathname === SITE_RANKING_PATH)}
              aria-label="プレイ回数ランキング"
            >
              <RankingIcon />
              <HeaderTooltip label="ランキング" />
            </Link>
            <Link
              href={SITE_CONTACT_PATH}
              aria-current={pathname === SITE_CONTACT_PATH ? "page" : undefined}
              className={headerNavLinkClass(pathname === SITE_CONTACT_PATH)}
              aria-label="お問い合わせ"
            >
              <ContactIcon />
              <HeaderTooltip label="お問い合わせ" />
            </Link>
            <Link
              href={SITE_GUIDE_PATH}
              aria-current={pathname === SITE_GUIDE_PATH ? "page" : undefined}
              className={headerNavLinkClass(pathname === SITE_GUIDE_PATH)}
              aria-label="このサイトについて"
            >
              <GuideIcon />
              <HeaderTooltip label="このサイトについて" />
            </Link>
          </div>
        </div>
      </header>
      <JoinRoomModal
        key={joinModalKey}
        open={joinOpen}
        connectingToSlug={joinNavSlug}
        onJoinNavigate={setJoinNavSlug}
        onClose={() => {
          setJoinOpen(false);
          setJoinNavSlug(null);
        }}
      />
    </>
  );
}
