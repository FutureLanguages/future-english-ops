import Link from "next/link";
import { AgreementPrintButton } from "@/components/portal/agreement-print-button";
import { DashboardStatusBadge, PortalOverallCompletionBadge } from "@/components/portal/dashboard-status";
import { PortalAgreementActionPanel } from "@/components/portal/portal-agreement-action-panel";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { PortalShell } from "@/components/portal/portal-shell";
import { getPortalDevSessionState } from "@/features/auth/server/portal-session";
import { getPortalAgreementDetailViewModel } from "@/features/portal/server/get-portal-agreements";

export default async function PortalAgreementDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ agreementId: string }>;
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const devSession = await getPortalDevSessionState();
  const session = devSession.currentUser;
  const { agreementId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const viewModel = await getPortalAgreementDetailViewModel({
    user: session,
    agreementId,
  });

  if (!viewModel) {
    return null;
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
        {resolvedSearchParams?.success ? (
          <section className="rounded-panel bg-[#e9f7ee] p-4 text-sm font-semibold text-[#1b7a43] shadow-soft">
            {resolvedSearchParams.success === "agreement_cancellation_rejected"
              ? "تم رفض طلب إلغاء الميثاق، وسيبقى الميثاق كما هو."
              : "تم حفظ الموافقة على الميثاق بنجاح."}
          </section>
        ) : resolvedSearchParams?.error ? (
          <section className="rounded-panel bg-[#ffe8e8] p-4 text-sm font-semibold text-[#a03232] shadow-soft">
            يرجى إكمال الإقرار والاسم والتوقيع قبل الإرسال.
          </section>
        ) : null}

        <PortalPageHeader
          title={viewModel.agreement.title}
          description="اقرأ الميثاق كاملًا ثم وقّع الإقرار إذا كنت موافقًا على جميع البنود."
          aside={<DashboardStatusBadge status={viewModel.applicationStatus} />}
        />

        <div className="flex flex-wrap gap-3 print:hidden">
          <Link
            href="/portal/agreements"
            className="inline-flex rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-sand"
          >
            رجوع
          </Link>
          <AgreementPrintButton />
        </div>

      <section className="rounded-panel bg-white p-5 shadow-soft">
        <h2 className="text-lg font-bold text-ink">نص الميثاق</h2>
        <div className="mt-4 h-[420px] select-none overflow-y-auto scroll-smooth whitespace-pre-line rounded-2xl border border-black/10 bg-sand p-5 text-sm leading-8 text-ink shadow-inner md:h-[480px] print:h-auto print:select-text print:overflow-visible print:border-0 print:bg-white print:p-0 print:shadow-none">
          {viewModel.agreement.content}
        </div>
      </section>

        <PortalAgreementActionPanel role={viewModel.role} agreement={viewModel.agreement} />
      </div>
    </PortalShell>
  );
}
