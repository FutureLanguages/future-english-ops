import { revalidatePath } from "next/cache";
import { ParentType, UserRole } from "@prisma/client";
import { canEditParentInfo, canEditStudentInfo, canUploadDocument, canUploadPaymentReceipt } from "@/features/auth/services";
import { getPortalSession } from "@/features/auth/server/portal-session";
import {
  applyParentLinkForApplication,
  resolveParentAccountByMobile,
} from "@/features/auth/server/account-lifecycle";
import { buildDefaultPasswordFromMobile, hashPassword } from "@/features/auth/server/passwords";
import { hasAcceptedApplicationAgreements } from "@/features/agreements/server/agreements";
import {
  notifyAdminsOfDocumentUpload,
} from "@/features/notifications/server/notifications";
import { prisma } from "@/lib/db/prisma";
import { isAllowedUploadMimeType, MAX_UPLOAD_SIZE_BYTES } from "@/lib/storage/upload-limits";
import { storeUploadedFile } from "@/lib/storage/upload-file";
import type { ApplicationRecord } from "@/types/application";

const englishNameRegex = /^[A-Za-z\s]+$/;
const passportNumberRegex = /^[A-Za-z0-9]+$/;
const identityNumberRegex = /^\d{1,10}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeOptionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeStudentNationality(params: {
  nationalityMode: string;
  nationality: string;
}) {
  if (params.nationalityMode === "saudi") {
    return "سعودي";
  }

  return params.nationality.trim();
}

async function assertUniqueStudentIdentity(params: {
  applicationId: string;
  passportNumber: string | null;
  nationalIdNumber: string | null;
}) {
  if (params.passportNumber) {
    const existingPassport = await prisma.studentProfile.findFirst({
      where: {
        passportNumber: params.passportNumber,
        applicationId: { not: params.applicationId },
      },
      select: { id: true },
    });

    if (existingPassport) {
      throw new PortalMutationError("duplicate_identity_number");
    }
  }

  if (params.nationalIdNumber) {
    const existingNationalId = await prisma.studentProfile.findFirst({
      where: {
        nationalIdNumber: params.nationalIdNumber,
        applicationId: { not: params.applicationId },
      },
      select: { id: true },
    });

    if (existingNationalId) {
      throw new PortalMutationError("duplicate_identity_number");
    }
  }
}

async function assertUniqueEmail(params: { userId: string; email: string | null }) {
  if (!params.email) {
    return;
  }

  if (!emailRegex.test(params.email)) {
    throw new PortalMutationError("invalid_email");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: params.email },
    select: { id: true },
  });

  if (existingUser && existingUser.id !== params.userId) {
    throw new PortalMutationError("email_in_use");
  }
}

export class PortalMutationError extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

function toPortalUserRole(role: "STUDENT" | "PARENT") {
  return role === "STUDENT" ? UserRole.STUDENT : UserRole.PARENT;
}

export function refreshPortalViews(applicationId: string) {
  revalidatePath("/portal/dashboard");
  revalidatePath("/portal/documents");
  revalidatePath("/portal/profile");
  revalidatePath("/portal/payments");
  revalidatePath("/portal/messages");
  revalidatePath("/portal/agreements");
  revalidatePath(`/portal/agreements`);
  revalidatePath(`/admin/students/${applicationId}`);
  revalidatePath("/admin/students");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/parents");
  revalidatePath("/admin/messages");
  revalidatePath("/admin/documents");
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
  studentProfile: ApplicationRecord["studentProfile"];
  parentProfiles: ApplicationRecord["parentProfiles"];
}): ApplicationRecord {
  return {
    ...application,
    totalCostSar:
      typeof application.totalCostSar === "number"
        ? application.totalCostSar
        : application.totalCostSar.toNumber(),
    paidAmountSar:
      typeof application.paidAmountSar === "number"
        ? application.paidAmountSar
        : application.paidAmountSar.toNumber(),
  };
}

