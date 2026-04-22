"use client";

import Link from "next/link";
import { useState, type MouseEvent, type ReactNode } from "react";

export function LoadingLink({
  href,
  children,
  loadingLabel = "جاري الفتح...",
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
      className={className}
    >
      {pending ? loadingLabel : children}
    </Link>
  );
}
