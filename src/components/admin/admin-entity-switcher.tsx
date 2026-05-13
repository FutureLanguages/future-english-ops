"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { LoadingLink } from "@/components/shared/loading-link";

export type AdminEntitySwitchItem = {
  id: string;
  label: string;
  description?: string | null;
  href: string;
};

export function AdminEntitySwitcher({
  items,
  currentId,
  buttonLabel,
  searchPlaceholder,
}: {
  items: AdminEntitySwitchItem[];
  currentId: string;
  buttonLabel: string;
  searchPlaceholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) => {
      return (
        item.label.toLowerCase().includes(normalizedQuery) ||
        item.description?.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [items, query]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-button border border-border-subtle bg-bg-surface px-3 py-2 text-caption font-bold text-pine outline-none transition-[color,background-color,border-color,box-shadow] duration-default ease-default hover:border-secondary-600 hover:bg-secondary-100 focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface"
      >
        {buttonLabel}
      </button>

      {open ? (
        <div className="absolute start-0 top-full z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-card border border-border-subtle bg-bg-surface shadow-card">
          <label className="flex items-center gap-2 border-b border-border-subtle px-3 py-2">
            <Search className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent py-1 text-body text-text-primary outline-none placeholder:text-text-muted"
            />
          </label>
          <div className="max-h-72 overflow-y-auto p-2">
            {visibleItems.length > 0 ? (
              visibleItems.map((item) => {
                const active = item.id === currentId;

                return (
                  <LoadingLink
                    key={item.id}
                    href={item.href}
                    className={`block rounded-lg px-3 py-2 text-right transition-[background-color,color] duration-default ease-default ${
                      active ? "bg-secondary-100 text-pine" : "hover:bg-bg-surface-alt"
                    }`}
                    loadingLabel="جارٍ الفتح..."
                  >
                    <span className="block truncate text-sm font-extrabold">{item.label}</span>
                    {item.description ? (
                      <span className="mt-0.5 block truncate text-caption text-text-muted">{item.description}</span>
                    ) : null}
                  </LoadingLink>
                );
              })
            ) : (
              <div className="px-3 py-6 text-center text-body font-bold text-text-muted">
                لا توجد نتائج مطابقة
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
