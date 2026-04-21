import { ApplicationStatus, NotificationType, ParentType, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { ensureDefaultAgreementTemplates } from "@/features/agreements/server/agreements";
import { notifyPortalUsers } from "@/features/notifications/server/notifications";
import {
  applyParentLinkForApplication,
  resolveParentAccountByMobile,
} from "@/features/auth/server/account-lifecycle";
import { buildDefaultPasswordFromMobile, hashPassword } from "@/features/auth/server/passwords";
import { prisma } from "@/lib/db/prisma";

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

export class AdminWorkspaceMutationError extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

export function refreshAdminWorkspaceViews(applicationId: string) {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/students");
  revalidatePath("/admin/parents");
  revalidatePath("/admin/documents");
  revalidatePath("/admin/messages");
  revalidatePath(`/admin/students/${applicationId}`);
  revalidatePath(`/admin/students/${applicationId}/profile`);
  revalidatePath("/portal/dashboard");
  revalidatePath("/portal/documents");
  revalidatePath("/portal/profile");
  revalidatePath("/portal/payments");
  revalidatePath("/portal/messages");
  revalidatePath("/portal/agreements");
}

export async function updateAdminStudentProfile(params: {
  applicationId: string;
  mobileNumber: string;
  email: string;
  fullNameAr: string;
  fullNameEn: string;
  birthDate: string;
  gender: string;
  nationalityMode: string;
  nationality: string;
  city: string;
  schoolName: string;
  languageLevel: string;
  hobbies: string;
  schoolStage: string;
  passportNumber: string;
  nationalIdNumber: string;
}) {
  await getAdminSession();

  if (!params.applicationId || !params.mobileNumber.trim()) {
    throw new AdminWorkspaceMutationError("invalid_student_profile");
  }

  if (
    (params.fullNameEn && !englishNameRegex.test(params.fullNameEn)) ||
    (params.passportNumber && !passportNumberRegex.test(params.passportNumber))
  ) {
    throw new AdminWorkspaceMutationError("invalid_english_fields");
  }

  const normalizedNationality = normalizeStudentNationality({
    nationalityMode: params.nationalityMode,
    nationality: params.nationality,
  });
  const normalizedNationalIdNumber = normalizeOptionalValue(params.nationalIdNumber);
  const normalizedPassportNumber = normalizeOptionalValue(params.passportNumber);
  const normalizedEmail = normalizeOptionalValue(params.email);

  if (normalizedEmail && !emailRegex.test(normalizedEmail)) {
    throw new AdminWorkspaceMutationError("invalid_email");
  }

  if (
    !params.gender ||
    !normalizedNationality ||
    !normalizedNationalIdNumber ||
    !identityNumberRegex.test(normalizedNationalIdNumber)
  ) {
    throw new AdminWorkspaceMutationError("invalid_identity_fields");
  }

  const application = await prisma.application.findUnique({
    where: { id: params.applicationId },
    select: {
      id: true,
      studentUserId: true,
    },
  });

  if (!application) {
    throw new AdminWorkspaceMutationError("application_not_found");
  }

  const conflictingUser = await prisma.user.findUnique({
    where: { mobileNumber: params.mobileNumber.trim() },
    select: { id: true },
  });

  if (conflictingUser && conflictingUser.id !== application.studentUserId) {
    throw new AdminWorkspaceMutationError("mobile_in_use");
  }

  if (normalizedEmail) {
    const conflictingEmailUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (conflictingEmailUser && conflictingEmailUser.id !== application.studentUserId) {
      throw new AdminWorkspaceMutationError("email_in_use");
    }
  }

  if (normalizedPassportNumber) {
    const existingPassport = await prisma.studentProfile.findFirst({
      where: {
        passportNumber: normalizedPassportNumber,
        applicationId: { not: params.applicationId },
      },
      select: { id: true },
    });

    if (existingPassport) {
      throw new AdminWorkspaceMutationError("duplicate_identity_number");
    }
  }

  if (normalizedNationalIdNumber) {
    const existingNationalId = await prisma.studentProfile.findFirst({
      where: {
        nationalIdNumber: normalizedNationalIdNumber,
        applicationId: { not: params.applicationId },
      },
      select: { id: true },
    });

    if (existingNationalId) {
      throw new AdminWorkspaceMutationError("duplicate_identity_number");
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: application.studentUserId },
        data: {
          mobileNumber: params.mobileNumber.trim(),
          email: normalizedEmail,
        },
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
      throw new AdminWorkspaceMutationError("duplicate_identity_number");
    }

    throw error;
  }

  refreshAdminWorkspaceViews(params.applicationId);
  return { code: "student_profile_updated" as const };
}

