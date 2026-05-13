import Link from "next/link";
import { AgreementPrintButton } from "@/components/portal/agreement-print-button";
import { PortalOverallCompletionBadge } from "@/components/portal/dashboard-status";
import { PortalAgreementActionPanel } from "@/components/portal/portal-agreement-action-panel";
import { PortalShell } from "@/components/portal/portal-shell";
import { BaseCard, BaseCardBody, BaseCardHeader } from "@/components/ui/base-card";
import { Button } from "@/components/ui/button";
import { HelperText } from "@/components/ui/helper-text";
import { StatusBadge } from "@/components/ui/status-badge";
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

  const currentRoleNotRequired =
    (viewModel.role === "STUDENT" && !viewModel.agreement.requiresStudentAcceptance) ||
    (viewModel.role === "PARENT" && !viewModel.agreement.requiresParentAcceptance);
  const needsCurrentApproval = !viewModel.agreement.accepted && !currentRoleNotRequired;
  const fullyAccepted =
    (!viewModel.agreement.requiresStudentAcceptance || viewModel.agreement.studentAccepted) &&
    (!viewModel.agreement.requiresParentAcceptance || viewModel.agreement.parentAccepted);

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
                {agreementFeedbackMessage(resolvedSearchParams)}
              </p>
            </BaseCardBody>
          </BaseCard>
        ) : null}

        <section className="space-y-4">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                label={needsCurrentApproval ? "اعتماد مطلوب" : fullyAccepted ? "الميثاق مكتمل" : "للمراجعة"}
                variant={needsCurrentApproval ? "warning" : fullyAccepted ? "complete" : "waiting"}
              />
              <StatusBadge label={viewModel.role === "STUDENT" ? "حساب الطالب" : "حساب ولي الأمر"} variant="info" />
            </div>
            <h1 className="mt-4 text-h1 font-extrabold leading-9 text-text-primary">{viewModel.agreement.title}</h1>
            <p className="mt-3 text-body leading-7 text-text-secondary">
              اقرأ نص الميثاق كاملًا، ثم أكمل الإقرار والتوقيع إذا كانت الموافقة مطلوبة من هذا الحساب.
            </p>
            {needsCurrentApproval ? (
              <HelperText className="mt-2" tone="warning">
                هذا إجراء اعتماد رسمي: يتطلب إقرارًا، واسمًا كاملًا، وتوقيعًا داخل الصفحة.
              </HelperText>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 print:hidden tablet:flex-row">
            <Button asChild variant="secondary" size="sm">
              <Link href={`/portal/agreements?applicationId=${viewModel.agreement.applicationId}`}>رجوع إلى المواثيق</Link>
            </Button>
            <AgreementPrintButton />
          </div>
        </section>

        <BaseCard variant="outlined">
          <BaseCardHeader>
            <div>
              <h2 className="text-h2 font-extrabold text-text-primary">نص الميثاق</h2>
              <HelperText>هذا هو النص الذي تتم الموافقة عليه. اقرأه قبل إكمال التوقيع.</HelperText>
            </div>
          </BaseCardHeader>
          <BaseCardBody>
            <div className="h-[420px] select-none overflow-y-auto scroll-smooth whitespace-pre-line rounded-lg border border-border-subtle bg-bg-surface-alt p-5 text-body leading-8 text-text-primary shadow-inner tablet:h-[480px] print:h-auto print:select-text print:overflow-visible print:border-0 print:bg-bg-surface print:p-0 print:shadow-none">
              {viewModel.agreement.content}
            </div>
          </BaseCardBody>
        </BaseCard>

        <PortalAgreementActionPanel role={viewModel.role} agreement={viewModel.agreement} />
      </div>
    </PortalShell>
  );
}

function agreementFeedbackMessage(searchParams: { success?: string; error?: string }) {
  if (searchParams.success === "agreement_cancellation_rejected") {
    return "تم رفض طلب إلغاء الميثاق، وسيبقى الميثاق كما هو.";
  }

  if (searchParams.success) {
    return "تم حفظ الموافقة على الميثاق بنجاح.";
  }

  return "يرجى إكمال الإقرار والاسم والتوقيع قبل الإرسال.";
}
