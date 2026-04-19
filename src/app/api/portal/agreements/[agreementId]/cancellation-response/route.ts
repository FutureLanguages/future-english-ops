import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getPortalSession } from "@/features/auth/server/portal-session";
import { prisma } from "@/lib/db/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ agreementId: string }> },
) {
  const user = await getPortalSession();
  const { agreementId } = await params;
  const formData = await request.formData();
  const response = String(formData.get("response") ?? "");

  if (!agreementId || (response !== "approve" && response !== "reject")) {
    return NextResponse.json({ error: "invalid_cancellation_response" }, { status: 400 });
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
    return NextResponse.json({ error: "invalid_cancellation_response" }, { status: 400 });
  }

  if (user.role === UserRole.STUDENT && agreement.application.studentUserId !== user.id) {
    return NextResponse.json({ error: "invalid_cancellation_response" }, { status: 403 });
  }

  if (user.role === UserRole.PARENT && agreement.application.parentUserId !== user.id) {
    return NextResponse.json({ error: "invalid_cancellation_response" }, { status: 403 });
  }

  if (response === "approve") {
    await prisma.applicationAgreement.delete({
      where: { id: agreementId },
    });
  } else {
    await prisma.applicationAgreement.update({
      where: { id: agreementId },
      data: {
        cancellationRequestedAt: null,
      },
    });
  }

  revalidatePath("/portal/agreements");
  revalidatePath(`/portal/agreements/${agreementId}`);
  revalidatePath("/portal/dashboard");
  revalidatePath("/portal/documents");
  revalidatePath("/portal/profile");
  revalidatePath("/portal/payments");
  revalidatePath("/portal/messages");
  revalidatePath(`/admin/students/${agreement.application.id}`);

  return NextResponse.json({
    code: response === "approve" ? "agreement_cancellation_approved" : "agreement_cancellation_rejected",
  });
}
