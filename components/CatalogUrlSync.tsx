"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useCatalogSidebar } from "@/components/CatalogSidebarContext";
import {
  buildCatalogSearchParams,
  catalogParamsEqual,
  parseCatalogSearchParams,
} from "@/lib/catalog-url";

export function CatalogUrlSync() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    filters,
    setFilters,
    sort,
    setSort,
    sortOrder,
    setSortOrder,
  } = useCatalogSidebar();
  const lastSyncedUrl = useRef<string | null>(null);

  useEffect(() => {
    if (pathname !== "/") return;

    const url = searchParams.toString();
    if (lastSyncedUrl.current !== null && catalogParamsEqual(url, lastSyncedUrl.current)) {
      return;
    }

    const parsed = parseCatalogSearchParams(searchParams);
    setFilters(parsed.filters);
    setSort(parsed.sort);
    setSortOrder(parsed.sortOrder);
    lastSyncedUrl.current = url;
  }, [pathname, searchParams, setFilters, setSort, setSortOrder]);

  useEffect(() => {
    if (pathname !== "/") return;

    const built = buildCatalogSearchParams(filters, sort, sortOrder);
    const current = searchParams.toString();
    if (catalogParamsEqual(built, current)) {
      lastSyncedUrl.current = built;
      return;
    }

    lastSyncedUrl.current = built;
    router.replace(built ? `/?${built}` : "/", { scroll: false });
  }, [pathname, filters, sort, sortOrder, router, searchParams]);

  return null;
}
