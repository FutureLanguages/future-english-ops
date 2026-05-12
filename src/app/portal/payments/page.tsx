import { ApplicationSwitcher } from "@/components/portal/application-switcher";
import { PortalOverallCompletionBadge } from "@/components/portal/dashboard-status";
import { PaymentReceiptCard } from "@/components/portal/payment-receipt-card";
import { PaymentSummaryCard } from "@/components/portal/payment-summary-card";
import { PortalShell } from "@/components/portal/portal-shell";
import { BaseCard, BaseCardBody, BaseCardHeader } from "@/components/ui/base-card";
import { EmptyState } from "@/components/ui/empty-state";
import { HelperText } from "@/components/ui/helper-text";
import { StatusBadge } from "@/components/ui/status-badge";
import { getPortalDevSessionState } from "@/features/auth/server/portal-session";
import { getPortalPaymentsViewModel } from "@/features/portal/server/get-portal-payments";
import { MAX_UPLOAD_SIZE_LABEL } from "@/lib/storage/upload-limits";

export default async function PortalPaymentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ applicationId?: string; success?: string; error?: string }>;
}) {
  const devSession = await getPortalDevSessionState();
  const session = devSession.currentUser;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const viewModel = await getPortalPaymentsViewModel({
    user: session,
    applicationId: resolvedSearchParams?.applicationId,
  });

  if (!viewModel) {
    return (
      <PortalShell
        role={session.role}
        navItems={[
          { key: "dashboard", label: "الرئيسية", href: "/portal/dashboard" },
          { key: "payments", label: "المدفوعات", href: "/portal/payments", active: true },
        ]}
        isDev={devSession.isDev}
        devUsers={devSession.availableUsers}
        currentUserId={session.id}
        activeUserLabel={session.role === "STUDENT" ? "طالب" : "ولي أمر"}
        activeMobileNumber={session.mobileNumber}
      >
        <EmptyState
          title="لا توجد بيانات سداد لعرضها"
          description="عند إضافة بيانات مالية لهذا الطلب ستظهر هنا بشكل واضح."
        />
      </PortalShell>
    );
  }

  if (!viewModel.canViewPayments) {
    return (
      <PortalShell
        role={viewModel.role}
        studentName={viewModel.studentName}
        activeUserLabel={viewModel.activeUserLabel}
        activeMobileNumber={viewModel.mobileNumber}
        statusSlot={
          <PortalOverallCompletionBadge
            label={viewModel.overallCompletion.label}
            percent={viewModel.overallCompletion.percent}
            tone={viewModel.overallCompletion.tone}
          />
        }
        navItems={viewModel.navItems}
        isDev={devSession.isDev}
        devUsers={devSession.availableUsers}
        currentUserId={session.id}
      >
        <div className="space-y-5">
          <ApplicationSwitcher
            options={viewModel.applicationOptions}
            selectedApplicationId={viewModel.selectedApplicationId}
            basePath="/portal/payments"
          />
          <EmptyState
            title="المدفوعات يتابعها ولي الأمر"
            description="تفاصيل السداد مخفية عن هذا الحساب لهذا الطلب. يمكن متابعة المبالغ والإيصالات من الحساب المسؤول عن السداد دون عرض بيانات مالية خاصة هنا."
            helperText="إذا ظهر إجراء مالي ضمن المهام، فهذا يعني أن المتابعة مطلوبة من الحساب المسؤول عن السداد."
          />
        </div>
      </PortalShell>
    );
  }

  const hasActionNeeded =
    viewModel.summary.remainingAmountSar > 0 || viewModel.receiptSummary.rejectedOrReupload > 0;

  return (
    <PortalShell
      role={viewModel.role}
      studentName={viewModel.studentName}
      activeUserLabel={viewModel.activeUserLabel}
      activeMobileNumber={viewModel.mobileNumber}
      statusSlot={
        <PortalOverallCompletionBadge
          label={viewModel.overallCompletion.label}
          percent={viewModel.overallCompletion.percent}
          tone={viewModel.overallCompletion.tone}
        />
      }
      navItems={viewModel.navItems}
      isDev={devSession.isDev}
      devUsers={devSession.availableUsers}
      currentUserId={session.id}
    >
      <div className="space-y-6">
        {resolvedSearchParams?.success || resolvedSearchParams?.error ? (
          <BaseCard
            variant="outlined"
            className={resolvedSearchParams?.success ? "border-success-100 bg-success-100/60" : "border-error-100 bg-error-100/60"}
          >
            <BaseCardBody>
              <p className={resolvedSearchParams?.success ? "text-body font-bold text-success-700" : "text-body font-bold text-error-600"}>
                {uploadFeedbackMessage(resolvedSearchParams)}
              </p>
            </BaseCardBody>
          </BaseCard>
        ) : null}

        <section className="space-y-4">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                label={hasActionNeeded ? "توجد متابعة مالية مطلوبة" : "لا توجد متابعة مالية مطلوبة"}
                variant={hasActionNeeded ? "warning" : "complete"}
              />
              <StatusBadge label={viewModel.role === "STUDENT" ? "حساب الطالب" : "حساب ولي الأمر"} variant="info" />
            </div>
            <h1 className="mt-4 text-h1 font-extrabold leading-9 text-text-primary">المدفوعات</h1>
            <p className="mt-3 text-body leading-7 text-text-secondary">
              {viewModel.role === "PARENT"
                ? "تابع حالة السداد والإيصالات من مكان واحد، مع توضيح ما يحتاج إجراء الآن."
                : "اعرض حالة السداد الظاهرة لهذا الحساب بدون كشف أي بيانات غير مفعّلة للطالب."}
            </p>
            {hasActionNeeded ? (
              <HelperText className="mt-2">
                ابدأ بالمبلغ المتبقي أو الإيصالات التي تحتاج تصحيحاً، أما الإيصالات قيد المراجعة فهي للمتابعة فقط.
              </HelperText>
            ) : null}
          </div>

          <ApplicationSwitcher
            options={viewModel.applicationOptions}
            selectedApplicationId={viewModel.selectedApplicationId}
            basePath="/portal/payments"
          />
        </section>

        <PaymentSummaryCard
          role={viewModel.role}
          originalTotalCostSar={viewModel.summary.originalTotalCostSar}
          totalCostSar={viewModel.summary.totalCostSar}
          paidAmountSar={viewModel.summary.paidAmountSar}
          remainingAmountSar={viewModel.summary.remainingAmountSar}
          isPaymentComplete={viewModel.summary.isPaymentComplete}
          stateLabel={viewModel.summary.stateLabel}
          stateDescription={viewModel.summary.stateDescription}
          receiptSummary={viewModel.receiptSummary}
          {...(viewModel.summary.discount ? { discount: viewModel.summary.discount } : {})}
        />

        <PaymentReceiptCard
          applicationId={viewModel.applicationId}
          latestPaymentNote={viewModel.latestPaymentNote}
          canUploadReceipt={viewModel.canUploadReceipt}
          receipts={viewModel.receipts}
          remainingAmountSar={viewModel.summary.remainingAmountSar}
          role={viewModel.role}
          isDev={devSession.isDev}
        />

        <ApprovedPaymentHistory payments={viewModel.ledger.payments} />
      </div>
    </PortalShell>
  );
}

