import Link from "next/link";
import { PortalBottomNav } from "@/components/portal/portal-bottom-nav";
import { PortalDevSwitcher } from "@/components/portal/portal-dev-switcher";
import { PortalQuickNav } from "@/components/portal/portal-quick-nav";
import { InstitutionLogo } from "@/components/shared/institution-logo";
import { NotificationBell } from "@/components/shared/notification-bell";
import { UserIdentity } from "@/components/shared/user-identity";
import { getPortalAgreementStatus } from "@/features/agreements/server/agreements";
import { getPortalSession } from "@/features/auth/server/portal-session";
import { getPortalUnreadMessageCount } from "@/features/messages/server/notifications";
import { getUserNotificationSummary } from "@/features/notifications/server/notifications";
import type { PortalDevUserOption, PortalNavItem } from "@/types/portal";

const roleLabels = {
  STUDENT: "طالب",
  PARENT: "ولي أمر",
} as const;

export async function PortalShell({
  role,
  studentName,
  activeUserLabel,
  activeMobileNumber,
  statusSlot,
  navItems,
  isDev,
  devUsers,
  currentUserId,
  children,
}: {
  role: "STUDENT" | "PARENT";
  studentName?: string;
  activeUserLabel?: string;
  activeMobileNumber?: string;
  statusSlot?: React.ReactNode;
  navItems: PortalNavItem[];
  isDev?: boolean;
  devUsers?: PortalDevUserOption[];
  currentUserId?: string;
  children: React.ReactNode;
}) {
  const [unreadMessagesCount, currentUser] = await Promise.all([
    getPortalUnreadMessageCount(),
    getPortalSession(),
  ]);
  const [agreementStatus, notificationSummary] = await Promise.all([
    getPortalAgreementStatus(currentUser),
    getUserNotificationSummary(currentUser.id),
  ]);
  const dashboardHref = navItems.find((item) => item.key === "dashboard")?.href ?? "/portal/dashboard";
  const messagesHref = navItems.find((item) => item.key === "messages")?.href ?? "/portal/messages";
  const agreementHref = navItems.find((item) => item.key === "agreements")?.href ?? "/portal/agreements";

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 pb-8 pt-4 md:px-6 md:pt-6">
        <header className="mb-5 rounded-panel bg-white/85 px-4 py-3 shadow-soft backdrop-blur">
          <div className="flex flex-col gap-4">
            <div className="min-w-0">
              <InstitutionLogo size="sm" />
              <div className="mt-1">
                <UserIdentity
                  name={studentName ?? "بوابة البرنامج"}
                  typeLabel={activeUserLabel ?? roleLabels[role]}
                  mobileNumber={activeMobileNumber}
                />
              </div>
              {isDev ? (
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#11212d] px-3 py-1 text-xs font-semibold text-white">
                  <span>وضع التطوير</span>
                  {activeUserLabel ? <span>{activeUserLabel}</span> : null}
                  {activeMobileNumber ? <span>{activeMobileNumber}</span> : null}
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <NotificationBell
                unreadCount={notificationSummary.unreadCount}
                notifications={notificationSummary.notifications}
                fullPageHref="/portal/notifications"
              />
              <Link
                href={dashboardHref}
                className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:bg-sand"
              >
                الرئيسية
              </Link>
              <Link
                href={messagesHref}
                className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:bg-sand"
              >
                الرسائل
                {unreadMessagesCount > 0 ? (
                  <span className="mr-2 rounded-full bg-pine px-2 py-0.5 text-[10px] text-white">
                    {unreadMessagesCount}
                  </span>
                ) : null}
              </Link>
              <Link
                href={agreementHref}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  agreementStatus.isAccepted
                    ? "border-black/10 bg-white text-ink hover:bg-sand"
                    : "border-[#a03232]/20 bg-[#ffe8e8] text-[#a03232] hover:bg-[#ffe8e8]"
                }`}
              >
                <span className="ml-1">{agreementStatus.isAccepted ? "●" : "●"}</span>
                {agreementStatus.label}
              </Link>
              <form action="/auth/logout" method="post">
                <button
                  type="submit"
                  className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:bg-sand"
                >
                  تسجيل الخروج
                </button>
              </form>
              <Link
                href="/auth/change-password"
                className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-ink transition hover:bg-sand"
              >
                تغيير كلمة المرور
              </Link>
              <span className="rounded-full bg-mist px-3 py-1 text-xs font-semibold text-pine">
                {roleLabels[role]}
              </span>
              {statusSlot}
            </div>
          </div>
        </header>

        {isDev ? (
          <div className="mb-5">
            <PortalDevSwitcher users={devUsers ?? []} currentUserId={currentUserId ?? ""} />
          </div>
        ) : null}

        <PortalQuickNav items={navItems} />

        <main className="flex-1">{children}</main>

        <footer className="mt-8 text-center text-[11px] leading-6 text-ink/45">
          جميع محتويات هذه المنصة محفوظة الحقوق لمؤسسة مستقبل اللغات، ولا يجوز نسخها أو اقتباسها أو إعادة استخدامها بأي شكل دون إذن خطي مسبق.
        </footer>
      </div>

      <PortalBottomNav items={navItems} />
    </div>
  );
}
