import { ApplicationSwitcher } from "@/components/portal/application-switcher";
import { DashboardStatusBadge, PortalOverallCompletionBadge } from "@/components/portal/dashboard-status";
import { PaymentReceiptCard } from "@/components/portal/payment-receipt-card";
import { PaymentSummaryCard } from "@/components/portal/payment-summary-card";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { PortalShell } from "@/components/portal/portal-shell";
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
        <div className="rounded-panel bg-white p-6 shadow-soft">
          <h2 className="text-lg font-bold text-ink">لا توجد بيانات سداد لعرضها</h2>
        </div>
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
        navItems={[
          { key: "dashboard", label: "الرئيسية", href: "/portal/dashboard" },
          { key: "documents", label: "المستندات", href: "/portal/documents" },
          { key: "profile", label: "الملف", href: "/portal/profile" },
        ]}
        isDev={devSession.isDev}
        devUsers={devSession.availableUsers}
        currentUserId={session.id}
      >
        <div className="rounded-panel bg-white p-6 shadow-soft">
          <h2 className="text-lg font-bold text-ink">هذه الصفحة غير متاحة لهذا الحساب</h2>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            بيانات السداد تظهر لولي الأمر بشكل افتراضي، ويمكن إتاحتها للطالب فقط إذا فعّلها
            المشرف لهذا الطلب.
          </p>
        </div>
      </PortalShell>
    );
  }

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
        {resolvedSearchParams?.success || resolvedSearchParams?.error ? (
          <section
            className={`rounded-panel p-4 shadow-soft ${
              resolvedSearchParams?.success
                ? "bg-[#e9f7ee] text-[#1b7a43]"
                : "bg-[#ffe8e8] text-[#a03232]"
            }`}
          >
            <div className="text-sm font-semibold">
              {resolvedSearchParams?.success === "receipt_uploaded"
                ? "تم رفع إيصال السداد بنجاح وهو الآن بانتظار المراجعة."
                : resolvedSearchParams?.error === "missing_file"
                  ? "يرجى اختيار ملف الإيصال قبل الإرسال."
                  : resolvedSearchParams?.error === "file_too_large"
                    ? `حجم الملف أكبر من الحد المسموح (${MAX_UPLOAD_SIZE_LABEL}).`
                  : resolvedSearchParams?.error === "unsupported_file_type"
                    ? "نوع الملف غير مدعوم. يرجى رفع PDF أو صورة."
                  : resolvedSearchParams?.error === "agreement_required"
                    ? "يجب الموافقة على الميثاق قبل استكمال البيانات."
                  : "تعذر تنفيذ عملية السداد المطلوبة حالياً."}
            </div>
          </section>
        ) : null}
        <PortalPageHeader
          title="المدفوعات"
          description="صفحة مستقلة للرسوم والدفعات والإيصالات فقط، بدون خلط مع بقية الأقسام."
          aside={<DashboardStatusBadge status={viewModel.status} />}
        />

        <ApplicationSwitcher
          options={viewModel.applicationOptions}
          selectedApplicationId={viewModel.selectedApplicationId}
          basePath="/portal/payments"
        />

        <PaymentSummaryCard
          totalCostSar={viewModel.summary.totalCostSar}
          paidAmountSar={viewModel.summary.paidAmountSar}
          remainingAmountSar={viewModel.summary.remainingAmountSar}
          isPaymentComplete={viewModel.summary.isPaymentComplete}
        />

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-panel bg-white p-4 shadow-soft">
            <div className="text-sm font-semibold text-pine">الرسوم</div>
            <p className="mt-2 text-sm text-ink/65">
              جميع الرسوم الرسمية التي أضافتها الإدارة لهذا الطلب.
            </p>
          </div>
          <div className="rounded-panel bg-white p-4 shadow-soft">
            <div className="text-sm font-semibold text-pine">الدفعات الرسمية</div>
            <p className="mt-2 text-sm text-ink/65">
              الدفعات التي تم اعتمادها رسميًا داخل النظام من قبل الإدارة.
            </p>
          </div>
          <div className="rounded-panel bg-white p-4 shadow-soft">
            <div className="text-sm font-semibold text-pine">الإيصالات المرفوعة</div>
            <p className="mt-2 text-sm text-ink/65">
              الإيصالات المرفوعة للمراجعة، ويمكن أن يكون لديك أكثر من إيصال في نفس الطلب.
            </p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-panel bg-white p-5 shadow-soft">
            <h3 className="text-lg font-bold text-ink">سجل الرسوم الرسمية</h3>
            <div className="mt-4 space-y-3">
              {viewModel.ledger.fees.length > 0 ? (
                viewModel.ledger.fees.map((fee) => (
                  <div key={fee.id} className="rounded-2xl bg-sand px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-ink">{fee.title}</div>
                      <div className="text-sm font-bold text-ink">{fee.amountSar} ر.س</div>
                    </div>
                    {fee.note ? <div className="mt-1 text-xs text-ink/55">{fee.note}</div> : null}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-sand px-4 py-3 text-sm text-ink/65">
                  لا توجد رسوم مسجلة حتى الآن.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-panel bg-white p-5 shadow-soft">
            <h3 className="text-lg font-bold text-ink">سجل الدفعات المعتمدة</h3>
            <div className="mt-4 space-y-3">
              {viewModel.ledger.payments.length > 0 ? (
                viewModel.ledger.payments.map((payment) => (
                  <div key={payment.id} className="rounded-2xl bg-sand px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-ink">
                        {new Intl.DateTimeFormat("ar-SA", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }).format(payment.paymentDate)}
                      </div>
                      <div className="text-sm font-bold text-ink">{payment.amountSar} ر.س</div>
                    </div>
                    {payment.note ? <div className="mt-1 text-xs text-ink/55">{payment.note}</div> : null}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-sand px-4 py-3 text-sm text-ink/65">
                  لا توجد دفعات رسمية معتمدة حتى الآن.
                </div>
              )}
            </div>
          </div>
        </section>

        <PaymentReceiptCard
          applicationId={viewModel.applicationId}
          latestPaymentNote={viewModel.latestPaymentNote}
          canUploadReceipt={viewModel.canUploadReceipt}
          receipts={viewModel.receipts}
          isDev={devSession.isDev}
        />
      </div>
    </PortalShell>
  );
}
