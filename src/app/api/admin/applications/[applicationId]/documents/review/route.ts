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

const documentReviewLabels = {
  [DocumentStatus.APPROVED]: "تم اعتماد المستند",
  [DocumentStatus.REJECTED]: "تم رفض المستند",
  [DocumentStatus.REUPLOAD_REQUESTED]: "تم طلب إعادة الرفع",
} as const;

function refreshApplicationViews(applicationId: string) {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/students");
  revalidatePath("/admin/documents");
  revalidatePath(`/admin/students/${applicationId}`);
  revalidatePath("/portal/dashboard");
  revalidatePath("/portal/documents");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  await getAdminSession();

  const { applicationId } = await params;
  const body = (await request.json().catch(() => null)) as {
    requirementId?: string;
    documentIds?: string[];
    status?: string;
    adminNote?: string;
  } | null;

  const statusValue = body?.status ?? "";
  const adminNote = body?.adminNote?.trim() ?? "";
  const requirementId = body?.requirementId?.trim() ?? "";
  const documentIds = Array.isArray(body?.documentIds)
    ? body.documentIds.map((id) => id.trim()).filter(Boolean)
    : [];

  console.info("[admin-document-review-api] start", {
    applicationId,
    requirementId,
    documentIdsCount: documentIds.length,
    status: statusValue,
    hasAdminNote: adminNote.length > 0,
  });

  if (!applicationId || !reviewStatuses.has(statusValue as DocumentStatus)) {
    return NextResponse.json({ error: "invalid_document_review" }, { status: 400 });
  }

  if (
    (statusValue === DocumentStatus.REJECTED ||
      statusValue === DocumentStatus.REUPLOAD_REQUESTED) &&
    adminNote.length === 0
  ) {
    return NextResponse.json({ error: "missing_review_note" }, { status: 400 });
  }

  if (!requirementId && documentIds.length === 0) {
    return NextResponse.json({ error: "invalid_document_review" }, { status: 400 });
  }

  try {
    if (requirementId) {
      const updatedDocument = await prisma.applicationDocument.update({
        where: {
          applicationId_requirementId: {
            applicationId,
            requirementId,
          },
        },
        data: {
          status: statusValue as DocumentStatus,
          adminNote: adminNote || null,
          reviewedAt: new Date(),
        },
        select: {
          id: true,
          requirementId: true,
          status: true,
          adminNote: true,
        },
      });

      console.info("[admin-document-review-api] updated", {
        applicationId,
        documentId: updatedDocument.id,
        status: updatedDocument.status,
      });

      try {
        await notifyPortalUsers({
          applicationId,
          actorUserId: undefined,
          actorName: "الإدارة",
          actorRole: UserRole.ADMIN,
          title:
            documentReviewLabels[statusValue as keyof typeof documentReviewLabels] ??
            "تم تحديث حالة المستند",
          description: adminNote || null,
          type: NotificationType.DOCUMENT,
          link: "/portal/documents",
        });
      } catch (error) {
        console.error("[admin-document-review-api] notification failed", {
          applicationId,
          requirementId,
          status: statusValue,
          error,
        });
      }

      refreshApplicationViews(applicationId);
      return NextResponse.json({
        message:
          documentReviewLabels[statusValue as keyof typeof documentReviewLabels] ??
          "تم تحديث حالة المستند",
        documents: [updatedDocument],
      });
    }

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

    console.info("[admin-document-review-api] bulk updated", {
      applicationId,
      status: statusValue,
      count: result.count,
    });

    try {
      await notifyPortalUsers({
        applicationId,
        actorName: "الإدارة",
        actorRole: UserRole.ADMIN,
        title: `تم تحديث حالة ${result.count} مستند`,
        description:
          adminNote ||
          documentReviewLabels[statusValue as keyof typeof documentReviewLabels] ||
          null,
        type: NotificationType.DOCUMENT,
        link: "/portal/documents",
      });
    } catch (error) {
      console.error("[admin-document-review-api] bulk notification failed", {
        applicationId,
        status: statusValue,
        documentIdsCount: documentIds.length,
        error,
      });
    }

    refreshApplicationViews(applicationId);
    return NextResponse.json({
      message: `تم تحديث حالة ${result.count} مستند`,
      documents: documentIds.map((id) => ({
        id,
        status: statusValue,
        adminNote: adminNote || null,
      })),
    });
  } catch (error) {
    console.error("[admin-document-review-api] failed", {
      applicationId,
      requirementId,
      documentIdsCount: documentIds.length,
      status: statusValue,
      error,
    });

    return NextResponse.json(
      { error: "تعذر تحديث حالة المستند حالياً" },
      { status: 500 },
    );
  }
}
