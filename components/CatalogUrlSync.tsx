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
  /** URL → state の反映直後は state → URL の push を1回スキップ（ロゴで `/` に戻ったときの書き戻しを防ぐ） */
  const skipPushFromUrlRef = useRef(false);

  useEffect(() => {
    if (pathname !== "/") {
      lastSyncedUrl.current = null;
      return;
    }

    const url = searchParams.toString();
    if (lastSyncedUrl.current !== null && catalogParamsEqual(url, lastSyncedUrl.current)) {
      return;
    }

    const parsed = parseCatalogSearchParams(searchParams);
    skipPushFromUrlRef.current = true;
    setFilters(parsed.filters);
    setSort(parsed.sort);
    setSortOrder(parsed.sortOrder);
    lastSyncedUrl.current = url;
  }, [pathname, searchParams, setFilters, setSort, setSortOrder]);

  useEffect(() => {
    if (pathname !== "/") return;
    if (skipPushFromUrlRef.current) {
      skipPushFromUrlRef.current = false;
      return;
    }

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
