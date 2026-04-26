import Link from "next/link";
import clsx from "clsx";
import {
  Bell,
  CreditCard,
  Download,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Table2,
  UserRound,
  Users,
} from "lucide-react";
import { InstitutionLogo } from "@/components/shared/institution-logo";
import { NotificationBell } from "@/components/shared/notification-bell";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { getAdminUnreadMessageCount } from "@/features/messages/server/notifications";
import { getUserNotificationSummary } from "@/features/notifications/server/notifications";
import type { AdminNavItem } from "@/types/admin";

const primaryNavKeys = ["dashboard", "students", "parents", "documents", "finance", "messages"];
const secondaryNavKeys = ["reports", "exports", "notifications"];

const navIconMap = {
  dashboard: LayoutDashboard,
  students: Users,
  parents: UserRound,
  documents: FileText,
  finance: CreditCard,
  messages: MessageCircle,
  reports: Table2,
  exports: Download,
  notifications: Bell,
};

function uniqueNavItems(items: AdminNavItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.key)) {
      return false;
    }

    seen.add(item.key);
    return true;
  });
}

function pickNavItems(items: AdminNavItem[], keys: string[]) {
  return keys
    .map((key) => items.find((item) => item.key === key))
    .filter((item): item is AdminNavItem => Boolean(item));
}

