"use server";

import { ApplicationNoteType, ApplicationStatus, DocumentStatus, MessageThreadType, NotificationType, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { syncApplicationFinancialTotals } from "@/features/payments/server/ledger";
import { resetUserPassword } from "@/features/auth/server/account-lifecycle";
import { ensureDefaultAgreementTemplates } from "@/features/agreements/server/agreements";
import { notifyMessageSent, notifyPortalUsers } from "@/features/notifications/server/notifications";
import { prisma } from "@/lib/db/prisma";

const allowedAccessFields = new Set([
  "studentInfoLocked",
  "studentBasicInfoLocked",
  "studentAdditionalInfoLocked",
  "parentInfoLocked",
  "fatherInfoLocked",
  "motherInfoLocked",
  "guardianInfoLocked",
  "documentsLocked",
  "studentDocumentsLocked",
  "parentDocumentsLocked",
  "guardianDocumentsLocked",
  "showPaymentToStudent",
]);

function toBoolean(value: FormDataEntryValue | null) {
  return value === "true";
}

function refreshApplicationViews(applicationId: string) {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/students");
  revalidatePath("/admin/parents");
  revalidatePath("/admin/documents");
  revalidatePath("/admin/messages");
  revalidatePath(`/admin/students/${applicationId}`);
  revalidatePath("/portal/dashboard");
  revalidatePath("/portal/documents");
  revalidatePath("/portal/profile");
  revalidatePath("/portal/payments");
  revalidatePath("/portal/messages");
  revalidatePath("/portal/agreements");
}

const reviewStatuses = new Set<string>([
  DocumentStatus.APPROVED,
  DocumentStatus.REJECTED,
  DocumentStatus.REUPLOAD_REQUESTED,
]);

const documentReviewLabels = {
  [DocumentStatus.APPROVED]: "تم قبول المستند",
  [DocumentStatus.REJECTED]: "تم رفض المستند",
  [DocumentStatus.REUPLOAD_REQUESTED]: "مطلوب إعادة رفع المستند",
} as const;

export async function updateAdminAccessSettingAction(formData: FormData) {
  await getAdminSession();

  const applicationId = String(formData.get("applicationId") ?? "");
  const field = String(formData.get("field") ?? "");
  const value = toBoolean(formData.get("value"));

  if (!applicationId || !allowedAccessFields.has(field)) {
    redirect(`/admin/students/${applicationId || ""}?error=invalid_access_setting#overview`);
  }

  await prisma.application.update({
    where: { id: applicationId },
    data: {
      [field]: value,
    },
  });

  refreshApplicationViews(applicationId);
  redirect(`/admin/students/${applicationId}?success=access_updated#overview`);
}

export async function updateAdminStatusAction(formData: FormData) {
  await getAdminSession();

  const applicationId = String(formData.get("applicationId") ?? "");
  const statusValue = String(formData.get("status") ?? "");

  if (!applicationId || !(statusValue in ApplicationStatus)) {
    redirect(`/admin/students/${applicationId || ""}?error=invalid_status#status`);
  }

  await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: statusValue as ApplicationStatus,
    },
  });

  refreshApplicationViews(applicationId);
  redirect(`/admin/students/${applicationId}?success=status_updated#status`);
}

