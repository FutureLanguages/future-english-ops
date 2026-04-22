import { DocumentStatus, NotificationType, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { notifyPortalUsers } from "@/features/notifications/server/notifications";
import { prisma } from "@/lib/db/prisma";

const reviewStatuses = new Set<string>([
  DocumentStatus.APPROVED,
  DocumentStatus.REJECTED,
  DocumentStatus.REUPLOAD_REQUESTED,
]);

const receiptReviewLabels = {
  [DocumentStatus.APPROVED]: "تم اعتماد الإيصال",
  [DocumentStatus.REJECTED]: "تم رفض الإيصال",
  [DocumentStatus.REUPLOAD_REQUESTED]: "تم طلب إعادة رفع الإيصال",
} as const;

function refreshApplicationViews(applicationId: string) {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${applicationId}`);
  revalidatePath("/portal/dashboard");
  revalidatePath("/portal/payments");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  await getAdminSession();

  const { applicationId } = await params;
  const body = (await request.json().catch(() => null)) as {
    receiptId?: string;
    status?: string;
    adminNote?: string;
  } | null;

  const receiptId = body?.receiptId?.trim() ?? "";
  const statusValue = body?.status ?? "";
  const adminNote = body?.adminNote?.trim() ?? "";

  console.info("[admin-receipt-review-api] start", {
    applicationId,
    receiptId,
    status: statusValue,
    hasAdminNote: adminNote.length > 0,
  });

  if (!applicationId || !receiptId || !reviewStatuses.has(statusValue as DocumentStatus)) {
    return NextResponse.json({ error: "invalid_receipt_review" }, { status: 400 });
  }

  if (
    (statusValue === DocumentStatus.REJECTED ||
      statusValue === DocumentStatus.REUPLOAD_REQUESTED) &&
    adminNote.length === 0
  ) {
    return NextResponse.json({ error: "missing_review_note" }, { status: 400 });
  }

  try {
    const receipt = await prisma.paymentReceipt.update({
      where: {
        id: receiptId,
        applicationId,
      },
      data: {
        status: statusValue as DocumentStatus,
        adminNote: adminNote || null,
        reviewedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        adminNote: true,
      },
    });

    console.info("[admin-receipt-review-api] updated", {
      applicationId,
      receiptId: receipt.id,
      status: receipt.status,
    });

    try {
      await notifyPortalUsers({
        applicationId,
        actorName: "الإدارة",
        actorRole: UserRole.ADMIN,
        title:
          receiptReviewLabels[statusValue as keyof typeof receiptReviewLabels] ??
          "تم تحديث حالة الإيصال",
        description: adminNote || null,
        type: NotificationType.PAYMENT,
        link: "/portal/payments",
      });
    } catch (error) {
      console.error("[admin-receipt-review-api] notification failed", {
        applicationId,
        receiptId,
        status: statusValue,
        error,
      });
    }

    refreshApplicationViews(applicationId);
    return NextResponse.json({
      message:
        receiptReviewLabels[statusValue as keyof typeof receiptReviewLabels] ??
        "تم تحديث حالة الإيصال",
      receipt,
    });
  } catch (error) {
    console.error("[admin-receipt-review-api] failed", {
      applicationId,
      receiptId,
      status: statusValue,
      error,
    });

    return NextResponse.json(
      { error: "تعذر تحديث حالة الإيصال حالياً" },
      { status: 500 },
    );
  }
}