function canPortalManageParentInfo(
  user: Awaited<ReturnType<typeof getPortalSession>>,
  application: ApplicationRecord,
) {
  if (canEditParentInfo(user, application)) {
    return true;
  }

  return user.role === "STUDENT" &&
    application.studentUserId === user.id &&
    !application.parentInfoLocked;
}

function getPortalSenderName(params: {
  role: Awaited<ReturnType<typeof getPortalSession>>["role"];
  mobileNumber: string;
  studentProfile: { fullNameAr: string | null } | null;
  parentProfiles: Array<{ fullName: string | null; mobileNumber: string | null }>;
}) {
  if (params.role === "STUDENT") {
    return params.studentProfile?.fullNameAr ?? params.mobileNumber;
  }

  return (
    params.parentProfiles.find((profile) => profile.mobileNumber === params.mobileNumber)?.fullName ??
    params.parentProfiles.find((profile) => profile.fullName)?.fullName ??
    params.mobileNumber
  );
}

async function assertAgreementsAccepted(applicationId: string, user: Awaited<ReturnType<typeof getPortalSession>>) {
  const isAccepted = await hasAcceptedApplicationAgreements({
    applicationId,
    user,
  });

  if (!isAccepted) {
    throw new PortalMutationError("agreement_required");
  }
}

export async function uploadPortalDocument(params: {
  applicationId: string;
  requirementCode: string;
  file: File;
}) {
  if (params.file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new PortalMutationError("file_too_large");
  }
  if (!isAllowedUploadMimeType(params.file.type || "application/octet-stream")) {
    throw new PortalMutationError("unsupported_file_type");
  }

  const user = await getPortalSession();
  const application = await prisma.application.findUnique({
    where: { id: params.applicationId },
    include: {
      studentProfile: true,
      parentProfiles: true,
      documents: true,
    },
  });

  if (!application) {
    throw new PortalMutationError("application_not_found");
  }

  const requirement = await prisma.documentRequirement.findUnique({
    where: { code: params.requirementCode },
  });

  if (!requirement) {
    throw new PortalMutationError("requirement_not_found");
  }

  const applicationRecord = toApplicationRecord(application);
  await assertAgreementsAccepted(params.applicationId, user);

  const canUpload = canUploadDocument({
    user,
    application: applicationRecord,
    requirement,
  });

  if (!canUpload) {
    throw new PortalMutationError("upload_not_allowed");
  }

  const existingDocument = application.documents.find(
    (document) => document.requirementId === requirement.id,
  );

  if (existingDocument?.status === "APPROVED") {
    throw new PortalMutationError("already_approved");
  }

  const storedFile = await storeUploadedFile({
    file: params.file,
    folder: params.applicationId,
  });

  const fileAsset = await prisma.fileAsset.create({
    data: storedFile,
  });

  await prisma.applicationDocument.upsert({
    where: {
      applicationId_requirementId: {
        applicationId: params.applicationId,
        requirementId: requirement.id,
      },
    },
    update: {
      fileAssetId: fileAsset.id,
      status: "UPLOADED",
      adminNote: null,
      uploadedByUserId: user.id,
      reviewedAt: null,
    },
    create: {
      applicationId: params.applicationId,
      requirementId: requirement.id,
      fileAssetId: fileAsset.id,
      status: "UPLOADED",
      uploadedByUserId: user.id,
    },
  });

  await notifyAdminsOfDocumentUpload({
    applicationId: params.applicationId,
    actorUserId: user.id,
    actorRole: toPortalUserRole(user.role),
    actorName: getPortalSenderName({
      role: user.role,
      mobileNumber: user.mobileNumber,
      studentProfile: application.studentProfile,
      parentProfiles: application.parentProfiles,
    }),
    documentTitle: requirement.titleAr,
  });

  refreshPortalViews(params.applicationId);
  return { code: "document_uploaded" as const };
}

