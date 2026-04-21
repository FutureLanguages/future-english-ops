import { canUploadPaymentReceipt } from "@/features/auth/services";
import { loadPortalApplicationData } from "@/features/portal/server/load-portal-application";
import { buildPortalNavItems } from "@/features/portal/server/nav";
import type { ApplicationUser } from "@/types/application";
import type { PortalNavItem } from "@/types/portal";

export type PortalPaymentsViewModel = {
  role: "STUDENT" | "PARENT";
  mobileNumber: string;
  activeUserLabel: string;
  studentName: string;
  status: "NEW" | "INCOMPLETE" | "UNDER_REVIEW" | "WAITING_PAYMENT" | "COMPLETED";
  overallCompletion: {
    percent: number;
    label: string;
    tone: "complete" | "incomplete";
  };
  navItems: PortalNavItem[];
  applicationOptions: Array<{ id: string; label: string }>;
  selectedApplicationId: string;
  canViewPayments: boolean;
  summary: {
    totalCostSar: number;
    paidAmountSar: number;
    remainingAmountSar: number;
    isPaymentComplete: boolean;
  };
  latestPaymentNote: string | null;
  applicationId: string;
  canUploadReceipt: boolean;
  receipts: Array<{
    id: string;
    status: "UPLOADED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "REUPLOAD_REQUESTED";
    statusLabel: string;
    adminNote: string | null;
    fileAssetId: string;
    fileMimeType: string;
    createdAt: Date;
  }>;
  ledger: {
    fees: Array<{
      id: string;
      title: string;
      amountSar: number;
      note: string | null;
      feeDate: Date | null;
    }>;
    payments: Array<{
      id: string;
      amountSar: number;
      note: string | null;
      paymentDate: Date;
      linkedReceiptId: string | null;
    }>;
  };
};

function mapReceiptStatus(status: string | null): string {
  if (!status) {
    return "لم يتم رفع إيصال بعد";
  }

  const labels: Record<string, string> = {
    MISSING: "لم يتم رفع إيصال بعد",
    UPLOADED: "تم رفع الإيصال",
    UNDER_REVIEW: "الإيصال قيد المراجعة",
    APPROVED: "تم اعتماد الإيصال",
    REJECTED: "الإيصال مرفوض",
    REUPLOAD_REQUESTED: "مطلوب إعادة رفع الإيصال",
  };

  return labels[status] ?? "حالة غير معروفة";
}

export async function getPortalPaymentsViewModel(params: {
  user: ApplicationUser;
  applicationId?: string;
}): Promise<PortalPaymentsViewModel | null> {
  const data = await loadPortalApplicationData(params);

  if (!data) {
    return null;
  }

  const latestPaymentNote =
    data.applications
      .find((application) => application.id === data.applicationRecord.id)
      ?.paymentReceipts.find((receipt) => Boolean(receipt.adminNote))
      ?.adminNote ?? data.latestAdminNote;

  const selectedApplication =
    data.applications.find((application) => application.id === data.applicationRecord.id) ?? null;

  return {
    role: data.user.role as "STUDENT" | "PARENT",
    mobileNumber: data.user.mobileNumber,
    activeUserLabel: data.user.role === "STUDENT" ? "طالب" : "ولي أمر",
    studentName: data.applicationRecord.studentProfile?.fullNameAr ?? "طالب بدون اسم",
    status: data.applicationRecord.status,
    overallCompletion: {
      percent: data.overallCompletionPercent,
      label: data.overallCompletionPercent === 100 ? "اكتمال الطلب" : "اكتمال جزئي",
      tone: data.overallCompletionPercent === 100 ? "complete" : "incomplete",
    },
    navItems: buildPortalNavItems({
      activeKey: "payments",
      canSeePayments: data.canSeePayments,
      applicationId: data.applicationRecord.id,
      agreements: data.applications.find((application) => application.id === data.applicationRecord.id)?.agreements ?? [],
    }),
    applicationOptions: data.applications.map((application) => ({
      id: application.id,
      label: application.studentProfile?.fullNameAr ?? "طلب بدون اسم",
    })),
    selectedApplicationId: data.applicationRecord.id,
    canViewPayments: data.canSeePayments,
    summary: {
      totalCostSar: data.paymentSummary.totalCostSar,
      paidAmountSar: data.paymentSummary.paidAmountSar,
      remainingAmountSar: data.paymentSummary.remainingAmountSar,
      isPaymentComplete: data.paymentSummary.isPaymentComplete,
    },
    latestPaymentNote,
    applicationId: data.applicationRecord.id,
    canUploadReceipt: canUploadPaymentReceipt(data.user, data.applicationRecord),
    receipts:
      selectedApplication?.paymentReceipts.map((receipt) => ({
        id: receipt.id,
        status: receipt.status as "UPLOADED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "REUPLOAD_REQUESTED",
        statusLabel: mapReceiptStatus(receipt.status),
        adminNote: receipt.adminNote,
        fileAssetId: receipt.fileAssetId,
        fileMimeType: receipt.fileAsset.mimeType,
        createdAt: receipt.createdAt,
      })) ?? [],
    ledger: {
      fees:
        selectedApplication?.fees.map((fee) => ({
          id: fee.id,
          title: fee.title,
          amountSar: typeof fee.amount === "number" ? fee.amount : fee.amount.toNumber(),
          note: fee.note,
          feeDate: fee.feeDate,
        })) ?? [],
      payments:
        selectedApplication?.payments.map((payment) => ({
          id: payment.id,
          amountSar: typeof payment.amount === "number" ? payment.amount : payment.amount.toNumber(),
          note: payment.note,
          paymentDate: payment.paymentDate,
          linkedReceiptId: payment.paymentReceiptId,
        })) ?? [],
    },
  };
}
