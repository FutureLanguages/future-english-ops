import { ApplicationSwitcher } from "@/components/portal/application-switcher";
import { DashboardStatusBadge, PortalOverallCompletionBadge } from "@/components/portal/dashboard-status";
import { DocumentItemCard } from "@/components/portal/document-item-card";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { PortalShell } from "@/components/portal/portal-shell";
import { LockStateIndicator } from "@/components/shared/lock-state-indicator";
import { getPortalDevSessionState } from "@/features/auth/server/portal-session";
import { getPortalDocumentsViewModel } from "@/features/portal/server/get-portal-documents";
import { MAX_UPLOAD_SIZE_LABEL } from "@/lib/storage/upload-limits";

export default async function PortalDocumentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ applicationId?: string; success?: string; error?: string }>;
}) {
  const devSession = await getPortalDevSessionState();
  const session = devSession.currentUser;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const viewModel = await getPortalDocumentsViewModel({
    user: session,
    applicationId: resolvedSearchParams?.applicationId,
  });

  if (!viewModel) {
    return (
      <PortalShell
        role={session.role}
        navItems={[
          { key: "dashboard", label: "الرئيسية", href: "/portal/dashboard" },
          { key: "documents", label: "المستندات", href: "/portal/documents", active: true },
        ]}
        isDev={devSession.isDev}
        devUsers={devSession.availableUsers}
        currentUserId={session.id}
        activeUserLabel={session.role === "STUDENT" ? "طالب" : "ولي أمر"}
        activeMobileNumber={session.mobileNumber}
      >
        <div className="rounded-panel bg-white p-6 shadow-soft">
          <h2 className="text-lg font-bold text-ink">لا توجد مستندات لعرضها</h2>
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
              {resolvedSearchParams?.success === "document_uploaded"
                ? "تم رفع المستند بنجاح وهو الآن بانتظار المراجعة."
                : resolvedSearchParams?.error === "missing_file"
                  ? "يرجى اختيار ملف قبل الإرسال."
                  : resolvedSearchParams?.error === "file_too_large"
                    ? `حجم الملف أكبر من الحد المسموح (${MAX_UPLOAD_SIZE_LABEL}).`
                  : resolvedSearchParams?.error === "unsupported_file_type"
                    ? "نوع الملف غير مدعوم. يرجى رفع PDF أو صورة."
                  : resolvedSearchParams?.error === "already_approved"
                    ? "هذا المستند معتمد بالفعل ولا يحتاج إلى رفع جديد."
                    : resolvedSearchParams?.error === "agreement_required"
                      ? "يجب الموافقة على الميثاق قبل استكمال البيانات."
                    : "تعذر تنفيذ عملية المستند المطلوبة حالياً."}
            </div>
          </section>
        ) : null}
        <PortalPageHeader
          title={viewModel.summary.roleHeading}
          description={viewModel.summary.roleDescription}
          aside={<DashboardStatusBadge status={viewModel.status} />}
        />

        <ApplicationSwitcher
          options={viewModel.applicationOptions}
          selectedApplicationId={viewModel.selectedApplicationId}
          basePath="/portal/documents"
        />

        <section className="rounded-panel bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold text-pine">ملخص المستندات</div>
              <h2 className="mt-1 text-xl font-bold text-ink">
                {viewModel.summary.needsAction > 0
                  ? `تحتاج إجراء: ${viewModel.summary.needsAction}`
                  : "لا توجد مستندات تتطلب إجراء من هذا الحساب"}
              </h2>
            </div>
            <span className="rounded-full bg-sand px-3 py-1 text-xs font-bold text-ink/60">
              الإجمالي: {viewModel.summary.total}
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DocumentSummaryItem label="معتمدة" value={viewModel.summary.approved} tone="success" />
            <DocumentSummaryItem label="بانتظار المراجعة" value={viewModel.summary.pendingReview} tone="neutral" />
            <DocumentSummaryItem label="إعادة رفع / مرفوضة" value={viewModel.summary.reuploadRequired} tone="danger" />
            <DocumentSummaryItem label="ناقصة" value={viewModel.summary.missing} tone="warning" />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {viewModel.groups.map((group) => {
            const groupNeedsAction = group.items.filter(
              (item) =>
                (item.status === "MISSING" || item.status === "REJECTED" || item.status === "REUPLOAD_REQUESTED"),
            ).length;

            return (
              <div key={`${group.id}-summary`} className="rounded-panel bg-white p-4 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-bold text-ink">{group.title}</h3>
                  <LockStateIndicator locked={group.locked} label={group.lockLabel} subtle />
                </div>
                <p className="mt-2 text-sm text-ink/60">
                  {groupNeedsAction > 0
                    ? `يوجد ${groupNeedsAction} مستند يحتاج إجراء في هذا القسم.`
                    : `${group.items.length} مستند، ولا يوجد إجراء مباشر مطلوب هنا حالياً.`}
                </p>
              </div>
            );
          })}
        </section>

        {viewModel.groups.map((group) => (
          <section key={group.id} className="space-y-3 rounded-panel bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-ink">{group.title}</h3>
                <LockStateIndicator locked={group.locked} label={group.lockLabel} subtle />
              </div>
              <span className="text-sm font-medium text-ink/55">{group.items.length} مستند</span>
            </div>
            <div className="grid gap-4">
              {group.items.map((item) => (
                <DocumentItemCard
                  key={item.requirementId}
                  item={item}
                  isDev={devSession.isDev}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </PortalShell>
  );
}

function DocumentSummaryItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "neutral" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "bg-[#e9f7ee] text-[#1b7a43]"
      : tone === "danger"
        ? "bg-[#ffe8e8] text-[#a03232]"
        : tone === "warning"
          ? "bg-[#fff8e1] text-[#7a5a03]"
          : "bg-mist text-pine";

  return (
    <div className={`rounded-2xl px-4 py-3 ${toneClass}`}>
      <div className="text-xs font-semibold opacity-80">{label}</div>
      <div className="mt-1 text-xl font-black">{value}</div>
    </div>
  );
}
