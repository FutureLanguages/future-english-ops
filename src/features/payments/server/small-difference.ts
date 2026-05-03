export function getSmallFinancialAdjustmentThresholdSar() {
  const configured = Number(process.env.ADMIN_SMALL_BALANCE_THRESHOLD_SAR ?? "");
  return Number.isFinite(configured) && configured > 0 ? configured : 20;
}
