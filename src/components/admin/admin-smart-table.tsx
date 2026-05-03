"use client";

import { useMemo, useState, useTransition } from "react";
import { Download, Table2 } from "lucide-react";
import { ApplicationStatusBadge } from "@/components/shared/application-status-badge";
import { UnifiedDocumentStatusBadge } from "@/components/shared/document-status-badge";
import type { AdminReportColumn, AdminReportRecordView } from "@/types/admin";

const groupLabels = {
  basic: "بيانات أساسية",
  financial: "البيانات المالية",
  documents: "المستندات",
  health: "الحالة الصحية والسلوكية",
  other: "مؤشرات إضافية",
} as const;

const statusFilterOptions = [
  { value: "NEW", label: "جديد" },
  { value: "INCOMPLETE", label: "توجد نواقص" },
  { value: "UNDER_REVIEW", label: "قيد المراجعة" },
  { value: "WAITING_PAYMENT", label: "بانتظار السداد" },
  { value: "COMPLETED", label: "مكتمل" },
];

const documentFilterOptions = [
  { value: "APPROVED", label: "مقبول" },
  { value: "MISSING", label: "مفقود" },
  { value: "UPLOADED", label: "مرفوع" },
  { value: "UNDER_REVIEW", label: "قيد المراجعة" },
  { value: "REJECTED", label: "مرفوض" },
  { value: "REUPLOAD_REQUESTED", label: "إعادة رفع" },
];

const booleanFilterOptions = [
  { value: "__yes__", label: "نعم" },
  { value: "__no__", label: "لا" },
];

