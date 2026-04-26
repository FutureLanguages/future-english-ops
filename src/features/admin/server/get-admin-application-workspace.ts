import { ApplicationNoteType, ApplicationStatus, MessageThreadType, UserRole, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { formatThreadMessages, getUnreadNotesCount, getUnreadThreadNotesCount } from "@/features/messages/server/thread";
import type { DocumentRequirementRecord } from "@/types/application";
import type { AdminApplicationWorkspaceViewModel, AdminWorkspaceDocumentGroup } from "@/types/admin";
import { buildAdminApplicationDerivedData } from "./load-admin-applications";
import { getAdminNavItems } from "./nav";

const statusLabels: Record<ApplicationStatus, string> = {
  NEW: "جديد",
  INCOMPLETE: "توجد نواقص",
  UNDER_REVIEW: "قيد المراجعة",
  WAITING_PAYMENT: "بانتظار السداد",
  COMPLETED: "مكتمل",
};

const documentGroupLabels = {
  STUDENT: "مستندات الطالب",
  PARENT: "مستندات ولي الأمر",
  GUARDIAN: "مستندات الوصاية",
} as const;

const uploaderRoleLabels = {
  STUDENT: "الطالب",
  PARENT: "ولي الأمر",
  ADMIN: "الإدارة",
} as const;

function latestDate(...dates: Array<Date | null | undefined>) {
  return dates
    .filter((date): date is Date => Boolean(date))
    .sort((left, right) => right.getTime() - left.getTime())[0] ?? null;
}

function computeChecklistCompletionPercent(
  checklist: Array<{
    status: "MISSING" | "UPLOADED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "REUPLOAD_REQUESTED";
  }>,
) {
  if (checklist.length === 0) {
    return 100;
  }

  const completed = checklist.filter((item) =>
    item.status === "UPLOADED" || item.status === "UNDER_REVIEW" || item.status === "APPROVED",
  ).length;

  return Math.round((completed / checklist.length) * 100);
}

function mapReceiptStatus(status: string | null): string {
  if (!status) {
    return "لم يتم رفع إيصال بعد";
  }

  const labels: Record<string, string> = {
    MISSING: "لم يتم رفع إيصال بعد",
    UPLOADED: "تم رفع الإيصال",
    UNDER_REVIEW: "الإيصال قيد المراجعة",
    APPROVED: "تم اعتماد الإيصال",
    REJECTED: "الإيصال مرفوض",
    REUPLOAD_REQUESTED: "مطلوب إعادة رفع الإيصال",
  };

  return labels[status] ?? "حالة غير معروفة";
}

function summarizeFees(
  fees: Array<{
    id: string;
    title: string;
    amount: { toNumber(): number } | number;
    note: string | null;
    feeDate: Date | null;
  }>,
) {
  const normalized = fees.map((fee) => {
    const amountSar = typeof fee.amount === "number" ? fee.amount : fee.amount.toNumber();
    return {
      id: fee.id,
      title: fee.title,
      amountSar,
      note: fee.note,
      feeDate: fee.feeDate,
    };
  });

  const totalFeesSar = normalized
    .filter((fee) => fee.amountSar > 0)
    .reduce((sum, fee) => sum + fee.amountSar, 0);
  const discountSar = Math.abs(
    normalized.filter((fee) => fee.amountSar < 0).reduce((sum, fee) => sum + fee.amountSar, 0),
  );

  return {
    items: normalized,
    totalFeesSar: Number(totalFeesSar.toFixed(2)),
    discountSar: Number(discountSar.toFixed(2)),
  };
}

function mapDocumentGroups(
  checklist: ReturnType<typeof buildAdminApplicationDerivedData>["checklist"],
  applicationDocuments: Array<{
    id: string;
    requirementId: string;
    fileAsset: {
      mimeType: string;
    } | null;
    uploadedByUser: {
      role: "ADMIN" | "STUDENT" | "PARENT";
      mobileNumber: string;
    } | null;
  }>,
): AdminWorkspaceDocumentGroup[] {
  const grouped = checklist.reduce<Record<string, AdminWorkspaceDocumentGroup["items"]>>(
    (accumulator, item) => {
      if (item.category === "PAYMENT") {
        return accumulator;
      }

      const uploadedDocument = applicationDocuments.find(
        (document) => document.requirementId === item.requirementId,
      );
      accumulator[item.category] ??= [];
      accumulator[item.category].push({
        id: uploadedDocument?.id ?? item.requirementId,
        requirementId: item.requirementId,
        title: item.titleAr,
        description: item.descriptionAr,
        status: item.status,
        adminNote: item.adminNote,
        fileAssetId: item.fileAssetId,
        fileMimeType: uploadedDocument?.fileAsset?.mimeType ?? null,
        uploaderRolesLabel: item.allowedUploaderRoles
          .map((role) => uploaderRoleLabels[role])
          .join(" / "),
        uploadedByLabel: uploadedDocument?.uploadedByUser
          ? `${uploaderRoleLabels[uploadedDocument.uploadedByUser.role]} - ${uploadedDocument.uploadedByUser.mobileNumber}`
          : null,
        canReview: Boolean(uploadedDocument?.id),
      });

      return accumulator;
    },
    {},
  );

  return (["STUDENT", "PARENT", "GUARDIAN"] as const)
    .filter((category) => (grouped[category] ?? []).length > 0)
    .map((category) => ({
      id: category,
      title: documentGroupLabels[category],
      items: grouped[category],
    }));
}

export async function getAdminApplicationWorkspaceViewModel(params: {
  adminMobileNumber: string;
  applicationId: string;
}): Promise<AdminApplicationWorkspaceViewModel | null> {
  await prisma.application.update({
    where: {
      id: params.applicationId,
    },
    data: {
      adminLastViewedNotesAt: new Date(),
      adminLastViewedStudentThreadAt: new Date(),
      adminLastViewedParentThreadAt: new Date(),
    },
  }).catch(() => null);

  const application = await prisma.application.findUnique({
    where: {
      id: params.applicationId,
    },
    include: {
      studentProfile: true,
      parentProfiles: true,
      documents: {
        include: {
          fileAsset: true,
          uploadedByUser: {
            select: {
              role: true,
              mobileNumber: true,
            },
          },
        },
      },
      paymentReceipts: {
        include: {
          fileAsset: true,
          uploadedByUser: {
            select: {
              role: true,
              mobileNumber: true,
            },
          },
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
      parentUser: {
        select: {
          mobileNumber: true,
        },
      },
      studentUser: {
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
              mobileNumber: true,
            },
          },
        },
      },
    },
  });

  type AdminWorkspaceApplication = Prisma.ApplicationGetPayload<{
    include: {
      studentProfile: true;
      parentProfiles: true;
      documents: {
        include: {
          fileAsset: true;
          uploadedByUser: {
            select: {
              role: true;
              mobileNumber: true;
            };
          };
        };
      };
      paymentReceipts: {
        include: {
          fileAsset: true;
          uploadedByUser: {
            select: {
              role: true;
              mobileNumber: true;
            };
          };
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
      parentUser: {
        select: {
          mobileNumber: true;
        };
      };
      studentUser: {
        select: {
          mobileNumber: true;
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

  if (!application) {
    return null;
  }

  const requirementRows = await prisma.documentRequirement.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });
  const agreementTemplates = await prisma.agreementTemplate.findMany({
    where: {
      isActive: true,
    },
    orderBy: [
      { isDefault: "desc" },
      { createdAt: "desc" },
    ],
  });
  const switcherApplications = await prisma.application.findMany({
    select: {
      id: true,
      updatedAt: true,
      studentProfile: {
        select: {
          fullNameAr: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const hydratedApplication = application as AdminWorkspaceApplication;
  const currentSwitcherIndex = switcherApplications.findIndex((item) => item.id === hydratedApplication.id);
  const previousSwitcherItem = currentSwitcherIndex > 0 ? switcherApplications[currentSwitcherIndex - 1] : null;
  const nextSwitcherItem =
    currentSwitcherIndex >= 0 && currentSwitcherIndex < switcherApplications.length - 1
      ? switcherApplications[currentSwitcherIndex + 1]
      : null;

  const requirements = requirementRows as unknown as DocumentRequirementRecord[];
  const derived = buildAdminApplicationDerivedData({
    application: hydratedApplication,
    requirements,
  });

  const latestAdminNote =
    hydratedApplication.notes.find(
      (note) => note.noteType === ApplicationNoteType.NOTE && note.senderUser.role === "ADMIN",
    )?.body ?? null;
  const latestPaymentNote =
    hydratedApplication.paymentReceipts.find((receipt) => Boolean(receipt.adminNote))?.adminNote ??
    latestAdminNote;
  const feeSummary = summarizeFees(hydratedApplication.fees);
  const agreementsPendingCount = hydratedApplication.agreements.filter((agreement) => {
    const parentAccepted = !agreement.requiresParentAcceptance || agreement.parentAccepted;
    return !agreement.studentAccepted || !parentAccepted;
  }).length;
  const documentsCompletionPercent = computeChecklistCompletionPercent(derived.checklist);
  const agreementsCompletionPercent =
    hydratedApplication.agreements.length > 0
      ? Math.round(
          ((hydratedApplication.agreements.length - agreementsPendingCount) / hydratedApplication.agreements.length) *
            100,
        )
      : 0;
  const combinedCompletionPercent = Math.round(
    (derived.profile.completionPercent + documentsCompletionPercent + agreementsCompletionPercent) / 3,
  );
  const profileDocumentsAgreementsComplete =
    derived.profile.completionPercent === 100 &&
    derived.missingDocumentsCount === 0 &&
    agreementsPendingCount === 0;
  const profileMissingCount =
    derived.profile.missingStudentFields.length + derived.profile.missingParentFields.length;
  const profileDocumentsAgreementsDetail = [
    profileMissingCount > 0 ? `حقول ناقصة: ${profileMissingCount}` : null,
    derived.missingDocumentsCount > 0 ? `مستندات ناقصة: ${derived.missingDocumentsCount}` : null,
    hydratedApplication.agreements.length === 0
      ? "الميثاق غير مسند"
      : agreementsPendingCount > 0
        ? `مواثيق غير معتمدة: ${agreementsPendingCount}`
        : null,
  ].filter(Boolean).join("، ");
  const unreadMessagesCount = getUnreadNotesCount({
    role: "ADMIN",
    notes: hydratedApplication.notes,
    lastViewedAt: hydratedApplication.adminLastViewedNotesAt,
  });

  return {
    adminMobileNumber: params.adminMobileNumber,
    navItems: [
      ...getAdminNavItems("students"),
      { key: "workspace", label: "ملف الطالب", href: `/admin/students/${hydratedApplication.id}`, active: true },
    ],
    tabs: [
      { id: "overview", label: "نظرة عامة", href: `/admin/students/${hydratedApplication.id}?tab=overview` },
      { id: "data", label: "البيانات", href: `/admin/students/${hydratedApplication.id}?tab=data` },
      { id: "documents", label: "المستندات", href: `/admin/students/${hydratedApplication.id}?tab=documents` },
      { id: "finance", label: "المالية", href: `/admin/students/${hydratedApplication.id}?tab=finance` },
      { id: "messages", label: "الرسائل", href: `/admin/students/${hydratedApplication.id}?tab=messages` },
      { id: "agreements", label: "الميثاق", href: `/admin/students/${hydratedApplication.id}?tab=agreements` },
      { id: "settings", label: "الإعدادات", href: `/admin/students/${hydratedApplication.id}?tab=settings` },
    ],
    application: derived.row,
    summary: {
      studentUserId: hydratedApplication.studentUserId,
      studentMobileNumber: hydratedApplication.studentUser.mobileNumber,
      parentUserId: hydratedApplication.parentUserId,
      studentName: derived.row.studentName,
      parentMobileNumber: derived.row.parentMobileNumber,
      status: derived.row.status,
      completionPercent: combinedCompletionPercent,
      latestAdminNote,
    },
    overview: {
      paymentSummary: {
        totalCostSar: derived.paymentSummary.totalCostSar,
        paidAmountSar: derived.paymentSummary.paidAmountSar,
        remainingAmountSar: derived.paymentSummary.remainingAmountSar,
        isPaymentComplete: derived.paymentSummary.isPaymentComplete,
      },
      progressIndicators: {
        profileDocumentsAgreements: {
          label: "البيانات + المستندات + المواثيق",
          statusLabel: `${combinedCompletionPercent}%`,
          detailLabel: profileDocumentsAgreementsDetail || "لا توجد نواقص",
          tone: profileDocumentsAgreementsComplete ? "success" : "warning",
        },
        payments: {
          label: "المدفوعات",
          statusLabel:
            derived.paymentSummary.remainingAmountSar > 0
              ? "0%"
              : "100%",
          detailLabel:
            derived.paymentSummary.remainingAmountSar > 0
              ? `متبقي: ${derived.paymentSummary.remainingAmountSar} ر.س`
              : "لا يوجد متبقي",
          tone: derived.paymentSummary.remainingAmountSar > 0 ? "warning" : "success",
        },
        messages: {
          label: "الرسائل",
          unreadCount: unreadMessagesCount,
        },
      },
      missingDocumentsCount: derived.missingDocumentsCount,
      requiredActions: derived.requiredActions.map((action) => action.label),
      unreadMessagesCount,
    },
    accessSettings: {
      showPaymentToStudent: derived.applicationRecord.showPaymentToStudent,
      sections: {
        studentInfoLocked: derived.applicationRecord.studentInfoLocked,
        parentInfoLocked: derived.applicationRecord.parentInfoLocked,
        documentsLocked: derived.applicationRecord.documentsLocked,
      },
      subSections: {
        studentBasicInfoLocked: derived.applicationRecord.studentBasicInfoLocked,
        studentAdditionalInfoLocked: derived.applicationRecord.studentAdditionalInfoLocked,
        fatherInfoLocked: derived.applicationRecord.fatherInfoLocked,
        motherInfoLocked: derived.applicationRecord.motherInfoLocked,
        guardianInfoLocked: derived.applicationRecord.guardianInfoLocked,
        studentDocumentsLocked: derived.applicationRecord.studentDocumentsLocked,
        parentDocumentsLocked: derived.applicationRecord.parentDocumentsLocked,
        guardianDocumentsLocked: derived.applicationRecord.guardianDocumentsLocked,
      },
    },
    documents: {
      groups: mapDocumentGroups(derived.checklist, hydratedApplication.documents),
      documentsNeedingReviewCount: derived.documentsNeedingReviewCount,
      reuploadCount: derived.reuploadCount,
    },
    payments: {
      totalFeesSar: feeSummary.totalFeesSar,
      discountSar: feeSummary.discountSar,
      totalCostSar: derived.paymentSummary.totalCostSar,
      paidAmountSar: derived.paymentSummary.paidAmountSar,
      remainingAmountSar: derived.paymentSummary.remainingAmountSar,
      isPaymentComplete: derived.paymentSummary.isPaymentComplete,
      latestPaymentNote,
      receipts: hydratedApplication.paymentReceipts.map((receipt) => ({
        id: receipt.id,
        status: receipt.status as "UPLOADED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "REUPLOAD_REQUESTED",
        adminNote: receipt.adminNote,
        fileAssetId: receipt.fileAssetId,
        fileMimeType: receipt.fileAsset.mimeType,
        uploadedByLabel: receipt.uploadedByUser
          ? `${uploaderRoleLabels[receipt.uploadedByUser.role]} - ${receipt.uploadedByUser.mobileNumber}`
          : null,
        createdAt: receipt.createdAt,
      })),
      fees: feeSummary.items,
      payments: hydratedApplication.payments.map((payment) => ({
        id: payment.id,
        amountSar: typeof payment.amount === "number" ? payment.amount : payment.amount.toNumber(),
        note: payment.note,
        paymentDate: payment.paymentDate,
        linkedReceiptId: payment.paymentReceiptId,
        linkedReceiptFileAssetId: payment.paymentReceipt?.fileAssetId ?? null,
        linkedReceiptFileMimeType: payment.paymentReceipt?.fileAsset?.mimeType ?? null,
      })),
    },
    messaging: {
      unreadCount: unreadMessagesCount,
      threads: [MessageThreadType.STUDENT, MessageThreadType.PARENT].map((threadType) => ({
        type: threadType,
        label: threadType === MessageThreadType.STUDENT ? "محادثة الطالب" : "محادثة ولي الأمر",
        unreadCount: getUnreadThreadNotesCount({
          role: UserRole.ADMIN,
          threadType,
          notes: hydratedApplication.notes,
          lastViewedAt:
            threadType === MessageThreadType.STUDENT
              ? hydratedApplication.adminLastViewedStudentThreadAt ?? hydratedApplication.adminLastViewedNotesAt
              : hydratedApplication.adminLastViewedParentThreadAt ?? hydratedApplication.adminLastViewedNotesAt,
        }),
        lastActivityAt:
          hydratedApplication.notes
            .filter((note) => (note.threadType ?? MessageThreadType.STUDENT) === threadType)
            .filter((note) => note.noteType === ApplicationNoteType.MESSAGE)
            .map((note) => note.createdAt)
            .sort((left, right) => right.getTime() - left.getTime())[0] ?? null,
        messages: formatThreadMessages(hydratedApplication.notes, threadType).map((message) => {
          const seenAt =
            threadType === MessageThreadType.PARENT
              ? hydratedApplication.parentLastViewedParentThreadAt ?? hydratedApplication.parentLastViewedNotesAt
              : latestDate(
                  hydratedApplication.studentLastViewedStudentThreadAt,
                  hydratedApplication.parentLastViewedStudentThreadAt,
                  hydratedApplication.studentLastViewedNotesAt,
                  hydratedApplication.parentLastViewedNotesAt,
                );

          return {
            ...message,
            isCurrentUser: message.senderRole === UserRole.ADMIN,
            seen: message.senderRole === UserRole.ADMIN && Boolean(seenAt && message.createdAt <= seenAt),
            read:
              message.senderRole === UserRole.ADMIN
                ? true
                : Boolean(
                    (
                      threadType === MessageThreadType.STUDENT
                        ? hydratedApplication.adminLastViewedStudentThreadAt ?? hydratedApplication.adminLastViewedNotesAt
                        : hydratedApplication.adminLastViewedParentThreadAt ?? hydratedApplication.adminLastViewedNotesAt
                    ) &&
                      message.createdAt <=
                        (threadType === MessageThreadType.STUDENT
                          ? hydratedApplication.adminLastViewedStudentThreadAt ?? hydratedApplication.adminLastViewedNotesAt
                          : hydratedApplication.adminLastViewedParentThreadAt ?? hydratedApplication.adminLastViewedNotesAt)!
                  ),
          };
        }),
      })),
    },
    agreements: {
      templates: agreementTemplates.map((template) => ({
        id: template.id,
        title: template.title,
        content: template.content,
        acknowledgmentText: template.acknowledgmentText,
        isDefault: template.isDefault,
        isActive: template.isActive,
      })),
      assigned: hydratedApplication.agreements.map((agreement) => ({
        id: agreement.id,
        title: agreement.title,
        assignedAt: agreement.assignedAt,
        requiresStudentAcceptance: agreement.requiresStudentAcceptance,
        requiresParentAcceptance: agreement.requiresParentAcceptance,
        studentAccepted: agreement.studentAccepted,
        parentAccepted: agreement.parentAccepted,
        cancellationRequestedAt: agreement.cancellationRequestedAt,
        studentAcceptedAt: agreement.studentAcceptedAt,
        parentAcceptedAt: agreement.parentAcceptedAt,
        studentFullName: agreement.studentFullName,
        parentFullName: agreement.parentFullName,
        studentSignature: agreement.studentSignature,
        parentSignature: agreement.parentSignature,
      })),
    },
    statusControls: {
      currentStatus: derived.row.status,
      options: [
        "NEW",
        "INCOMPLETE",
        "UNDER_REVIEW",
        "WAITING_PAYMENT",
        "COMPLETED",
      ].map((status) => ({
        value: status as ApplicationStatus,
        label: statusLabels[status as ApplicationStatus],
      })),
    },
    studentSwitch: {
      previous: previousSwitcherItem
        ? {
            applicationId: previousSwitcherItem.id,
            studentName: previousSwitcherItem.studentProfile?.fullNameAr ?? "طالب بدون اسم",
          }
        : null,
      next: nextSwitcherItem
        ? {
            applicationId: nextSwitcherItem.id,
            studentName: nextSwitcherItem.studentProfile?.fullNameAr ?? "طالب بدون اسم",
          }
        : null,
      positionLabel:
        currentSwitcherIndex >= 0
          ? `${currentSwitcherIndex + 1} من ${switcherApplications.length}`
          : `${switcherApplications.length} طلب`,
    },
  };
}
