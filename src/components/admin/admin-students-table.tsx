"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DashboardStatusBadge } from "@/components/portal/dashboard-status";
import { AdminExportTrigger } from "@/components/admin/admin-export-trigger";
import { UserIdentity } from "@/components/shared/user-identity";
import type { AdminApplicationRow } from "@/types/admin";

export function AdminStudentsTable({
  rows,
  filters,
}: {
  rows: AdminApplicationRow[];
  filters: {
    q?: string;
    status?: string;
    view?: string;
  };
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const allIds = useMemo(() => rows.map((row) => row.id), [rows]);

  function toggleSelection(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function toggleAll() {
    setSelectedIds((current) => (current.length === allIds.length ? [] : allIds));
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-panel bg-white p-6 shadow-soft text-sm text-ink/60">
        لا توجد نتائج مطابقة للفلاتر الحالية.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-panel bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-ink">تصدير بيانات الطلبات</h2>
            <p className="text-sm text-ink/60">
              يمكنك تصدير كل النتائج الحالية أو الصفوف المحددة فقط.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-ink/70">
              <input
                type="checkbox"
                checked={selectedIds.length === allIds.length}
                onChange={toggleAll}
              />
              <span>تحديد الكل</span>
            </label>
            <AdminExportTrigger
              title="تصدير البيانات"
              currentFilters={filters}
              selectedIds={selectedIds}
            />
          </div>
        </div>
      </section>

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="rounded-panel bg-white p-5 shadow-soft transition hover:-translate-y-0.5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selectedIds.includes(row.id)}
                  onChange={() => toggleSelection(row.id)}
                  aria-label={`تحديد ${row.studentName}`}
                />
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <UserIdentity name={row.studentName} typeLabel="الطالب" compact />
                    <DashboardStatusBadge status={row.status} />
                  </div>
                  <div className="text-sm text-ink/60">ولي الأمر: {row.parentMobileNumber}</div>
                  <div className="text-sm text-ink/60">المدينة: {row.city}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:min-w-[320px]">
                <div className="rounded-2xl bg-sand px-3 py-3">
                  <div className="text-xs font-medium text-ink/55">الاكتمال</div>
                  <div className="mt-1 text-base font-bold text-ink">{row.completionPercent}%</div>
                </div>
                <div className="rounded-2xl bg-sand px-3 py-3">
                  <div className="text-xs font-medium text-ink/55">المتبقي</div>
                  <div className="mt-1 text-base font-bold text-ink">{row.remainingAmountSar} ر.س</div>
                </div>
                <div className="rounded-2xl bg-sand px-3 py-3">
                  <div className="text-xs font-medium text-ink/55">مستندات ناقصة</div>
                  <div className="mt-1 text-base font-bold text-ink">{row.missingDocumentsCount}</div>
                </div>
                <div className="rounded-2xl bg-sand px-3 py-3">
                  <div className="text-xs font-medium text-ink/55">تحتاج مراجعة</div>
                  <div className="mt-1 text-base font-bold text-ink">{row.documentsNeedingReviewCount}</div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-ink/55">
                آخر تحديث: {new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(row.updatedAt)}
              </span>
              <Link href={`/admin/students/${row.id}`} className="font-semibold text-pine">
                فتح الملف
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
