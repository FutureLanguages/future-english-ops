import { NotificationType } from "@prisma/client";

type NotificationPresentationInput = {
  type: NotificationType;
  isRead: boolean;
  link: string | null;
  title: string;
  description: string | null;
};

export function deriveNotificationPresentation(notification: NotificationPresentationInput) {
  const base =
    notification.type === NotificationType.PAYMENT
      ? {
          importance: "critical" as const,
          groupLabel: "مالية",
          actionLabel: "متابعة المدفوعات",
        }
      : notification.type === NotificationType.AGREEMENT
        ? {
            importance: "actionable" as const,
            groupLabel: "ميثاق",
            actionLabel: "فتح الميثاق",
          }
        : notification.type === NotificationType.DOCUMENT
          ? {
              importance: "actionable" as const,
              groupLabel: "مستندات",
              actionLabel: "متابعة المستند",
            }
          : {
              importance: "informational" as const,
              groupLabel: "رسائل",
              actionLabel: "فتح الرسائل",
            };

  const isActionable = Boolean(notification.link) || base.importance !== "informational";

  return {
    ...base,
    isActionable,
    priority:
      !notification.isRead && base.importance === "critical"
        ? 1
        : !notification.isRead && base.importance === "actionable"
          ? 2
          : !notification.isRead
            ? 3
            : base.importance === "critical"
              ? 4
              : 5,
  };
}
