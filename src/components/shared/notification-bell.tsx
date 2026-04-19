"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Bell } from "lucide-react";
import clsx from "clsx";

type NotificationItem = {
  id: string;
  title: string;
  description: string | null;
  actorName: string | null;
  actorRole: string | null;
  isRead: boolean;
  link: string | null;
  createdAt: string;
};

const actorRoleLabels: Record<string, string> = {
  admin: "الإدارة",
  student: "الطالب",
  parent: "ولي الأمر",
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function NotificationBell({
  unreadCount,
  notifications,
  fullPageHref,
}: {
  unreadCount: number;
  notifications: NotificationItem[];
  fullPageHref?: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState(notifications);
  const [count, setCount] = useState(unreadCount);
  const [mounted, setMounted] = useState(false);
  const [panelStyle, setPanelStyle] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 16,
    width: 352,
  });
  const [, startTransition] = useTransition();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function updatePosition() {
      if (!buttonRef.current) {
        return;
      }

      const rect = buttonRef.current.getBoundingClientRect();
      const width = Math.min(352, window.innerWidth - 24);
      const left = Math.min(Math.max(12, rect.left + rect.width - width), window.innerWidth - width - 12);
      setPanelStyle({
        top: rect.bottom + 8,
        left,
        width,
      });
    }

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("mousedown", onPointerDown);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [isOpen]);

  function openNotification(notification: NotificationItem) {
    if (!notification.isRead) {
      setItems((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item,
        ),
      );
      setCount((current) => Math.max(current - 1, 0));
    }

    startTransition(async () => {
      try {
        await fetch(`/api/notifications/${notification.id}/read`, {
          method: "POST",
        });
        if (notification.link) {
          router.push(notification.link);
        }
      } catch {
        setItems((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, isRead: false } : item,
          ),
        );
        setCount((current) => current + 1);
      }
    });
  }

  function markNotificationAsRead(notification: NotificationItem) {
    if (notification.isRead) {
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, isRead: true } : item,
      ),
    );
    setCount((current) => Math.max(current - 1, 0));

    startTransition(async () => {
      const response = await fetch(`/api/notifications/${notification.id}/read`, {
        method: "POST",
      });

      if (!response.ok) {
        setItems((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, isRead: false } : item,
          ),
        );
        setCount((current) => current + 1);
      }
    });
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-ink transition hover:bg-sand"
        title="الإشعارات"
        aria-label="الإشعارات"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {count > 0 ? (
          <span className="absolute -left-1 -top-1 min-w-5 rounded-full bg-pine px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
            {count}
          </span>
        ) : null}
      </button>

      {isOpen && mounted
        ? createPortal(
        <div
          ref={panelRef}
          className="fixed z-[120] overflow-hidden rounded-3xl border border-black/10 bg-white shadow-soft"
          style={{
            top: panelStyle.top,
            left: panelStyle.left,
            width: panelStyle.width,
          }}
        >
          <div className="border-b border-black/10 px-4 py-3">
            <div className="text-sm font-bold text-ink">الإشعارات</div>
            <div className="mt-1 text-xs leading-5 text-ink/55">
              {count > 0 ? `${count} غير مقروء` : "لا توجد إشعارات غير مقروءة"}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length > 0 ? (
              items.map((notification) => (
                <div
                  key={notification.id}
                  className={clsx(
                    "border-b border-black/5 px-4 py-3 transition last:border-b-0 hover:bg-sand/60",
                    !notification.isRead && "bg-mist/45",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => openNotification(notification)}
                    className="block w-full text-right"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-bold leading-6 text-ink">{notification.title}</div>
                        {notification.actorName || notification.actorRole ? (
                          <div className="mt-1 text-xs text-ink/55">
                            {notification.actorRole ? actorRoleLabels[notification.actorRole] ?? notification.actorRole : ""}
                            {notification.actorName ? ` - ${notification.actorName}` : ""}
                          </div>
                        ) : null}
                        {notification.description ? (
                          <div className="mt-1 line-clamp-2 text-xs leading-5 text-ink/65">
                            {notification.description}
                          </div>
                        ) : null}
                      </div>
                      {!notification.isRead ? (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-pine" aria-hidden="true" />
                      ) : null}
                    </div>
                    <div className="mt-2 text-[11px] text-ink/45">
                      {formatTime(notification.createdAt)}
                    </div>
                  </button>
                  {!notification.isRead ? (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => markNotificationAsRead(notification)}
                        className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-[11px] font-semibold text-ink hover:bg-sand"
                      >
                        تمت قراءته
                      </button>
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center">
                <div className="text-sm font-bold text-ink">لا توجد إشعارات بعد</div>
                <div className="mt-1 text-xs leading-5 text-ink/55">
                  ستظهر هنا التحديثات الجديدة عند وجود رسائل أو مراجعات أو تغييرات مهمة.
                </div>
              </div>
            )}
          </div>
          {fullPageHref ? (
            <button
              type="button"
              onClick={() => router.push(fullPageHref)}
              className="block w-full border-t border-black/10 bg-sand px-4 py-3 text-center text-xs font-bold text-pine transition hover:bg-mist"
            >
              عرض كل الإشعارات
            </button>
          ) : null}
        </div>,
        document.body,
      ) : null}
    </div>
  );
}
