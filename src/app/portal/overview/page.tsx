import Link from "next/link";
import { ApplicationSwitcher } from "@/components/portal/application-switcher";
import { CompletionRing } from "@/components/portal/completion-ring";
import { DashboardSectionCard } from "@/components/portal/dashboard-card";
import { DashboardStatusBadge, PortalOverallCompletionBadge } from "@/components/portal/dashboard-status";
import { PortalPageHeader } from "@/components/portal/portal-page-header";
import { PortalShell } from "@/components/portal/portal-shell";
import { getPortalDevSessionState } from "@/features/auth/server/portal-session";
import { getPortalDashboardViewModel } from "@/features/portal/server/get-portal-dashboard";

export default async function PortalOverviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ applicationId?: string }>;
}) {
  const devSession = await getPortalDevSessionState();
  const session = devSession.currentUser;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const viewModel = await getPortalDashboardViewModel({
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
          title="عرض كل البيانات"
          description="نظرة موحدة على حالة الطلب والأقسام الرئيسية في صفحة واحدة للمتابعة السريعة."
          aside={<CompletionRing percent={viewModel.completionPercent} />}
        />

        <ApplicationSwitcher
          options={viewModel.applicationOptions}
          selectedApplicationId={viewModel.selectedApplicationId}
          basePath="/portal/overview"
        />

        <section className="rounded-panel bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-bold text-ink">آخر ملاحظة من الإدارة</h3>
              <p className="mt-1 text-sm text-ink/65">
                {viewModel.latestAdminNote ?? "لا توجد ملاحظات إدارية حالياً."}
              </p>
            </div>
            <Link
              href={`/portal/actions?applicationId=${viewModel.selectedApplicationId}`}
              className="inline-flex rounded-2xl bg-pine px-4 py-3 text-sm font-semibold text-white"
            >
              عرض الإجراءات المطلوبة
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {viewModel.cards.map((card) => (
            <DashboardSectionCard key={card.id} card={card} />
          ))}
        </section>
      </div>
    </PortalShell>
  );
}
