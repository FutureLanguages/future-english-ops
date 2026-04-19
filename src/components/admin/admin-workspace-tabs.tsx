import Link from "next/link";
import type { AdminWorkspaceTab } from "@/types/admin";

export function AdminWorkspaceTabs({ tabs }: { tabs: AdminWorkspaceTab[] }) {
  return (
    <nav className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className="rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white"
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
