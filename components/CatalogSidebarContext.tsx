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

type CatalogSidebarContextValue = {
  open: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  filters: CatalogFilters;
  setFilters: (filters: CatalogFilters) => void;
  clearFilters: () => void;
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
      games,
    }),
    [open, openSidebar, closeSidebar, toggleSidebar, filters, clearFilters, games]
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
