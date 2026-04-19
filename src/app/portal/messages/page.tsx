import { ApplicationSwitcher } from "@/components/portal/application-switcher";
import { DashboardStatusBadge, PortalOverallCompletionBadge } from "@/components/portal/dashboard-status";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { PortalShell } from "@/components/portal/portal-shell";
import { MessageThreadsPanel } from "@/components/shared/message-threads-panel";
import { getPortalDevSessionState } from "@/features/auth/server/portal-session";
import { getPortalMessagesViewModel } from "@/features/portal/server/get-portal-messages";

export default async function PortalMessagesPage({
  searchParams,
}: {
  searchParams?: Promise<{ applicationId?: string; thread?: string; success?: string; error?: string }>;
}) {
  const devSession = await getPortalDevSessionState();
  const session = devSession.currentUser;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const viewModel = await getPortalMessagesViewModel({
    user: session,
    applicationId: resolvedSearchParams?.applicationId,
    threadType: resolvedSearchParams?.thread,
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
        {resolvedSearchParams?.success === "message_sent" ? (
          <section className="rounded-panel bg-[#e9f7ee] p-4 text-sm font-semibold text-[#1b7a43] shadow-soft">
            تم إرسال الرسالة بنجاح.
          </section>
        ) : resolvedSearchParams?.error ? (
          <section className="rounded-panel bg-[#ffe8e8] p-4 text-sm font-semibold text-[#a03232] shadow-soft">
            {resolvedSearchParams.error === "agreement_required"
              ? "يجب الموافقة على الميثاق قبل استكمال البيانات."
              : "تعذر إرسال الرسالة حالياً."}
          </section>
        ) : null}

        <PortalPageHeader
          title="الرسائل"
          description="صفحة مستقلة للتواصل مع الإدارة حول الطلب. الرسائل هنا فقط لتسهيل المتابعة بدون تشتيت."
          aside={<DashboardStatusBadge status={viewModel.status} />}
        />

        <ApplicationSwitcher
          options={viewModel.applicationOptions}
          selectedApplicationId={viewModel.selectedApplicationId}
          basePath="/portal/messages"
        />

        <MessageThreadsPanel
          applicationId={viewModel.selectedApplicationId}
          initialThreads={viewModel.threads}
          initialActiveThread={viewModel.activeThreadType}
          endpoint="/api/portal/messages"
          readEndpoint="/api/portal/messages/read"
        />
      </div>
    </PortalShell>
  );
}
