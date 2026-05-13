"use client";

import Link from "next/link";
import { useState, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function LoadingLink({
  href,
  children,
  loadingLabel = "جارٍ الفتح...",
  className,
  target,
}: {
  href: string;
  children: ReactNode;
  loadingLabel?: string;
  className?: string;
  target?: string;
}) {
  const [pending, setPending] = useState(false);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (pending) {
      event.preventDefault();
      return;
    }

    setPending(true);
  }

  return (
    <Link
      href={href}
      target={target}
      aria-disabled={pending}
      onClick={handleClick}
      className={cn(
        "outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface",
        className,
      )}
    >
      {pending ? loadingLabel : children}
    </Link>
  );
}
