import { NotificationType } from "@prisma/client";
import { PortalShell } from "@/components/portal/portal-shell";
import { NotificationsCenter } from "@/components/shared/notifications-center";
import { getPortalDevSessionState } from "@/features/auth/server/portal-session";
import { getUserNotifications } from "@/features/notifications/server/notifications";
import { loadPortalApplicationData } from "@/features/portal/server/load-portal-application";
import { buildPortalNavItems } from "@/features/portal/server/nav";
import type { PortalNavItem } from "@/types/portal";

const filterToType: Record<string, NotificationType | undefined> = {
  all: undefined,
  messages: NotificationType.MESSAGE,
  documents: NotificationType.DOCUMENT,
  payments: NotificationType.PAYMENT,
  agreements: NotificationType.AGREEMENT,
};

function buildFallbackNavItems(): PortalNavItem[] {
  return [{ key: "dashboard", label: "الرئيسية", href: "/portal/dashboard" }];
}

export default async function PortalNotificationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string; applicationId?: string }>;
}) {
  const devSession = await getPortalDevSessionState();
  const session = devSession.currentUser;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const activeFilter = resolvedSearchParams?.type ?? "all";
  const [notifications, portalData] = await Promise.all([
    getUserNotifications({
      userId: session.id,
      type: filterToType[activeFilter],
    }),
    loadPortalApplicationData({
      user: session,
      applicationId: resolvedSearchParams?.applicationId,
    }),
  ]);
  const navItems = portalData
    ? [
        ...buildPortalNavItems({
          activeKey: "notifications",
          canSeePayments: portalData.canSeePayments,
          applicationId: portalData.applicationRecord.id,
          agreements:
            portalData.applications.find((application) => application.id === portalData.applicationRecord.id)
              ?.agreements ?? [],
        }),
        {
          key: "notifications",
          label: "الإشعارات",
          href: `/portal/notifications?applicationId=${portalData.applicationRecord.id}`,
          active: true,
        },
      ]
    : buildFallbackNavItems();

  return (
    <PortalShell
      role={session.role}
      studentName={portalData?.applicationRecord.studentProfile?.fullNameAr ?? undefined}
      activeUserLabel={session.role === "STUDENT" ? "طالب" : "ولي أمر"}
      activeMobileNumber={session.mobileNumber}
      navItems={navItems}
      isDev={devSession.isDev}
      devUsers={devSession.availableUsers}
      currentUserId={session.id}
    >
      <NotificationsCenter
        notifications={notifications}
        activeFilter={filterToType[activeFilter] ? activeFilter : "all"}
        basePath={
          portalData
            ? `/portal/notifications?applicationId=${portalData.applicationRecord.id}`
            : "/portal/notifications"
        }
      />
    </PortalShell>
  );
}