export async function reviewApplicationDocumentAction(formData: FormData) {
  await getAdminSession();

  const applicationId = String(formData.get("applicationId") ?? "");
  const requirementId = String(formData.get("requirementId") ?? "");
  const statusValue = String(formData.get("status") ?? "");
  const adminNote = String(formData.get("adminNote") ?? "").trim();
  const targetTab = String(formData.get("targetTab") ?? "documents");

  console.info("[admin-document-review] start", {
    applicationId,
    requirementId,
    status: statusValue,
    hasAdminNote: adminNote.length > 0,
  });

  if (
    !applicationId ||
    !requirementId ||
    !reviewStatuses.has(statusValue as DocumentStatus)
  ) {
    redirect(`/admin/students/${applicationId || ""}?error=invalid_document_review#${targetTab}`);
  }

  if (
    (statusValue === DocumentStatus.REJECTED ||
      statusValue === DocumentStatus.REUPLOAD_REQUESTED) &&
    adminNote.length === 0
  ) {
    redirect(`/admin/students/${applicationId}?error=missing_review_note#${targetTab}`);
  }

  try {
    const updatedDocument = await prisma.applicationDocument.update({
      where: {
        applicationId_requirementId: {
          applicationId,
          requirementId,
        },
      },
      data: {
        status: statusValue as DocumentStatus,
        adminNote: adminNote.length > 0 ? adminNote : null,
        reviewedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
      },
    });
    console.info("[admin-document-review] updated", updatedDocument);

  } catch (error) {
    console.error("[admin-document-review] failed", {
      applicationId,
      requirementId,
      status: statusValue,
      error,
    });
    redirect(`/admin/students/${applicationId}?error=invalid_document_review#${targetTab}`);
  }

  try {
    await notifyPortalUsers({
      applicationId,
      actorUserId: undefined,
      actorName: "الإدارة",
      actorRole: UserRole.ADMIN,
      title: documentReviewLabels[statusValue as keyof typeof documentReviewLabels] ?? "تم تحديث حالة المستند",
      description: adminNote || null,
      type: NotificationType.DOCUMENT,
      link: "/portal/documents",
    });
  } catch (error) {
    console.error("[admin-document-review] notification failed", {
      applicationId,
      requirementId,
      status: statusValue,
      error,
    });
  }

  refreshApplicationViews(applicationId);
  redirect(`/admin/students/${applicationId}?success=document_review_updated#${targetTab}`);
}

export async function bulkReviewApplicationDocumentsAction(formData: FormData) {
  await getAdminSession();

  const applicationId = String(formData.get("applicationId") ?? "");
  const statusValue = String(formData.get("status") ?? "");
  const adminNote = String(formData.get("adminNote") ?? "").trim();
  const documentIds = formData.getAll("documentIds").map(String).filter(Boolean);

  console.info("[admin-document-bulk-review] start", {
    applicationId,
    status: statusValue,
    documentIdsCount: documentIds.length,
    hasAdminNote: adminNote.length > 0,
  });

  if (!applicationId || documentIds.length === 0 || !reviewStatuses.has(statusValue as DocumentStatus)) {
    redirect(`/admin/students/${applicationId || ""}?error=invalid_document_review#documents`);
  }

  if (
    (statusValue === DocumentStatus.REJECTED ||
      statusValue === DocumentStatus.REUPLOAD_REQUESTED) &&
    adminNote.length === 0
  ) {
    redirect(`/admin/students/${applicationId}?error=missing_review_note#documents`);
  }

  try {
    const result = await prisma.applicationDocument.updateMany({
      where: {
        applicationId,
        id: {
          in: documentIds,
        },
      },
      data: {
        status: statusValue as DocumentStatus,
        adminNote: adminNote || null,
        reviewedAt: new Date(),
      },
    });
    console.info("[admin-document-bulk-review] updated", {
      applicationId,
      status: statusValue,
      count: result.count,
    });

  } catch (error) {
    console.error("[admin-document-bulk-review] failed", {
      applicationId,
      status: statusValue,
      documentIdsCount: documentIds.length,
      error,
    });
    redirect(`/admin/students/${applicationId}?error=invalid_document_review#documents`);
  }

  try {
    await notifyPortalUsers({
      applicationId,
      actorName: "الإدارة",
      actorRole: UserRole.ADMIN,
      title: `تم تحديث حالة ${documentIds.length} مستند`,
      description: adminNote || (documentReviewLabels[statusValue as keyof typeof documentReviewLabels] ?? null),
      type: NotificationType.DOCUMENT,
      link: "/portal/documents",
    });
  } catch (error) {
    console.error("[admin-document-bulk-review] notification failed", {
      applicationId,
      status: statusValue,
      documentIdsCount: documentIds.length,
      error,
    });
  }

  refreshApplicationViews(applicationId);
  redirect(`/admin/students/${applicationId}?success=document_review_updated#documents`);
}

