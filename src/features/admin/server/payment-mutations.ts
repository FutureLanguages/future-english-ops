import { revalidatePath } from "next/cache";
import { NotificationType, UserRole } from "@prisma/client";
import { getAdminSession } from "@/features/auth/server/admin-session";
import { notifyPortalUsers } from "@/features/notifications/server/notifications";
import { syncApplicationFinancialTotals } from "@/features/payments/server/ledger";
import { prisma } from "@/lib/db/prisma";

export class AdminPaymentMutationError extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

export function refreshApplicationViews(applicationId: string) {
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

export async function addApplicationFee(params: {
  applicationId: string;
  presetTitle: string;
  customTitle: string;
  amount: number;
  note: string;
}) {
  await getAdminSession();

  const title = params.customTitle || params.presetTitle;
  if (!params.applicationId || !title || !Number.isFinite(params.amount) || params.amount <= 0) {
    throw new AdminPaymentMutationError("invalid_fee");
  }

  await prisma.$transaction(async (tx) => {
    await tx.applicationFee.create({
      data: {
        applicationId: params.applicationId,
        title,
        amount: params.amount,
        feeDate: null,
        note: params.note || null,
      },
    });

    await syncApplicationFinancialTotals(tx, params.applicationId);
  });

  await notifyPortalUsers({
    applicationId: params.applicationId,
    actorName: "الإدارة",
    actorRole: UserRole.ADMIN,
    title: "تمت إضافة رسوم جديدة",
    description: `${title} - ${params.amount} ر.س`,
    type: NotificationType.PAYMENT,
    link: "/portal/payments",
  });

  refreshApplicationViews(params.applicationId);
  return { code: "fee_added" as const };
}

export async function addApplicationDiscount(params: {
  applicationId: string;
  discountType: string;
  amount: number;
  note: string;
  targets: string[];
}) {
  await getAdminSession();

  if (!params.applicationId || !Number.isFinite(params.amount) || params.amount <= 0) {
    throw new AdminPaymentMutationError("invalid_fee");
  }

  await prisma.$transaction(async (tx) => {
    const existingFees = await tx.applicationFee.findMany({
      where: { applicationId: params.applicationId },
      select: { amount: true, title: true },
    });

    const targetLabels = params.targets.length > 0 ? new Set(params.targets) : null;
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
      params.discountType === "percentage"
        ? Number(((positiveTotal * params.amount) / 100).toFixed(2))
        : Number(params.amount.toFixed(2));

    if (!Number.isFinite(discountAmount) || discountAmount <= 0) {
      throw new AdminPaymentMutationError("invalid_fee");
    }

    await tx.applicationFee.create({
      data: {
        applicationId: params.applicationId,
        title:
          params.discountType === "percentage"
            ? `خصم (${params.amount}%)${params.targets.length > 0 ? ` - ${params.targets.join(" + ")}` : ""}`
            : `خصم ثابت${params.targets.length > 0 ? ` - ${params.targets.join(" + ")}` : ""}`,
        amount: -Math.abs(discountAmount),
        feeDate: null,
        note:
          [params.targets.length > 0 ? `يشمل: ${params.targets.join("، ")}` : null, params.note || null]
            .filter(Boolean)
            .join(" - ") || null,
      },
    });

    await syncApplicationFinancialTotals(tx, params.applicationId);
  });

  await notifyPortalUsers({
    applicationId: params.applicationId,
    actorName: "الإدارة",
    actorRole: UserRole.ADMIN,
    title: "تم تحديث الخصم",
    description: params.note || null,
    type: NotificationType.PAYMENT,
    link: "/portal/payments",
  });

  refreshApplicationViews(params.applicationId);
  return { code: "fee_added" as const };
}

export async function addApplicationPayment(params: {
  applicationId: string;
  amount: number;
  paymentDate: string;
  note: string;
  linkedReceiptId: string;
}) {
  await getAdminSession();

  if (
    !params.applicationId ||
    !Number.isFinite(params.amount) ||
    params.amount <= 0 ||
    !params.paymentDate
  ) {
    throw new AdminPaymentMutationError("invalid_payment");
  }

  await prisma.$transaction(async (tx) => {
    await tx.applicationPayment.create({
      data: {
        applicationId: params.applicationId,
        amount: params.amount,
        paymentDate: new Date(params.paymentDate),
        note: params.note || null,
        paymentReceiptId: params.linkedReceiptId || null,
      },
    });

    await syncApplicationFinancialTotals(tx, params.applicationId);
  });

  await notifyPortalUsers({
    applicationId: params.applicationId,
    actorName: "الإدارة",
    actorRole: UserRole.ADMIN,
    title: "تمت إضافة دفعة رسمية",
    description: `${params.amount} ر.س`,
    type: NotificationType.PAYMENT,
    link: "/portal/payments",
  });

  refreshApplicationViews(params.applicationId);
  return { code: "payment_added" as const };
}

export async function updateApplicationFee(params: {
  applicationId: string;
  feeId: string;
  title: string;
  amount: number;
  note: string;
}) {
  await getAdminSession();

  if (!params.applicationId || !params.feeId || !params.title || !Number.isFinite(params.amount) || params.amount <= 0) {
    throw new AdminPaymentMutationError("invalid_fee");
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.applicationFee.findUnique({
      where: { id: params.feeId },
      select: { id: true, applicationId: true, amount: true },
    });

    if (!existing || existing.applicationId !== params.applicationId) {
      throw new AdminPaymentMutationError("invalid_fee");
    }

    const existingAmount = typeof existing.amount === "number" ? existing.amount : existing.amount.toNumber();
    const normalizedAmount = existingAmount < 0 ? -Math.abs(params.amount) : params.amount;

    await tx.applicationFee.update({
      where: { id: params.feeId },
      data: {
        title: params.title,
        amount: normalizedAmount,
        note: params.note || null,
      },
    });

    await syncApplicationFinancialTotals(tx, params.applicationId);
  });

  refreshApplicationViews(params.applicationId);
  return { code: "fee_updated" as const };
}

