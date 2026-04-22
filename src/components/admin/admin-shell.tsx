import Link from "next/link";
import clsx from "clsx";
import { InstitutionLogo } from "@/components/shared/institution-logo";
import { NotificationBell } from "@/components/shared/notification-bell";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { getAdminUnreadMessageCount } from "@/features/messages/server/notifications";
import { getUserNotificationSummary } from "@/features/notifications/server/notifications";
import type { AdminNavItem } from "@/types/admin";

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

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-8 pt-4 md:px-6 md:pt-6">
        <header className="mb-5 rounded-panel bg-white/85 px-4 py-4 shadow-soft backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <InstitutionLogo size="sm" />
              <p className="mt-3 text-sm font-medium text-ink/60">لوحة الإدارة</p>
              <h1 className="text-2xl font-bold text-ink">{title}</h1>
              {subtitle ? <p className="mt-1 text-sm text-ink/65">{subtitle}</p> : null}
            </div>
            <div className="flex max-w-full flex-wrap items-center gap-2">
              <NotificationBell
                unreadCount={notificationSummary.unreadCount}
                notifications={notificationSummary.notifications}
                fullPageHref="/admin/notifications"
              />
              <Link
                href="/admin/dashboard"
                className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:bg-sand"
              >
                الرئيسية
              </Link>
              <Link
                href="/admin/messages"
                className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:bg-sand"
              >
                الرسائل
                {unreadMessagesCount > 0 ? (
                  <span className="mr-2 rounded-full bg-pine px-2 py-0.5 text-[10px] text-white">
                    {unreadMessagesCount}
                  </span>
                ) : null}
              </Link>
              <form action="/auth/logout" method="post">
                <button
                  type="submit"
                  className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:bg-sand"
                >
                  تسجيل الخروج
                </button>
              </form>
              <div className="inline-flex max-w-full min-w-0 items-center gap-2 rounded-full bg-[#11212d] px-3 py-1 text-xs font-semibold text-white">
                <span className="shrink-0">حساب الإدارة</span>
                <span className="min-w-0 break-all">{mobileNumber}</span>
              </div>
            </div>
          </div>

          <nav className="mt-4 flex max-w-full flex-wrap gap-2">
            {navItems.map((item) => {
              const classes = clsx(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                item.active && "bg-pine text-white",
                !item.active && !item.disabled && "bg-sand text-ink hover:bg-white",
                item.disabled && "bg-sand/70 text-ink/45",
              );

              if (item.href && !item.disabled) {
                return (
                  <Link key={item.key} href={item.href} className={classes}>
                    {item.label}
                  </Link>
                );
              }

              return (
                <span key={item.key} className={classes}>
                  {item.label}
                  {item.devOnlyLabel ? ` - ${item.devOnlyLabel}` : ""}
                </span>
              );
            })}
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-8 text-center text-[11px] leading-6 text-ink/45">
          جميع محتويات هذه المنصة محفوظة الحقوق لمؤسسة مستقبل اللغات، ولا يجوز نسخها أو اقتباسها أو إعادة استخدامها بأي شكل دون إذن خطي مسبق.
        </footer>
      </div>
    </div>
  );
}
