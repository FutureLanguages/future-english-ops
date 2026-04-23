import type { AdminReportsViewModel } from "@/types/admin";
import { getAdminNavItems } from "./nav";
import { loadAdminReportRecords } from "./load-admin-report-records";

export async function getAdminReportsViewModel(params: {
  adminMobileNumber: string;
  q?: string;
  status?: string;
  paymentView?: string;
  healthFilter?: string;
}): Promise<AdminReportsViewModel> {
  const paymentView =
    params.paymentView === "remaining_only" || params.paymentView === "paid_only"
      ? params.paymentView
      : "all";
  const q = params.q?.trim() ?? "";
  const status = params.status ?? "";
  const healthFilter = params.healthFilter ?? "";

  const { records, documentRequirements } = await loadAdminReportRecords({
    q,
    status,
    paymentView,
    healthFilter,
  });

  const columns: AdminReportsViewModel["columns"] = [
    { key: "studentName", label: "اسم الطالب", group: "basic" },
    { key: "studentMobile", label: "رقم الجوال", group: "basic" },
    { key: "parentName", label: "اسم ولي الأمر", group: "basic" },
    { key: "parentMobile", label: "رقم جوال ولي الأمر", group: "basic" },
    { key: "status", label: "حالة الطلب", group: "basic" },
    { key: "totalFeesSar", label: "إجمالي الرسوم", group: "financial" },
    { key: "totalDiscountSar", label: "إجمالي الخصم", group: "financial" },
    { key: "totalPaidSar", label: "المدفوع", group: "financial" },
    { key: "remainingSar", label: "المتبقي", group: "financial" },
    ...documentRequirements.map((requirement) => ({
      key: `document:${requirement.code}`,
      label: requirement.titleAr,
      group: "documents" as const,
      documentCode: requirement.code,
    })),
    { key: "health:medicalConditions", label: "حالات مرضية", group: "health" },
    { key: "health:allergies", label: "الحساسية", group: "health" },
    { key: "health:medications", label: "أدوية مستمرة", group: "health" },
    { key: "health:sleepDisorders", label: "اضطرابات النوم", group: "health" },
    { key: "health:bedwetting", label: "التبول اللاإرادي", group: "health" },
    { key: "health:phobias", label: "رهاب", group: "health" },
    { key: "health:requiresSpecialAttention", label: "متابعة خاصة", group: "health" },
    { key: "documentsCompletedCount", label: "عدد المستندات المكتملة", group: "other" },
    { key: "unreadMessagesCount", label: "عدد الرسائل غير المقروءة", group: "other" },
    { key: "receiptsCount", label: "عدد الإيصالات", group: "other" },
    { key: "updatedAt", label: "آخر تحديث", group: "other" },
  ];

  return {
    adminMobileNumber: params.adminMobileNumber,
    navItems: getAdminNavItems("reports"),
    filters: {
      q,
      status,
      paymentView,
      healthFilter,
    },
    columns,
    defaultColumnKeys: [
      "studentName",
      "studentMobile",
      "parentName",
      "status",
      "totalFeesSar",
      "totalDiscountSar",
      "totalPaidSar",
      "remainingSar",
      "documentsCompletedCount",
      "receiptsCount",
      "updatedAt",
    ],
    rows: records.map((record) => ({
      ...record,
      updatedAt: new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(record.updatedAt),
    })),
  };
}
