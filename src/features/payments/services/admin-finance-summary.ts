import { smallFinancialDifferenceFeeTitle } from "@/features/payments/constants";

function normalizeAmount(value: number | { toNumber(): number }) {
  return typeof value === "number" ? value : value.toNumber();
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

export function summarizeAdminFinance(params: {
  fees: Array<{
    title: string;
    amount: number | { toNumber(): number };
  }>;
  payments: Array<{
    amount: number | { toNumber(): number };
  }>;
}) {
  const fees = params.fees.map((fee) => ({
    title: fee.title,
    amountSar: normalizeAmount(fee.amount),
  }));
  const payments = params.payments.map((payment) => normalizeAmount(payment.amount));

  const regularFees = fees.filter((fee) => fee.title !== smallFinancialDifferenceFeeTitle);
  const financialDifferenceAmount = fees
    .filter((fee) => fee.title === smallFinancialDifferenceFeeTitle)
    .reduce((sum, fee) => sum + fee.amountSar, 0);

  const totalFeesSar = regularFees
    .filter((fee) => fee.amountSar > 0)
    .reduce((sum, fee) => sum + fee.amountSar, 0);
  const totalDiscountsSar = Math.abs(
    regularFees
      .filter((fee) => fee.amountSar < 0)
      .reduce((sum, fee) => sum + fee.amountSar, 0),
  );
  const netDueSar = totalFeesSar - totalDiscountsSar;
  const totalPaymentsSar = payments
    .filter((amount) => amount > 0)
    .reduce((sum, amount) => sum + amount, 0);
  const totalRefundsSar = Math.abs(
    payments
      .filter((amount) => amount < 0)
      .reduce((sum, amount) => sum + amount, 0),
  );
  const netPaidSar = totalPaymentsSar - totalRefundsSar;

  // The special fee line affects the ledger with the opposite sign of the final balance adjustment.
  const totalFinancialDifferencesSar = -financialDifferenceAmount;
  const finalBalanceSar = netDueSar - netPaidSar - totalFinancialDifferencesSar;
  const settlementPercent = netDueSar > 0 ? (netPaidSar / netDueSar) * 100 : netPaidSar > 0 ? 100 : 0;

  return {
    totalFeesSar: roundMoney(totalFeesSar),
    totalDiscountsSar: roundMoney(totalDiscountsSar),
    netDueSar: roundMoney(netDueSar),
    totalPaymentsSar: roundMoney(totalPaymentsSar),
    totalRefundsSar: roundMoney(totalRefundsSar),
    netPaidSar: roundMoney(netPaidSar),
    totalFinancialDifferencesSar: roundMoney(totalFinancialDifferencesSar),
    finalBalanceSar: roundMoney(finalBalanceSar),
    finalRemainingSar: roundMoney(Math.max(finalBalanceSar, 0)),
    excessPaidSar: roundMoney(Math.max(-finalBalanceSar, 0)),
    settlementPercent: roundMoney(settlementPercent),
  };
}
