import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { loadAdminReportRecords } from "@/features/admin/server/load-admin-report-records";
import { getAdminReportsViewModel } from "@/features/admin/server/get-admin-reports";

const documentStatusLabels: Record<string, string> = {
  MISSING: "مفقود",
  UPLOADED: "مرفوع",
  UNDER_REVIEW: "قيد المراجعة",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
  REUPLOAD_REQUESTED: "إعادة رفع",
};

export async function GET(request: Request) {
  await getAdminSession();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";
  const paymentView = searchParams.get("paymentView") ?? "all";
  const columns = searchParams.getAll("columns");

  const [viewModel, data] = await Promise.all([
    getAdminReportsViewModel({
      adminMobileNumber: "",
      q,
      status,
      paymentView,
    }),
    loadAdminReportRecords({
      q,
      status,
      paymentView: paymentView === "remaining_only" || paymentView === "paid_only" ? paymentView : "all",
    }),
  ]);

  const selectedColumns =
    columns.length > 0
      ? viewModel.columns.filter((column) => columns.includes(column.key))
      : viewModel.columns.filter((column) => viewModel.defaultColumnKeys.includes(column.key));

  const rows = data.records.map((record) => {
    const row: Record<string, string | number> = {};

    for (const column of selectedColumns) {
      let value: string | number = "";

      if (column.documentCode) {
        value = documentStatusLabels[record.documentStatuses[column.documentCode] ?? "MISSING"] ?? "مفقود";
      } else {
        switch (column.key) {
          case "studentName":
            value = record.studentName;
            break;
          case "studentMobile":
            value = record.studentMobile;
            break;
          case "parentName":
            value = record.parentName;
            break;
          case "parentMobile":
            value = record.parentMobile;
            break;
          case "status":
            value = record.status;
            break;
          case "totalFeesSar":
            value = record.totalFeesSar;
            break;
          case "totalDiscountSar":
            value = record.totalDiscountSar;
            break;
          case "totalPaidSar":
            value = record.totalPaidSar;
            break;
          case "remainingSar":
            value = record.remainingSar;
            break;
          case "documentsCompletedCount":
            value = record.documentsCompletedCount;
            break;
          case "unreadMessagesCount":
            value = record.unreadMessagesCount;
            break;
          case "receiptsCount":
            value = record.receiptsCount;
            break;
          case "updatedAt":
            value = new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(record.updatedAt);
            break;
          default:
            value = "";
        }
      }

      row[column.label] = value;
    }

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!rtl"] = true;
  const workbook = XLSX.utils.book_new();
  workbook.Workbook = { Views: [{ RTL: true }] };
  XLSX.utils.book_append_sheet(workbook, worksheet, "الجدول الذكي");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="future-english-smart-table.xlsx"',
    },
  });
}