export async function uploadPaymentReceipt(params: {
  applicationId: string;
  file: File;
}) {
  if (params.file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new PortalMutationError("file_too_large");
  }
  if (!isAllowedUploadMimeType(params.file.type || "application/octet-stream")) {
    throw new PortalMutationError("unsupported_file_type");
  }

  const user = await getPortalSession();
  const application = await prisma.application.findUnique({
    where: { id: params.applicationId },
    include: {
      studentProfile: true,
      parentProfiles: true,
      parentUser: {
        select: {
          id: true,
          isActive: true,
          role: true,
        },
      },
    },
  });

  if (!application) {
    throw new PortalMutationError("application_not_found");
  }

  const applicationRecord = toApplicationRecord(application);
  await assertAgreementsAccepted(params.applicationId, user);

  if (!canUploadPaymentReceipt(user, applicationRecord)) {
    throw new PortalMutationError("upload_not_allowed");
  }

  const storedFile = await storeUploadedFile({
    file: params.file,
    folder: `${params.applicationId}/receipts`,
  });

  const fileAsset = await prisma.fileAsset.create({
    data: storedFile,
  });

  await prisma.paymentReceipt.create({
    data: {
      applicationId: params.applicationId,
      fileAssetId: fileAsset.id,
      status: "UPLOADED",
      uploadedByUserId: user.id,
    },
  });

  await notifyAdminsOfDocumentUpload({
    applicationId: params.applicationId,
    actorUserId: user.id,
    actorRole: toPortalUserRole(user.role),
    actorName: getPortalSenderName({
      role: user.role,
      mobileNumber: user.mobileNumber,
      studentProfile: application.studentProfile,
      parentProfiles: application.parentProfiles,
    }),
    documentTitle: "إيصال دفع",
    isPaymentReceipt: true,
  });

  refreshPortalViews(params.applicationId);
  return { code: "receipt_uploaded" as const };
}

export async function updateStudentProfile(params: {
  applicationId: string;
  email: string;
  fullNameAr: string;
  fullNameEn: string;
  birthDate: string;
  gender: string;
  nationalityMode: string;
  nationality: string;
  nationalIdNumber: string;
  city: string;
  schoolName: string;
  languageLevel: string;
  hobbies: string;
  schoolStage: string;
  passportNumber: string;
}) {
  const user = await getPortalSession();
  const application = await prisma.application.findUnique({
    where: { id: params.applicationId },
    include: {
      studentProfile: true,
      parentProfiles: true,
      studentUser: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!application) {
    throw new PortalMutationError("application_not_found");
  }

  const applicationRecord = toApplicationRecord(application);
  await assertAgreementsAccepted(params.applicationId, user);

  if (!canEditStudentInfo(user, applicationRecord)) {
    throw new PortalMutationError("student_edit_not_allowed");
  }

  if (
    (params.fullNameEn && !englishNameRegex.test(params.fullNameEn)) ||
    (params.passportNumber && !passportNumberRegex.test(params.passportNumber))
  ) {
    throw new PortalMutationError("invalid_english_fields");
  }

  const normalizedNationality = normalizeStudentNationality({
    nationalityMode: params.nationalityMode,
    nationality: params.nationality,
  });
  const normalizedNationalIdNumber = normalizeOptionalValue(params.nationalIdNumber);
  const normalizedPassportNumber = normalizeOptionalValue(params.passportNumber);

  if (
    !params.gender ||
    !normalizedNationality ||
    !normalizedNationalIdNumber ||
    !identityNumberRegex.test(normalizedNationalIdNumber)
  ) {
    throw new PortalMutationError("invalid_identity_fields");
  }

  await assertUniqueStudentIdentity({
    applicationId: params.applicationId,
    passportNumber: normalizedPassportNumber,
    nationalIdNumber: normalizedNationalIdNumber,
  });
  const normalizedEmail = normalizeOptionalValue(params.email);
  await assertUniqueEmail({ userId: application.studentUser.id, email: normalizedEmail });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: application.studentUser.id },
        data: { email: normalizedEmail },
      });

      await tx.studentProfile.upsert({
        where: { applicationId: params.applicationId },
        update: {
          fullNameAr: params.fullNameAr || null,
          fullNameEn: params.fullNameEn || null,
          birthDate: params.birthDate ? new Date(params.birthDate) : null,
          gender: params.gender || null,
          nationality: normalizedNationality,
          city: params.city || null,
          schoolName: params.schoolName || null,
          languageLevel: params.languageLevel || null,
          hobbies: params.hobbies || null,
          schoolStage: params.schoolStage || null,
          passportNumber: normalizedPassportNumber,
          nationalIdNumber: normalizedNationalIdNumber,
        },
        create: {
          applicationId: params.applicationId,
          fullNameAr: params.fullNameAr || null,
          fullNameEn: params.fullNameEn || null,
          birthDate: params.birthDate ? new Date(params.birthDate) : null,
          gender: params.gender || null,
          nationality: normalizedNationality,
          city: params.city || null,
          schoolName: params.schoolName || null,
          languageLevel: params.languageLevel || null,
          hobbies: params.hobbies || null,
          schoolStage: params.schoolStage || null,
          passportNumber: normalizedPassportNumber,
          nationalIdNumber: normalizedNationalIdNumber,
        },
      });
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      throw new PortalMutationError("duplicate_identity_number");
    }

    throw error;
  }

  refreshPortalViews(params.applicationId);
  return { code: "student_profile_updated" as const };
}

