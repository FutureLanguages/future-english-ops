import type { AdminFinanceViewModel } from "@/types/admin";
import { getAdminNavItems } from "./nav";
import { loadAdminReportRecords } from "./load-admin-report-records";

export async function getAdminFinanceViewModel(params: {
  adminMobileNumber: string;
  status?: string;
  paymentView?: string;
  sort?: string;
}): Promise<AdminFinanceViewModel> {
  const paymentView =
    params.paymentView === "remaining_only" || params.paymentView === "paid_only"
      ? params.paymentView
      : "all";
  const sort = params.sort === "lowest_remaining" ? "lowest_remaining" : "highest_remaining";
  const status = params.status ?? "";

  const { records } = await loadAdminReportRecords({
    status,
    paymentView,
  });

  const sortedRows = records
    .slice()
    .sort((left, right) =>
      sort === "lowest_remaining"
        ? left.remainingSar - right.remainingSar
        : right.remainingSar - left.remainingSar,
    );

  const totalFeesSar = Number(sortedRows.reduce((sum, row) => sum + row.totalFeesSar, 0).toFixed(2));
  const totalDiscountSar = Number(
    sortedRows.reduce((sum, row) => sum + row.totalDiscountSar, 0).toFixed(2),
  );
  const totalPaidSar = Number(sortedRows.reduce((sum, row) => sum + row.totalPaidSar, 0).toFixed(2));
  const totalRemainingSar = Number(
    sortedRows.reduce((sum, row) => sum + row.remainingSar, 0).toFixed(2),
  );
  const highestRemainingStudent =
    sortedRows.length > 0
      ? sortedRows.reduce((highest, row) =>
          row.remainingSar > highest.remainingSar ? row : highest,
        )
      : null;

  return {
    adminMobileNumber: params.adminMobileNumber,
    navItems: getAdminNavItems("finance"),
    filters: {
      status,
      paymentView,
      sort,
    },
    summary: {
      totalFeesSar,
      totalDiscountSar,
      totalPaidSar,
      totalRemainingSar,
      fullyPaidStudentsCount: sortedRows.filter((row) => row.remainingSar <= 0).length,
      studentsWithRemainingCount: sortedRows.filter((row) => row.remainingSar > 0).length,
      highestRemainingStudent: highestRemainingStudent
        ? {
            studentName: highestRemainingStudent.studentName,
            remainingSar: highestRemainingStudent.remainingSar,
          }
        : null,
    },
    rows: sortedRows.map((row) => ({
      applicationId: row.applicationId,
      studentName: row.studentName,
      status: row.status,
      totalFeesSar: row.totalFeesSar,
      totalDiscountSar: row.totalDiscountSar,
      totalPaidSar: row.totalPaidSar,
      remainingSar: row.remainingSar,
    })),
  };
}
