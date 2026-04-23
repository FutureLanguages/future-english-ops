import { DocumentStatus, type ApplicationStatus, type Prisma } from "@prisma/client";
import { getUnreadNotesCount } from "@/features/messages/server/thread";
import { prisma } from "@/lib/db/prisma";
import type { DocumentRequirementRecord } from "@/types/application";
import { buildAdminApplicationDerivedData } from "./load-admin-applications";

export type AdminReportRecord = {
  applicationId: string;
  studentName: string;
  studentMobile: string;
  parentName: string;
  parentMobile: string;
  status: ApplicationStatus;
  totalFeesSar: number;
  totalDiscountSar: number;
  totalPaidSar: number;
  remainingSar: number;
  documentsCompletedCount: number;
  unreadMessagesCount: number;
  receiptsCount: number;
  updatedAt: Date;
  healthFlags: Record<string, boolean>;
  documentStatuses: Record<string, DocumentStatus>;
};

export type AdminReportFilters = {
  q?: string;
  status?: string;
  paymentView?: "all" | "remaining_only" | "paid_only";
  healthFilter?: string;
};

function toNumber(value: { toNumber(): number } | number) {
  return typeof value === "number" ? value : value.toNumber();
}

function summarizeFees(
  fees: Array<{
    amount: { toNumber(): number } | number;
  }>,
) {
  const amounts = fees.map((fee) => toNumber(fee.amount));
  const totalFeesSar = amounts.filter((amount) => amount > 0).reduce((sum, amount) => sum + amount, 0);
  const totalDiscountSar = Math.abs(
    amounts.filter((amount) => amount < 0).reduce((sum, amount) => sum + amount, 0),
  );

  return {
    totalFeesSar: Number(totalFeesSar.toFixed(2)),
    totalDiscountSar: Number(totalDiscountSar.toFixed(2)),
  };
}

export async function loadAdminReportRecords(filters: AdminReportFilters = {}) {
  const [applications, requirementRows] = await Promise.all([
    prisma.application.findMany({
      include: {
        studentProfile: true,
        studentHealthProfile: true,
        studentUser: {
          select: {
            mobileNumber: true,
          },
        },
        parentProfiles: true,
        parentUser: {
          select: {
            mobileNumber: true,
          },
        },
        documents: true,
        fees: true,
        paymentReceipts: {
          select: {
            id: true,
          },
        },
        notes: {
          include: {
            senderUser: {
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

  const records: AdminReportRecord[] = applications.map((application) => {
    const derived = buildAdminApplicationDerivedData({
      application: application as Parameters<typeof buildAdminApplicationDerivedData>[0]["application"],
      requirements,
    });
    const feeSummary = summarizeFees(application.fees);
    const parentName =
      application.parentProfiles.find((profile) => Boolean(profile.fullName?.trim()))?.fullName?.trim() ??
      "ولي أمر بدون اسم";
    const documentStatuses = Object.fromEntries(
      derived.checklist
        .filter((item) => item.category !== "PAYMENT")
        .map((item) => [item.code, item.status]),
    ) as Record<string, DocumentStatus>;
    const documentsCompletedCount = derived.checklist.filter((item) =>
      item.status === "UPLOADED" ||
      item.status === "UNDER_REVIEW" ||
      item.status === "APPROVED",
    ).length;

    return {
      applicationId: application.id,
      studentName: application.studentProfile?.fullNameAr ?? "طالب بدون اسم",
      studentMobile: application.studentUser.mobileNumber,
      parentName,
      parentMobile: application.parentUser.mobileNumber,
      status: application.status,
      totalFeesSar: feeSummary.totalFeesSar,
      totalDiscountSar: feeSummary.totalDiscountSar,
      totalPaidSar: derived.paymentSummary.paidAmountSar,
      remainingSar: derived.paymentSummary.remainingAmountSar,
      documentsCompletedCount,
      unreadMessagesCount: getUnreadNotesCount({
        role: "ADMIN",
        notes: application.notes as Parameters<typeof getUnreadNotesCount>[0]["notes"],
        lastViewedAt: application.adminLastViewedNotesAt,
      }),
      receiptsCount: application.paymentReceipts.length,
      updatedAt: application.updatedAt,
      documentStatuses,
      healthFlags: {
        medicalConditions: Boolean(application.studentHealthProfile?.hasMedicalConditions),
        allergies: Boolean(application.studentHealthProfile?.hasAllergies),
        medications: Boolean(application.studentHealthProfile?.hasContinuousMedication),
        sleepDisorders: Boolean(application.studentHealthProfile?.hasSleepDisorders),
        bedwetting: Boolean(application.studentHealthProfile?.hasBedwetting),
        phobias: Boolean(application.studentHealthProfile?.hasPhobia),
        requiresSpecialAttention: Boolean(application.studentHealthProfile?.needsSpecialSupervisorFollowUp),
      },
    };
  });

  let filteredRecords = records.slice();
  const q = filters.q?.trim().toLowerCase() ?? "";

  if (filters.status) {
    filteredRecords = filteredRecords.filter((record) => record.status === filters.status);
  }

  if (filters.paymentView === "remaining_only") {
    filteredRecords = filteredRecords.filter((record) => record.remainingSar > 0);
  }

  if (filters.paymentView === "paid_only") {
    filteredRecords = filteredRecords.filter((record) => record.remainingSar <= 0);
  }

  if (filters.healthFilter) {
    filteredRecords = filteredRecords.filter((record) => Boolean(record.healthFlags[filters.healthFilter!]));
  }

  if (q) {
    filteredRecords = filteredRecords.filter((record) => {
      return (
        record.studentName.toLowerCase().includes(q) ||
        record.studentMobile.toLowerCase().includes(q) ||
        record.parentName.toLowerCase().includes(q) ||
        record.parentMobile.toLowerCase().includes(q)
      );
    });
  }

  return {
    records: filteredRecords,
    documentRequirements: requirementRows.filter((requirement) => requirement.category !== "PAYMENT"),
  };
}
