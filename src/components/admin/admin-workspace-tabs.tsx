import Link from "next/link";
import type { AdminWorkspaceTab } from "@/types/admin";

export function AdminWorkspaceTabs({
  tabs,
  activeTab,
}: {
  tabs: AdminWorkspaceTab[];
  activeTab: string;
}) {
  return (
    <nav className="sticky top-[4.1rem] z-20 flex gap-2 overflow-x-auto rounded-2xl border border-black/10 bg-white/90 p-2 shadow-soft backdrop-blur">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          aria-current={tab.id === activeTab ? "page" : undefined}
          className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition ${
            tab.id === activeTab
              ? "bg-pine text-white"
              : "bg-sand text-ink/70 hover:bg-white hover:text-ink"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
