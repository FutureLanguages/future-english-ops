"use client";

import { useEffect, useRef, useState, useTransition } from "react";

type MessageView = {
  id: string;
  body: string;
  createdAt: Date | string;
  threadType: "STUDENT" | "PARENT";
  senderRole: "ADMIN" | "STUDENT" | "PARENT";
  senderLabel: string;
  senderMobileNumber: string;
  isAdminMessage: boolean;
  isCurrentUser: boolean;
  seen?: boolean;
  read?: boolean;
};

type ThreadView = {
  type: "STUDENT" | "PARENT";
  label: string;
  unreadCount: number;
  lastActivityAt: Date | string | null;
  messages: MessageView[];
};

function formatMessageTime(value: Date | string) {
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(new Date(value));
}

export function MessageThreadsPanel({
  applicationId,
  initialThreads,
  initialActiveThread,
  endpoint,
  readEndpoint,
}: {
  applicationId: string;
  initialThreads: ThreadView[];
  initialActiveThread: "STUDENT" | "PARENT";
  endpoint: string;
  readEndpoint: string;
}) {
  const [threads, setThreads] = useState(initialThreads);
  const [activeThread, setActiveThread] = useState(initialActiveThread);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const currentThread = threads.find((thread) => thread.type === activeThread) ?? threads[0];
  const lastActivityLabel = currentThread?.lastActivityAt
    ? formatMessageTime(currentThread.lastActivityAt)
    : "لا يوجد نشاط بعد";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [currentThread?.messages.length, activeThread]);

  useEffect(() => {
    if (!toast && !error) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setToast(null);
      setError(null);
    }, 3200);

    return () => window.clearTimeout(timeout);
  }, [toast, error]);

  function sendMessage() {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isPending || !currentThread) {
      return;
    }

    setError(null);
    setToast(null);
    startTransition(async () => {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationId,
          threadType: currentThread.type,
          message: trimmedMessage,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(
          payload?.error === "thread_not_allowed"
            ? "هذه المحادثة غير متاحة لهذا الحساب."
            : "تعذر إرسال الرسالة حالياً.",
        );
        return;
      }

      const payload = (await response.json()) as { message: MessageView };
      setThreads((current) =>
        current.map((thread) =>
          thread.type === currentThread.type
            ? { ...thread, messages: [...thread.messages, payload.message], unreadCount: 0 }
            : thread,
        ),
      );
      setMessage("");
      setToast("تم إرسال الرسالة");
    });
  }

  function markThreadRead(threadType: "STUDENT" | "PARENT", messageId: string) {
    if (isPending) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const response = await fetch(readEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationId,
          threadType,
          messageId,
        }),
      });

      if (!response.ok) {
        setError("تعذر تحديث حالة القراءة حالياً.");
        return;
      }

      setThreads((current) =>
        current.map((thread) =>
          thread.type === threadType
            ? {
                ...thread,
                unreadCount: 0,
                messages: thread.messages.map((item) =>
                  item.threadType === threadType && !item.isCurrentUser ? { ...item, read: true } : item,
                ),
              }
            : thread,
        ),
      );
      setToast("تم تحديث حالة القراءة");
    });
  }

  if (!currentThread) {
    return null;
  }

  return (
    <div className="space-y-4">
      {(toast || error) ? (
        <div
          className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
            toast ? "bg-[#e9f7ee] text-[#1b7a43]" : "bg-[#ffe8e8] text-[#a03232]"
          }`}
        >
          {toast ?? error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {threads.map((thread) => (
          <button
            key={thread.type}
            type="button"
            onClick={() => setActiveThread(thread.type)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              activeThread === thread.type
                ? "bg-pine text-white"
                : "border border-black/10 bg-white text-ink hover:bg-sand"
            }`}
          >
            {thread.label}
            {thread.unreadCount > 0 ? (
              <span className="mr-2 rounded-full bg-clay px-2 py-0.5 text-[10px] text-ink">
                {thread.unreadCount}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-panel bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-ink">{currentThread.label}</h3>
              <p className="mt-1 text-xs text-ink/50">آخر نشاط: {lastActivityLabel}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {currentThread.unreadCount > 0 ? (
                <span className="rounded-full bg-clay/35 px-3 py-1 text-xs font-semibold text-ink">
                  غير مقروء: {currentThread.unreadCount}
                </span>
              ) : null}
              <span className="rounded-full bg-mist px-3 py-1 text-xs font-semibold text-pine">
                {currentThread.messages.length} رسالة
              </span>
            </div>
          </div>
          <div className="max-h-[560px] space-y-3 overflow-y-auto scroll-smooth">
            {currentThread.messages.length > 0 ? (
              currentThread.messages.map((item) => (
                <div
                  key={item.id}
                  className={`flex ${item.isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      item.isCurrentUser ? "bg-pine text-white" : "bg-sand text-ink"
                    }`}
                  >
                    <div
                      className={`mb-1 flex flex-wrap items-center justify-between gap-3 text-xs ${
                        item.isCurrentUser ? "text-white/70" : "text-ink/55"
                      }`}
                    >
                      <span>{item.senderLabel}</span>
                      <span>{formatMessageTime(item.createdAt)}</span>
                    </div>
                    <div>{item.body}</div>
                    {item.isCurrentUser ? (
                      <div
                        className={`mt-2 text-left text-[11px] ${
                          item.isCurrentUser ? "text-white/70" : "text-ink/45"
                        }`}
                        title={item.seen ? "تمت المشاهدة" : "تم الإرسال"}
                      >
                        ✓✓ {item.seen ? "تمت المشاهدة" : "تم الإرسال"}
                      </div>
                    ) : !item.read ? (
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="text-[11px] text-ink/45">غير مقروءة</div>
                        <button
                          type="button"
                          onClick={() => markThreadRead(currentThread.type, item.id)}
                          className="text-[11px] font-semibold text-pine"
                          title="تحديد الرسالة كمقروءة"
                        >
                          ✓ تمت القراءة
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2 text-left text-[11px] text-ink/45">✓ تمت القراءة</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-sand px-4 py-5 text-center">
                <div className="text-sm font-bold text-ink">لا توجد رسائل بعد</div>
                <div className="mt-1 text-sm leading-6 text-ink/55">
                  ابدأ المحادثة من النموذج الجانبي، وستظهر الرسائل هنا بشكل مرتب.
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="rounded-panel bg-white p-5 shadow-soft">
          <h3 className="text-lg font-bold text-ink">إرسال رسالة جديدة</h3>
          <p className="mt-1 text-sm leading-6 text-ink/65">
            اكتب رسالتك بوضوح، وسيتم إضافتها داخل المحادثة الحالية بدون إعادة تحميل الصفحة.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-ink">نص الرسالة</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={6}
                placeholder={`اكتب رسالة في ${currentThread.label}`}
                className="w-full rounded-2xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none"
              />
            </label>
            <div>
              <button
                type="button"
                onClick={sendMessage}
                disabled={isPending || message.trim().length === 0}
                className="rounded-2xl bg-pine px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "جارٍ الإرسال..." : "إرسال الرسالة"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
