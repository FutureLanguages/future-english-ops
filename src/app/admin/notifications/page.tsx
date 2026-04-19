import { NotificationType } from "@prisma/client";
import { AdminShell } from "@/components/admin/admin-shell";
import { NotificationsCenter } from "@/components/shared/notifications-center";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { getAdminNavItems } from "@/features/admin/server/nav";
import { getUserNotifications } from "@/features/notifications/server/notifications";

const filterToType: Record<string, NotificationType | undefined> = {
  all: undefined,
  messages: NotificationType.MESSAGE,
  documents: NotificationType.DOCUMENT,
  payments: NotificationType.PAYMENT,
  agreements: NotificationType.AGREEMENT,
};

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string }>;
}) {
  const session = await getAdminSession();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const activeFilter = resolvedSearchParams?.type ?? "all";
  const notifications = await getUserNotifications({
    userId: session.id,
    type: filterToType[activeFilter],
  });

  return (
    <AdminShell
      mobileNumber={session.mobileNumber}
      navItems={getAdminNavItems("notifications")}
      title="الإشعارات"
      subtitle="متابعة فورية لأهم الرسائل والمستندات والمدفوعات والمواثيق."
    >
      <NotificationsCenter
        notifications={notifications}
        activeFilter={filterToType[activeFilter] ? activeFilter : "all"}
        basePath="/admin/notifications"
      />
    </AdminShell>
  );
}
