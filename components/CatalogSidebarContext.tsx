"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  EMPTY_CATALOG_FILTERS,
  type CatalogFilters,
  type GameMeta,
} from "@/lib/games";
import {
  DEFAULT_CATALOG_SORT,
  DEFAULT_CATALOG_SORT_ORDER,
  type CatalogSort,
  type CatalogSortOrder,
} from "@/lib/catalog-sort";

type CatalogSidebarContextValue = {
  open: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  filters: CatalogFilters;
  setFilters: (filters: CatalogFilters) => void;
  clearFilters: () => void;
  sort: CatalogSort;
  setSort: (sort: CatalogSort) => void;
  sortOrder: CatalogSortOrder;
  setSortOrder: (order: CatalogSortOrder) => void;
  toggleSortOrder: () => void;
  games: GameMeta[];
};

const CatalogSidebarContext = createContext<CatalogSidebarContextValue | null>(
  null
);

type ProviderProps = {
  games: GameMeta[];
  children: ReactNode;
};

export function CatalogSidebarProvider({ games, children }: ProviderProps) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<CatalogFilters>(EMPTY_CATALOG_FILTERS);
  const [sort, setSortState] = useState<CatalogSort>(DEFAULT_CATALOG_SORT);
  const [sortOrder, setSortOrder] = useState<CatalogSortOrder>(
    DEFAULT_CATALOG_SORT_ORDER[DEFAULT_CATALOG_SORT]
  );

  const setSort = useCallback((next: CatalogSort) => {
    setSortState(next);
    setSortOrder(DEFAULT_CATALOG_SORT_ORDER[next]);
  }, []);

  const toggleSortOrder = useCallback(() => {
    setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
  }, []);

  const openSidebar = useCallback(() => setOpen(true), []);
  const closeSidebar = useCallback(() => setOpen(false), []);
  const toggleSidebar = useCallback(() => setOpen((current) => !current), []);
  const clearFilters = useCallback(() => setFilters(EMPTY_CATALOG_FILTERS), []);

  const value = useMemo(
    () => ({
      open,
      openSidebar,
      closeSidebar,
      toggleSidebar,
      filters,
      setFilters,
      clearFilters,
      sort,
      setSort,
      sortOrder,
      setSortOrder,
      toggleSortOrder,
      games,
    }),
    [
      open,
      openSidebar,
      closeSidebar,
      toggleSidebar,
      filters,
      clearFilters,
      sort,
      setSort,
      sortOrder,
      toggleSortOrder,
      games,
    ]
  );

  return (
    <CatalogSidebarContext.Provider value={value}>
      {children}
    </CatalogSidebarContext.Provider>
  );
}

export function useCatalogSidebar() {
  const context = useContext(CatalogSidebarContext);
  if (!context) {
    throw new Error("useCatalogSidebar must be used within CatalogSidebarProvider");
  }
  return context;
}
