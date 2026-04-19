"use client";

import clsx from "clsx";
import Link from "next/link";
import type { PortalNavItem } from "@/types/portal";

export function PortalBottomNav({ items }: { items: PortalNavItem[] }) {
  return (
    <nav className="sticky bottom-0 z-20 border-t border-black/5 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] pt-3 backdrop-blur md:hidden">
      <div
        className="grid gap-2 rounded-[1.25rem] bg-sand p-2 shadow-soft"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const classes = clsx(
            "flex min-h-14 items-center justify-center rounded-2xl px-2 text-sm font-semibold transition",
            item.active && "bg-pine text-white",
            !item.active && !item.disabled && "bg-white text-ink",
            item.disabled && "bg-transparent text-ink/45",
          );

          if (item.href && !item.disabled) {
            return (
              <Link key={item.key} href={item.href} className={classes}>
                <span className="text-center leading-tight">{item.label}</span>
              </Link>
            );
          }

          return (
            <div key={item.key} className={classes} aria-disabled="true">
              <div className="text-center leading-tight">
                <div>{item.label}</div>
                {item.devOnlyLabel ? (
                  <div className="mt-0.5 text-[10px] font-medium opacity-70">{item.devOnlyLabel}</div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