export async function deleteApplicationFee(params: {
  applicationId: string;
  feeId: string;
}) {
  await getAdminSession();

  if (!params.applicationId || !params.feeId) {
    throw new AdminPaymentMutationError("invalid_fee");
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.applicationFee.findUnique({
      where: { id: params.feeId },
      select: { id: true, applicationId: true },
    });

    if (!existing || existing.applicationId !== params.applicationId) {
      throw new AdminPaymentMutationError("invalid_fee");
    }

    await tx.applicationFee.delete({
      where: { id: params.feeId },
    });

    await syncApplicationFinancialTotals(tx, params.applicationId);
  });

  refreshApplicationViews(params.applicationId);
  return { code: "fee_deleted" as const };
}

export async function updateApplicationPayment(params: {
  applicationId: string;
  paymentId: string;
  amount: number;
  paymentDate: string;
  note: string;
  linkedReceiptId: string;
}) {
  await getAdminSession();

  if (
    !params.applicationId ||
    !params.paymentId ||
    !Number.isFinite(params.amount) ||
    params.amount <= 0 ||
    !params.paymentDate
  ) {
    throw new AdminPaymentMutationError("invalid_payment");
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.applicationPayment.findUnique({
      where: { id: params.paymentId },
      select: { id: true, applicationId: true },
    });

    if (!existing || existing.applicationId !== params.applicationId) {
      throw new AdminPaymentMutationError("invalid_payment");
    }

    await tx.applicationPayment.update({
      where: { id: params.paymentId },
      data: {
        amount: params.amount,
        paymentDate: new Date(params.paymentDate),
        note: params.note || null,
        paymentReceiptId: params.linkedReceiptId || null,
      },
    });

    await syncApplicationFinancialTotals(tx, params.applicationId);
  });

  refreshApplicationViews(params.applicationId);
  return { code: "payment_updated" as const };
}

export async function deleteApplicationPayment(params: {
  applicationId: string;
  paymentId: string;
}) {
  await getAdminSession();

  if (!params.applicationId || !params.paymentId) {
    throw new AdminPaymentMutationError("invalid_payment");
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.applicationPayment.findUnique({
      where: { id: params.paymentId },
      select: { id: true, applicationId: true },
    });

    if (!existing || existing.applicationId !== params.applicationId) {
      throw new AdminPaymentMutationError("invalid_payment");
    }

    await tx.applicationPayment.delete({
      where: { id: params.paymentId },
    });

    await syncApplicationFinancialTotals(tx, params.applicationId);
  });

  refreshApplicationViews(params.applicationId);
  return { code: "payment_deleted" as const };
}
