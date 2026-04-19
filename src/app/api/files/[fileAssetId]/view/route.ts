import { NextResponse } from "next/server";
import { canViewApplication, canViewPayments } from "@/features/auth/services/permissions.service";
import { getOptionalAuthSession } from "@/features/auth/server/session";
import { readStoredFile } from "@/lib/storage/file-access";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileAssetId: string }> },
) {
  const session = await getOptionalAuthSession();

  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { fileAssetId } = await params;
  const [document, receipt] = await Promise.all([
    prisma.applicationDocument.findFirst({
      where: { fileAssetId },
      include: {
        fileAsset: true,
        application: {
          include: {
            studentProfile: true,
            parentProfiles: true,
          },
        },
      },
    }),
    prisma.paymentReceipt.findFirst({
      where: { fileAssetId },
      include: {
        fileAsset: true,
        application: {
          include: {
            studentProfile: true,
            parentProfiles: true,
          },
        },
      },
    }),
  ]);

  const fileOwner = document ?? receipt;

  if (!fileOwner?.fileAsset) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const applicationRecord = {
    id: fileOwner.application.id,
    studentUserId: fileOwner.application.studentUserId,
    parentUserId: fileOwner.application.parentUserId,
    status: fileOwner.application.status,
    totalCostSar:
      typeof fileOwner.application.totalCostSar === "number"
        ? fileOwner.application.totalCostSar
        : fileOwner.application.totalCostSar.toNumber(),
    paidAmountSar:
      typeof fileOwner.application.paidAmountSar === "number"
        ? fileOwner.application.paidAmountSar
        : fileOwner.application.paidAmountSar.toNumber(),
    showPaymentToStudent: fileOwner.application.showPaymentToStudent,
    studentInfoLocked: fileOwner.application.studentInfoLocked,
    studentBasicInfoLocked: fileOwner.application.studentBasicInfoLocked,
    studentAdditionalInfoLocked: fileOwner.application.studentAdditionalInfoLocked,
    parentInfoLocked: fileOwner.application.parentInfoLocked,
    fatherInfoLocked: fileOwner.application.fatherInfoLocked,
    motherInfoLocked: fileOwner.application.motherInfoLocked,
    guardianInfoLocked: fileOwner.application.guardianInfoLocked,
    documentsLocked: fileOwner.application.documentsLocked,
    studentDocumentsLocked: fileOwner.application.studentDocumentsLocked,
    parentDocumentsLocked: fileOwner.application.parentDocumentsLocked,
    guardianDocumentsLocked: fileOwner.application.guardianDocumentsLocked,
    studentProfile: fileOwner.application.studentProfile,
    parentProfiles: fileOwner.application.parentProfiles,
  };

  const allowed =
    session.role === "ADMIN"
      ? true
      : document
        ? canViewApplication(session, applicationRecord)
        : canViewPayments(session, applicationRecord);

  if (!allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let fileBuffer: Buffer;

  try {
    fileBuffer = await readStoredFile(fileOwner.fileAsset.storageKey);
  } catch {
    return NextResponse.json({ error: "file_not_found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      "Content-Type": fileOwner.fileAsset.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(fileOwner.fileAsset.originalName)}`,
    },
  });
}
