"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCatalogSidebar } from "@/components/CatalogSidebarContext";
import { countCatalogFilters } from "@/lib/games";

const links = [
  { href: "/", label: "ゲーム一覧" },
  { href: "/about", label: "制作代行" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return (
      pathname === "/" ||
      pathname.startsWith("/games/") ||
      pathname.startsWith("/play/")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

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
  const filterCount = pathname === "/" ? countCatalogFilters(filters) : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-expanded={open}
          aria-controls="site-sidebar"
          className="relative inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-slate-300 transition hover:bg-surface-raised hover:text-white"
          aria-label="メニューを開く"
        >
          <MenuIcon />
          {filterCount > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-white">
              {filterCount}
            </span>
          ) : null}
        </button>

        <Link
          href="/"
          className="flex min-w-0 flex-1 items-center gap-2 font-semibold tracking-tight sm:flex-none"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
            BP
          </span>
          <span className="truncate text-sm sm:text-base">Board Playground</span>
        </Link>

        <nav
          aria-label="メイン"
          className="hidden items-center gap-4 text-sm sm:ml-auto sm:flex sm:gap-6"
        >
          {links.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`transition ${
                  active ? "font-medium text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
