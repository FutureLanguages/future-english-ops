import type { AdminDashboardViewModel } from "@/types/admin";
import { loadAdminApplications } from "./load-admin-applications";
import { getAdminNavItems } from "./nav";

export async function getAdminDashboardViewModel(params: {
  adminMobileNumber: string;
}): Promise<AdminDashboardViewModel> {
  const { rows } = await loadAdminApplications();

  return {
    adminMobileNumber: params.adminMobileNumber,
    navItems: getAdminNavItems("dashboard"),
    kpis: [
      { label: "إجمالي الطلبات", value: rows.length },
      { label: "جديد", value: rows.filter((row) => row.status === "NEW").length, status: "NEW" },
      { label: "توجد نواقص", value: rows.filter((row) => row.status === "INCOMPLETE").length, status: "INCOMPLETE" },
      { label: "قيد المراجعة", value: rows.filter((row) => row.status === "UNDER_REVIEW").length, status: "UNDER_REVIEW" },
      { label: "بانتظار السداد", value: rows.filter((row) => row.status === "WAITING_PAYMENT").length, status: "WAITING_PAYMENT" },
      { label: "مكتمل", value: rows.filter((row) => row.status === "COMPLETED").length, status: "COMPLETED" },
    ],
    reviewQueues: [
      {
        label: "مستندات تحتاج مراجعة",
        value: rows.reduce((sum, row) => sum + row.documentsNeedingReviewCount, 0),
        href: "/admin/students?view=needs_action",
      },
      {
        label: "طلبات بها مستندات ناقصة",
        value: rows.filter((row) => row.missingDocumentsCount > 0).length,
        href: "/admin/students?view=needs_action",
      },
      {
        label: "طلبات بها مبالغ متبقية",
        value: rows.filter((row) => row.remainingAmountSar > 0).length,
        href: "/admin/students?view=needs_action",
      },
    ],
    quickActions: [
      { label: "فتح قائمة الطلاب", href: "/admin/students" },
      { label: "فتح قائمة أولياء الأمور", href: "/admin/parents" },
      { label: "فتح المستندات", href: "/admin/documents" },
      { label: "فتح الجدول الذكي", href: "/admin/reports" },
      { label: "فتح الوضع المالي", href: "/admin/finance" },
      { label: "فتح الرسائل", href: "/admin/messages" },
    ],
  };
}
