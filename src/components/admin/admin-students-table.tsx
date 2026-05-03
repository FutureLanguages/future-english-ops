"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AdminExportTrigger } from "@/components/admin/admin-export-trigger";
import { ApplicationStatusBadge } from "@/components/shared/application-status-badge";
import { UserIdentity } from "@/components/shared/user-identity";
import { LoadingLink } from "@/components/shared/loading-link";
import type { AdminApplicationRow } from "@/types/admin";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(value);
}

function formatCurrency(value: number) {
  return `${value} ر.س`;
}

function completionTone(percent: number) {
  if (percent >= 100) return "bg-pine";
  if (percent >= 70) return "bg-clay";
  return "bg-[#a03232]";
}

function OperationalChip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "success" | "warning" | "neutral";
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
        tone === "success"
          ? "bg-mist text-pine"
          : tone === "warning"
            ? "bg-clay/35 text-ink"
            : "bg-sand text-ink/65"
      }`}
    >
      {children}
    </span>
  );
}

function DocumentsState({ row }: { row: AdminApplicationRow }) {
  if (row.documentsNeedingReviewCount > 0) {
    return <OperationalChip tone="warning">للمراجعة: {row.documentsNeedingReviewCount}</OperationalChip>;
  }

  if (row.reuploadCount > 0) {
    return <OperationalChip tone="warning">إعادة رفع: {row.reuploadCount}</OperationalChip>;
  }

  if (row.missingDocumentsCount > 0) {
    return <OperationalChip tone="warning">ناقصة: {row.missingDocumentsCount}</OperationalChip>;
  }

  return <OperationalChip tone="success">لا توجد نواقص</OperationalChip>;
}

const columnDropdownFilters: Record<string, Array<{ value: string; label: string }>> = {
  status: [
    { value: "NEW", label: "جديد" },
    { value: "INCOMPLETE", label: "توجد نواقص" },
    { value: "UNDER_REVIEW", label: "قيد المراجعة" },
    { value: "WAITING_PAYMENT", label: "بانتظار السداد" },
    { value: "COMPLETED", label: "مكتمل" },
  ],
  completion: [
    { value: "__complete__", label: "مكتمل 100%" },
    { value: "__incomplete__", label: "أقل من 100%" },
  ],
  documents: [
    { value: "__documents_review__", label: "بانتظار مراجعة" },
    { value: "__documents_missing__", label: "ناقصة / إعادة رفع" },
    { value: "__documents_clear__", label: "لا توجد نواقص" },
  ],
  financial: [
    { value: "__payment_remaining__", label: "يوجد متبقي" },
    { value: "__payment_clear__", label: "لا يوجد متبقي" },
  ],
  messages: [
    { value: "__messages_unread__", label: "غير مقروءة" },
    { value: "__messages_clear__", label: "لا توجد رسائل" },
  ],
};

export function AdminStudentsTable({
  rows,
  filters,
}: {
  rows: AdminApplicationRow[];
  filters: {
    q?: string;
    status?: string;
    view?: string;
    sort?: string;
  };
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const displayedRows = useMemo(() => {
    const activeFilters = Object.entries(columnFilters)
      .map(([key, value]) => [key, value.trim().toLowerCase()] as const)
      .filter(([, value]) => Boolean(value));
    let nextRows = rows.slice();

    if (activeFilters.length > 0) {
      nextRows = nextRows.filter((row) =>
        activeFilters.every(([key, value]) => {
          if (value === "__complete__") return row.completionPercent >= 100;
          if (value === "__incomplete__") return row.completionPercent < 100;
          if (value === "__documents_review__") return row.documentsNeedingReviewCount > 0;
          if (value === "__documents_missing__") return row.missingDocumentsCount + row.reuploadCount > 0;
          if (value === "__documents_clear__") {
            return row.documentsNeedingReviewCount + row.reuploadCount + row.missingDocumentsCount === 0;
          }
          if (value === "__payment_remaining__") return row.remainingAmountSar > 0;
          if (value === "__payment_clear__") return row.remainingAmountSar <= 0;
          if (value === "__messages_unread__") return row.unreadMessagesCount > 0;
          if (value === "__messages_clear__") return row.unreadMessagesCount === 0;

          const cellValue =
            key === "student"
              ? `${row.studentName} ${row.parentMobileNumber} ${row.city}`
              : key === "status"
                ? row.status
                : key === "completion"
                  ? String(row.completionPercent)
                  : key === "documents"
                    ? String(row.documentsNeedingReviewCount + row.reuploadCount + row.missingDocumentsCount)
                    : key === "financial"
                      ? String(row.remainingAmountSar)
                      : key === "messages"
                        ? String(row.unreadMessagesCount)
                        : key === "nextAction"
                          ? row.nextActionLabel
                          : "";

          return cellValue.toLowerCase().includes(value);
        }),
      );
    }

    if (sortConfig) {
      nextRows.sort((left, right) => {
        const direction = sortConfig.direction === "asc" ? 1 : -1;
        if (sortConfig.key === "student") {
          return left.studentName.localeCompare(right.studentName, "ar") * direction;
        }
        if (sortConfig.key === "completion") {
          return (left.completionPercent - right.completionPercent) * direction;
        }
        if (sortConfig.key === "documents") {
          const leftDocuments = left.documentsNeedingReviewCount + left.reuploadCount + left.missingDocumentsCount;
          const rightDocuments = right.documentsNeedingReviewCount + right.reuploadCount + right.missingDocumentsCount;
          return (leftDocuments - rightDocuments) * direction;
        }
        if (sortConfig.key === "financial") {
          return (left.remainingAmountSar - right.remainingAmountSar) * direction;
        }
        if (sortConfig.key === "messages") {
          return (left.unreadMessagesCount - right.unreadMessagesCount) * direction;
        }
        if (sortConfig.key === "updated") {
          return (left.updatedAt.getTime() - right.updatedAt.getTime()) * direction;
        }
        return left.status.localeCompare(right.status) * direction;
      });
    }

    return nextRows;
  }, [columnFilters, rows, sortConfig]);
  const allIds = useMemo(() => displayedRows.map((row) => row.id), [displayedRows]);
  const allSelected = allIds.length > 0 && selectedIds.length === allIds.length;

  function toggleSort(key: string) {
    setSortConfig((current) => {
      if (current?.key !== key) {
        return { key, direction: "asc" };
      }
      if (current.direction === "asc") {
        return { key, direction: "desc" };
      }
      return null;
    });
  }

  function renderColumnControl(key: string, label: string) {
    const dropdownOptions = columnDropdownFilters[key] ?? [];

    return (
      <div>
        <button
          type="button"
          onClick={() => toggleSort(key)}
          className="font-bold text-ink/70 transition hover:text-pine"
          title="ترتيب حسب هذا العمود"
        >
          {label}
          {sortConfig?.key === key ? (sortConfig.direction === "asc" ? " ↑" : " ↓") : ""}
        </button>
        <input
          type="search"
          value={columnFilters[key] ?? ""}
          onChange={(event) =>
            setColumnFilters((current) => ({
              ...current,
              [key]: event.target.value,
            }))
          }
          placeholder="تصفية"
          className="mt-2 block w-24 rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-medium outline-none"
        />
        {dropdownOptions.length > 0 ? (
          <select
            value={columnFilters[key] ?? ""}
            onChange={(event) =>
              setColumnFilters((current) => ({
                ...current,
                [key]: event.target.value,
              }))
            }
            className="mt-1 block w-24 rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-medium outline-none"
            aria-label={`تصفية ${label}`}
          >
            <option value="">كل الخيارات</option>
            {dropdownOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : null}
      </div>
    );
  }

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
      <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-ink/60 shadow-soft">
        لا توجد نتائج مطابقة للفلاتر الحالية. جرّب توسيع البحث أو اختيار عرض آخر.
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-soft">
      <div className="flex flex-col gap-3 border-b border-black/10 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-extrabold text-ink">قائمة الطلاب التشغيلية</h2>
          <p className="mt-1 text-xs leading-5 text-ink/55">
            {selectedIds.length > 0 ? `تم تحديد ${selectedIds.length} طلب` : `المعروض الآن ${displayedRows.length} طلب. اختر صفوفًا للتصدير أو افتح ملف الطالب مباشرة.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-ink/70">
              <input
                type="checkbox"
                checked={allSelected}
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

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[980px] border-collapse text-right text-sm">
          <thead className="bg-sand/70 text-xs font-bold text-ink/55">
            <tr>
              <th className="w-10 px-4 py-3">
                <span className="sr-only">تحديد</span>
              </th>
              <th className="px-3 py-3">{renderColumnControl("student", "الطالب")}</th>
              <th className="px-3 py-3">{renderColumnControl("status", "الحالة")}</th>
              <th className="px-3 py-3">{renderColumnControl("completion", "الاكتمال")}</th>
              <th className="px-3 py-3">{renderColumnControl("documents", "المستندات")}</th>
              <th className="px-3 py-3">{renderColumnControl("financial", "المالي")}</th>
              <th className="px-3 py-3">{renderColumnControl("messages", "الرسائل")}</th>
              <th className="px-3 py-3">{renderColumnControl("updated", "آخر تحديث")}</th>
              <th className="px-3 py-3">{renderColumnControl("nextAction", "الإجراء التالي")}</th>
              <th className="px-4 py-3">فتح</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {displayedRows.map((row) => (
              <tr key={row.id} className="transition hover:bg-mist/45">
                <td className="px-4 py-3 align-middle">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(row.id)}
                    onChange={() => toggleSelection(row.id)}
                    aria-label={`تحديد ${row.studentName}`}
                  />
                </td>
                <td className="min-w-[210px] px-3 py-3 align-middle">
                  <LoadingLink href={`/admin/students/${row.id}`} className="block rounded-lg transition hover:text-pine">
                    <UserIdentity
                      name={row.studentName}
                      typeLabel="الطالب"
                      mobileNumber={row.parentMobileNumber}
                      compact
                    />
                  </LoadingLink>
                  <div className="mt-1 text-xs text-ink/45">المدينة: {row.city}</div>
                </td>
                <td className="px-3 py-3 align-middle">
                  <ApplicationStatusBadge status={row.status} compact />
                </td>
                <td className="min-w-[130px] px-3 py-3 align-middle">
                  <div className="flex items-center gap-2">
                    <span className="w-10 text-sm font-extrabold text-ink">{row.completionPercent}%</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-sand">
                      <span
                        className={`block h-full rounded-full ${completionTone(row.completionPercent)}`}
                        style={{ width: `${Math.min(row.completionPercent, 100)}%` }}
                      />
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3 align-middle">
                  <DocumentsState row={row} />
                </td>
                <td className="px-3 py-3 align-middle">
                  <OperationalChip tone={row.remainingAmountSar > 0 ? "warning" : "success"}>
                    {row.remainingAmountSar > 0 ? `متبقي: ${formatCurrency(row.remainingAmountSar)}` : "مكتمل"}
                  </OperationalChip>
                </td>
                <td className="px-3 py-3 align-middle">
                  <OperationalChip tone={row.unreadMessagesCount > 0 ? "warning" : "neutral"}>
                    {row.unreadMessagesCount > 0 ? row.unreadMessagesCount : "لا يوجد"}
                  </OperationalChip>
                </td>
                <td className="whitespace-nowrap px-3 py-3 align-middle text-xs font-medium text-ink/55">
                  {formatDate(row.updatedAt)}
                </td>
                <td className="max-w-[190px] px-3 py-3 align-middle">
                  <span className="line-clamp-2 text-sm font-bold leading-6 text-ink">
                    {row.nextActionLabel}
                  </span>
                </td>
                <td className="px-4 py-3 align-middle">
                  <LoadingLink
                    href={`/admin/students/${row.id}`}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-pine px-3 py-2 text-xs font-bold text-white transition hover:bg-pine/90"
                  >
                    فتح الملف
                  </LoadingLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-3 lg:hidden">
        {displayedRows.map((row) => (
          <div key={row.id} className="rounded-xl border border-black/10 bg-white p-4">
            <div className="flex flex-col gap-4">
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
                    <ApplicationStatusBadge status={row.status} compact />
                  </div>
                  <div className="text-sm text-ink/60">ولي الأمر: {row.parentMobileNumber}</div>
                  <div className="text-sm text-ink/60">المدينة: {row.city}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-sand px-3 py-3">
                  <div className="text-xs font-medium text-ink/55">الاكتمال</div>
                  <div className="mt-1 text-base font-bold text-ink">{row.completionPercent}%</div>
                </div>
                <div className="rounded-xl bg-sand px-3 py-3">
                  <div className="text-xs font-medium text-ink/55">المتبقي</div>
                  <div className="mt-1 text-base font-bold text-ink">{formatCurrency(row.remainingAmountSar)}</div>
                </div>
                <div className="rounded-xl bg-sand px-3 py-3">
                  <div className="text-xs font-medium text-ink/55">المستندات</div>
                  <div className="mt-2"><DocumentsState row={row} /></div>
                </div>
                <div className="rounded-xl bg-sand px-3 py-3">
                  <div className="text-xs font-medium text-ink/55">الرسائل</div>
                  <div className="mt-1 text-base font-bold text-ink">{row.unreadMessagesCount}</div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 text-sm">
              <span className="font-bold text-ink">{row.nextActionLabel}</span>
              <LoadingLink href={`/admin/students/${row.id}`} className="font-bold text-pine">
                فتح الملف
              </LoadingLink>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
