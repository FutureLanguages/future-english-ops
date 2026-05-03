import { prisma } from "@/lib/db/prisma";
import { maxSmallFinancialDifferenceThresholdSar } from "@/features/payments/constants";

export const smallFinancialDifferenceThresholdSettingKey = "small_financial_difference_threshold_sar";

function parseThreshold(value: string | null | undefined) {
  const configured = Number(value ?? "");
  return Number.isFinite(configured) && configured > 0 ? configured : null;
}

export function getSmallFinancialAdjustmentThresholdFallbackSar() {
  const configured = Number(process.env.ADMIN_SMALL_BALANCE_THRESHOLD_SAR ?? "");
  return Number.isFinite(configured) && configured > 0 ? configured : 20;
}

export async function getSmallFinancialAdjustmentThresholdSar() {
  const setting = await prisma.adminSetting.findUnique({
    where: { key: smallFinancialDifferenceThresholdSettingKey },
    select: { value: true },
  });

  return parseThreshold(setting?.value) ?? getSmallFinancialAdjustmentThresholdFallbackSar();
}

export async function updateSmallFinancialAdjustmentThresholdSar(value: number) {
  if (!Number.isFinite(value) || value <= 0 || value > maxSmallFinancialDifferenceThresholdSar) {
    throw new Error("invalid_threshold");
  }

  const normalized = Number(value.toFixed(2));

  await prisma.adminSetting.upsert({
    where: { key: smallFinancialDifferenceThresholdSettingKey },
    create: {
      key: smallFinancialDifferenceThresholdSettingKey,
      value: String(normalized),
    },
    update: {
      value: String(normalized),
    },
  });

  return normalized;
}
