import { UserRole } from "@prisma/client";
import { loadPortalApplicationData } from "@/features/portal/server/load-portal-application";
import { isAgreementAcceptedByRole, summarizeAgreementStatus } from "@/features/agreements/server/agreements";
import type { ApplicationUser } from "@/types/application";
import { buildPortalNavItems } from "./nav";

export async function getPortalAgreementsViewModel(params: {
  user: ApplicationUser;
  applicationId?: string;
}) {
  const data = await loadPortalApplicationData(params);

  if (!data) {
    return null;
  }

  const selectedApplication = data.applications.find(
    (application) => application.id === data.applicationRecord.id,
  );
  const agreements = selectedApplication?.agreements ?? [];
  const status = summarizeAgreementStatus(agreements, data.user.role);
  const acceptedCount = agreements.filter((agreement) => {
    const studentAccepted = !agreement.requiresStudentAcceptance || agreement.studentAccepted;
    const parentAccepted = !agreement.requiresParentAcceptance || agreement.parentAccepted;

    return studentAccepted && parentAccepted;
  }).length;
  const pendingForCurrentRole = agreements.filter((agreement) => !isAgreementAcceptedByRole(agreement, data.user.role)).length;
  const pendingStudent = agreements.filter(
    (agreement) => agreement.requiresStudentAcceptance && !agreement.studentAccepted,
  ).length;
  const pendingParent = agreements.filter(
    (agreement) => agreement.requiresParentAcceptance && !agreement.parentAccepted,
  ).length;

  return {
    role: data.user.role as "STUDENT" | "PARENT",
    mobileNumber: data.user.mobileNumber,
    activeUserLabel: data.user.role === UserRole.STUDENT ? "طالب" : "ولي أمر",
    studentName: data.applicationRecord.studentProfile?.fullNameAr ?? "طالب بدون اسم",
    applicationStatus: data.applicationRecord.status,
    overallCompletion: {
      percent: data.overallCompletionPercent,
      label: data.overallCompletionPercent === 100 ? "اكتمال الطلب" : "اكتمال جزئي",
      tone: data.overallCompletionPercent === 100 ? ("complete" as const) : ("incomplete" as const),
    },
    navItems: buildPortalNavItems({
      activeKey: "agreements",
      canSeePayments: data.canSeePayments,
      applicationId: data.applicationRecord.id,
      agreements,
    }),
    applicationOptions: data.applications.map((application) => ({
      id: application.id,
      label: application.studentProfile?.fullNameAr ?? "طلب بدون اسم",
    })),
    selectedApplicationId: data.applicationRecord.id,
    status,
    summary: {
      total: agreements.length,
      acceptedCount,
      pendingForCurrentRole,
      pendingStudent,
      pendingParent,
      stateLabel:
        agreements.length === 0
          ? "لا يوجد ميثاق مسند"
          : pendingForCurrentRole > 0
            ? `بانتظار موافقتك: ${pendingForCurrentRole}`
            : acceptedCount === agreements.length
              ? "كل المواثيق مكتملة"
              : "بانتظار الطرف الآخر",
    },
    agreements: agreements
      .map((agreement) => {
        const accepted = isAgreementAcceptedByRole(agreement, data.user.role);
        const studentPending = agreement.requiresStudentAcceptance && !agreement.studentAccepted;
        const parentPending = agreement.requiresParentAcceptance && !agreement.parentAccepted;

        return {
          id: agreement.id,
          title: agreement.title,
          assignedAt: agreement.assignedAt,
          accepted,
          studentAccepted: agreement.studentAccepted,
          parentAccepted: agreement.parentAccepted,
          requiresStudentAcceptance: agreement.requiresStudentAcceptance,
          requiresParentAcceptance: agreement.requiresParentAcceptance,
          cancellationRequestedAt: agreement.cancellationRequestedAt,
          actionOwnerLabel:
            studentPending && parentPending
              ? "بانتظار الطالب وولي الأمر"
              : studentPending
                ? "بانتظار الطالب"
                : parentPending
                  ? "بانتظار ولي الأمر"
                  : "مكتمل من الأطراف المطلوبة",
        };
      })
      .sort((left, right) => Number(left.accepted) - Number(right.accepted)),
  };
}

export async function getPortalAgreementDetailViewModel(params: {
  user: ApplicationUser;
  agreementId: string;
}) {
  const data = await loadPortalApplicationData({ user: params.user });

  if (!data) {
    return null;
  }

  const agreement = data.applications
    .flatMap((application) => application.agreements)
    .find((item) => item.id === params.agreementId);

  if (!agreement) {
    return null;
  }

  return {
    role: data.user.role as "STUDENT" | "PARENT",
    mobileNumber: data.user.mobileNumber,
    activeUserLabel: data.user.role === UserRole.STUDENT ? "طالب" : "ولي أمر",
    studentName: data.applicationRecord.studentProfile?.fullNameAr ?? "طالب بدون اسم",
    applicationStatus: data.applicationRecord.status,
    overallCompletion: {
      percent: data.overallCompletionPercent,
      label: data.overallCompletionPercent === 100 ? "اكتمال الطلب" : "اكتمال جزئي",
      tone: data.overallCompletionPercent === 100 ? ("complete" as const) : ("incomplete" as const),
    },
    navItems: buildPortalNavItems({
      activeKey: "agreements",
      canSeePayments: data.canSeePayments,
      applicationId: agreement.applicationId,
      agreements: data.applications.find((application) => application.id === agreement.applicationId)?.agreements ?? [],
    }),
    agreement: {
      id: agreement.id,
      applicationId: agreement.applicationId,
      title: agreement.title,
      content: agreement.contentSnapshot,
      acknowledgmentText: agreement.acknowledgmentSnapshot,
      accepted: isAgreementAcceptedByRole(agreement, data.user.role),
      requiresStudentAcceptance: agreement.requiresStudentAcceptance,
      requiresParentAcceptance: agreement.requiresParentAcceptance,
      acceptedAt: data.user.role === UserRole.STUDENT
        ? agreement.studentAcceptedAt
        : agreement.parentAcceptedAt,
      cancellationRequestedAt: agreement.cancellationRequestedAt,
      fullName: data.user.role === UserRole.STUDENT
        ? agreement.studentFullName
        : agreement.parentFullName,
      signature: data.user.role === UserRole.STUDENT
        ? agreement.studentSignature
        : agreement.parentSignature,
    },
  };
}
