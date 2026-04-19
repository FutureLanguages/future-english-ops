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
  const fullName = String(formData.get("fullName") ?? "").trim();
  const signature = String(formData.get("signature") ?? "").trim();
  const accepted = formData.get("accepted") === "on";

  if (!agreementId || !accepted || !fullName || !signature.startsWith("data:image/png;base64,")) {
    return NextResponse.json({ error: "invalid_acceptance" }, { status: 400 });
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
    return NextResponse.json({ error: "agreement_not_found" }, { status: 404 });
  }

  if (user.role === UserRole.STUDENT && agreement.application.studentUserId !== user.id) {
    return NextResponse.json({ error: "invalid_acceptance" }, { status: 403 });
  }

  if (user.role === UserRole.PARENT && agreement.application.parentUserId !== user.id) {
    return NextResponse.json({ error: "invalid_acceptance" }, { status: 403 });
  }

  if (user.role === UserRole.STUDENT && agreement.studentAccepted) {
    return NextResponse.json({ code: "already_accepted" });
  }

  if (user.role === UserRole.PARENT && (!agreement.requiresParentAcceptance || agreement.parentAccepted)) {
    return NextResponse.json({ code: "already_accepted" });
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

  return NextResponse.json({ code: "agreement_accepted" });
}
