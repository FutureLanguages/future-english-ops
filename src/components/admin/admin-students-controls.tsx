"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const statuses = [
  ["", "كل الحالات"],
  ["NEW", "جديد"],
  ["INCOMPLETE", "توجد نواقص"],
  ["UNDER_REVIEW", "قيد المراجعة"],
  ["WAITING_PAYMENT", "بانتظار السداد"],
  ["COMPLETED", "مكتمل"],
];

const presetViews = [
  { key: "all", label: "الكل", description: "كل الطلبات" },
  { key: "needs_action", label: "يحتاج إجراء", description: "عمل إداري مفتوح" },
  { key: "missing_documents", label: "ناقص مستندات", description: "ملفات ناقصة أو إعادة رفع" },
  { key: "outstanding_payment", label: "متبقٍ مالي", description: "رصيد يحتاج متابعة" },
  { key: "unread_messages", label: "رسائل غير مقروءة", description: "محادثات تحتاج قراءة" },
  { key: "completed", label: "مكتمل", description: "طلبات مكتملة" },
] as const;

type PresetKey = (typeof presetViews)[number]["key"];

export function AdminStudentsControls({
  filters,
  presetCounts,
}: {
  filters: {
    q: string;
    status: string;
    view: PresetKey;
    sort: string;
  };
  presetCounts: Record<PresetKey, number>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(filters.q);
  const [status, setStatus] = useState(filters.status);
  const [sort, setSort] = useState(filters.sort);
  const [view, setView] = useState<PresetKey>(filters.view);

  function apply(next?: Partial<{ q: string; status: string; sort: string; view: PresetKey }>) {
    const nextState = {
      q,
      status,
      sort,
      view,
      ...next,
    };
    const params = new URLSearchParams();
    if (nextState.q.trim()) params.set("q", nextState.q.trim());
    if (nextState.status) params.set("status", nextState.status);
    if (nextState.sort !== "priority") params.set("sort", nextState.sort);
    params.set("view", nextState.view);

    startTransition(() => {
      router.replace(`/admin/students?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-soft">
      <form
        className="grid gap-3 lg:grid-cols-[minmax(14rem,1.4fr)_12rem_13rem_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          apply();
        }}
      >
        <input
          type="search"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="ابحث باسم الطالب أو رقم ولي الأمر"
          className="rounded-xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine/40 focus:bg-white"
        />
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            apply({ status: event.target.value });
          }}
          className="rounded-xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine/40 focus:bg-white"
        >
          {statuses.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(event) => {
            setSort(event.target.value);
            apply({ sort: event.target.value });
          }}
          className="rounded-xl border border-black/10 bg-sand px-4 py-3 text-sm outline-none transition focus:border-pine/40 focus:bg-white"
          aria-label="ترتيب النتائج"
        >
          <option value="priority">الأولوية التشغيلية</option>
          <option value="name_asc">الاسم أ-ي</option>
          <option value="status">حالة الطلب</option>
          <option value="documents_desc">الأكثر احتياجاً للمستندات</option>
          <option value="financial_desc">الأعلى متبقياً مالياً</option>
          <option value="messages_desc">الأكثر رسائل غير مقروءة</option>
          <option value="updated_desc">آخر تحديث</option>
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-pine px-5 py-3 text-sm font-bold text-white transition hover:bg-pine/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "جاري التحديث..." : "تطبيق"}
        </button>
      </form>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {presetViews.map((preset) => {
          const active = view === preset.key;
          const count = presetCounts[preset.key];

          return (
            <button
              type="button"
              key={preset.key}
              onClick={() => {
                setView(preset.key);
                apply({ view: preset.key });
              }}
              disabled={isPending}
              className={`min-w-[9rem] whitespace-nowrap rounded-2xl px-3 py-2 text-right text-xs transition disabled:opacity-60 ${
                active
                  ? "bg-pine text-white shadow-soft"
                  : "border border-black/10 bg-sand text-ink/70 hover:bg-white hover:text-ink"
              }`}
            >
              <span className="flex items-center justify-between gap-3 font-extrabold">
                <span>{preset.label}</span>
                <span className={active ? "text-white/80" : "text-ink/45"}>{count}</span>
              </span>
              <span className={`mt-1 block text-[11px] font-semibold ${active ? "text-white/70" : "text-ink/45"}`}>
                {preset.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
