"use client";

import {
  CATALOG_SORT_OPTIONS,
  CATALOG_SORT_ORDER_LABEL,
  type CatalogSort,
  type CatalogSortOrder,
} from "@/lib/catalog-sort";

type Props = {
  value: CatalogSort;
  order: CatalogSortOrder;
  onChange: (sort: CatalogSort) => void;
  onToggleOrder: () => void;
};

export function CatalogSortSelect({
  value,
  order,
  onChange,
  onToggleOrder,
}: Props) {
  const orderLabel = CATALOG_SORT_ORDER_LABEL[order];

  return (
    <div className="flex items-center gap-2">
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
      <button
        type="button"
        onClick={onToggleOrder}
        aria-label={`${orderLabel}。クリックで${
          order === "asc"
            ? CATALOG_SORT_ORDER_LABEL.desc
            : CATALOG_SORT_ORDER_LABEL.asc
        }に変更`}
        className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-surface-raised px-3 text-sm text-slate-300 ring-1 ring-surface-border transition hover:text-white focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <span aria-hidden>{order === "asc" ? "↑" : "↓"}</span>
        <span>{orderLabel}</span>
      </button>
    </div>
  );
}
