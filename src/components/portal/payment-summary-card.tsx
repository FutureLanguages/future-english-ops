type PaymentSummaryCardProps = {
  role: "STUDENT" | "PARENT";
  totalCostSar: number;
  paidAmountSar: number;
  remainingAmountSar: number;
  isPaymentComplete: boolean;
  stateLabel: string;
  stateDescription: string;
  receiptSummary: {
    pendingReview: number;
    approved: number;
    rejectedOrReupload: number;
    latestStatusLabel: string;
  };
};

export function PaymentSummaryCard({
  role,
  totalCostSar,
  paidAmountSar,
  remainingAmountSar,
  isPaymentComplete,
  stateLabel,
  stateDescription,
  receiptSummary,
}: PaymentSummaryCardProps) {
  const items = [
    { label: "إجمالي الرسوم", value: `${totalCostSar} ر.س` },
    { label: "المدفوع", value: `${paidAmountSar} ر.س` },
    { label: "المتبقي", value: `${remainingAmountSar} ر.س` },
  ];

  return (
    <section className="rounded-panel bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-ink">ملخص السداد</h3>
          <p className="mt-1 text-sm text-ink/65">
            {role === "PARENT"
              ? "نظرة واضحة على الرسوم، المدفوع، والإيصالات التي تحتاج متابعة."
              : "لمحة مختصرة عن السداد حسب الصلاحية المفعّلة لهذا الحساب."}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isPaymentComplete ? "bg-[#eaf7ef] text-[#1a7f46]" : "bg-[#fff6da] text-[#8d6b00]"
          }`}
        >
          {isPaymentComplete ? "مكتمل" : "بانتظار السداد"}
        </span>
      </div>

      <div className="mb-4 rounded-2xl bg-mist px-4 py-3">
        <div className="text-sm font-bold text-pine">{stateLabel}</div>
        <p className="mt-1 text-sm leading-6 text-ink/65">{stateDescription}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl bg-sand px-4 py-4">
            <div className="text-xs font-medium text-ink/55">{item.label}</div>
            <div className="mt-1 text-lg font-bold text-ink">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <ReceiptState label="إيصالات قيد المراجعة" value={receiptSummary.pendingReview} tone="neutral" />
        <ReceiptState label="إيصالات معتمدة" value={receiptSummary.approved} tone="success" />
        <ReceiptState label="تحتاج تصحيحاً" value={receiptSummary.rejectedOrReupload} tone="warning" />
      </div>

      <div className="mt-4 rounded-2xl bg-mist px-4 py-3 text-sm text-ink/65">
        ولي الأمر يرفع الإيصالات فقط، أما الرسوم والدفعات الرسمية فيسجلها ويعتمدها المشرف.
        <span className="mt-1 block text-xs font-semibold text-ink/50">
          آخر حالة إيصال: {receiptSummary.latestStatusLabel}
        </span>
      </div>
    </section>
  );
}

function ReceiptState({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "neutral" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "bg-[#e9f7ee] text-[#1b7a43]"
      : tone === "warning"
        ? "bg-[#fff8e1] text-[#7a5a03]"
        : "bg-sand text-ink";

  return (
    <div className={`rounded-2xl px-4 py-3 ${toneClass}`}>
      <div className="text-xs font-semibold opacity-80">{label}</div>
      <div className="mt-1 text-lg font-black">{value}</div>
    </div>
  );
}
