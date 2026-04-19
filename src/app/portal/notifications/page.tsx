import { NotificationType } from "@prisma/client";
import { PortalShell } from "@/components/portal/portal-shell";
import { NotificationsCenter } from "@/components/shared/notifications-center";
import { getPortalDevSessionState } from "@/features/auth/server/portal-session";
import { getUserNotifications } from "@/features/notifications/server/notifications";
import type { PortalNavItem } from "@/types/portal";

const filterToType: Record<string, NotificationType | undefined> = {
  all: undefined,
  messages: NotificationType.MESSAGE,
  documents: NotificationType.DOCUMENT,
  payments: NotificationType.PAYMENT,
  agreements: NotificationType.AGREEMENT,
};

function buildNavItems(): PortalNavItem[] {
  return [
    { key: "dashboard", label: "الرئيسية", href: "/portal/dashboard" },
    { key: "documents", label: "المستندات", href: "/portal/documents" },
    { key: "agreements", label: "الميثاق", href: "/portal/agreements" },
    { key: "profile", label: "الملف", href: "/portal/profile" },
    { key: "notifications", label: "الإشعارات", href: "/portal/notifications", active: true },
  ];
}

export default async function PortalNotificationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string }>;
}) {
  const devSession = await getPortalDevSessionState();
  const session = devSession.currentUser;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const activeFilter = resolvedSearchParams?.type ?? "all";
  const notifications = await getUserNotifications({
    userId: session.id,
    type: filterToType[activeFilter],
  });

  return (
    <PortalShell
      role={session.role}
      activeUserLabel={session.role === "STUDENT" ? "طالب" : "ولي أمر"}
      activeMobileNumber={session.mobileNumber}
      navItems={buildNavItems()}
      isDev={devSession.isDev}
      devUsers={devSession.availableUsers}
      currentUserId={session.id}
    >
      <NotificationsCenter
        notifications={notifications}
        activeFilter={filterToType[activeFilter] ? activeFilter : "all"}
        basePath="/portal/notifications"
      />
    </PortalShell>
  );
}
