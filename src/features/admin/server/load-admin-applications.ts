import { ApplicationNoteType, DocumentStatus, UserRole, type ApplicationStatus } from "@prisma/client";
import {
  buildApplicationContext,
  getProfileCompleteness,
  getRequiredActions,
} from "@/features/applications/services";
import {
  buildDocumentChecklist,
  getApplicableDocumentRequirements,
} from "@/features/documents/services";
import { getPaymentSummary } from "@/features/payments/services";
import { prisma } from "@/lib/db/prisma";
import type {
  ApplicationDocumentRecord,
  ApplicationContext,
  ApplicationRecord,
  DocumentRequirementRecord,
  ParentProfileRecord,
  StudentProfileRecord,
} from "@/types/application";
import type { AdminApplicationRow } from "@/types/admin";
import type { DocumentChecklistItem } from "@/types/document";

function toNumber(value: { toNumber(): number } | number): number {
  return typeof value === "number" ? value : value.toNumber();
}

function toApplicationRecord(application: {
  id: string;
  studentUserId: string;
  parentUserId: string;
  status: ApplicationStatus;
  totalCostSar: { toNumber(): number } | number;
  paidAmountSar: { toNumber(): number } | number;
  showPaymentToStudent: boolean;
  studentInfoLocked: boolean;
  studentBasicInfoLocked: boolean;
  studentAdditionalInfoLocked: boolean;
  parentInfoLocked: boolean;
  fatherInfoLocked: boolean;
  motherInfoLocked: boolean;
  guardianInfoLocked: boolean;
  documentsLocked: boolean;
  studentDocumentsLocked: boolean;
  parentDocumentsLocked: boolean;
  guardianDocumentsLocked: boolean;
  studentProfile: StudentProfileRecord | null;
  parentProfiles: ParentProfileRecord[];
}): ApplicationRecord {
  return {
    ...application,
    totalCostSar: toNumber(application.totalCostSar),
    paidAmountSar: toNumber(application.paidAmountSar),
  };
}

function toDocumentRecord(document: {
  id: string;
  applicationId: string;
  requirementId: string;
  status: ApplicationDocumentRecord["status"];
  adminNote: string | null;
  uploadedByUserId: string | null;
  fileAssetId: string | null;
  reviewedAt: Date | null;
}): ApplicationDocumentRecord {
  return document;
}

export function buildAdminApplicationDerivedData(params: {
  application: {
    id: string;
    studentUserId: string;
    parentUserId: string;
    status: ApplicationStatus;
    totalCostSar: { toNumber(): number } | number;
    paidAmountSar: { toNumber(): number } | number;
    showPaymentToStudent: boolean;
    studentInfoLocked: boolean;
    studentBasicInfoLocked: boolean;
    studentAdditionalInfoLocked: boolean;
    parentInfoLocked: boolean;
    fatherInfoLocked: boolean;
    motherInfoLocked: boolean;
    guardianInfoLocked: boolean;
    documentsLocked: boolean;
    studentDocumentsLocked: boolean;
    parentDocumentsLocked: boolean;
    guardianDocumentsLocked: boolean;
    updatedAt: Date;
    studentProfile: StudentProfileRecord | null;
    parentProfiles: ParentProfileRecord[];
    parentUser: {
      mobileNumber: string;
    };
    documents: Array<{
      id: string;
      applicationId: string;
      requirementId: string;
      status: ApplicationDocumentRecord["status"];
      adminNote: string | null;
      uploadedByUserId: string | null;
      fileAssetId: string | null;
      reviewedAt: Date | null;
    }>;
  };
  requirements: DocumentRequirementRecord[];
}) {
  const applicationRecord = toApplicationRecord(params.application);
  const context: ApplicationContext = buildApplicationContext({
    studentProfile: applicationRecord.studentProfile,
    parentProfiles: applicationRecord.parentProfiles,
  });
  const profile = getProfileCompleteness({
    context,
    studentProfile: applicationRecord.studentProfile,
    parentProfiles: applicationRecord.parentProfiles,
  });
  const applicableRequirements = getApplicableDocumentRequirements({
    context,
    requirements: params.requirements,
  });
  const checklist: DocumentChecklistItem[] = buildDocumentChecklist({
    requirements: applicableRequirements.requiredRequirements,
    documents: params.application.documents.map(toDocumentRecord),
  });
  const paymentSummary = getPaymentSummary({
    totalCostSar: applicationRecord.totalCostSar,
    paidAmountSar: applicationRecord.paidAmountSar,
  });
  const requiredActions = getRequiredActions({
    profile,
    documents: checklist,
    hasOutstandingPayment: paymentSummary.hasOutstandingPayment,
  });
  const missingDocumentsCount = checklist.filter((item) => item.status === DocumentStatus.MISSING).length;
  const documentsNeedingReviewCount = checklist.filter(
    (item) => item.status === DocumentStatus.UPLOADED || item.status === DocumentStatus.UNDER_REVIEW,
  ).length;
  const reuploadCount = checklist.filter(
    (item) =>
      item.status === DocumentStatus.REJECTED ||
      item.status === DocumentStatus.REUPLOAD_REQUESTED,
  ).length;

  const row: AdminApplicationRow = {
    id: params.application.id,
    studentName: params.application.studentProfile?.fullNameAr ?? "طالب بدون اسم",
    parentMobileNumber: params.application.parentUser.mobileNumber,
    status: params.application.status,
    completionPercent: profile.completionPercent,
    totalCostSar: paymentSummary.totalCostSar,
    paidAmountSar: paymentSummary.paidAmountSar,
    remainingAmountSar: paymentSummary.remainingAmountSar,
    missingDocumentsCount,
    documentsNeedingReviewCount,
    reuploadCount,
    updatedAt: params.application.updatedAt,
    city: params.application.studentProfile?.city ?? "غير محدد",
    needsAction: requiredActions.length > 0 || documentsNeedingReviewCount > 0,
    requiredActionsCount: requiredActions.length,
  };

  return {
    applicationRecord,
    context,
    profile,
    applicableRequirements,
    checklist,
    paymentSummary,
    requiredActions,
    missingDocumentsCount,
    documentsNeedingReviewCount,
    reuploadCount,
    row,
  };
}

export async function loadAdminApplications() {
  const [applications, requirementRows] = await Promise.all([
    prisma.application.findMany({
      include: {
        studentProfile: true,
        parentProfiles: true,
        documents: true,
        parentUser: {
          select: {
            mobileNumber: true,
          },
        },
        notes: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            senderUser: {
              select: {
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
    prisma.documentRequirement.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
    }),
  ]);

  const requirements = requirementRows as unknown as DocumentRequirementRecord[];

  const rows: AdminApplicationRow[] = applications.map((application) => {
    return buildAdminApplicationDerivedData({
      application,
      requirements,
    }).row;
  });

  return {
    rows,
    latestAdminNotes: applications.map((application) => ({
      applicationId: application.id,
      latestAdminNote:
        application.notes.find(
          (note) => note.noteType === ApplicationNoteType.NOTE && note.senderUser.role === UserRole.ADMIN,
        )?.body ?? null,
    })),
  };
}
