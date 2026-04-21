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
    agreements: agreements.map((agreement) => ({
      id: agreement.id,
      title: agreement.title,
      assignedAt: agreement.assignedAt,
      accepted: isAgreementAcceptedByRole(agreement, data.user.role),
      studentAccepted: agreement.studentAccepted,
      parentAccepted: agreement.parentAccepted,
      requiresStudentAcceptance: agreement.requiresStudentAcceptance,
      requiresParentAcceptance: agreement.requiresParentAcceptance,
      cancellationRequestedAt: agreement.cancellationRequestedAt,
    })),
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
