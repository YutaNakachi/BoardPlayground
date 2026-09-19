"use client";

import { CATALOG_SORT_OPTIONS, type CatalogSort } from "@/lib/catalog-sort";

type Props = {
  value: CatalogSort;
  onChange: (sort: CatalogSort) => void;
};

export function CatalogSortSelect({ value, onChange }: Props) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-sm text-slate-500">並び替え</span>
      <span className="relative inline-flex">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value as CatalogSort)}
          aria-label="並び替え"
          className="min-h-10 min-w-[9.5rem] appearance-none rounded-lg bg-surface-raised py-2 pl-3 pr-8 text-sm text-slate-300 ring-1 ring-surface-border transition hover:text-white focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {CATALOG_SORT_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
        <span
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500"
          aria-hidden
        >
          ▼
        </span>
      </span>
    </label>
  );
}