export async function updateHealthBehaviorProfile(params: {
  applicationId: string;
  healthBehavior: Record<string, { hasIssue: boolean; details: string }>;
  parentSupervisorNotes: string;
}) {
  const user = await getPortalSession();
  const application = await prisma.application.findUnique({
    where: { id: params.applicationId },
    include: {
      studentProfile: true,
      parentProfiles: true,
    },
  });

  if (!application) {
    throw new PortalMutationError("application_not_found");
  }

  const applicationRecord = toApplicationRecord(application);
  await assertAgreementsAccepted(params.applicationId, user);

  if (user.role !== UserRole.PARENT || !canEditParentInfo(user, applicationRecord)) {
    throw new PortalMutationError("parent_profile_failed");
  }

  const health = params.healthBehavior;

  await prisma.$transaction(async (tx) => {
    await tx.studentHealthProfile.upsert({
      where: { applicationId: params.applicationId },
      update: {
        hasMedicalConditions: Boolean(health.medicalConditions?.hasIssue),
        medicalConditionsDetails: health.medicalConditions?.details || null,
        hasSleepDisorders: Boolean(health.sleepDisorders?.hasIssue),
        sleepDisordersDetails: health.sleepDisorders?.details || null,
        hasAllergies: Boolean(health.allergies?.hasIssue),
        allergiesDetails: health.allergies?.details || null,
        hasContinuousMedication: Boolean(health.continuousMedication?.hasIssue),
        continuousMedicationDetails: health.continuousMedication?.details || null,
        hasPhobia: Boolean(health.phobia?.hasIssue),
        phobiaDetails: health.phobia?.details || null,
        hasBedwetting: Boolean(health.bedwetting?.hasIssue),
        bedwettingDetails: health.bedwetting?.details || null,
        needsSpecialSupervisorFollowUp: Boolean(health.needsSpecialSupervisorFollowUp?.hasIssue),
        specialSupervisorFollowUpDetails: health.needsSpecialSupervisorFollowUp?.details || null,
      },
      create: {
        applicationId: params.applicationId,
        hasMedicalConditions: Boolean(health.medicalConditions?.hasIssue),
        medicalConditionsDetails: health.medicalConditions?.details || null,
        hasSleepDisorders: Boolean(health.sleepDisorders?.hasIssue),
        sleepDisordersDetails: health.sleepDisorders?.details || null,
        hasAllergies: Boolean(health.allergies?.hasIssue),
        allergiesDetails: health.allergies?.details || null,
        hasContinuousMedication: Boolean(health.continuousMedication?.hasIssue),
        continuousMedicationDetails: health.continuousMedication?.details || null,
        hasPhobia: Boolean(health.phobia?.hasIssue),
        phobiaDetails: health.phobia?.details || null,
        hasBedwetting: Boolean(health.bedwetting?.hasIssue),
        bedwettingDetails: health.bedwetting?.details || null,
        needsSpecialSupervisorFollowUp: Boolean(health.needsSpecialSupervisorFollowUp?.hasIssue),
        specialSupervisorFollowUpDetails: health.needsSpecialSupervisorFollowUp?.details || null,
      },
    });

    await tx.applicationParentNote.upsert({
      where: { applicationId: params.applicationId },
      update: {
        body: params.parentSupervisorNotes || "",
        updatedByUserId: user.id,
      },
      create: {
        applicationId: params.applicationId,
        body: params.parentSupervisorNotes || "",
        updatedByUserId: user.id,
      },
    });
  });

  refreshPortalViews(params.applicationId);
  return { code: "health_profile_updated" as const };
}

