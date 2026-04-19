import { ApplicationNoteType, UserRole, type Prisma } from "@prisma/client";
import {
  buildApplicationContext,
  getProfileCompleteness,
  getRequiredActions,
} from "@/features/applications/services";
import { canUploadDocument, canViewPayments } from "@/features/auth/services";
import {
  buildDocumentChecklist,
  getApplicableDocumentRequirements,
} from "@/features/documents/services";
import { getPaymentSummary } from "@/features/payments/services";
import { prisma } from "@/lib/db/prisma";
import { formatThreadMessages, getUnreadNotesCount } from "@/features/messages/server/thread";
import type {
  ApplicationDocumentRecord,
  ApplicationRecord,
  ApplicationUser,
  DocumentRequirementRecord,
  ParentProfileRecord,
  StudentProfileRecord,
} from "@/types/application";

function toNumber(value: { toNumber(): number } | number): number {
  return typeof value === "number" ? value : value.toNumber();
}

function toApplicationRecord(application: {
  id: string;
  studentUserId: string;
  parentUserId: string;
  status: ApplicationRecord["status"];
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

function computeDocumentsCompletionPercent(checklist: Array<{ status: ApplicationDocumentRecord["status"] }>) {
  if (checklist.length === 0) {
    return 100;
  }

  const completedCount = checklist.filter(
    (item) =>
      item.status === "UPLOADED" ||
      item.status === "UNDER_REVIEW" ||
      item.status === "APPROVED",
  ).length;

  return Math.round((completedCount / checklist.length) * 100);
}

function computeAgreementsCompletionPercent(
  agreements: Array<{
    studentAccepted: boolean;
    parentAccepted: boolean;
    requiresParentAcceptance: boolean;
  }>,
) {
  if (agreements.length === 0) {
    return 0;
  }

  const completedCount = agreements.filter((agreement) =>
    agreement.studentAccepted && (!agreement.requiresParentAcceptance || agreement.parentAccepted),
  ).length;

  return Math.round((completedCount / agreements.length) * 100);
}

export async function loadPortalApplicationData(params: {
  user: ApplicationUser;
  applicationId?: string;
}) {
  const applicationWhere =
    params.user.role === UserRole.STUDENT
      ? { studentUserId: params.user.id }
      : { parentUserId: params.user.id };

  const applications = await prisma.application.findMany({
    where: applicationWhere,
    include: {
      studentProfile: true,
      parentProfiles: true,
      documents: {
        include: {
          fileAsset: true,
        },
      },
      paymentReceipts: {
        include: {
          uploadedByUser: {
            select: {
              role: true,
              mobileNumber: true,
            },
          },
          fileAsset: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      agreements: {
        orderBy: {
          assignedAt: "desc",
        },
      },
      fees: {
        orderBy: {
          createdAt: "desc",
        },
      },
      payments: {
        include: {
          paymentReceipt: {
            include: {
              fileAsset: true,
            },
          },
        },
        orderBy: {
          paymentDate: "desc",
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
              mobileNumber: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (applications.length === 0) {
    return null;
  }

  type PortalApplication = Prisma.ApplicationGetPayload<{
    include: {
      studentProfile: true;
      parentProfiles: true;
      documents: {
        include: {
          fileAsset: true;
        };
      };
      paymentReceipts: {
        include: {
          uploadedByUser: {
            select: {
              role: true;
              mobileNumber: true;
            };
          };
          fileAsset: true;
        };
      };
      agreements: true;
      fees: true;
      payments: {
        include: {
          paymentReceipt: {
            include: {
              fileAsset: true;
            };
          };
        };
      };
      notes: {
        include: {
          senderUser: {
            select: {
              role: true;
              mobileNumber: true;
            };
          };
        };
      };
    };
  }>;
  const hydratedApplications = applications as PortalApplication[];

  const selectedApplication =
    hydratedApplications.find((application) => application.id === params.applicationId) ??
    hydratedApplications[0];

  const applicationRecord = toApplicationRecord(selectedApplication);
  const context = buildApplicationContext({
    studentProfile: applicationRecord.studentProfile,
    parentProfiles: applicationRecord.parentProfiles,
  });
  const profile = getProfileCompleteness({
    context,
    studentProfile: applicationRecord.studentProfile,
    parentProfiles: applicationRecord.parentProfiles,
  });

  const requirementRows = await prisma.documentRequirement.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  const requirements = requirementRows as unknown as DocumentRequirementRecord[];
  const applicableRequirements = getApplicableDocumentRequirements({
    context,
    requirements,
  });
  const documents = selectedApplication.documents.map(toDocumentRecord);
  const checklist = buildDocumentChecklist({
    requirements: applicableRequirements.requiredRequirements,
    documents,
  });
  const checklistWithPermissions = checklist.map((item) => {
    const requirement = applicableRequirements.requiredRequirements.find(
      (requirementRow) => requirementRow.id === item.requirementId,
    );

    return {
      ...item,
      canUpload:
        requirement !== undefined
          ? canUploadDocument({
              user: params.user,
              application: applicationRecord,
              requirement,
            })
          : false,
    };
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

  const latestAdminNote =
    selectedApplication.notes.find(
      (note) => note.noteType === ApplicationNoteType.NOTE && note.senderUser.role === UserRole.ADMIN,
    )?.body ?? null;

  const unreadMessagesCount = getUnreadNotesCount({
    role: params.user.role,
    notes: selectedApplication.notes,
    lastViewedAt:
      params.user.role === UserRole.STUDENT
        ? selectedApplication.studentLastViewedNotesAt
        : selectedApplication.parentLastViewedNotesAt,
  });

  const documentsCompletionPercent = computeDocumentsCompletionPercent(checklist);
  const agreementsCompletionPercent = computeAgreementsCompletionPercent(selectedApplication.agreements);
  const paymentCompletionPercent =
    paymentSummary.totalCostSar <= 0 || paymentSummary.remainingAmountSar <= 0 ? 100 : 0;
  const allSectionsComplete =
    profile.completionPercent === 100 &&
    documentsCompletionPercent === 100 &&
    agreementsCompletionPercent === 100;
  const overallCompletionPercent = allSectionsComplete
    ? 100
    : Math.min(
        99,
        Math.round(
          (profile.completionPercent + documentsCompletionPercent + agreementsCompletionPercent) / 3,
        ),
      );

  return {
    user: params.user,
    applicationRecord,
    applications: hydratedApplications,
    context,
    profile,
    checklist: checklistWithPermissions,
    rawChecklist: checklist,
    paymentSummary,
    requiredActions,
    latestAdminNote,
    unreadMessagesCount,
    threadMessages: formatThreadMessages(
      selectedApplication.notes.filter((note) => note.noteType === ApplicationNoteType.MESSAGE),
    ),
    canSeePayments: canViewPayments(params.user, applicationRecord),
    documentsCompletionPercent,
    agreementsCompletionPercent,
    paymentCompletionPercent,
    overallCompletionPercent,
  };
}
