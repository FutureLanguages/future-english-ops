import type { PaymentSummary } from "@/types/payment";

function normalizeAmount(amount: number): number {
  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Number(amount.toFixed(2));
}

export function getPaymentSummary(params: {
  totalCostSar: number;
  paidAmountSar: number;
}): PaymentSummary {
  const totalCostSar = normalizeAmount(params.totalCostSar);
  const paidAmountSar = normalizeAmount(params.paidAmountSar);
  const remainingAmountSar = normalizeAmount(Math.max(totalCostSar - paidAmountSar, 0));

  return {
    totalCostSar,
    paidAmountSar,
    remainingAmountSar,
    isPaymentComplete: remainingAmountSar === 0,
    hasOutstandingPayment: remainingAmountSar > 0,
  };
}
