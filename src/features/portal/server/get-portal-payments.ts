import { canUploadPaymentReceipt } from "@/features/auth/services";
import { smallFinancialDifferenceFeeTitle } from "@/features/payments/constants";
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
    originalTotalCostSar: number;
    discount?: {
      title: string;
      discountType: "FIXED" | "PERCENTAGE";
      amountSar: number;
    };
    totalCostSar: number;
    paidAmountSar: number;
    remainingAmountSar: number;
    isPaymentComplete: boolean;
    stateLabel: string;
    stateDescription: string;
  };
  receiptSummary: {
    total: number;
    pendingReview: number;
    approved: number;
    rejectedOrReupload: number;
    latestStatusLabel: string;
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

  const selectedApplication =
    data.applications.find((application) => application.id === data.applicationRecord.id) ?? null;
  const receipts = (selectedApplication?.paymentReceipts ?? []).slice().sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
  const latestPaymentNote = receipts.find((receipt) => Boolean(receipt.adminNote))?.adminNote ?? data.latestAdminNote;
  const visibleFees = selectedApplication?.fees.filter((fee) => fee.title !== smallFinancialDifferenceFeeTitle) ?? [];
  const positiveFeesTotal = visibleFees.reduce((sum, fee) => {
    const amount = typeof fee.amount === "number" ? fee.amount : fee.amount.toNumber();
    return amount > 0 ? sum + amount : sum;
  }, 0);
  const discountFees = visibleFees.filter((fee) => {
    const amount = typeof fee.amount === "number" ? fee.amount : fee.amount.toNumber();
    return amount < 0;
  });
  const discountAmountSar = Number(
    Math.abs(
      discountFees.reduce((sum, fee) => {
        const amount = typeof fee.amount === "number" ? fee.amount : fee.amount.toNumber();
        return sum + amount;
      }, 0),
    ).toFixed(2),
  );
  // Payment receipts use DocumentStatus, so UNDER_REVIEW is an intentional persisted receipt state here.
  const pendingReview = receipts.filter(
    (receipt) => receipt.status === "UPLOADED" || receipt.status === "UNDER_REVIEW",
  ).length;
  const approved = receipts.filter((receipt) => receipt.status === "APPROVED").length;
  const rejectedOrReupload = receipts.filter(
    (receipt) => receipt.status === "REJECTED" || receipt.status === "REUPLOAD_REQUESTED",
  ).length;
  const stateLabel = rejectedOrReupload > 0
    ? "يوجد إيصال يحتاج تصحيحاً"
    : data.paymentSummary.remainingAmountSar > 0
      ? "يوجد مبلغ متبقٍ"
      : pendingReview > 0
        ? "بانتظار مراجعة إيصال"
        : "السداد مكتمل";
  const stateDescription = rejectedOrReupload > 0
    ? "يوجد إيصال يحتاج تصحيحاً قبل اعتماده."
    : data.paymentSummary.remainingAmountSar > 0
      ? "يوجد مبلغ متبقٍ يحتاج متابعة حسب البيانات المالية الحالية."
      : pendingReview > 0
        ? "لا يوجد مبلغ متبقٍ ظاهر حالياً، لكن يوجد إيصال مرفوع وينتظر مراجعة الإدارة."
        : "لا يوجد مبلغ متبقٍ حسب البيانات المالية الحالية.";

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
      originalTotalCostSar: Number(positiveFeesTotal.toFixed(2)),
      ...(discountAmountSar > 0
        ? {
            discount: {
              title: discountFees.length === 1 ? discountFees[0].title : "إجمالي الخصومات",
              discountType: discountFees.some((fee) => fee.title.includes("%")) ? "PERCENTAGE" as const : "FIXED" as const,
              amountSar: discountAmountSar,
            },
          }
        : {}),
      totalCostSar: data.paymentSummary.totalCostSar,
      paidAmountSar: data.paymentSummary.paidAmountSar,
      remainingAmountSar: data.paymentSummary.remainingAmountSar,
      isPaymentComplete: data.paymentSummary.isPaymentComplete,
      stateLabel,
      stateDescription,
    },
    receiptSummary: {
      total: receipts.length,
      pendingReview,
      approved,
      rejectedOrReupload,
      latestStatusLabel: receipts[0]?.status ? mapReceiptStatus(receipts[0].status) : "لم يتم رفع إيصال بعد",
    },
    latestPaymentNote,
    applicationId: data.applicationRecord.id,
    canUploadReceipt: canUploadPaymentReceipt(data.user, data.applicationRecord),
    receipts:
      receipts.map((receipt) => ({
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
        selectedApplication?.fees
          .filter((fee) => fee.title !== smallFinancialDifferenceFeeTitle)
          .map((fee) => ({
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
