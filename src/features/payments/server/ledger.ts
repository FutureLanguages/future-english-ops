import type { Prisma } from "@prisma/client";

function toNumber(value: { toNumber(): number } | number) {
  return typeof value === "number" ? value : value.toNumber();
}

export function computeLedgerTotals(params: {
  fees: Array<{ amount: { toNumber(): number } | number }>;
  payments: Array<{ amount: { toNumber(): number } | number }>;
}) {
  const totalCostSar = params.fees.reduce((sum, fee) => sum + toNumber(fee.amount), 0);
  const paidAmountSar = params.payments.reduce((sum, payment) => sum + toNumber(payment.amount), 0);

  return {
    totalCostSar: Number(totalCostSar.toFixed(2)),
    paidAmountSar: Number(paidAmountSar.toFixed(2)),
  };
}

export async function syncApplicationFinancialTotals(
  tx: Prisma.TransactionClient,
  applicationId: string,
) {
  const [fees, payments] = await Promise.all([
    tx.applicationFee.findMany({
      where: {
        applicationId,
      },
      select: {
        amount: true,
      },
    }),
    tx.applicationPayment.findMany({
      where: {
        applicationId,
      },
      select: {
        amount: true,
      },
    }),
  ]);

  const totals = computeLedgerTotals({ fees, payments });
  const remainingAmountSar = Number((totals.totalCostSar - totals.paidAmountSar).toFixed(2));

  await tx.application.update({
    where: { id: applicationId },
    data: {
      totalCostSar: totals.totalCostSar,
      paidAmountSar: totals.paidAmountSar,
      ...(remainingAmountSar <= 0 ? { status: "COMPLETED" } : {}),
    },
  });

  return totals;
}
