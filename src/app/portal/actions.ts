"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApplicationNoteType, MessageThreadType, ParentType, UserRole } from "@prisma/client";
import { canUploadDocument, canUploadPaymentReceipt } from "@/features/auth/services";
import { canEditParentInfo, canEditStudentInfo } from "@/features/auth/services";
import { assertPortalAgreementsAccepted } from "@/features/agreements/server/agreements";
import { getPortalSession } from "@/features/auth/server/portal-session";
import {
  applyParentLinkForApplication,
  resolveParentAccountByMobile,
} from "@/features/auth/server/account-lifecycle";
import { buildDefaultPasswordFromMobile, hashPassword } from "@/features/auth/server/passwords";
import {
  notifyAdminsOfDocumentUpload,
  notifyMessageSent,
} from "@/features/notifications/server/notifications";
import { prisma } from "@/lib/db/prisma";
import { isAllowedUploadMimeType, MAX_UPLOAD_SIZE_BYTES } from "@/lib/storage/upload-limits";
import { storeUploadedFile } from "@/lib/storage/upload-file";
import type { ApplicationRecord } from "@/types/application";

const englishNameRegex = /^[A-Za-z\s]+$/;
const passportNumberRegex = /^[A-Za-z0-9]+$/;

function toPortalUserRole(role: "STUDENT" | "PARENT") {
  return role === "STUDENT" ? UserRole.STUDENT : UserRole.PARENT;
}

function refreshPortalViews(applicationId: string) {
  revalidatePath("/portal/dashboard");
  revalidatePath("/portal/documents");
  revalidatePath("/portal/profile");
  revalidatePath("/portal/payments");
  revalidatePath("/portal/messages");
  revalidatePath(`/admin/students/${applicationId}`);
  revalidatePath("/admin/students");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/parents");
  revalidatePath("/admin/messages");
  revalidatePath("/admin/documents");
}

