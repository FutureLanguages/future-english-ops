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
  };
}) {
  const [selectedColumnKeys, setSelectedColumnKeys] = useState<string[]>(defaultColumnKeys);
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
          <span>عدد الصفوف: {rows.length}</span>
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
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
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