export async function updateAdminParentProfile(params: {
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
  await getAdminSession();

  const application = await prisma.application.findUnique({
    where: { id: params.applicationId },
    include: {
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
    throw new AdminWorkspaceMutationError("parent_profile_failed");
  }

  if (
    params.mobileNumber &&
    !params.isDeceased &&
    (params.passportNumber && !passportNumberRegex.test(params.passportNumber))
  ) {
    throw new AdminWorkspaceMutationError("invalid_english_fields");
  }

  const parentType = params.parentType as ParentType;
  const newParentPasswordHash =
    params.mobileNumber && !params.isDeceased
      ? await hashPassword(buildDefaultPasswordFromMobile(params.mobileNumber))
      : undefined;

  if (params.mobileNumber && !params.isDeceased) {
    const resolution = await resolveParentAccountByMobile(params.mobileNumber);

    if (resolution.kind === "non_parent_conflict") {
      throw new AdminWorkspaceMutationError("mobile_in_use");
    }

    try {
      await prisma.$transaction((tx) =>
        applyParentLinkForApplication({
          tx,
          applicationId: params.applicationId,
          parentType,
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
      throw new AdminWorkspaceMutationError("parent_profile_failed");
    }
  } else {
    await prisma.parentProfile.upsert({
      where: {
        applicationId_type: {
          applicationId: params.applicationId,
          type: parentType,
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
        type: parentType,
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

  refreshAdminWorkspaceViews(params.applicationId);
  return { code: "parent_profile_updated" as const };
}

export async function updateApplicationStatus(params: {
  applicationId: string;
  status: string;
}) {
  await getAdminSession();

  if (!params.applicationId || !(params.status in ApplicationStatus)) {
    throw new AdminWorkspaceMutationError("invalid_status");
  }

  await prisma.application.update({
    where: { id: params.applicationId },
    data: {
      status: params.status as ApplicationStatus,
    },
  });

  refreshAdminWorkspaceViews(params.applicationId);
  return { code: "status_updated" as const };
}

export async function assignAgreementTemplate(params: {
  applicationId: string;
  templateId: string;
  assignmentScope: string;
}) {
  await getAdminSession();

  if (!params.applicationId || !params.templateId) {
    throw new AdminWorkspaceMutationError("agreement_failed");
  }

  await ensureDefaultAgreementTemplates();

  const template = await prisma.agreementTemplate.findUnique({
    where: { id: params.templateId },
  });

  if (!template || !template.isActive) {
    throw new AdminWorkspaceMutationError("agreement_failed");
  }

  await prisma.applicationAgreement.create({
    data: {
      applicationId: params.applicationId,
      templateId: template.id,
      title: template.title,
      contentSnapshot: template.content,
      acknowledgmentSnapshot: template.acknowledgmentText,
      requiresStudentAcceptance: true,
      requiresParentAcceptance: params.assignmentScope !== "student_only",
    },
  });

  await notifyPortalUsers({
    applicationId: params.applicationId,
    actorName: "الإدارة",
    actorRole: UserRole.ADMIN,
    title: "تم إسناد ميثاق جديد",
    description: template.title,
    type: NotificationType.AGREEMENT,
    link: "/portal/agreements",
  });

  refreshAdminWorkspaceViews(params.applicationId);
  return { code: "agreement_assigned" as const };
}

export async function createAndAssignAgreement(params: {
  applicationId: string;
  title: string;
  content: string;
  acknowledgmentText: string;
  assignmentScope: string;
}) {
  const admin = await getAdminSession();

  if (!params.applicationId || !params.title || !params.content || !params.acknowledgmentText) {
    throw new AdminWorkspaceMutationError("agreement_failed");
  }

  await prisma.$transaction(async (tx) => {
    const template = await tx.agreementTemplate.create({
      data: {
        title: params.title,
        content: params.content,
        acknowledgmentText: params.acknowledgmentText,
        createdByUserId: admin.id,
      },
    });

    await tx.applicationAgreement.create({
      data: {
        applicationId: params.applicationId,
        templateId: template.id,
        title: template.title,
        contentSnapshot: template.content,
        acknowledgmentSnapshot: template.acknowledgmentText,
        requiresStudentAcceptance: true,
        requiresParentAcceptance: params.assignmentScope !== "student_only",
      },
    });
  });

  await notifyPortalUsers({
    applicationId: params.applicationId,
    actorName: "الإدارة",
    actorRole: UserRole.ADMIN,
    title: "تم إسناد ميثاق جديد",
    description: params.title,
    type: NotificationType.AGREEMENT,
    link: "/portal/agreements",
  });

  refreshAdminWorkspaceViews(params.applicationId);
  return { code: "agreement_assigned" as const };
}
