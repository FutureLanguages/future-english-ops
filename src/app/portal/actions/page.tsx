import { ApplicationSwitcher } from "@/components/portal/application-switcher";
import { PortalOverallCompletionBadge } from "@/components/portal/dashboard-status";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { PortalShell } from "@/components/portal/portal-shell";
import { RequiredActionsList } from "@/components/portal/required-actions-list";
import { getPortalDevSessionState } from "@/features/auth/server/portal-session";
import { getPortalActionsViewModel } from "@/features/portal/server/get-portal-actions";

export default async function PortalActionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ applicationId?: string }>;
}) {
  const devSession = await getPortalDevSessionState();
  const session = devSession.currentUser;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const viewModel = await getPortalActionsViewModel({
    user: session,
    applicationId: resolvedSearchParams?.applicationId,
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
        <PortalPageHeader
          title="الإجراءات المطلوبة"
          description="هذه الصفحة تجمع الإجراءات الحالية فقط، حتى تتمكن من تنفيذها بدون تشتيت."
        />

        <ApplicationSwitcher
          options={viewModel.applicationOptions}
          selectedApplicationId={viewModel.selectedApplicationId}
          basePath="/portal/actions"
        />

        <section className="rounded-panel bg-white p-5 shadow-soft">
          <RequiredActionsList actions={viewModel.actions} />
        </section>
      </div>
    </PortalShell>
  );
}
