import { BaseCard, BaseCardBody, BaseCardHeader } from "@/components/ui/base-card";
import { HelperText } from "@/components/ui/helper-text";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

type PaymentSummaryCardProps = {
  role: "STUDENT" | "PARENT";
  originalTotalCostSar: number;
  totalCostSar: number;
  paidAmountSar: number;
  remainingAmountSar: number;
  isPaymentComplete: boolean;
  stateLabel: string;
  stateDescription: string;
  discount?: {
    title: string;
    discountType: "FIXED" | "PERCENTAGE";
    amountSar: number;
  };
  receiptSummary: {
    pendingReview: number;
    approved: number;
    rejectedOrReupload: number;
    latestStatusLabel: string;
  };
};

function formatSar(value: number) {
  return `${value.toLocaleString("en-US")} ر.س`;
}

function financeState(params: {
  remainingAmountSar: number;
  pendingReview: number;
  rejectedOrReupload: number;
}) {
  if (params.rejectedOrReupload > 0) {
    return { label: "يحتاج تصحيح إيصال", variant: "error" as const };
  }

  if (params.remainingAmountSar > 0) {
    return { label: "يوجد مبلغ متبقٍ", variant: "warning" as const };
  }

  if (params.pendingReview > 0) {
    return { label: "بانتظار مراجعة إيصال", variant: "waiting" as const };
  }

  return { label: "السداد مكتمل", variant: "complete" as const };
}

export function PaymentSummaryCard({
  discount,
  originalTotalCostSar,
  paidAmountSar,
  receiptSummary,
  remainingAmountSar,
  role,
  stateDescription,
  stateLabel,
  totalCostSar,
}: PaymentSummaryCardProps) {
  const state = financeState({
    remainingAmountSar,
    pendingReview: receiptSummary.pendingReview,
    rejectedOrReupload: receiptSummary.rejectedOrReupload,
  });

  return (
    <BaseCard variant="elevated" className="border-secondary-100">
      <BaseCardHeader>
        <div className="flex flex-col gap-3 tablet:flex-row tablet:items-start tablet:justify-between">
          <div>
            <h2 className="text-h2 font-extrabold text-text-primary">ملخص السداد</h2>
            <HelperText>
              {role === "PARENT"
                ? "نظرة واضحة على الرسوم، المدفوع، وما يحتاج متابعة."
                : "ملخص السداد الظاهر لهذا الحساب حسب الصلاحية المفعّلة."}
            </HelperText>
          </div>
          <StatusBadge label={state.label} variant={state.variant} />
        </div>
      </BaseCardHeader>

      <BaseCardBody className="space-y-4">
        <div
          className={cn(
            "rounded-lg border px-4 py-3",
            state.variant === "complete" && "border-success-100 bg-success-100/60",
            state.variant === "waiting" && "border-secondary-100 bg-secondary-100/70",
            state.variant === "warning" && "border-warning-100 bg-warning-100/60",
            state.variant === "error" && "border-error-100 bg-error-100/60",
          )}
        >
          <div className="text-body font-extrabold text-text-primary">{stateLabel}</div>
          <p className="mt-1 text-helper leading-6 text-text-secondary">{stateDescription}</p>
        </div>

        <div className="grid gap-3">
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
          <FinancialRow label="الإجمالي النهائي" value={formatSar(totalCostSar)} strong />
          <FinancialRow label="المدفوع المعتمد" value={formatSar(paidAmountSar)} />
          <FinancialRow
            label="المتبقي"
            value={formatSar(remainingAmountSar)}
            tone={remainingAmountSar > 0 ? "warning" : "complete"}
          />
        </div>

        <div className="grid gap-3 tablet:grid-cols-3">
          <ReceiptState label="قيد المراجعة" value={receiptSummary.pendingReview} tone="waiting" />
          <ReceiptState label="معتمدة" value={receiptSummary.approved} tone="complete" />
          <ReceiptState label="تحتاج تصحيحاً" value={receiptSummary.rejectedOrReupload} tone="warning" />
        </div>

        <HelperText>
          آخر حالة إيصال: {receiptSummary.latestStatusLabel}
        </HelperText>
      </BaseCardBody>
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
        className={cn(
          "text-h3 font-extrabold",
          strong ? "text-text-primary" : "text-text-secondary",
          tone === "complete" && "text-success-700",
          tone === "warning" && "text-warning-500",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function ReceiptState({
  label,
  tone,
  value,
}: {
  label: string;
  value: number;
  tone: "complete" | "waiting" | "warning";
}) {
  const variant = tone === "complete" ? "complete" : tone === "warning" ? "warning" : "waiting";

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface-alt px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-helper font-bold text-text-secondary">{label}</div>
        <StatusBadge label={String(value)} variant={variant} />
      </div>
    </div>
  );
}
