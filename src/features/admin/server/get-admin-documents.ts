import { DocumentStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getAdminNavItems } from "./nav";

export async function getAdminDocumentsViewModel(params: {
  adminMobileNumber: string;
  type?: string;
  status?: string;
  student?: string;
  parent?: string;
}) {
  const [documents, receipts] = await Promise.all([
    prisma.applicationDocument.findMany({
      where: {
        fileAssetId: {
          not: null,
        },
      },
      include: {
        fileAsset: true,
        requirement: true,
        application: {
          include: {
            studentProfile: true,
            parentUser: {
              select: {
                mobileNumber: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
    prisma.paymentReceipt.findMany({
      include: {
        fileAsset: true,
        application: {
          include: {
            studentProfile: true,
            parentUser: {
              select: {
                mobileNumber: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
  ]);

  const rows = [
    ...documents.map((document) => ({
      id: document.id,
      fileAssetId: document.fileAssetId!,
      fileMimeType: document.fileAsset?.mimeType ?? null,
      title: document.requirement.titleAr,
      typeCode: document.requirement.code,
      status: document.status,
      studentName: document.application.studentProfile?.fullNameAr ?? "طالب بدون اسم",
      parentMobileNumber: document.application.parentUser.mobileNumber,
      applicationId: document.applicationId,
      createdAt: document.updatedAt,
    })),
    ...receipts.map((receipt) => ({
      id: receipt.id,
      fileAssetId: receipt.fileAssetId,
      fileMimeType: receipt.fileAsset.mimeType,
      title: "إيصال سداد",
      typeCode: "payment_receipt",
      status: receipt.status,
      studentName: receipt.application.studentProfile?.fullNameAr ?? "طالب بدون اسم",
      parentMobileNumber: receipt.application.parentUser.mobileNumber,
      applicationId: receipt.applicationId,
      createdAt: receipt.updatedAt,
    })),
  ]
    .filter((row) => !params.type || row.typeCode === params.type)
    .filter((row) => !params.status || row.status === params.status)
    .filter((row) => !params.student || row.studentName.includes(params.student))
    .filter((row) => !params.parent || row.parentMobileNumber.includes(params.parent))
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

  return {
    adminMobileNumber: params.adminMobileNumber,
    navItems: getAdminNavItems("documents"),
    filters: {
      type: params.type ?? "",
      status: params.status ?? "",
      student: params.student ?? "",
      parent: params.parent ?? "",
    },
    rows,
    statuses: Object.values(DocumentStatus),
  };
}
