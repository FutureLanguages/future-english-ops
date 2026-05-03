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
        className="rounded-xl bg-white px-3 py-2 text-pine transition hover:bg-mist"
      >
        {buttonLabel}
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-soft">
          <label className="flex items-center gap-2 border-b border-black/10 px-3 py-2">
            <Search className="h-4 w-4 text-ink/40" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none"
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
                    className={`block rounded-xl px-3 py-2 text-right transition ${
                      active ? "bg-mist text-pine" : "hover:bg-sand"
                    }`}
                    loadingLabel="جاري الفتح..."
                  >
                    <span className="block truncate text-sm font-extrabold">{item.label}</span>
                    {item.description ? (
                      <span className="mt-0.5 block truncate text-xs text-ink/50">{item.description}</span>
                    ) : null}
                  </LoadingLink>
                );
              })
            ) : (
              <div className="px-3 py-6 text-center text-sm font-semibold text-ink/50">
                لا توجد نتائج مطابقة
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
