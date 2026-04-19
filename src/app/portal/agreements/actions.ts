"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPortalSession } from "@/features/auth/server/portal-session";
import { prisma } from "@/lib/db/prisma";

export async function acceptPortalAgreementAction(formData: FormData) {
  const user = await getPortalSession();
  const agreementId = String(formData.get("agreementId") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const signature = String(formData.get("signature") ?? "").trim();
  const accepted = formData.get("accepted") === "on";

  if (!agreementId || !accepted || !fullName || !signature.startsWith("data:image/png;base64,")) {
    redirect(`/portal/agreements/${agreementId || ""}?error=invalid_acceptance`);
  }

  const agreement = await prisma.applicationAgreement.findUnique({
    where: { id: agreementId },
    include: {
      application: {
        select: {
          id: true,
          studentUserId: true,
          parentUserId: true,
        },
      },
    },
  });

  if (!agreement) {
    redirect(`/portal/agreements?error=agreement_not_found`);
  }

  if (user.role === UserRole.STUDENT && agreement.application.studentUserId !== user.id) {
    redirect(`/portal/agreements/${agreementId}?error=invalid_acceptance`);
  }

  if (user.role === UserRole.PARENT && agreement.application.parentUserId !== user.id) {
    redirect(`/portal/agreements/${agreementId}?error=invalid_acceptance`);
  }

  if (user.role === UserRole.STUDENT && agreement.studentAccepted) {
    redirect(`/portal/agreements/${agreementId}?success=already_accepted`);
  }

  if (user.role === UserRole.PARENT && (!agreement.requiresParentAcceptance || agreement.parentAccepted)) {
    redirect(`/portal/agreements/${agreementId}?success=already_accepted`);
  }

  const now = new Date();

  await prisma.applicationAgreement.update({
    where: { id: agreementId },
    data:
      user.role === UserRole.STUDENT
        ? {
            studentAccepted: true,
            studentAcceptedAt: now,
            studentFullName: fullName,
            studentSignature: signature,
            cancellationRequestedAt: null,
          }
        : {
            parentAccepted: true,
            parentAcceptedAt: now,
            parentFullName: fullName,
            parentSignature: signature,
            cancellationRequestedAt: null,
          },
  });

  revalidatePath("/portal/agreements");
  revalidatePath(`/portal/agreements/${agreementId}`);
  revalidatePath("/portal/dashboard");
  revalidatePath("/portal/documents");
  revalidatePath("/portal/profile");
  revalidatePath("/portal/payments");
  revalidatePath("/portal/messages");
  revalidatePath(`/admin/students/${agreement.application.id}`);

  redirect(`/portal/agreements/${agreementId}?success=agreement_accepted`);
}

export async function respondAgreementCancellationAction(formData: FormData) {
  const user = await getPortalSession();
  const agreementId = String(formData.get("agreementId") ?? "");
  const response = String(formData.get("response") ?? "");

  if (!agreementId || (response !== "approve" && response !== "reject")) {
    redirect(`/portal/agreements/${agreementId || ""}?error=invalid_cancellation_response`);
  }

  const agreement = await prisma.applicationAgreement.findUnique({
    where: { id: agreementId },
    include: {
      application: {
        select: {
          id: true,
          studentUserId: true,
          parentUserId: true,
        },
      },
    },
  });

  if (!agreement || !agreement.cancellationRequestedAt) {
    redirect(`/portal/agreements/${agreementId || ""}?error=invalid_cancellation_response`);
  }

  if (user.role === UserRole.STUDENT && agreement.application.studentUserId !== user.id) {
    redirect(`/portal/agreements/${agreementId}?error=invalid_cancellation_response`);
  }

  if (user.role === UserRole.PARENT && agreement.application.parentUserId !== user.id) {
    redirect(`/portal/agreements/${agreementId}?error=invalid_cancellation_response`);
  }

  if (response === "approve") {
    await prisma.applicationAgreement.delete({
      where: { id: agreementId },
    });

    revalidatePath("/portal/agreements");
    revalidatePath("/portal/dashboard");
    revalidatePath(`/admin/students/${agreement.application.id}`);
    redirect(`/portal/agreements?success=agreement_cancellation_approved`);
  }

  await prisma.applicationAgreement.update({
    where: { id: agreementId },
    data: {
      cancellationRequestedAt: null,
    },
  });

  revalidatePath("/portal/agreements");
  revalidatePath(`/portal/agreements/${agreementId}`);
  revalidatePath(`/admin/students/${agreement.application.id}`);
  redirect(`/portal/agreements/${agreementId}?success=agreement_cancellation_rejected`);
}