function uploadFeedbackMessage(searchParams: { success?: string; error?: string }) {
  if (searchParams.success === "receipt_uploaded") return "تم رفع إيصال السداد بنجاح وهو الآن بانتظار المراجعة.";
  if (searchParams.error === "missing_file") return "يرجى اختيار ملف الإيصال قبل الإرسال.";
  if (searchParams.error === "file_too_large") return `حجم الملف أكبر من الحد المسموح (${MAX_UPLOAD_SIZE_LABEL}).`;
  if (searchParams.error === "unsupported_file_type") return "نوع الملف غير مدعوم. يرجى رفع PDF أو صورة.";
  if (searchParams.error === "agreement_required") return "يجب الموافقة على الميثاق قبل استكمال البيانات.";
  return "تعذر تنفيذ عملية السداد المطلوبة حالياً.";
}

function formatSar(value: number) {
  return `${value.toLocaleString("en-US")} ر.س`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function ApprovedPaymentHistory({
  payments,
}: {
  payments: Array<{
    id: string;
    amountSar: number;
    note: string | null;
    paymentDate: Date;
    linkedReceiptId: string | null;
  }>;
}) {
  if (payments.length === 0) {
    return (
      <BaseCard variant="outlined" className="border-secondary-100 bg-secondary-100/50">
        <BaseCardBody>
          <h2 className="text-h2 font-extrabold text-text-primary">لا توجد دفعات معتمدة بعد</h2>
          <p className="mt-2 text-body leading-7 text-text-secondary">
            ستظهر الدفعات هنا بعد اعتمادها وتسجيلها من الإدارة.
          </p>
        </BaseCardBody>
      </BaseCard>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-h2 font-extrabold text-text-primary">سجل الدفعات المعتمدة</h2>
          <StatusBadge label="مسجّلة" variant="complete" />
        </div>
        <p className="mt-2 text-body leading-7 text-text-secondary">
          الدفعات التي تم تسجيلها واعتمادها رسمياً داخل النظام.
        </p>
      </div>

      <div className="grid gap-4">
        {payments.map((payment) => (
          <BaseCard key={payment.id} variant="outlined">
            <BaseCardHeader>
              <div className="flex flex-col gap-3 tablet:flex-row tablet:items-start tablet:justify-between">
                <div>
                  <h3 className="text-h3 font-extrabold text-text-primary">دفعة بتاريخ {formatDate(payment.paymentDate)}</h3>
                  <HelperText>
                    {payment.linkedReceiptId ? "هذه الدفعة مرتبطة بإيصال مرفوع." : "دفعة مسجلة من الإدارة."}
                  </HelperText>
                </div>
                <StatusBadge label="معتمدة" variant="complete" />
              </div>
            </BaseCardHeader>
            <BaseCardBody>
              <div className="flex items-center justify-between gap-4 rounded-lg bg-bg-surface-alt px-4 py-3">
                <div className="text-body font-bold text-text-secondary">المبلغ</div>
                <div dir="ltr" className="text-h3 font-extrabold text-success-700">
                  {formatSar(payment.amountSar)}
                </div>
              </div>
              {payment.note ? (
                <p className="mt-3 text-body leading-7 text-text-secondary">{payment.note}</p>
              ) : null}
            </BaseCardBody>
          </BaseCard>
        ))}
      </div>
    </section>
  );
}
