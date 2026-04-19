"use client";

import clsx from "clsx";
import Link from "next/link";
import type { PortalNavItem } from "@/types/portal";

export function PortalQuickNav({ items }: { items: PortalNavItem[] }) {
  return (
    <nav className="mb-5 overflow-x-auto rounded-panel border border-black/5 bg-white/90 px-2 py-2 shadow-soft backdrop-blur">
      <div className="flex min-w-max items-center gap-2">
        {items.map((item) => {
          const classes = clsx(
            "inline-flex min-h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition whitespace-nowrap border",
            item.active && "border-pine bg-pine text-white shadow-sm",
            !item.active && !item.disabled && "border-transparent bg-sand text-ink hover:border-black/10 hover:bg-mist",
            item.disabled && "border-transparent bg-sand/60 text-ink/45",
          );

          if (item.href && !item.disabled) {
            return (
              <Link key={item.key} href={item.href} className={classes}>
                {item.label}
              </Link>
            );
          }

          return (
            <div key={item.key} className={classes} aria-disabled="true">
              {item.label}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