export async function reviewPaymentReceiptAction(formData: FormData) {
  await getAdminSession();

  const applicationId = String(formData.get("applicationId") ?? "");
  const receiptId = String(formData.get("receiptId") ?? "");
  const statusValue = String(formData.get("status") ?? "");
  const adminNote = String(formData.get("adminNote") ?? "").trim();

  if (!applicationId || !receiptId || !reviewStatuses.has(statusValue as DocumentStatus)) {
    redirect(`/admin/students/${applicationId || ""}?error=invalid_document_review#payments`);
  }

  if (
    (statusValue === DocumentStatus.REJECTED ||
      statusValue === DocumentStatus.REUPLOAD_REQUESTED) &&
    adminNote.length === 0
  ) {
    redirect(`/admin/students/${applicationId}?error=missing_review_note#payments`);
  }

  await prisma.paymentReceipt.update({
    where: { id: receiptId },
    data: {
      status: statusValue as DocumentStatus,
      adminNote: adminNote || null,
      reviewedAt: new Date(),
    },
  });

  await notifyPortalUsers({
    applicationId,
    actorName: "الإدارة",
    actorRole: UserRole.ADMIN,
    title: documentReviewLabels[statusValue as keyof typeof documentReviewLabels] ?? "تم تحديث حالة الإيصال",
    description: adminNote || null,
    type: NotificationType.PAYMENT,
    link: "/portal/payments",
  });

  refreshApplicationViews(applicationId);
  redirect(`/admin/students/${applicationId}?success=document_review_updated#payments`);
}

