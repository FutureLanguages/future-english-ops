type PaymentSummaryCardProps = {
  totalCostSar: number;
  paidAmountSar: number;
  remainingAmountSar: number;
  isPaymentComplete: boolean;
};

export function PaymentSummaryCard({
  totalCostSar,
  paidAmountSar,
  remainingAmountSar,
  isPaymentComplete,
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
            ملخص الرسوم المسجلة من الإدارة وحالة السداد الحالية.
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

      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl bg-sand px-4 py-4">
            <div className="text-xs font-medium text-ink/55">{item.label}</div>
            <div className="mt-1 text-lg font-bold text-ink">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-mist px-4 py-3 text-sm text-ink/65">
        ولي الأمر يرفع الإيصالات فقط، أما الرسوم والدفعات الرسمية فيسجلها ويعتمدها المشرف.
      </div>
    </section>
  );
}
