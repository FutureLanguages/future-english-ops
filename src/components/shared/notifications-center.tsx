"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle, CreditCard, FileText, MessageCircle, ScrollText } from "lucide-react";
import clsx from "clsx";

type NotificationItem = {
  id: string;
  title: string;
  description: string | null;
  type: "MESSAGE" | "DOCUMENT" | "PAYMENT" | "AGREEMENT";
  actorName: string | null;
  actorRole: string | null;
  isRead: boolean;
  link: string | null;
  createdAt: string;
};

const typeFilters = [
  { key: "all", label: "الكل" },
  { key: "messages", label: "الرسائل" },
  { key: "documents", label: "المستندات" },
  { key: "payments", label: "المدفوعات" },
  { key: "agreements", label: "المواثيق" },
] as const;

const typeConfig = {
  MESSAGE: { label: "رسالة", Icon: MessageCircle, className: "bg-mist text-pine" },
  DOCUMENT: { label: "مستند", Icon: FileText, className: "bg-sand text-ink" },
  PAYMENT: { label: "مدفوعات", Icon: CreditCard, className: "bg-clay/35 text-ink" },
  AGREEMENT: { label: "ميثاق", Icon: ScrollText, className: "bg-pine text-white" },
} as const;

const actorRoleLabels: Record<string, string> = {
  admin: "الإدارة",
  student: "الطالب",
  parent: "ولي الأمر",
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function NotificationsCenter({
  notifications,
  activeFilter,
  basePath,
}: {
  notifications: NotificationItem[];
  activeFilter: string;
  basePath: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState(notifications);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const unreadCount = useMemo(() => items.filter((item) => !item.isRead).length, [items]);

  function markAllAsRead() {
    if (isPending || unreadCount === 0) {
      return;
    }

    setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    setToast("تم تعليم جميع الإشعارات كمقروءة");
    startTransition(async () => {
      await fetch("/api/notifications/read-all", { method: "POST" });
      router.refresh();
    });
  }

  function openNotification(notification: NotificationItem) {
    if (!notification.isRead) {
      setItems((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item,
        ),
      );
    }

    startTransition(async () => {
      await fetch(`/api/notifications/${notification.id}/read`, { method: "POST" });
      if (notification.link) {
        router.push(notification.link);
      }
    });
  }

  function markSingleAsRead(notification: NotificationItem) {
    if (notification.isRead) {
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, isRead: true } : item,
      ),
    );

    startTransition(async () => {
      const response = await fetch(`/api/notifications/${notification.id}/read`, { method: "POST" });
      if (!response.ok) {
        setItems((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, isRead: false } : item,
          ),
        );
        setToast("تعذر تحديث الإشعار حالياً");
        return;
      }

      setToast("تم تعليم الإشعار كمقروء");
    });
  }

  return (
    <div className="space-y-5">
      {toast ? (
        <div className="rounded-2xl bg-[#e9f7ee] px-4 py-3 text-sm font-semibold text-[#1b7a43] shadow-soft">
          {toast}
        </div>
      ) : null}

      <section className="rounded-panel bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-pine" />
              <h2 className="text-lg font-bold text-ink">مركز الإشعارات</h2>
            </div>
            <p className="mt-1 text-sm leading-6 text-ink/60">الأحدث أولًا، ويمكن تصفيتها حسب النوع.</p>
          </div>
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={isPending || unreadCount === 0}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-pine px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            <span>{isPending ? "جارٍ التحديث..." : "تعليم الكل كمقروء"}</span>
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {typeFilters.map((filter) => (
            <Link
              key={filter.key}
              href={filter.key === "all" ? basePath : `${basePath}?type=${filter.key}`}
              className={clsx(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                activeFilter === filter.key
                  ? "bg-pine text-white"
                  : "border border-black/10 bg-white text-ink hover:bg-sand",
              )}
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        {items.length > 0 ? (
          items.map((notification) => {
            const config = typeConfig[notification.type];
            const Icon = config.Icon;

            return (
              <article
                key={notification.id}
                className={clsx(
                  "rounded-panel border border-black/5 bg-white p-4 shadow-soft transition",
                  !notification.isRead && "ring-1 ring-pine/20",
                )}
              >
                <button
                  type="button"
                  onClick={() => openNotification(notification)}
                  className="block w-full text-right"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${config.className}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {config.label}
                        </span>
                        {!notification.isRead ? (
                          <span className="rounded-full bg-clay/35 px-3 py-1 text-xs font-bold text-ink">
                            جديد
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-3 text-base font-bold leading-7 text-ink">{notification.title}</h3>
                      {notification.description ? (
                        <p className="mt-1 text-sm leading-6 text-ink/65">{notification.description}</p>
                      ) : null}
                      {notification.actorName || notification.actorRole ? (
                      <p className="mt-2 text-xs leading-5 text-ink/50">
                          {notification.actorRole
                            ? actorRoleLabels[notification.actorRole] ?? notification.actorRole
                            : ""}
                          {notification.actorName ? ` - ${notification.actorName}` : ""}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-xs text-ink/45">{formatTime(notification.createdAt)}</div>
                  </div>
                </button>
                {!notification.isRead ? (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => markSingleAsRead(notification)}
                      className="rounded-full border border-black/10 bg-sand px-3 py-1.5 text-xs font-semibold text-ink hover:bg-mist"
                    >
                      تمت قراءته
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })
        ) : (
          <div className="rounded-panel bg-white p-8 text-center shadow-soft">
            <div className="text-base font-bold text-ink">لا توجد إشعارات</div>
            <p className="mt-2 text-sm leading-6 text-ink/55">
              ستظهر هنا الإشعارات الجديدة عند حدوث نشاط مهم، مثل الرسائل أو المستندات أو تحديثات المدفوعات.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
