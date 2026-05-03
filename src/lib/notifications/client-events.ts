export const notificationsReadEventName = "future-languages:notifications-read";

export type NotificationsReadEventDetail =
  | {
      all: true;
    }
  | {
      notificationIds: string[];
    };

export function dispatchNotificationsRead(detail: NotificationsReadEventDetail) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<NotificationsReadEventDetail>(notificationsReadEventName, { detail }));
}
