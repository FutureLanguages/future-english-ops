import { loadPortalApplicationData } from "@/features/portal/server/load-portal-application";
import { buildPortalNavItems } from "@/features/portal/server/nav";
import type { ApplicationUser } from "@/types/application";
import type { PortalNavItem } from "@/types/portal";

type PortalDocumentsViewModel = {
  role: "STUDENT" | "PARENT";
  mobileNumber: string;
  activeUserLabel: string;
  studentName: string;
  status: "NEW" | "INCOMPLETE" | "UNDER_REVIEW" | "WAITING_PAYMENT" | "COMPLETED";
  overallCompletion: {
    percent: number;
    label: string;
    tone: "complete" | "incomplete";
  };
  navItems: PortalNavItem[];
  applicationOptions: Array<{ id: string; label: string }>;
  selectedApplicationId: string;
  groups: Array<{
    id: string;
    title: string;
    locked: boolean;
    lockLabel: string;
    items: Array<{
      requirementId: string;
      requirementCode: string;
      applicationId: string;
      titleAr: string;
      descriptionAr: string | null;
      status: "MISSING" | "UPLOADED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "REUPLOAD_REQUESTED";
      adminNote: string | null;
      fileAssetId: string | null;
      fileMimeType: string | null;
      canUpload: boolean;
      actionLabel: string | null;
      category: "STUDENT" | "PARENT" | "GUARDIAN";
    }>;
  }>;
};

const groupLabels = {
  STUDENT: "مستندات الطالب",
  PARENT: "مستندات ولي الأمر",
  GUARDIAN: "مستندات الوصاية",
} as const;

export async function getPortalDocumentsViewModel(params: {
  user: ApplicationUser;
  applicationId?: string;
}): Promise<PortalDocumentsViewModel | null> {
  const data = await loadPortalApplicationData(params);

  if (!data) {
    return null;
  }

  const grouped = data.checklist.reduce<
    Record<string, PortalDocumentsViewModel["groups"][number]["items"]>
  >((accumulator, item) => {
    if (item.category === "PAYMENT") {
      return accumulator;
    }

    const key = item.category;
    const actionLabel =
      item.status === "REJECTED" || item.status === "REUPLOAD_REQUESTED"
        ? "إعادة الرفع"
        : item.status === "MISSING"
          ? "رفع المستند"
          : item.canUpload
            ? "تحديث المستند"
            : null;

    accumulator[key] ??= [];
    accumulator[key].push({
      requirementId: item.requirementId,
      requirementCode: item.code,
      applicationId: data.applicationRecord.id,
      titleAr: item.titleAr,
      descriptionAr: item.descriptionAr,
      status: item.status,
      adminNote: item.adminNote,
      fileAssetId: item.fileAssetId,
      fileMimeType:
        data.applications
          .find((application) => application.id === data.applicationRecord.id)
          ?.documents.find((document) => document.requirementId === item.requirementId)
          ?.fileAsset?.mimeType ?? null,
      canUpload: item.canUpload,
      actionLabel,
      category: item.category,
    });

    return accumulator;
  }, {});

  const groups = (["STUDENT", "PARENT", "GUARDIAN"] as const)
    .filter((groupKey) => (grouped[groupKey] ?? []).length > 0)
    .map((groupKey) => ({
      id: groupKey,
      title: groupLabels[groupKey],
      locked:
        data.applicationRecord.documentsLocked ||
        (groupKey === "STUDENT"
          ? data.applicationRecord.studentDocumentsLocked
          : groupKey === "PARENT"
            ? data.applicationRecord.parentDocumentsLocked
            : data.applicationRecord.guardianDocumentsLocked),
      lockLabel:
        data.applicationRecord.documentsLocked ||
        (groupKey === "STUDENT"
          ? data.applicationRecord.studentDocumentsLocked
          : groupKey === "PARENT"
            ? data.applicationRecord.parentDocumentsLocked
            : data.applicationRecord.guardianDocumentsLocked)
          ? "هذا القسم مقفل"
          : "القسم متاح للتعديل",
      items: grouped[groupKey],
    }));

  return {
    role: data.user.role as "STUDENT" | "PARENT",
    mobileNumber: data.user.mobileNumber,
    activeUserLabel: data.user.role === "STUDENT" ? "طالب" : "ولي أمر",
    studentName: data.applicationRecord.studentProfile?.fullNameAr ?? "طالب بدون اسم",
    status: data.applicationRecord.status,
    overallCompletion: {
      percent: data.overallCompletionPercent,
      label: data.overallCompletionPercent === 100 ? "اكتمال الطلب" : "اكتمال جزئي",
      tone: data.overallCompletionPercent === 100 ? "complete" : "incomplete",
    },
    navItems: buildPortalNavItems({
      activeKey: "documents",
      canSeePayments: data.canSeePayments,
      applicationId: data.applicationRecord.id,
      agreements: data.applications.find((application) => application.id === data.applicationRecord.id)?.agreements ?? [],
    }),
    applicationOptions: data.applications.map((application) => ({
      id: application.id,
      label: application.studentProfile?.fullNameAr ?? "طلب بدون اسم",
    })),
    selectedApplicationId: data.applicationRecord.id,
    groups,
  };
}