function redirectWithResult(
  basePath: string,
  applicationId: string,
  status: "success" | "error",
  code: string,
): never {
  redirect(`${basePath}?applicationId=${applicationId}&${status}=${code}`);
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

async function saveApplicationDocument(params: {
  applicationId: string;
  requirementCode: string;
  file: File;
  basePath: string;
}) {
  if (params.file.size > MAX_UPLOAD_SIZE_BYTES) {
    redirectWithResult(params.basePath, params.applicationId, "error", "file_too_large");
  }
  if (!isAllowedUploadMimeType(params.file.type || "application/octet-stream")) {
    redirectWithResult(params.basePath, params.applicationId, "error", "unsupported_file_type");
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
    redirectWithResult(params.basePath, params.applicationId, "error", "application_not_found");
  }

  const requirement = await prisma.documentRequirement.findUnique({
    where: { code: params.requirementCode },
  });

  if (!requirement) {
    redirectWithResult(params.basePath, params.applicationId, "error", "requirement_not_found");
  }

  const applicationRecord = toApplicationRecord(application);

  await assertPortalAgreementsAccepted({
    applicationId: params.applicationId,
    user,
    redirectPath: params.basePath,
  });

  const canUpload =
    params.requirementCode === "payment_receipt"
      ? canUploadPaymentReceipt(user, applicationRecord)
      : canUploadDocument({
          user,
          application: applicationRecord,
          requirement,
        });

  if (!canUpload) {
    redirectWithResult(params.basePath, params.applicationId, "error", "upload_not_allowed");
  }

  const existingDocument = application.documents.find(
    (document) => document.requirementId === requirement.id,
  );

  if (existingDocument?.status === "APPROVED") {
    redirectWithResult(params.basePath, params.applicationId, "error", "already_approved");
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
  redirectWithResult(
    params.basePath,
    params.applicationId,
    "success",
    params.requirementCode === "payment_receipt" ? "receipt_uploaded" : "document_uploaded",
  );
}

function canPortalManageParentInfo(user: Awaited<ReturnType<typeof getPortalSession>>, application: ApplicationRecord) {
  if (canEditParentInfo(user, application)) {
    return true;
  }

  return user.role === "STUDENT" &&
    application.studentUserId === user.id &&
    !application.parentInfoLocked;
}

function canPortalSendMessage(user: Awaited<ReturnType<typeof getPortalSession>>, application: ApplicationRecord) {
  if (user.role === "STUDENT") {
    return application.studentUserId === user.id;
  }

  if (user.role === "PARENT") {
    return application.parentUserId === user.id;
  }

  return false;
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

export async function uploadPortalDocumentAction(formData: FormData) {
  const applicationId = String(formData.get("applicationId") ?? "");
  const requirementCode = String(formData.get("requirementCode") ?? "");
  const file = formData.get("file");

  if (!applicationId || !requirementCode || !(file instanceof File) || file.size === 0) {
    redirectWithResult("/portal/documents", applicationId || "", "error", "missing_file");
  }

  await saveApplicationDocument({
    applicationId,
    requirementCode,
    file: file as File,
    basePath: "/portal/documents",
  });
}

export async function uploadPaymentReceiptAction(formData: FormData) {
  const applicationId = String(formData.get("applicationId") ?? "");
  const file = formData.get("file");

  if (!applicationId || !(file instanceof File) || file.size === 0) {
    redirectWithResult("/portal/payments", applicationId || "", "error", "missing_file");
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    redirectWithResult("/portal/payments", applicationId || "", "error", "file_too_large");
  }
  if (!isAllowedUploadMimeType(file.type || "application/octet-stream")) {
    redirectWithResult("/portal/payments", applicationId || "", "error", "unsupported_file_type");
  }

  const user = await getPortalSession();
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
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
    redirectWithResult("/portal/payments", applicationId, "error", "application_not_found");
  }

  const applicationRecord = toApplicationRecord(application);

  await assertPortalAgreementsAccepted({
    applicationId,
    user,
    redirectPath: "/portal/payments",
  });

  if (!canUploadPaymentReceipt(user, applicationRecord)) {
    redirectWithResult("/portal/payments", applicationId, "error", "upload_not_allowed");
  }

  const storedFile = await storeUploadedFile({
    file: file as File,
    folder: `${applicationId}/receipts`,
  });

  const fileAsset = await prisma.fileAsset.create({
    data: storedFile,
  });

  await prisma.paymentReceipt.create({
    data: {
      applicationId,
      fileAssetId: fileAsset.id,
      status: "UPLOADED",
      uploadedByUserId: user.id,
    },
  });

  await notifyAdminsOfDocumentUpload({
    applicationId,
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

  refreshPortalViews(applicationId);
  redirectWithResult("/portal/payments", applicationId, "success", "receipt_uploaded");
}

export async function updateStudentProfileAction(formData: FormData) {
  const user = await getPortalSession();
  const applicationId = String(formData.get("applicationId") ?? "");

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
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
    redirectWithResult("/portal/profile", applicationId || "", "error", "application_not_found");
  }

  const applicationRecord = toApplicationRecord(application);

  await assertPortalAgreementsAccepted({
    applicationId,
    user,
    redirectPath: "/portal/profile",
  });

  if (!canEditStudentInfo(user, applicationRecord)) {
    redirectWithResult("/portal/profile", applicationId, "error", "student_edit_not_allowed");
  }

  const fullNameEn = String(formData.get("fullNameEn") ?? "").trim();
  const passportNumber = String(formData.get("passportNumber") ?? "").trim();

  if ((fullNameEn && !englishNameRegex.test(fullNameEn)) || (passportNumber && !passportNumberRegex.test(passportNumber))) {
    redirectWithResult("/portal/profile", applicationId, "error", "invalid_english_fields");
  }

  await prisma.studentProfile.upsert({
    where: {
      applicationId,
    },
    update: {
      fullNameAr: String(formData.get("fullNameAr") ?? "").trim() || null,
      fullNameEn: fullNameEn || null,
      birthDate: formData.get("birthDate")
        ? new Date(String(formData.get("birthDate")))
        : null,
      city: String(formData.get("city") ?? "").trim() || null,
      schoolName: String(formData.get("schoolName") ?? "").trim() || null,
      passportNumber: passportNumber || null,
    },
    create: {
      applicationId,
      fullNameAr: String(formData.get("fullNameAr") ?? "").trim() || null,
      fullNameEn: fullNameEn || null,
      birthDate: formData.get("birthDate")
        ? new Date(String(formData.get("birthDate")))
        : null,
      city: String(formData.get("city") ?? "").trim() || null,
      schoolName: String(formData.get("schoolName") ?? "").trim() || null,
      passportNumber: passportNumber || null,
    },
  });

  refreshPortalViews(applicationId);
  redirectWithResult("/portal/profile", applicationId, "success", "student_profile_updated");
}

export async function linkParentAccountAction(formData: FormData) {
  const user = await getPortalSession();
  const applicationId = String(formData.get("applicationId") ?? "");
  const parentType = String(formData.get("parentType") ?? "FATHER");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const mobileNumber = String(formData.get("mobileNumber") ?? "").trim();

  if (user.role !== "STUDENT" || !applicationId || !mobileNumber) {
    redirectWithResult("/portal/profile", applicationId || "", "error", "parent_link_failed");
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
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

  if (!application || application.studentUserId !== user.id || application.parentInfoLocked) {
    redirectWithResult("/portal/profile", applicationId, "error", "parent_link_failed");
  }

  await assertPortalAgreementsAccepted({
    applicationId,
    user,
    redirectPath: "/portal/profile",
  });

  try {
    const resolution = await resolveParentAccountByMobile(mobileNumber);

    if (resolution.kind === "non_parent_conflict") {
      redirectWithResult("/portal/profile", applicationId, "error", "mobile_used_by_other_account");
    }

    const newParentPasswordHash = await hashPassword(buildDefaultPasswordFromMobile(mobileNumber));
    await prisma.$transaction((tx) =>
      applyParentLinkForApplication({
        tx,
        applicationId,
        parentType: parentType as ParentType,
        fullName,
        mobileNumber,
        currentParentUser: application.parentUser,
        resolution,
        newParentPasswordHash,
      }),
    );
  } catch {
    redirectWithResult("/portal/profile", applicationId, "error", "parent_link_failed");
  }

  refreshPortalViews(applicationId);
  redirectWithResult("/portal/profile", applicationId, "success", "parent_linked");
}

export async function updateParentProfileAction(formData: FormData) {
  const user = await getPortalSession();
  const applicationId = String(formData.get("applicationId") ?? "");
  const parentType = String(formData.get("parentType") ?? "");

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
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
    redirectWithResult("/portal/profile", applicationId || "", "error", "parent_profile_failed");
  }

  const applicationRecord = toApplicationRecord(application);

  await assertPortalAgreementsAccepted({
    applicationId,
    user,
    redirectPath: "/portal/profile",
  });

  if (!canPortalManageParentInfo(user, applicationRecord)) {
    redirectWithResult("/portal/profile", applicationId, "error", "parent_profile_failed");
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const mobileNumber = String(formData.get("mobileNumber") ?? "").trim();
  const passportNumber = String(formData.get("passportNumber") ?? "").trim();
  const nationalIdNumber = String(formData.get("nationalIdNumber") ?? "").trim();
  const relationToStudent = String(formData.get("relationToStudent") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const isDeceased = formData.get("isDeceased") === "on";

  const newParentPasswordHash =
    mobileNumber && !isDeceased
      ? await hashPassword(buildDefaultPasswordFromMobile(mobileNumber))
      : undefined;

  try {
    if (mobileNumber && !isDeceased) {
      const resolution = await resolveParentAccountByMobile(mobileNumber);

      if (resolution.kind === "non_parent_conflict") {
        redirectWithResult("/portal/profile", applicationId, "error", "mobile_used_by_other_account");
      }

      await prisma.$transaction((tx) =>
        applyParentLinkForApplication({
          tx,
          applicationId,
          parentType: parentType as ParentType,
          fullName,
          mobileNumber,
          currentParentUser: application.parentUser,
          resolution,
          newParentPasswordHash,
          profilePayload: {
            passportNumber: passportNumber || null,
            nationalIdNumber: nationalIdNumber || null,
            relationToStudent: relationToStudent || null,
            note: note || null,
            isDeceased,
          },
        }),
      );
    } else {
      await prisma.parentProfile.upsert({
        where: {
          applicationId_type: {
            applicationId,
            type: parentType as ParentType,
          },
        },
        update: {
          fullName: fullName || null,
          mobileNumber: mobileNumber || null,
          passportNumber: passportNumber || null,
          nationalIdNumber: nationalIdNumber || null,
          relationToStudent: relationToStudent || null,
          note: note || null,
          isDeceased,
        },
        create: {
          applicationId,
          type: parentType as ParentType,
          fullName: fullName || null,
          mobileNumber: mobileNumber || null,
          passportNumber: passportNumber || null,
          nationalIdNumber: nationalIdNumber || null,
          relationToStudent: relationToStudent || null,
          note: note || null,
          isDeceased,
        },
      });
    }
  } catch {
    redirectWithResult("/portal/profile", applicationId, "error", "parent_profile_failed");
  }

  refreshPortalViews(applicationId);
  redirectWithResult("/portal/profile", applicationId, "success", "parent_profile_updated");
}

export async function sendPortalMessageAction(formData: FormData) {
  const user = await getPortalSession();
  const applicationId = String(formData.get("applicationId") ?? "");
  const threadTypeValue = String(formData.get("threadType") ?? MessageThreadType.STUDENT);
  const body = String(formData.get("body") ?? "").trim();

  if (!applicationId || !body) {
    redirectWithResult("/portal/messages", applicationId || "", "error", "message_failed");
  }

  const threadType =
    threadTypeValue === MessageThreadType.PARENT ? MessageThreadType.PARENT : MessageThreadType.STUDENT;

  if (user.role === "STUDENT" && threadType !== MessageThreadType.STUDENT) {
    redirectWithResult("/portal/messages", applicationId, "error", "message_failed");
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      studentProfile: true,
      parentProfiles: true,
    },
  });

  if (!application) {
    redirectWithResult("/portal/messages", applicationId, "error", "application_not_found");
  }

  const applicationRecord = toApplicationRecord(application);

  if (!canPortalSendMessage(user, applicationRecord)) {
    redirectWithResult("/portal/messages", applicationId, "error", "message_failed");
  }

  const senderName = getPortalSenderName({
    role: user.role,
    mobileNumber: user.mobileNumber,
    studentProfile: application.studentProfile,
    parentProfiles: application.parentProfiles,
  });

  await prisma.applicationNote.create({
    data: {
      applicationId,
      senderUserId: user.id,
      threadType,
      noteType: ApplicationNoteType.MESSAGE,
      senderRole: user.role,
      senderName,
      body,
    },
  });

  await notifyMessageSent({
    applicationId,
    threadType,
    actorUserId: user.id,
    actorRole: toPortalUserRole(user.role),
    actorName: senderName,
  });

  refreshPortalViews(applicationId);
  redirect(`/portal/messages?applicationId=${applicationId}&thread=${threadType.toLowerCase()}&success=message_sent`);
}
