import Link from "next/link";
import { BaseCard, BaseCardBody, BaseCardFooter, BaseCardHeader } from "@/components/ui/base-card";
import { Button } from "@/components/ui/button";
import { HelperText } from "@/components/ui/helper-text";
import { StatusBadge } from "@/components/ui/status-badge";

export type FinancialSummaryCardProps = {
  originalTotalCostSar: number;
  totalCostSar: number;
  paidAmountSar: number;
  remainingAmountSar: number;
  paymentsHref: string;
  discount?: {
    title: string;
    discountType: "FIXED" | "PERCENTAGE";
    amountSar: number;
  };
};

function formatSar(value: number) {
  return `${value} ر.س`;
}

export function FinancialSummaryCard({
  discount,
  originalTotalCostSar,
  paidAmountSar,
  paymentsHref,
  remainingAmountSar,
  totalCostSar,
}: FinancialSummaryCardProps) {
  const isComplete = remainingAmountSar <= 0;

  return (
    <BaseCard variant="outlined">
      <BaseCardHeader>
        <div className="flex flex-col gap-3 tablet:flex-row tablet:items-start tablet:justify-between">
          <div>
            <h2 className="text-h2 font-extrabold text-text-primary">الملخص المالي</h2>
            <HelperText>نظرة مختصرة على الرسوم والمدفوعات لهذا الطلب.</HelperText>
          </div>
          <StatusBadge
            label={isComplete ? "مكتمل مالياً" : "يوجد متبقٍ"}
            variant={isComplete ? "complete" : "warning"}
          />
        </div>
      </BaseCardHeader>
      <BaseCardBody className="space-y-3">
        <FinancialRow label="الإجمالي قبل الخصم" value={formatSar(originalTotalCostSar)} />
        {discount ? (
          <div className="rounded-lg bg-success-100 px-4 py-3">
            <div className="flex flex-col gap-2 tablet:flex-row tablet:items-center tablet:justify-between">
              <div>
                <div className="text-caption font-bold text-success-700">خصم مطبّق</div>
                <div className="mt-1 text-body font-extrabold text-text-primary">{discount.title}</div>
              </div>
              <div dir="ltr" className="text-h3 font-black text-success-700">
                -{formatSar(discount.amountSar)}
              </div>
            </div>
          </div>
        ) : null}
        <FinancialRow label="الإجمالي بعد الخصم" value={formatSar(totalCostSar)} strong />
        <FinancialRow label="المدفوع" value={formatSar(paidAmountSar)} />
        <FinancialRow label="المتبقي" value={formatSar(remainingAmountSar)} tone={isComplete ? "complete" : "warning"} />
      </BaseCardBody>
      <BaseCardFooter>
        <Button asChild variant="secondary" size="sm">
          <Link href={paymentsHref}>مراجعة المدفوعات</Link>
        </Button>
      </BaseCardFooter>
    </BaseCard>
  );
}

function FinancialRow({
  label,
  strong = false,
  tone,
  value,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "complete" | "warning";
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-bg-surface-alt px-4 py-3">
      <div className="text-body font-bold text-text-secondary">{label}</div>
      <div
        dir="ltr"
        className={[
          "text-h3 font-extrabold",
          strong ? "text-text-primary" : "text-text-secondary",
          tone === "complete" ? "text-success-700" : "",
          tone === "warning" ? "text-warning-500" : "",
        ].filter(Boolean).join(" ")}
      >
        {value}
      </div>
    </div>
  );
}
