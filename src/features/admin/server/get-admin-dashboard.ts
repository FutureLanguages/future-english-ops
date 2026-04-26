import type { AdminDashboardViewModel } from "@/types/admin";
import { loadAdminApplications } from "./load-admin-applications";
import { getAdminNavItems } from "./nav";

export async function getAdminDashboardViewModel(params: {
  adminMobileNumber: string;
}): Promise<AdminDashboardViewModel> {
  const { rows } = await loadAdminApplications();
  const studentsNeedingAction = rows
    .filter((row) => row.needsAction || row.remainingAmountSar > 0 || row.completionPercent < 100)
    .sort((left, right) => {
      const leftScore =
        left.documentsNeedingReviewCount * 5 +
        left.unreadMessagesCount * 4 +
        left.reuploadCount * 3 +
        (left.remainingAmountSar > 0 ? 2 : 0) +
        (left.missingDocumentsCount > 0 ? 1 : 0);
      const rightScore =
        right.documentsNeedingReviewCount * 5 +
        right.unreadMessagesCount * 4 +
        right.reuploadCount * 3 +
        (right.remainingAmountSar > 0 ? 2 : 0) +
        (right.missingDocumentsCount > 0 ? 1 : 0);

      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }

      return right.updatedAt.getTime() - left.updatedAt.getTime();
    })
    .slice(0, 6);
  const documentsPendingReview = rows.reduce((sum, row) => sum + row.documentsNeedingReviewCount, 0);
  const studentsWithMissingDocuments = rows.filter((row) => row.missingDocumentsCount > 0).length;
  const studentsWithRemainingBalance = rows.filter((row) => row.remainingAmountSar > 0).length;
  const unreadMessages = rows.reduce((sum, row) => sum + row.unreadMessagesCount, 0);
  const studentsNeedingActionCount = rows.filter((row) => row.needsAction || row.remainingAmountSar > 0).length;
  const completedCount = rows.filter((row) => row.status === "COMPLETED").length;

  return {
    adminMobileNumber: params.adminMobileNumber,
    navItems: getAdminNavItems("dashboard"),
    kpis: [
      { label: "إجمالي الطلاب", value: rows.length, detail: "كل الطلبات المسجلة" },
      { label: "يحتاج إجراء", value: studentsNeedingActionCount, detail: "طلاب لديهم عمل إداري مفتوح" },
      { label: "مستندات بانتظار مراجعة", value: documentsPendingReview, detail: "ملفات مرفوعة تحتاج قرار" },
      { label: "رسائل غير مقروءة", value: unreadMessages, detail: "محادثات تحتاج رد أو قراءة" },
      { label: "متبقٍ مالي", value: studentsWithRemainingBalance, detail: "طلاب لديهم رصيد متبقٍ" },
      { label: "مكتمل", value: completedCount, status: "COMPLETED", detail: "طلبات مكتملة" },
    ],
    actionQueue: [
      {
        label: "راجع المستندات المرفوعة",
        description: "ابدأ بالملفات التي رفعها الطلاب أو أولياء الأمور وتحتاج اعتمادًا أو رفضًا.",
        value: documentsPendingReview,
        href: "/admin/documents?status=UPLOADED",
        priority: "high",
      },
      {
        label: "تابع الرسائل غير المقروءة",
        description: "افتح المحادثات التي تحتاج قراءة أو رد من الإدارة.",
        value: unreadMessages,
        href: "/admin/messages",
        priority: unreadMessages > 0 ? "high" : "low",
      },
      {
        label: "تابع الحالات المالية المتبقية",
        description: "طلاب لديهم مبالغ متبقية أو يحتاجون متابعة دفع.",
        value: studentsWithRemainingBalance,
        href: "/admin/students?view=outstanding_payment",
        priority: "medium",
      },
      {
        label: "استكمل المستندات الناقصة",
        description: "طلبات ما زالت تحتاج ملفات أساسية من الطالب أو ولي الأمر.",
        value: studentsWithMissingDocuments,
        href: "/admin/students?view=missing_documents",
        priority: "medium",
      },
    ],
    workPanels: [
      {
        label: "المستندات",
        value: documentsPendingReview,
        detail: `${studentsWithMissingDocuments} طلب لديه مستندات ناقصة`,
        href: "/admin/documents",
        actionLabel: "فتح مراجعة المستندات",
        tone: documentsPendingReview > 0 ? "attention" : "success",
      },
      {
        label: "المالية",
        value: studentsWithRemainingBalance,
        detail: "طلاب لديهم مبالغ متبقية",
        href: "/admin/finance",
        actionLabel: "فتح الملخص المالي",
        tone: studentsWithRemainingBalance > 0 ? "attention" : "success",
      },
      {
        label: "الرسائل",
        value: unreadMessages,
        detail: "رسائل غير مقروءة في محادثات الطلاب وأولياء الأمور",
        href: "/admin/messages",
        actionLabel: "فتح الرسائل",
        tone: unreadMessages > 0 ? "attention" : "neutral",
      },
      {
        label: "المتابعة العامة",
        value: studentsNeedingActionCount,
        detail: "طلاب يحتاجون تدخلًا أو مراجعة إدارية",
        href: "/admin/students?view=needs_action",
        actionLabel: "فتح الطلاب المحتاجين إجراء",
        tone: studentsNeedingActionCount > 0 ? "attention" : "success",
      },
    ],
    studentsNeedingAction: studentsNeedingAction.map((row) => ({
      applicationId: row.id,
      studentName: row.studentName,
      nextActionLabel: row.nextActionLabel,
      completionPercent: row.completionPercent,
      remainingAmountSar: row.remainingAmountSar,
      documentsNeedingReviewCount: row.documentsNeedingReviewCount,
      unreadMessagesCount: row.unreadMessagesCount,
      href: `/admin/students/${row.id}`,
    })),
  };
}