function AdminSidebarLink({ item }: { item: AdminNavItem }) {
  const Icon = navIconMap[item.key as keyof typeof navIconMap];
  const classes = clsx(
    "group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition",
    item.active && "bg-clay/45 text-ink shadow-sm ring-1 ring-clay/60",
    !item.active && !item.disabled && "text-ink/68 hover:bg-white hover:text-ink hover:shadow-sm",
    item.disabled && "cursor-not-allowed text-ink/35",
  );
  const marker = (
    <span
      className={clsx(
        "h-7 w-1 rounded-full transition",
        item.active ? "bg-pine" : "bg-transparent group-hover:bg-clay/80",
      )}
      aria-hidden="true"
    />
  );
  const content = (
    <>
      {marker}
      {Icon ? <Icon className="h-4 w-4 shrink-0" strokeWidth={2.1} aria-hidden="true" /> : null}
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.devOnlyLabel ? <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] text-ink/55">{item.devOnlyLabel}</span> : null}
    </>
  );

  if (item.href && !item.disabled) {
    return (
      <Link href={item.href} className={classes} aria-current={item.active ? "page" : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <span className={classes} aria-disabled="true">
      {content}
    </span>
  );
}

function AdminNavGroup({
  label,
  items,
}: {
  label: string;
  items: AdminNavItem[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-2 px-4 text-[11px] font-bold uppercase tracking-normal text-ink/38">{label}</div>
      <div className="space-y-1">
        {items.map((item) => (
          <AdminSidebarLink key={item.key} item={item} />
        ))}
      </div>
    </div>
  );
}

export async function AdminShell({
  mobileNumber,
  adminId,
  navItems,
  title,
  subtitle,
  children,
}: {
  mobileNumber: string;
  adminId?: string;
  navItems: AdminNavItem[];
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const admin = adminId ? { id: adminId } : await getAdminSession();
  const unreadMessagesCount = await getAdminUnreadMessageCount();
  const notificationSummary = await getUserNotificationSummary(admin.id);
  const normalizedNavItems = uniqueNavItems(navItems);
  const primaryItems = pickNavItems(normalizedNavItems, primaryNavKeys);
  const secondaryItems = pickNavItems(normalizedNavItems, secondaryNavKeys);
  const contextualItems = normalizedNavItems.filter(
    (item) => !primaryNavKeys.includes(item.key) && !secondaryNavKeys.includes(item.key),
  );
  const activeBaseItem =
    normalizedNavItems.find((item) => item.active && (primaryNavKeys.includes(item.key) || secondaryNavKeys.includes(item.key))) ??
    primaryItems.find((item) => item.active) ??
    secondaryItems.find((item) => item.active);

  return (
    <div className="min-h-screen overflow-x-hidden bg-mist/35">
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] gap-0 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <aside className="border-b border-black/10 bg-white/92 px-4 py-4 shadow-soft backdrop-blur lg:sticky lg:top-0 lg:col-start-2 lg:row-start-1 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-l lg:px-5">
          <div className="flex items-center justify-between gap-3 lg:block">
            <InstitutionLogo size="sm" />
            <div className="rounded-full bg-mist px-3 py-1 text-xs font-bold text-pine lg:mt-4 lg:inline-flex">
              لوحة الإدارة
            </div>
          </div>

          <nav className="mt-5 flex gap-3 overflow-x-auto pb-1 lg:flex-1 lg:flex-col lg:gap-7 lg:overflow-visible lg:pb-0">
            <div className="min-w-[15rem] lg:min-w-0">
              <AdminNavGroup label="العمليات الرئيسية" items={primaryItems} />
            </div>
            <div className="min-w-[15rem] lg:min-w-0">
              <AdminNavGroup label="المتابعة" items={secondaryItems} />
            </div>
            {contextualItems.length > 0 ? (
              <div className="min-w-[15rem] lg:min-w-0">
                <AdminNavGroup label="السياق الحالي" items={contextualItems} />
              </div>
            ) : null}
          </nav>

          <div className="mt-5 hidden border-t border-black/10 pt-4 lg:block">
            <div className="rounded-2xl bg-sand px-3 py-3">
              <div className="text-xs font-bold text-ink">حساب الإدارة</div>
              <div className="mt-1 break-all text-xs leading-5 text-ink/58">{mobileNumber}</div>
            </div>
            <form action="/auth/logout" method="post" className="mt-3">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-bold text-ink transition hover:bg-sand"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                تسجيل الخروج
              </button>
            </form>
          </div>
        </aside>

        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <div className="sticky top-0 z-30 border-b border-black/5 bg-sand/85 px-4 py-3 backdrop-blur md:px-6">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-xs font-bold text-ink/48">
                  لوحة الإدارة{activeBaseItem ? ` / ${activeBaseItem.label}` : ""}
                </div>
                <div className="mt-0.5 truncate text-sm font-bold text-ink">{title}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
              <NotificationBell
                unreadCount={notificationSummary.unreadCount}
                notifications={notificationSummary.notifications}
                fullPageHref="/admin/notifications"
              />
              <Link
                href="/admin/messages"
                className="relative inline-flex h-9 items-center justify-center rounded-full border border-black/10 bg-white px-3 text-xs font-bold text-ink transition hover:bg-mist"
              >
                الرسائل
                {unreadMessagesCount > 0 ? (
                  <span className="mr-2 rounded-full bg-pine px-2 py-0.5 text-[10px] text-white">
                    {unreadMessagesCount}
                  </span>
                ) : null}
              </Link>
              <form action="/auth/logout" method="post" className="lg:hidden">
                <button
                  type="submit"
                  className="inline-flex h-9 items-center justify-center rounded-full border border-black/10 bg-white px-3 text-xs font-bold text-ink transition hover:bg-mist"
                >
                  تسجيل الخروج
                </button>
              </form>
            </div>
          </div>
          </div>

          <main className="mx-auto w-full max-w-6xl px-4 py-5 md:px-6 md:py-7">
            <header className="mb-5 flex flex-col gap-3 border-b border-black/10 pb-5 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0">
                <div className="text-xs font-bold text-pine/70">
                  {activeBaseItem?.label ?? "لوحة الإدارة"}
                </div>
                <h1 className="mt-1 text-2xl font-extrabold text-ink md:text-3xl">{title}</h1>
                {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/62">{subtitle}</p> : null}
              </div>
            </header>

            <div className="space-y-5">{children}</div>

            <footer className="mt-8 text-center text-[11px] leading-6 text-ink/45">
              جميع محتويات هذه المنصة محفوظة الحقوق لمؤسسة مستقبل اللغات، ولا يجوز نسخها أو اقتباسها أو إعادة استخدامها بأي شكل دون إذن خطي مسبق.
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