export async function updateParentProfile(params: {
  applicationId: string;
  parentType: string;
  fullName: string;
  mobileNumber: string;
  passportNumber: string;
  nationalIdNumber: string;
  relationToStudent: string;
  note: string;
  isDeceased: boolean;
}) {
  const user = await getPortalSession();
  const application = await prisma.application.findUnique({
    where: { id: params.applicationId },
    include: {
      studentProfile: true,
      parentProfiles: true,
      parentUser: {
        select: {
          id: true,
          isActive: true,
          role: true,
        },
      },
    },
  });

  if (!application) {
    throw new PortalMutationError("parent_profile_failed");
  }

  const applicationRecord = toApplicationRecord(application);
  await assertAgreementsAccepted(params.applicationId, user);

  if (!canPortalManageParentInfo(user, applicationRecord)) {
    throw new PortalMutationError("parent_profile_failed");
  }

  const newParentPasswordHash =
    params.mobileNumber && !params.isDeceased
      ? await hashPassword(buildDefaultPasswordFromMobile(params.mobileNumber))
      : undefined;

  if (params.mobileNumber && !params.isDeceased) {
    const resolution = await resolveParentAccountByMobile(params.mobileNumber);

    if (resolution.kind === "non_parent_conflict") {
      throw new PortalMutationError("mobile_used_by_other_account");
    }

    try {
      await prisma.$transaction((tx) =>
        applyParentLinkForApplication({
          tx,
          applicationId: params.applicationId,
          parentType: params.parentType as ParentType,
          fullName: params.fullName,
          mobileNumber: params.mobileNumber,
          currentParentUser: application.parentUser,
          resolution,
          newParentPasswordHash,
          profilePayload: {
            passportNumber: params.passportNumber || null,
            nationalIdNumber: params.nationalIdNumber || null,
            relationToStudent: params.relationToStudent || null,
            note: params.note || null,
            isDeceased: params.isDeceased,
          },
        }),
      );
    } catch {
      throw new PortalMutationError("parent_profile_failed");
    }
  } else {
    await prisma.parentProfile.upsert({
      where: {
        applicationId_type: {
          applicationId: params.applicationId,
          type: params.parentType as ParentType,
        },
      },
      update: {
        fullName: params.fullName || null,
        mobileNumber: params.mobileNumber || null,
        passportNumber: params.passportNumber || null,
        nationalIdNumber: params.nationalIdNumber || null,
        relationToStudent: params.relationToStudent || null,
        note: params.note || null,
        isDeceased: params.isDeceased,
      },
      create: {
        applicationId: params.applicationId,
        type: params.parentType as ParentType,
        fullName: params.fullName || null,
        mobileNumber: params.mobileNumber || null,
        passportNumber: params.passportNumber || null,
        nationalIdNumber: params.nationalIdNumber || null,
        relationToStudent: params.relationToStudent || null,
        note: params.note || null,
        isDeceased: params.isDeceased,
      },
    });
  }

  refreshPortalViews(params.applicationId);
  return { code: "parent_profile_updated" as const };
}