export async function addApplicationFeeAction(formData: FormData) {
  await getAdminSession();

  const applicationId = String(formData.get("applicationId") ?? "");
  const presetTitle = String(formData.get("presetTitle") ?? "");
  const customTitle = String(formData.get("customTitle") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const note = String(formData.get("note") ?? "").trim();
  const title = customTitle || presetTitle;

  if (!applicationId || !title || !Number.isFinite(amount) || amount <= 0) {
    redirect(`/admin/students/${applicationId || ""}?error=invalid_fee#payments`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.applicationFee.create({
      data: {
        applicationId,
        title,
        amount,
        feeDate: null,
        note: note || null,
      },
    });

    await syncApplicationFinancialTotals(tx, applicationId);
  });

  await notifyPortalUsers({
    applicationId,
    actorName: "الإدارة",
    actorRole: UserRole.ADMIN,
    title: "تمت إضافة رسوم جديدة",
    description: `${title} - ${amount} ر.س`,
    type: NotificationType.PAYMENT,
    link: "/portal/payments",
  });

  refreshApplicationViews(applicationId);
  redirect(`/admin/students/${applicationId}?success=fee_added#payments`);
}

export async function addApplicationDiscountAction(formData: FormData) {
  await getAdminSession();

  const applicationId = String(formData.get("applicationId") ?? "");
  const discountType = String(formData.get("discountType") ?? "fixed");
  const amountValue = Number(formData.get("amount") ?? 0);
  const note = String(formData.get("note") ?? "").trim();
  const selectedTargets = formData
    .getAll("discountTargets")
    .map((value) => String(value))
    .filter(Boolean);

  if (!applicationId || !Number.isFinite(amountValue) || amountValue <= 0) {
    redirect(`/admin/students/${applicationId || ""}?error=invalid_fee#payments`);
  }

  await prisma.$transaction(async (tx) => {
    const existingFees = await tx.applicationFee.findMany({
      where: { applicationId },
      select: { amount: true, title: true },
    });

    const targetLabels = selectedTargets.length > 0 ? new Set(selectedTargets) : null;
    const positiveFees = existingFees.filter((fee) => {
      const amount = typeof fee.amount === "number" ? fee.amount : fee.amount.toNumber();
      if (amount <= 0) {
        return false;
      }

      if (!targetLabels) {
        return true;
      }

      return targetLabels.has(fee.title);
    });

    const positiveTotal = positiveFees.reduce((sum, fee) => {
      const amount = typeof fee.amount === "number" ? fee.amount : fee.amount.toNumber();
      return sum + amount;
    }, 0);

    const discountAmount =
      discountType === "percentage"
        ? Number(((positiveTotal * amountValue) / 100).toFixed(2))
        : Number(amountValue.toFixed(2));

    if (!Number.isFinite(discountAmount) || discountAmount <= 0) {
      redirect(`/admin/students/${applicationId}?error=invalid_fee#payments`);
    }

    await tx.applicationFee.create({
      data: {
        applicationId,
        title:
          discountType === "percentage"
            ? `خصم (${amountValue}%)${selectedTargets.length > 0 ? ` - ${selectedTargets.join(" + ")}` : ""}`
            : `خصم ثابت${selectedTargets.length > 0 ? ` - ${selectedTargets.join(" + ")}` : ""}`,
        amount: -Math.abs(discountAmount),
        feeDate: null,
        note:
          [selectedTargets.length > 0 ? `يشمل: ${selectedTargets.join("، ")}` : null, note || null]
            .filter(Boolean)
            .join(" - ") || null,
      },
    });

    await syncApplicationFinancialTotals(tx, applicationId);
  });

  await notifyPortalUsers({
    applicationId,
    actorName: "الإدارة",
    actorRole: UserRole.ADMIN,
    title: "تم تحديث الخصم",
    description: note || null,
    type: NotificationType.PAYMENT,
    link: "/portal/payments",
  });

  refreshApplicationViews(applicationId);
  redirect(`/admin/students/${applicationId}?success=fee_added#payments`);
}

export async function addApplicationPaymentAction(formData: FormData) {
  await getAdminSession();

  const applicationId = String(formData.get("applicationId") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const paymentDateRaw = String(formData.get("paymentDate") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const linkedReceiptId = String(formData.get("linkedReceiptId") ?? "").trim();

  if (!applicationId || !Number.isFinite(amount) || amount <= 0 || !paymentDateRaw) {
    redirect(`/admin/students/${applicationId || ""}?error=invalid_payment#payments`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.applicationPayment.create({
      data: {
        applicationId,
        amount,
        paymentDate: new Date(paymentDateRaw),
        note: note || null,
        paymentReceiptId: linkedReceiptId || null,
      },
    });

    await syncApplicationFinancialTotals(tx, applicationId);
  });

  await notifyPortalUsers({
    applicationId,
    actorName: "الإدارة",
    actorRole: UserRole.ADMIN,
    title: "تمت إضافة دفعة رسمية",
    description: `${amount} ر.س`,
    type: NotificationType.PAYMENT,
    link: "/portal/payments",
  });

  refreshApplicationViews(applicationId);
  redirect(`/admin/students/${applicationId}?success=payment_added#payments`);
}

export async function sendAdminMessageAction(formData: FormData) {
  const admin = await getAdminSession();
  const applicationId = String(formData.get("applicationId") ?? "");
  const threadTypeValue = String(formData.get("threadType") ?? MessageThreadType.STUDENT);
  const body = String(formData.get("body") ?? "").trim();
  const threadType =
    threadTypeValue === MessageThreadType.PARENT ? MessageThreadType.PARENT : MessageThreadType.STUDENT;

  if (!applicationId || !body) {
    redirect(`/admin/students/${applicationId || ""}?error=message_failed#messages`);
  }

  await prisma.applicationNote.create({
    data: {
      applicationId,
      senderUserId: admin.id,
      threadType,
      noteType: ApplicationNoteType.MESSAGE,
      senderRole: UserRole.ADMIN,
      senderName: "الإدارة",
      body,
    },
  });

  await notifyMessageSent({
    applicationId,
    threadType,
    actorUserId: admin.id,
    actorRole: UserRole.ADMIN,
    actorName: "الإدارة",
  });

  refreshApplicationViews(applicationId);
  redirect(`/admin/students/${applicationId}?success=message_sent#messages-${threadType.toLowerCase()}`);
}

export async function resetAccountPasswordAction(formData: FormData) {
  await getAdminSession();

  const userId = String(formData.get("userId") ?? "");
  const applicationId = String(formData.get("applicationId") ?? "");
  const nextPassword = String(formData.get("nextPassword") ?? "").trim();
  const forceChange = formData.get("forceChange") === "on";
  const redirectTo = String(formData.get("redirectTo") ?? `/admin/students/${applicationId}`);

  if (!userId) {
    redirect(`${redirectTo}?error=password_reset_failed`);
  }

  try {
    await prisma.$transaction((tx) =>
      resetUserPassword({
        tx,
        userId,
        nextPassword,
        forceChange,
      }),
    );
  } catch {
    redirect(`${redirectTo}?error=password_reset_failed`);
  }

  if (applicationId) {
    refreshApplicationViews(applicationId);
  }

  redirect(`${redirectTo}?success=password_reset`);
}

export async function assignAgreementTemplateAction(formData: FormData) {
  await getAdminSession();

  const applicationId = String(formData.get("applicationId") ?? "");
  const templateId = String(formData.get("templateId") ?? "");
  const assignmentScope = String(formData.get("assignmentScope") ?? "student_parent");

  if (!applicationId || !templateId) {
    redirect(`/admin/students/${applicationId || ""}?error=agreement_failed#agreements`);
  }

  await ensureDefaultAgreementTemplates();

  const template = await prisma.agreementTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template || !template.isActive) {
    redirect(`/admin/students/${applicationId}?error=agreement_failed#agreements`);
  }

  await prisma.applicationAgreement.create({
    data: {
      applicationId,
      templateId: template.id,
      title: template.title,
      contentSnapshot: template.content,
      acknowledgmentSnapshot: template.acknowledgmentText,
      requiresStudentAcceptance: true,
      requiresParentAcceptance: assignmentScope !== "student_only",
    },
  });

  await notifyPortalUsers({
    applicationId,
    actorName: "الإدارة",
    actorRole: UserRole.ADMIN,
    title: "تم إسناد ميثاق جديد",
    description: template.title,
    type: NotificationType.AGREEMENT,
    link: "/portal/agreements",
  });

  refreshApplicationViews(applicationId);
  redirect(`/admin/students/${applicationId}?success=agreement_assigned#agreements`);
}

export async function createAndAssignAgreementAction(formData: FormData) {
  const admin = await getAdminSession();

  const applicationId = String(formData.get("applicationId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const acknowledgmentText = String(formData.get("acknowledgmentText") ?? "").trim();
  const assignmentScope = String(formData.get("assignmentScope") ?? "student_parent");

  if (!applicationId || !title || !content || !acknowledgmentText) {
    redirect(`/admin/students/${applicationId || ""}?error=agreement_failed#agreements`);
  }

  await prisma.$transaction(async (tx) => {
    const template = await tx.agreementTemplate.create({
      data: {
        title,
        content,
        acknowledgmentText,
        createdByUserId: admin.id,
      },
    });

    await tx.applicationAgreement.create({
      data: {
        applicationId,
        templateId: template.id,
        title: template.title,
        contentSnapshot: template.content,
        acknowledgmentSnapshot: template.acknowledgmentText,
        requiresStudentAcceptance: true,
        requiresParentAcceptance: assignmentScope !== "student_only",
      },
    });
  });

  await notifyPortalUsers({
    applicationId,
    actorName: "الإدارة",
    actorRole: UserRole.ADMIN,
    title: "تم إسناد ميثاق جديد",
    description: title,
    type: NotificationType.AGREEMENT,
    link: "/portal/agreements",
  });

  refreshApplicationViews(applicationId);
  redirect(`/admin/students/${applicationId}?success=agreement_assigned#agreements`);
}

export async function updateAgreementTemplateAction(formData: FormData) {
  await getAdminSession();

  const applicationId = String(formData.get("applicationId") ?? "");
  const templateId = String(formData.get("templateId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const acknowledgmentText = String(formData.get("acknowledgmentText") ?? "").trim();

  if (!applicationId || !templateId || !title || !content || !acknowledgmentText) {
    redirect(`/admin/students/${applicationId || ""}?error=agreement_failed#agreements`);
  }

  await prisma.agreementTemplate.update({
    where: { id: templateId },
    data: {
      title,
      content,
      acknowledgmentText,
      isActive: true,
    },
  });

  refreshApplicationViews(applicationId);
  redirect(`/admin/students/${applicationId}?success=agreement_template_updated#agreements`);
}

export async function archiveAgreementTemplateAction(formData: FormData) {
  await getAdminSession();

  const applicationId = String(formData.get("applicationId") ?? "");
  const templateId = String(formData.get("templateId") ?? "");

  if (!applicationId || !templateId) {
    redirect(`/admin/students/${applicationId || ""}?error=agreement_failed#agreements`);
  }

  await prisma.agreementTemplate.update({
    where: { id: templateId },
    data: {
      isActive: false,
    },
  });

  refreshApplicationViews(applicationId);
  redirect(`/admin/students/${applicationId}?success=agreement_template_archived#agreements`);
}

export async function removeAssignedAgreementAction(formData: FormData) {
  await getAdminSession();

  const applicationId = String(formData.get("applicationId") ?? "");
  const agreementId = String(formData.get("agreementId") ?? "");

  if (!applicationId || !agreementId) {
    redirect(`/admin/students/${applicationId || ""}?error=agreement_failed#agreements`);
  }

  const agreement = await prisma.applicationAgreement.findUnique({
    where: { id: agreementId },
    select: {
      id: true,
      applicationId: true,
      studentAccepted: true,
      parentAccepted: true,
    },
  });

  if (!agreement || agreement.applicationId !== applicationId) {
    redirect(`/admin/students/${applicationId}?error=agreement_failed#agreements`);
  }

  if (agreement.studentAccepted || agreement.parentAccepted) {
    redirect(`/admin/students/${applicationId}?error=agreement_already_accepted#agreements`);
  }

  await prisma.applicationAgreement.delete({
    where: { id: agreementId },
  });

  refreshApplicationViews(applicationId);
  redirect(`/admin/students/${applicationId}?success=agreement_removed#agreements`);
}

export async function requestAgreementCancellationAction(formData: FormData) {
  await getAdminSession();

  const applicationId = String(formData.get("applicationId") ?? "");
  const agreementId = String(formData.get("agreementId") ?? "");

  if (!applicationId || !agreementId) {
    redirect(`/admin/students/${applicationId || ""}?error=agreement_failed#agreements`);
  }

  const agreement = await prisma.applicationAgreement.findUnique({
    where: { id: agreementId },
    select: {
      id: true,
      applicationId: true,
      studentAccepted: true,
      parentAccepted: true,
      cancellationRequestedAt: true,
    },
  });

  if (!agreement || agreement.applicationId !== applicationId) {
    redirect(`/admin/students/${applicationId}?error=agreement_failed#agreements`);
  }

  if (!agreement.studentAccepted && !agreement.parentAccepted) {
    redirect(`/admin/students/${applicationId}?error=agreement_not_accepted#agreements`);
  }

  if (!agreement.cancellationRequestedAt) {
    await prisma.applicationAgreement.update({
      where: { id: agreementId },
      data: {
        cancellationRequestedAt: new Date(),
      },
    });
  }

  refreshApplicationViews(applicationId);
  redirect(`/admin/students/${applicationId}?success=agreement_cancellation_requested#agreements`);
}