export function AdminSmartTable({
  rows,
  columns,
  defaultColumnKeys,
  filters,
}: {
  rows: AdminReportRecordView[];
  columns: AdminReportColumn[];
  defaultColumnKeys: string[];
  filters: {
    q?: string;
    status?: string;
    paymentView?: string;
    healthFilter?: string;
    sort?: string;
  };
}) {
  const [selectedColumnKeys, setSelectedColumnKeys] = useState<string[]>(defaultColumnKeys);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const selectedColumns = useMemo(
    () => columns.filter((column) => selectedColumnKeys.includes(column.key)),
    [columns, selectedColumnKeys],
  );

  function toggleColumn(columnKey: string) {
    setSelectedColumnKeys((current) =>
      current.includes(columnKey)
        ? current.filter((key) => key !== columnKey)
        : [...current, columnKey],
    );
  }

  function formatCell(row: AdminReportRecordView, column: AdminReportColumn) {
    if (column.documentCode) {
      return (
        <UnifiedDocumentStatusBadge
          status={row.documentStatuses[column.documentCode] ?? "MISSING"}
          compact
        />
      );
    }

    if (column.key.startsWith("health:")) {
      const healthKey = column.key.replace("health:", "");
      return row.healthFlags[healthKey] ? "نعم" : "لا";
    }

    switch (column.key) {
      case "studentName":
        return <span className="font-semibold text-ink">{row.studentName}</span>;
      case "studentMobile":
        return <span dir="ltr">{row.studentMobile}</span>;
      case "parentName":
        return <span>{row.parentName}</span>;
      case "parentMobile":
        return <span dir="ltr">{row.parentMobile}</span>;
      case "status":
        return <ApplicationStatusBadge status={row.status} compact />;
      case "totalFeesSar":
        return `${row.totalFeesSar} ر.س`;
      case "totalDiscountSar":
        return `${row.totalDiscountSar} ر.س`;
      case "totalPaidSar":
        return `${row.totalPaidSar} ر.س`;
      case "remainingSar":
        return `${row.remainingSar} ر.س`;
      case "documentsCompletedCount":
        return row.documentsCompletedCount;
      case "unreadMessagesCount":
        return row.unreadMessagesCount;
      case "receiptsCount":
        return row.receiptsCount;
      case "updatedAt":
        return row.updatedAt;
      default:
        return "—";
    }
  }

  function getCellPlainText(row: AdminReportRecordView, column: AdminReportColumn) {
    if (column.documentCode) {
      return row.documentStatuses[column.documentCode] ?? "MISSING";
    }

    if (column.key.startsWith("health:")) {
      const healthKey = column.key.replace("health:", "");
      return row.healthFlags[healthKey] ? "نعم" : "لا";
    }

    const value = row[column.key as keyof AdminReportRecordView];
    return typeof value === "number" ? value : String(value ?? "");
  }

  function getColumnDropdownOptions(column: AdminReportColumn) {
    if (column.documentCode) return documentFilterOptions;
    if (column.key === "status") return statusFilterOptions;
    if (column.key.startsWith("health:")) return booleanFilterOptions;
    if (column.key === "remainingSar") {
      return [
        { value: "__remaining__", label: "يوجد متبقي" },
        { value: "__paid__", label: "لا يوجد متبقي" },
      ];
    }
    if (column.key === "unreadMessagesCount") {
      return [
        { value: "__unread__", label: "يوجد غير مقروء" },
        { value: "__read__", label: "لا يوجد غير مقروء" },
      ];
    }
    return [];
  }

  function toggleSort(columnKey: string) {
    setSortConfig((current) => {
      if (current?.key !== columnKey) {
        return { key: columnKey, direction: "asc" };
      }

      if (current.direction === "asc") {
        return { key: columnKey, direction: "desc" };
      }

      return null;
    });
  }

  function getCellHighlightClass(row: AdminReportRecordView, column: AdminReportColumn) {
    if (column.documentCode) {
      const status = row.documentStatuses[column.documentCode] ?? "MISSING";

      if (status === "APPROVED") {
        return "bg-mist/90";
      }

      if (status === "MISSING" || status === "REJECTED" || status === "REUPLOAD_REQUESTED") {
        return "bg-clay/30";
      }

      return "bg-sand/70";
    }

    if (column.key === "remainingSar") {
      return row.remainingSar <= 0 ? "bg-mist/90" : "bg-clay/30";
    }

    if (column.key.startsWith("health:")) {
      const healthKey = column.key.replace("health:", "");
      return row.healthFlags[healthKey] ? "bg-clay/30" : "bg-sand/70";
    }

    return "";
  }

  function getMissingDocumentsCount(row: AdminReportRecordView) {
    return Object.values(row.documentStatuses).filter(
      (status) =>
        status === "MISSING" ||
        status === "REJECTED" ||
        status === "REUPLOAD_REQUESTED",
    ).length;
  }

  function getRowHighlightClass(row: AdminReportRecordView) {
    const missingDocumentsCount = getMissingDocumentsCount(row);

    if (row.remainingSar > 0 && missingDocumentsCount > 0) {
      return "bg-clay/25";
    }

    if (row.remainingSar > 0 || missingDocumentsCount > 0) {
      return "bg-clay/15";
    }

    return "bg-sand";
  }

  function getCellTitle(row: AdminReportRecordView, column: AdminReportColumn) {
    if (column.documentCode) {
      return "حالة المستند";
    }

    if (column.key === "remainingSar") {
      return row.remainingSar > 0 ? "يوجد مبلغ متبقٍ" : "لا يوجد مبلغ متبقٍ";
    }

    if (column.key.startsWith("health:")) {
      return "مؤشر صحي/سلوكي داخلي للإدارة فقط";
    }

    return column.label;
  }

  const displayedRows = useMemo(() => {
    const activeFilters = Object.entries(columnFilters)
      .map(([key, value]) => [key, value.trim().toLowerCase()] as const)
      .filter(([, value]) => Boolean(value));
    let nextRows = rows.slice();

    if (activeFilters.length > 0) {
      nextRows = nextRows.filter((row) =>
        activeFilters.every(([columnKey, value]) => {
          const column = columns.find((item) => item.key === columnKey);
          if (!column) {
            return true;
          }

          if (value === "__yes__") return getCellPlainText(row, column) === "نعم";
          if (value === "__no__") return getCellPlainText(row, column) === "لا";
          if (value === "__remaining__") return row.remainingSar > 0;
          if (value === "__paid__") return row.remainingSar <= 0;
          if (value === "__unread__") return row.unreadMessagesCount > 0;
          if (value === "__read__") return row.unreadMessagesCount === 0;

          return String(getCellPlainText(row, column)).toLowerCase().includes(value);
        }),
      );
    }

    if (sortConfig) {
      const column = columns.find((item) => item.key === sortConfig.key);
      if (column) {
        nextRows.sort((left, right) => {
          const leftValue = getCellPlainText(left, column);
          const rightValue = getCellPlainText(right, column);
          const direction = sortConfig.direction === "asc" ? 1 : -1;

          if (typeof leftValue === "number" && typeof rightValue === "number") {
            return (leftValue - rightValue) * direction;
          }

          return String(leftValue).localeCompare(String(rightValue), "ar") * direction;
        });
      }
    }

    return nextRows;
  }, [columnFilters, columns, rows, sortConfig]);

  function exportCurrentTable() {
    if (selectedColumnKeys.length === 0) {
      setMessage("يرجى اختيار عمود واحد على الأقل قبل التصدير.");
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const params = new URLSearchParams();
      if (filters.q) params.set("q", filters.q);
      if (filters.status) params.set("status", filters.status);
      if (filters.paymentView) params.set("paymentView", filters.paymentView);
      if (filters.healthFilter) params.set("healthFilter", filters.healthFilter);
      if (filters.sort) params.set("sort", filters.sort);
      for (const columnKey of selectedColumnKeys) {
        params.append("columns", columnKey);
      }

      const response = await fetch(`/admin/reports/export?${params.toString()}`);

      if (!response.ok) {
        setMessage("تعذر إنشاء ملف Excel للجدول الحالي.");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "future-english-smart-table.xlsx";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage("تم تجهيز ملف Excel حسب الأعمدة المحددة.");
    });
  }

  const groupedColumns = Object.entries(
    columns.reduce<Record<string, AdminReportColumn[]>>((accumulator, column) => {
      accumulator[column.group] ??= [];
      accumulator[column.group].push(column);
      return accumulator;
    }, {}),
  ) as Array<[AdminReportColumn["group"], AdminReportColumn[]]>;

  return (
    <div className="space-y-5">
      <section className="rounded-panel bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Table2 className="h-5 w-5 text-pine" strokeWidth={2.1} />
              <h2 className="text-lg font-bold text-ink">تخصيص الأعمدة</h2>
            </div>
            <p className="text-sm text-ink/60">
              اختر الأعمدة التي تريد رؤيتها في الجدول أو تصديرها إلى Excel.
            </p>
          </div>
          <button
            type="button"
            onClick={exportCurrentTable}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-full bg-pine px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{isPending ? "جارٍ التصدير..." : "تصدير Excel"}</span>
          </button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-4">
          {groupedColumns.map(([groupKey, groupColumns]) => (
            <div key={groupKey} className="rounded-2xl bg-sand p-4">
              <div className="mb-3 text-sm font-bold text-ink">{groupLabels[groupKey]}</div>
              <div className="space-y-2 text-sm text-ink/80">
                {groupColumns.map((column) => (
                  <label key={column.key} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={selectedColumnKeys.includes(column.key)}
                      onChange={() => toggleColumn(column.key)}
                    />
                    <span>{column.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {message ? <div className="mt-4 text-sm font-semibold text-pine">{message}</div> : null}
      </section>

      <section className="rounded-panel bg-white p-5 shadow-soft">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-ink/60">
          <span>عدد الصفوف: {displayedRows.length}</span>
          <span>•</span>
          <span>عدد الأعمدة المعروضة: {selectedColumns.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr>
                {selectedColumns.map((column) => (
                  <th
                    key={column.key}
                    className="whitespace-nowrap px-3 py-2 text-right text-sm font-bold text-ink"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className="font-bold text-ink transition hover:text-pine"
                      title="ترتيب حسب هذا العمود"
                    >
                      {column.label}
                      {sortConfig?.key === column.key ? (sortConfig.direction === "asc" ? " ↑" : " ↓") : ""}
                    </button>
                    <input
                      type="search"
                      value={columnFilters[column.key] ?? ""}
                      onChange={(event) =>
                        setColumnFilters((current) => ({
                          ...current,
                          [column.key]: event.target.value,
                        }))
                      }
                      placeholder="تصفية"
                      className="mt-2 block w-28 rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-medium outline-none"
                    />
                    {getColumnDropdownOptions(column).length > 0 ? (
                      <select
                        value={columnFilters[column.key] ?? ""}
                        onChange={(event) =>
                          setColumnFilters((current) => ({
                            ...current,
                            [column.key]: event.target.value,
                          }))
                        }
                        className="mt-1 block w-28 rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-medium outline-none"
                        aria-label={`تصفية ${column.label}`}
                      >
                        <option value="">كل الخيارات</option>
                        {getColumnDropdownOptions(column).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedRows.map((row) => (
                <tr
                  key={row.applicationId}
                  className={getRowHighlightClass(row)}
                  title={
                    row.remainingSar > 0 || getMissingDocumentsCount(row) > 0
                      ? `يحتاج متابعة: متبقي ${row.remainingSar} ر.س، مستندات تحتاج إجراء ${getMissingDocumentsCount(row)}`
                      : "لا توجد مؤشرات متابعة بارزة"
                  }
                >
                  {selectedColumns.map((column) => (
                    <td
                      key={`${row.applicationId}-${column.key}`}
                      title={getCellTitle(row, column)}
                      className={`whitespace-nowrap px-3 py-3 text-sm text-ink first:rounded-r-2xl last:rounded-l-2xl ${getCellHighlightClass(
                        row,
                        column,
                      )}`}
                    >
                      {formatCell(row, column)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
